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

type CacheEntry = {
  items: FeedItem[];
  cursor: number;
  seenIds: Set<string>;
  hasMore: boolean;
};

// Module-level, per-category cache that survives a component unmounting —
// e.g. navigating Home → article → back. Without this, every remount
// started from an empty list and waited on the network again, which both
// looked like the page was "loading" every time you opened it AND broke
// the browser's scroll-position restoration (there was nothing at the old
// scroll offset to restore to, because the list had just been emptied).
const feedCache = new Map<string, CacheEntry>();

/**
 * Keeps `items` in sync with the backend's `/ws/feed` socket, the way a
 * real social feed behaves:
 *
 *  - Opening the app / returning to a page you already loaded shows what
 *    you already had, instantly — no reset, no spinner.
 *  - Articles scraped while you're on the page do NOT get injected into
 *    the list automatically — that would yank content around under
 *    someone mid-scroll or mid-read. They're held quietly until
 *    `refresh()` is called (pull-to-refresh, a manual refresh action).
 *  - When you do refresh, anything new is appended after what's already
 *    loaded — it shows up further down as you keep scrolling, instead of
 *    jumping to the top and shoving everything else down.
 */
export function useLiveFeed({
  category = "All",
  initialItems = [],
  pageSize = 10,
  cacheKey,
}: Options) {
  const key = cacheKey ?? category;
  const cached = feedCache.get(key);
  const seed = cached?.items.length ? cached.items : initialItems;

  const [items, setItems] = useState<FeedItem[]>(seed);
  const [connected, setConnected] = useState(false);
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const cursorRef = useRef(cached?.cursor ?? seed.length);
  const seenIds = useRef(cached?.seenIds ?? new Set(seed.map((i) => i.id)));
  const pendingRef = useRef<FeedItem[]>([]);
  const itemsRef = useRef(seed);
  const hasMoreRef = useRef(cached?.hasMore ?? true);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);

  const setItemsTracked = useCallback(
    (updater: FeedItem[] | ((prev: FeedItem[]) => FeedItem[])) => {
      setItems((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: FeedItem[]) => FeedItem[])(prev)
            : updater;
        itemsRef.current = next;
        return next;
      });
    },
    [],
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

  /** Queue a newly-scraped article instead of dropping it straight into
   * the visible feed — keeps whatever the user is looking at stable
   * until they explicitly ask for what's new. */
  const queuePending = useCallback((incoming: FeedItem[]) => {
    const fresh = incoming.filter(
      (i) => !seenIds.current.has(i.id) && !pendingRef.current.some((p) => p.id === i.id),
    );
    if (fresh.length === 0) return;
    pendingRef.current = [...pendingRef.current, ...fresh];
  }, []);

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
            // But if items are already showing — which is exactly what
            // happens on every remount of this cache key: navigating
            // Home → article → back, switching tabs and returning,
            // Home ⇄ Updates, etc. — do NOT merge this snapshot into the
            // visible list. That was the bug: every page revisit opened
            // a fresh socket, which always sends "initial" again, and
            // unconditionally prepending its contents meant new stories
            // appeared at the top on their own, with no pull-to-refresh
            // and no scrolling involved. Instead, treat it exactly like
            // a "new_item" — queue it quietly, and only surface it when
            // the user actually pulls down to refresh.
            if (itemsRef.current.length > 0) {
              queuePending(msg.items);
            } else {
              seenIds.current = new Set(msg.items.map((i) => i.id));
              cursorRef.current = msg.items.length;
              setItemsTracked(msg.items);
              pendingRef.current = [];
            }
            hasMoreRef.current = true;
            setHasMore(true);
            break;
          case "new_item":
            // Anything scraped after the first load queues quietly instead
            // of jumping into the feed the user is currently reading.
            queuePending([msg.item]);
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
      // Persist current state so the next mount of this cache key (e.g.
      // navigating back) picks up right where this one left off.
      feedCache.set(key, {
        items: itemsRef.current,
        cursor: cursorRef.current,
        seenIds: seenIds.current,
        hasMore: hasMoreRef.current,
      });
    };
  }, [category, key, mergeUnique, queuePending, setItemsTracked]);

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

  /** Manual refresh — pull-to-refresh, a refresh action, etc. Reveals
   * anything queued since the last refresh, and tops up against the REST
   * snapshot too, so a socket that's been silently reconnecting still
   * catches up. New items are appended after what's already on screen,
   * continuing the feed downward instead of jumping to the top. */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const queued = pendingRef.current;
      pendingRef.current = [];
      if (queued.length > 0) {
        mergeUnique(queued, "end");
        cursorRef.current += queued.length;
      }
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
  }, [category, mergeUnique, setItemsTracked]);

  return { items, connected, hasMore, loadingMore, loadMore, refreshing, refresh };
}
