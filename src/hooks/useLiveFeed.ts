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
};

// How long the app needs to have been hidden/backgrounded before coming
// back triggers an automatic refresh (see the visibilitychange effect
// below). Short enough that "closed the app, came back a bit later"
// always gets fresh content the moment it reopens; long enough that
// switching to check a notification and back doesn't spam a refresh.
const AUTO_REFRESH_AFTER_HIDDEN_MS = 15_000;

// Belt-and-braces automatic top-up: the WebSocket already pushes new
// articles the instant they're scraped (see the "new_item"/"initial"
// cases below), but a lot of real-world networks — corporate proxies,
// some mobile carriers, a laptop that suspends its network on sleep —
// silently kill long-lived WebSocket connections without ever firing
// `onclose`, so the feed can quietly stop receiving live pushes while
// still *looking* connected. Polling the plain REST snapshot on a timer,
// independent of socket state entirely, is what makes "fresh news
// appears automatically" actually hold up the way it does on
// Instagram/YouTube — those apps don't rely on one transport either.
const AUTO_POLL_INTERVAL_MS = 20_000;

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
 * Keeps `items` in sync with the backend's `/ws/feed` socket, the way a
 * real social feed behaves:
 *
 *  - Opening the app / returning to a page you already loaded shows what
 *    you already had, instantly — no reset, no spinner.
 *  - Articles scraped while you're on the page are pushed over the socket
 *    in real time and spliced in at the *front* of the feed immediately
 *    (see `prependFresh`), matching the backend's newest-first order, so
 *    fresh stories are actually where the reader will see them instead of
 *    buried behind everything already loaded. A layout effect
 *    compensates the scroll position by exactly however many pixels that
 *    added, so this can never yank content the reader is currently
 *    looking at.
 *  - `loadMore()` (driven by the infinite-scroll sentinel) asks the
 *    backend for the next page and appends it the same way, so scrolling
 *    to the bottom keeps extending the feed rather than ever showing a
 *    hard "end".
 */
