import { r as reactExports } from "../_libs/react.mjs";
import { w as fetchFeed, B as feedSocketUrl } from "./router-B91z3HGk.mjs";
const AUTO_REFRESH_AFTER_HIDDEN_MS = 15e3;
const feedCache = /* @__PURE__ */ new Map();
function useLiveFeed({
  category = "All",
  initialItems = [],
  pageSize = 10,
  cacheKey,
  scrollContainerRef,
  treatInitialMergeAsFresh = false
}) {
  const key = cacheKey ?? category;
  const cached = feedCache.get(key);
  const seed = cached && cached.length > 0 ? cached : initialItems;
  const [items, setItems] = reactExports.useState(seed);
  const [connected, setConnected] = reactExports.useState(false);
  const [loaded, setLoaded] = reactExports.useState(seed.length > 0);
  const [showEmptyState, setShowEmptyState] = reactExports.useState(false);
  const [hasMore, setHasMore] = reactExports.useState(true);
  const [loadingMore, setLoadingMore] = reactExports.useState(false);
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const wsRef = reactExports.useRef(null);
  const cursorRef = reactExports.useRef(seed.length);
  const seenIds = reactExports.useRef(new Set(seed.map((i) => i.id)));
  const itemsRef = reactExports.useRef(seed);
  const hasMoreRef = reactExports.useRef(true);
  const reconnectTimer = reactExports.useRef(null);
  const reconnectAttempt = reactExports.useRef(0);
  const emptyStateTimer = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (emptyStateTimer.current) {
      clearTimeout(emptyStateTimer.current);
      emptyStateTimer.current = null;
    }
    if (loaded && items.length === 0) {
      emptyStateTimer.current = setTimeout(() => setShowEmptyState(true), 8e3);
    } else {
      setShowEmptyState(false);
    }
    return () => {
      if (emptyStateTimer.current) clearTimeout(emptyStateTimer.current);
    };
  }, [loaded, items.length]);
  const setItemsTracked = reactExports.useCallback(
    (updater) => {
      setItems((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        itemsRef.current = next;
        feedCache.set(key, next);
        return next;
      });
    },
    [key]
  );
  const mergeUnique = reactExports.useCallback(
    (incoming, position) => {
      setItemsTracked((prev) => {
        const fresh = incoming.filter((i) => !seenIds.current.has(i.id));
        if (fresh.length === 0) return prev;
        fresh.forEach((i) => seenIds.current.add(i.id));
        return position === "start" ? [...fresh, ...prev] : [...prev, ...fresh];
      });
    },
    [setItemsTracked]
  );
  const pendingScrollFix = reactExports.useRef(null);
  reactExports.useLayoutEffect(() => {
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
  const prependFresh = reactExports.useCallback(
    (incoming, options) => {
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
    [setItemsTracked, scrollContainerRef]
  );
  const autoMerge = reactExports.useCallback(
    (incoming) => {
      prependFresh(incoming);
    },
    [prependFresh]
  );
  const treatInitialMergeAsFreshRef = reactExports.useRef(treatInitialMergeAsFresh);
  reactExports.useEffect(() => {
    treatInitialMergeAsFreshRef.current = treatInitialMergeAsFresh;
  }, [treatInitialMergeAsFresh]);
  reactExports.useEffect(() => {
    reconnectAttempt.current = 0;
    if (typeof window === "undefined") return;
    let cancelled = false;
    let ws = null;
    const restFallback = () => {
      fetchFeed(category).then(({ items: snapshot }) => {
        if (cancelled) return;
        seenIds.current = new Set(snapshot.map((i) => i.id));
        cursorRef.current = snapshot.length;
        setItemsTracked(snapshot);
      }).catch(() => {
      }).finally(() => {
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
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "initial":
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
        const delay = Math.min(1e3 * 2 ** reconnectAttempt.current, 15e3);
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(() => {
          if (!cancelled) connect();
        }, delay);
      };
      ws.onerror = () => ws?.close();
    };
    if (itemsRef.current.length === 0) restFallback();
    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws?.close();
      wsRef.current = null;
    };
  }, [category, mergeUnique, autoMerge, prependFresh, setItemsTracked]);
  const loadMore = reactExports.useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "load_more",
          cursor: cursorRef.current,
          page_size: pageSize,
          category
        })
      );
    } else {
      fetchFeed(category).then(({ items: snapshot }) => {
        const next = snapshot.slice(cursorRef.current, cursorRef.current + pageSize);
        mergeUnique(next, "end");
        cursorRef.current += next.length;
        const more = cursorRef.current < snapshot.length;
        hasMoreRef.current = more;
        setHasMore(more);
      }).catch(() => {
        hasMoreRef.current = false;
        setHasMore(false);
      }).finally(() => setLoadingMore(false));
    }
  }, [category, hasMore, loadingMore, mergeUnique, pageSize]);
  const refresh = reactExports.useCallback(async () => {
    setRefreshing(true);
    try {
      const { items: snapshot } = await fetchFeed(category);
      prependFresh(snapshot, { scrollToTop: true });
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, [category, prependFresh]);
  const hiddenAtRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt !== null && Date.now() - hiddenAt > AUTO_REFRESH_AFTER_HIDDEN_MS && itemsRef.current.length > 0) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const onPageShow = (e) => {
      if (e.persisted && itemsRef.current.length > 0) refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [refresh]);
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
    refresh
  };
}
export {
  useLiveFeed as u
};
