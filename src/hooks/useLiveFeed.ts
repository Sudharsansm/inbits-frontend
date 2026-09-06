import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type FeedItem, type WsServerMessage, feedSocketUrl, fetchFeed } from "@/lib/api";

type Options = {
  category?: string;
  /** Items already fetched during SSR (route loader) — used as the first
   * paint so the home feed isn't empty while the socket connects. */
  initialItems?: FeedItem[];
  pageSize?: number;
  /** Cache namespace, separate from `category`. Two callers can request
   * the same backend category (e.g. Home and Updates both want "All")
   * while keeping independent buffers/pagination — so they're free to
   * present that shared pool of articles in different orders instead of
   * being locked to literally the same list instance. Defaults to
   * `category` when omitted, which is the previous (shared) behavior. */
  cacheKey?: string;
  /** Where "bring the reader to fresh content" should scroll when new
   * items land (see `prependFresh`'s `scrollToTop` option below). Most
   * pages (Home) scroll the window itself, which is the default when
   * this is omitted. Updates instead scrolls *inside* its own reel list
   * div (it needs snap-scrolling one reel at a time, so the window
   * never actually scrolls there) — passing that div's ref here lets
   * this hook stay in charge of *when* to scroll to the top for fresh
   * content while still letting each page decide *what element* that
   * means for its own layout. */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** True when this mount has no remembered read/scroll position worth
   * protecting — a genuinely fresh session (see routes/index.tsx and
   * routes/updates.tsx, where this is `resetOnMount`). In that case the
   * very first "initial" socket message finding items already on screen
   * (from SSR) should reveal anything scraped between the SSR fetch and
   * the socket connecting the same way a real live push would (scrolled
   * to the top), instead of silently merging it in out of view above
   * content there's no saved position to protect anyway. When this is
   * false/omitted (resuming a remembered post/reel), that initial merge
   * stays position-preserving so it can never yank the reader away from
   * what they came back to see. */
  treatInitialMergeAsFresh?: boolean;
};

// How long the app needs to have been hidden/backgrounded before coming
// back triggers an automatic refresh (see the visibilitychange effect
// below). Short enough that "closed the app, came back a bit later"
// always gets fresh content the moment it reopens; long enough that
// switching to check a notification and back doesn't spam a refresh.
const AUTO_REFRESH_AFTER_HIDDEN_MS = 15_000;

// FIX: this cache was removed entirely at one point on the theory that a
// stored/stale feed flashing on screen for a moment was worse than
// showing nothing. In practice it made every single remount of a cache
// key — Home → article → Back, tab-switching Home ⇄ Updates, even just
// backgrounding and returning to the same tab — start from a blank list
// and re-run a full network round trip before anything appeared, which
// is exactly the "takes a moment to appear" symptom this was meant to
// avoid, and it makes it happen on *every* navigation, not just the first
// one. Restored as an in-memory (session-only; cleared on a real reload)
// map so a remount can seed `items` from what was already on screen a
// moment ago and render instantly, while the effect below still goes
// straight to the socket/REST for the live, current feed the same as
// before. This is safe from the "stale flash" problem it was removed
// for: the "initial" socket handler already merges rather than replaces
// whenever items are non-empty on mount (see the `itemsRef.current.length
// > 0` branch below), so cached items are only ever topped up, never
// shown as a stale full replacement.
const feedCache = new Map<string, FeedItem[]>();

/**
 * Keeps `items` in sync with the backend's `/ws/feed` socket, deliberately
 * *not* the way a live ticker behaves:
 *
 *  - Opening the app / returning to a page you already loaded shows what
 *    you already had, instantly — no reset, no spinner.
 *  - Articles scraped while you're actively on the page are **not**
 *    pushed into view automatically — the backend keeps scraping and
 *    buffering them regardless, but the feed you're looking at doesn't
 *    change under you. Fresh content only ever surfaces at two specific
 *    moments: an explicit pull-to-refresh/refresh action, and reopening
 *    the app after it's been backgrounded/closed for a while (see
 *    `refresh()` and the visibilitychange/pageshow effect below). Both
 *    of those go through `prependFresh` with `scrollToTop: true` so the
 *    reader actually sees what just landed.
 *  - `loadMore()` (driven by the infinite-scroll sentinel) asks the
 *    backend for the next page and appends it at the *end*, so scrolling
 *    to the bottom keeps extending the feed rather than ever showing a
 *    hard "end".
 */