export function useLiveFeed({
  category = "All",
  initialItems = [],
  pageSize = 10,
  cacheKey,
}: Options) {
  // Prefer the route loader's SSR data when there is any (that's live,
  // just-fetched data). Otherwise fall back to whatever this cache key
  // last had on screen, so a remount — Home → article → Back, switching
  // Home ⇄ Updates, reopening a backgrounded tab — paints immediately
  // instead of blank. The network effect below always still runs and
  // brings this up to date (merging on top if the initial socket message
  // finds items already present, replacing only when truly starting from
  // nothing), so this seed is purely about not showing an empty screen
  // while that happens.
  const key = cacheKey ?? category;
  const seed = initialItems.length > 0 ? initialItems : (feedCache.get(key) ?? []);

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
  // How many freshly-scraped articles are waiting, queued, for the reader
  // to ask to see — see `queuePending`/`revealPending` below.
  const [pendingCount, setPendingCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const cursorRef = useRef(seed.length);
  const seenIds = useRef(new Set(seed.map((i) => i.id)));
  const itemsRef = useRef(seed);
  const hasMoreRef = useRef(true);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);
  const emptyStateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Newest-first queue of articles that have arrived live but haven't
  // been shown yet — see `queuePending`/`revealPending`.
  const pendingItemsRef = useRef<FeedItem[]>([]);

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

  /** Splice freshly-arrived items in at the front of the feed immediately
   * — no queue, no tap. Reserved for moments that are already an
   * explicit "start fresh" point, the same way Instagram only actually
   * re-sorts your feed on a deliberate pull-to-refresh or a cold re-open,
   * never silently underneath you while you're mid-scroll: a remount's
   * "initial" socket message finding a cached feed already on screen
   * (Home → article → Back, tab-switching), manual pull-to-refresh, and
   * the reopen-after-backgrounded refresh. `loadMore`'s pagination is the
   * one thing that deliberately stays append-at-the-end below — that's
   * older content further back in time, which belongs after what's
   * already loaded, not before it. For a live push or background poll
   * that arrives *while the reader is actively on the page*, see
   * `queuePending` instead — those don't touch the feed at all until the
   * reader asks to see them. */
  const prependFresh = useCallback(
    (incoming: FeedItem[]) => {
      const fresh = incoming.filter((i) => !seenIds.current.has(i.id));
      if (fresh.length === 0) return;
      fresh.forEach((i) => seenIds.current.add(i.id));
      cursorRef.current += fresh.length;
      if (typeof document !== "undefined") {
        pendingScrollFix.current = document.documentElement.scrollHeight;
      }
      setItemsTracked((prev) => [...fresh, ...prev]);
    },
    [setItemsTracked],
  );

  const autoMerge = useCallback(
    (incoming: FeedItem[]) => {
      prependFresh(incoming);
    },
    [prependFresh],
  );

  // FIX: live WebSocket pushes and the background poll used to call
  // `prependFresh` directly — technically correct order, but it meant
  // the feed could re-shuffle itself out from under a reader mid-scroll,
  // which isn't actually how Instagram behaves: Instagram never rewrites
  // what's on your screen while you're looking at it. New posts wait,
  // announced by a small "N new posts" pill, until you tap it (or pull
  // to refresh, or reopen the app) to bring them in. `queuePending` is
  // that waiting room: it marks incoming items as seen (so nothing else
  // re-queues or re-fetches them) but holds them out of `items` — and
  // out of view — until `revealPending` is called.
  const queuePending = useCallback((incoming: FeedItem[]) => {
    const fresh = incoming.filter((i) => !seenIds.current.has(i.id));
    if (fresh.length === 0) return;
    fresh.forEach((i) => seenIds.current.add(i.id));
    pendingItemsRef.current = [...fresh, ...pendingItemsRef.current];
    setPendingCount(pendingItemsRef.current.length);
  }, []);

  /** Brings whatever's queued in `queuePending` into view — this is the
   * "N new posts" pill's tap handler. Splices the queue in at the front
   * (same newest-first order as everything else) and, since this is
   * always a deliberate reader action, scrolls them to the top to
   * actually see it rather than silently keeping their old scroll
   * position the way the passive paths do. */
  const revealPending = useCallback(() => {
    const pending = pendingItemsRef.current;
    if (pending.length === 0) return;
    pendingItemsRef.current = [];
    setPendingCount(0);
    cursorRef.current += pending.length;
    setItemsTracked((prev) => [...pending, ...prev]);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setItemsTracked]);

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
            // If items are already showing — which is exactly what
            // happens on every remount of this cache key: navigating
            // Home → article → back, switching tabs and returning,
            // Home ⇄ Updates, etc. — auto-merge whatever's new here the
            // same way "new_item" does: appended at the end, never the
            // top, so it can never yank content the reader is currently
            // looking at. This is what makes the feed top itself up
            // automatically, the way Instagram's does, with no tap and
            // no "N new posts" notice required.
            if (itemsRef.current.length > 0) {
              autoMerge(msg.items);
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
            // Real-time push from the crawler while the reader's
            // actively on the page: queue it (see `queuePending` above)
            // instead of touching the feed — it shows up as a "N new
            // posts" pill, not a silent reshuffle underneath them.
            queuePending([msg.item]);
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
  }, [category, mergeUnique, autoMerge, prependFresh, queuePending, setItemsTracked]);

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
   * `prependFresh` above). */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      revealPending();
      const { items: snapshot } = await fetchFeed(category);
      prependFresh(snapshot);
    } catch {
      /* offline — nothing to refresh with, keep current items as-is */
    } finally {
      setRefreshing(false);
    }
  }, [category, prependFresh, revealPending]);

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

  // Automatic background check, independent of the socket entirely (see
  // AUTO_POLL_INTERVAL_MS above for why). Queues whatever's new (see
  // `queuePending`) instead of touching the feed directly — same as a
  // live WebSocket push, this surfaces as the "N new posts" pill rather
  // than silently reshuffling what the reader's looking at. Skips a tick
  // whenever the tab is hidden/backgrounded, since the visibilitychange
  // effect above already covers that case (as an immediate reveal) when
  // the tab comes back.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchFeed(category)
        .then(({ items: snapshot }) => {
          queuePending(snapshot);
        })
        .catch(() => {
          /* offline or backend unreachable this tick — try again next one */
        });
    }, AUTO_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [category, queuePending]);

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
    // How many fresh articles are queued and waiting — drive a "N new
    // posts" pill off this.
    pendingCount,
    // Tap handler for that pill: brings the queued articles into view.
    revealPending,
  };
}