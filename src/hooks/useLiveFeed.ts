import { useCallback, useEffect, useRef, useState } from "react";
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
 *    in real time and appended to the *end* of the feed immediately, so
 *    scrolling down never runs out of content — the feed tops itself up
 *    continuously instead of capping out at whatever loaded first.
 *    Appending at the end (never the top) means this can never yank
 *    content the reader is currently looking at.
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

  /** Auto-merge a newly-scraped batch straight into the visible feed —
   * no queue, no tap, no notification. Mirrors real Instagram: the feed
   * tops itself up on its own the moment fresh content exists. Always
   * appended at the *end* (never the top), which is what makes doing
   * this automatically safe — nothing above the reader's current scroll
   * position ever moves, so new stories just extend the feed downward
   * for them to scroll into, instead of yanking what's on screen. */
  const autoMerge = useCallback(
    (incoming: FeedItem[]) => {
      const freshCount = incoming.filter((i) => !seenIds.current.has(i.id)).length;
      mergeUnique(incoming, "end");
      cursorRef.current += freshCount;
    },
    [mergeUnique],
  );

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
            // Real-time push from the crawler: append straight onto the
            // *end* of the feed and let the infinite-scroll sentinel pick
            // it up naturally as the reader scrolls down — this is what
            // keeps the feed continuously topped up with fresh stories
            // instead of capping out once the first page is exhausted.
            // Appending at the end (never the top) is what makes this
            // safe to do live: it can never yank content the reader is
            // currently looking at, since nothing above their scroll
            // position ever moves.
            mergeUnique([msg.item], "end");
            cursorRef.current += 1;
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
  }, [category, mergeUnique, autoMerge, setItemsTracked]);

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

  /** Manual refresh — pull-to-refresh, a refresh action, etc. Tops up
   * against the REST snapshot in case the socket's been silently
   * reconnecting. New items are appended after what's already on screen,
   * continuing the feed downward instead of jumping to the top. The
   * socket itself (`new_item`/`initial`, above) already keeps the feed
   * automatically topped up in real time — this exists as a fallback for
   * whenever the reader explicitly asks for one, or the socket's been
   * down. */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { items: snapshot } = await fetchFeed(category);
      const fresh = snapshot.filter((i) => !seenIds.current.has(i.id));
      if (fresh.length > 0) {
        fresh.forEach((i) => seenIds.current.add(i.id));
        cursorRef.current += fresh.length;
        setItemsTracked((prev) => [...prev, ...fresh]);
      }
    } catch {
      /* offline — nothing to refresh with, keep current items as-is */
    } finally {
      setRefreshing(false);
    }
  }, [category, setItemsTracked]);

  // FIX: previously the only way to see fresh articles that arrived while
  // the app was closed/backgrounded was to manually pull down. Instagram
  // doesn't make you do that: reopening the app after being away for a
  // bit silently tops up the feed on its own. Mirrors that:
  // once the tab/app has been hidden for more than a few seconds (a real
  // "closed and reopened", not just a half-second flick to another app
  // and back) and *comes back* visible, run the same `refresh()` used by
  // pull-to-refresh — reusing it means this gets the exact same
  // append-at-the-end, never-yank-your-scroll-position behavior for
  // free. Guarded on there already being items on screen so this never
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

  // Automatic background top-up, independent of the socket entirely (see
  // AUTO_POLL_INTERVAL_MS above for why). Silent — no spinner, no
  // "refreshing" state flip — it just quietly extends the feed downward
  // with whatever's new, exactly like `refresh()`, so the reader's
  // current scroll position is never touched. Skips a tick whenever the
  // tab is hidden/backgrounded, since the visibilitychange effect above
  // already covers that case on its own terms when the tab comes back.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchFeed(category)
        .then(({ items: snapshot }) => {
          const fresh = snapshot.filter((i) => !seenIds.current.has(i.id));
          if (fresh.length === 0) return;
          fresh.forEach((i) => seenIds.current.add(i.id));
          cursorRef.current += fresh.length;
          setItemsTracked((prev) => [...prev, ...fresh]);
        })
        .catch(() => {
          /* offline or backend unreachable this tick — try again next one */
        });
    }, AUTO_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [category, setItemsTracked]);

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