export function useLiveFeed({
  category = "All",
  initialItems = [],
  pageSize = 10,
  cacheKey,
  scrollContainerRef,
  treatInitialMergeAsFresh = false,
}: Options) {
  // FIX: this used to prefer the route loader's SSR data ("initialItems")
  // over this cache whenever the loader had anything at all -- which is
  // almost always, since it succeeds on every normal navigation. That's
  // backwards: the loader only ever fetches page 1 (pageSize items), but
  // by the time a reader has scrolled and triggered a few loadMore calls,
  // `items` -- and therefore this cache -- holds page 1..N. Tab-switching
  // away (Jobs/Search/Menu) and back remounts this hook, and with the old
  // priority that remount seeded from the loader's page-1-only snapshot,
  // silently discarding everything loaded beyond it. The reader's
  // remembered post (routes/index.tsx's returnToPostId) is almost always
  // further down than page 1 once they've been scrolling, so it was no
  // longer anywhere in the DOM for the scroll-restore effect to find --
  // it failed silently and the reader landed back at the top of a
  // freshly-truncated feed. This is exactly the bug that looked like
  // "switching tabs and back always resets Home to the top".
  //
  // The cache is the one that actually reflects everything loaded this
  // session, so it takes priority whenever it has anything -- the loader
  // data is only the seed for a genuinely first-ever mount of this cache
  // key (nothing cached yet), same as before. The network effect below
  // always still runs and brings this up to date (merging on top if the
  // initial socket message finds items already present, replacing only
  // when truly starting from nothing), so this seed is purely about not
  // showing an empty screen while that happens.
  const key = cacheKey ?? category;
  const cached = feedCache.get(key);
  const seed = cached && cached.length > 0 ? cached : initialItems;

  const [items, setItems] = useState<FeedItem[]>(seed);
  const [connected, setConnected] = useState(false);
  // `connected` only reflects the socket handshake — it flips true the
  // instant `ws.onopen` fires, which can easily happen *before* any real
  // data (the "initial" message, or the REST fallback) has come back.
  // Screens were using `connected` to decide whether to render the
  // "No stories yet" empty state, so on a fresh deploy (socket connects
  // fast, first payload takes a beat longer) that message flashed before
  // there was ever a genuine reason to show it. `loaded` tracks whether a
  // real data attempt has actually settled at least once, and is what the
  // empty-state check below should key off of instead.
  const [loaded, setLoaded] = useState(seed.length > 0);
  // Even once `loaded` is true, a brand-new deployment can have a crawler
  // that simply hasn't produced its first batch yet — that's a real "zero
  // items" state, but it's temporary, not broken. Rather than declare
  // "No stories yet" the moment the first empty response lands, give it a
  // grace window to fill in on its own (new items arrive over the same
  // socket in real time) before showing any empty-state copy at all.
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const cursorRef = useRef(seed.length);
  const seenIds = useRef(new Set(seed.map((i) => i.id)));
  const itemsRef = useRef(seed);
  const hasMoreRef = useRef(true);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);
  const emptyStateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Arm/disarm the "genuinely empty" grace window whenever loaded-ness or
  // the item count changes, instead of re-deriving it inline on render.
  useEffect(() => {
    if (emptyStateTimer.current) {
      clearTimeout(emptyStateTimer.current);
      emptyStateTimer.current = null;
    }
    if (loaded && items.length === 0) {
      emptyStateTimer.current = setTimeout(() => setShowEmptyState(true), 8000);
    } else {
      setShowEmptyState(false);
    }
    return () => {
      if (emptyStateTimer.current) clearTimeout(emptyStateTimer.current);
    };
  }, [loaded, items.length]);

  const setItemsTracked = useCallback(
    (updater: FeedItem[] | ((prev: FeedItem[]) => FeedItem[])) => {
      setItems((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: FeedItem[]) => FeedItem[])(prev)
            : updater;
        itemsRef.current = next;
        // Keep the cross-mount cache current so the *next* mount of this
        // cache key can seed from it instantly instead of starting blank.
        feedCache.set(key, next);
        return next;
      });
    },
    [key],
  );

  const mergeUnique = useCallback(
    (incoming: FeedItem[], position: "start" | "end") => {
      setItemsTracked((prev) => {
        const fresh = incoming.filter((i) => !seenIds.current.has(i.id));
        if (fresh.length === 0) return prev;
        fresh.forEach((i) => seenIds.current.add(i.id));
        return position === "start" ? [...fresh, ...prev] : [...prev, ...fresh];
      });
    },
    [setItemsTracked],
  );

  // FIX: every "there's fresh content" path here used to append incoming
  // items to the *end* of `items`. That was safe for scroll position, but
  // wrong for freshness: the backend's snapshot/buffer is newest-first
  // (see broadcaster.py's `appendleft`), so appending genuinely-new
  // articles after everything already loaded buried them behind however
  // many older items were already on screen (up to the full 300-item
  // buffer) — the reader would have to scroll past all of that to ever
  // see them, which in practice reads as "new articles never show up".
  // Only a full reload (a fresh SSR/loader snapshot, newest-first from
  // index 0) ever visibly surfaced them, which is why it looked like
  // manual refresh "worked" and everything else didn't.
  //
  // The fix: put fresh items where they actually belong — at the *front*
  // — and instead solve the scroll-jump problem the old code was really
  // guarding against by compensating for it directly. `pendingScrollFix`
  // records the page's height immediately before the new items are
  // spliced in; the layout effect right below runs after they've painted
  // and nudges the scroll position down by exactly however many pixels
  // that added, so whatever the reader was already looking at stays
  // pixel-for-pixel in place. This is the same trick real feeds (Twitter,
  // Instagram) use to land new posts above what you're reading without
  // yanking your place.
  const pendingScrollFix = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingScrollFix.current === null) return;
    if (typeof document === "undefined" || typeof window === "undefined") {
      pendingScrollFix.current = null;
      return;
    }
    const before = pendingScrollFix.current;
    pendingScrollFix.current = null;
    const delta = document.documentElement.scrollHeight - before;
    if (delta > 0) window.scrollBy(0, delta);
  }, [items]);

  /** Splice freshly-arrived items in at the front of the feed. Used only
   * at the specific moments fresh content is allowed to surface: a
   * remount's "initial" socket message finding a cached feed already on
   * screen (Home → article → Back, tab-switching), manual pull-to-refresh,
   * and the reopen-after-backgrounded refresh. A live WebSocket
   * "new_item" push while the reader is actively on the page deliberately
   * does *not* go through this — see the socket handler below.
   * `loadMore`'s pagination is the one thing that deliberately stays
   * append-at-the-end below — that's older content further back in
   * time, which belongs after what's already loaded, not before it.
   *
   * `scrollToTop` controls how the reader's viewport reacts to the new
   * items landing:
   *  - `false` (default) keeps the reader pixel-for-pixel where they
   *    were — `pendingScrollFix` records the page height beforehand and
   *    the layout effect above nudges the scroll position down by
   *    however many pixels the new items added. This is what a remount
   *    finding a cached feed already on screen uses (Home → article →
   *    Back, tab-switching): the reader didn't ask for anything just
   *    now, so their place shouldn't move.
   *  - `true` scrolls smoothly to the top instead, so the fresh content
   *    that just landed is actually the first thing in view rather than
   *    buried above whatever the reader happened to be looking at. Used
   *    for an explicit "start fresh" action (pull-to-refresh, reopening
   *    the app) — see the call sites below. */
  const prependFresh = useCallback(
    (incoming: FeedItem[], options?: { scrollToTop?: boolean }) => {
      const fresh = incoming.filter((i) => !seenIds.current.has(i.id));
      if (fresh.length === 0) return;
      fresh.forEach((i) => seenIds.current.add(i.id));
      cursorRef.current += fresh.length;
      if (options?.scrollToTop) {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        } else if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (typeof document !== "undefined") {
        pendingScrollFix.current = document.documentElement.scrollHeight;
      }
      setItemsTracked((prev) => [...fresh, ...prev]);
    },
    [setItemsTracked, scrollContainerRef],
  );

  const autoMerge = useCallback(
    (incoming: FeedItem[]) => {
      prependFresh(incoming);
    },
    [prependFresh],
  );

  // `treatInitialMergeAsFresh` (see Options above) decides whether the
  // very first "initial" socket message on a fresh-session mount reveals
  // itself like a real refresh (scrolled to the top) instead of merging
  // in silently. Read via a ref so changing it doesn't force the socket
  // effect below to reconnect.
  const treatInitialMergeAsFreshRef = useRef(treatInitialMergeAsFresh);
  useEffect(() => {
    treatInitialMergeAsFreshRef.current = treatInitialMergeAsFresh;
  }, [treatInitialMergeAsFresh]);

  // FIX: articles scraped while the reader is actively on the page used
  // to be spliced straight into the feed the instant the "new_item"
  // socket push (or a 20s background poll) arrived — no tap, no pause,
  // just appearing live. That's exactly what wasn't wanted: it meant the
  // feed could reorder/scroll itself under a reader who was mid-article,
  // at essentially any moment. Fresh content should only ever appear at
  // two specific, reader-initiated-or-obvious moments: an explicit
  // refresh (pull-to-refresh) and reopening the app after it's actually
  // been away for a while (see the visibilitychange/pageshow effect
  // below, both of which call `refresh()`). So a live "new_item" push
  // is intentionally a no-op for what's on screen now — the backend
  // keeps scraping and buffering regardless, and the next refresh/reopen
  // picks everything up in one go via the REST snapshot.

  useEffect(() => {
    reconnectAttempt.current = 0;

    if (typeof window === "undefined") return; // no sockets during SSR

    let cancelled = false;
    let ws: WebSocket | null = null;

    const restFallback = () => {
      fetchFeed(category)
        .then(({ items: snapshot }) => {
          if (cancelled) return;
          seenIds.current = new Set(snapshot.map((i) => i.id));
          cursorRef.current = snapshot.length;
          setItemsTracked(snapshot);
        })
        .catch(() => {
          /* backend unreachable — keep whatever is currently on screen */
        })
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    };

    const connect = () => {
      ws = new WebSocket(feedSocketUrl(category));
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        let msg: WsServerMessage;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "initial":
            // First message on a freshly-opened socket. If this is a
            // genuinely first-ever load for this cache key (nothing
            // cached, nothing from SSR), show it immediately — there's
            // nothing on screen yet to disturb.
            //
            // If items are already showing — which happens on every
            // remount of this cache key: navigating Home → article →
            // back, switching tabs and returning, Home ⇄ Updates, etc.
            // — merge whatever's new here rather than replacing outright,
            // so a remount can never wipe out items already on screen.
            // Whether that merge reveals itself at the top (a genuinely
            // fresh session, nothing worth preserving — see
            // `treatInitialMergeAsFresh`) or stays invisible/
            // position-preserving (resuming a remembered post/reel) is
            // the one thing this mount-time merge decides for itself;
            // it is still not a live "keeps changing while you read"
            // update — see "new_item" below for why that's intentionally
            // a no-op.
            if (itemsRef.current.length > 0) {
              if (treatInitialMergeAsFreshRef.current) {
                prependFresh(msg.items, { scrollToTop: true });
              } else {
                autoMerge(msg.items);
              }
            } else {
              seenIds.current = new Set(msg.items.map((i) => i.id));
              cursorRef.current = msg.items.length;
              setItemsTracked(msg.items);
            }
            hasMoreRef.current = true;
            setHasMore(true);
            setLoaded(true);
            break;
          case "new_item":
            // Real-time push from the crawler while the reader is
            // actively on the page. Deliberately does *not* touch what's
            // on screen (see the comment above this effect) — the item
            // is already durable on the backend and will show up the
            // next time `refresh()` runs, either from an explicit
            // pull-to-refresh or the reader reopening the app.
            setLoaded(true);
            break;
          case "more_items":
            mergeUnique(msg.items, "end");
            cursorRef.current = msg.next_cursor;
            hasMoreRef.current = msg.has_more;
            setHasMore(msg.has_more);
            setLoadingMore(false);
            break;
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        if (itemsRef.current.length === 0) restFallback();
        const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 15_000);
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(() => {
          if (!cancelled) connect();
        }, delay);
      };

      ws.onerror = () => ws?.close();
    };

    // Nothing cached and no SSR seed either — this category has genuinely
    // never been loaded, so go get a snapshot while the socket connects.
    if (itemsRef.current.length === 0) restFallback();
    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws?.close();
      wsRef.current = null;
    };
  }, [category, mergeUnique, autoMerge, prependFresh, setItemsTracked]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "load_more",
          cursor: cursorRef.current,
          page_size: pageSize,
          category,
        }),
      );
    } else {
      fetchFeed(category)
        .then(({ items: snapshot }) => {
          const next = snapshot.slice(cursorRef.current, cursorRef.current + pageSize);
          mergeUnique(next, "end");
          cursorRef.current += next.length;
          const more = cursorRef.current < snapshot.length;
          hasMoreRef.current = more;
          setHasMore(more);
        })
        .catch(() => {
          hasMoreRef.current = false;
          setHasMore(false);
        })
        .finally(() => setLoadingMore(false));
    }
  }, [category, hasMore, loadingMore, mergeUnique, pageSize]);

  /** Manual refresh — pull-to-refresh, a refresh action, etc. — and also
   * reused for the reopen-after-backgrounded case below. Both are
   * deliberate "start fresh" moments (the reader asked, or just came
   * back), so unlike a live push this reveals immediately: first
   * whatever's already sitting in the pending queue (no need to make
   * someone who just pulled to refresh *also* tap a pill), then tops up
   * against the REST snapshot in case the socket's been silently
   * reconnecting. Fresh items are spliced in at the front (see
   * `prependFresh` above, with `scrollToTop` so the reader actually sees
   * what just came in instead of it landing off-screen above them). */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { items: snapshot } = await fetchFeed(category);
      prependFresh(snapshot, { scrollToTop: true });
    } catch {
      /* offline — nothing to refresh with, keep current items as-is */
    } finally {
      setRefreshing(false);
    }
  }, [category, prependFresh]);

  // FIX: previously the only way to see fresh articles that arrived while
  // the app was closed/backgrounded was to manually pull down. Instagram
  // doesn't make you do that: reopening the app after being away for a
  // bit silently tops up the feed on its own. Mirrors that:
  // once the tab/app has been hidden for more than a few seconds (a real
  // "closed and reopened", not just a half-second flick to another app
  // and back) and *comes back* visible, run the same `refresh()` used by
  // pull-to-refresh — reusing it means this also immediately reveals
  // anything that piled up in the pending queue while the tab was away.
  // Guarded on there already being items on screen so this never
  // fires during the very first cold load, which the loader/socket/REST
  // fallback above already own.
  const hiddenAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (
        hiddenAt !== null &&
        Date.now() - hiddenAt > AUTO_REFRESH_AFTER_HIDDEN_MS &&
        itemsRef.current.length > 0
      ) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    // iOS Safari/installed-PWA back-forward-cache restores fire `pageshow`
    // (with `persisted: true`) instead of a visibilitychange in some
    // cases — covering both is what makes this reliable specifically in
    // an installed app, which is where this gap was reported.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted && itemsRef.current.length > 0) refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [refresh]);

  // FIX: there used to also be a 20s background poll here that silently
  // re-fetched the REST snapshot and spliced in anything new — belt and
  // braces for sockets that die without firing `onclose`. Removed: it
  // had the same problem as the live "new_item" push above, just on a
  // timer instead of an event — the feed could top itself up and jump to
  // the top at essentially any moment while the reader was mid-article,
  // which is exactly what's not wanted here (see the comment above the
  // socket effect). A dead-without-`onclose` socket is still handled:
  // the reconnect logic in `ws.onclose` covers a clean disconnect, and a
  // reader who suspects the feed is stale always has pull-to-refresh and
  // the reopen-after-backgrounded refresh to fall back on.

  return {
    items,
    connected,
    // `loaded`: a real data attempt (REST fallback or the socket's first
    // message) has settled at least once — use this, not `connected`, to
    // decide whether "empty" is even a meaningful thing to check yet.
    loaded,
    // `showEmptyState`: still zero items after `loaded` AND after the
    // grace window above has passed. This is the one to key an actual
    // "No stories yet" message off of.
    showEmptyState,
    hasMore,
    loadingMore,
    loadMore,
    refreshing,
    refresh,
  };
}