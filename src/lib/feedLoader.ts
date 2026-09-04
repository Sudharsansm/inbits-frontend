import { fetchFeed, type FeedItem } from "@/lib/api";

// Used by route `loader`s (Home, Updates) to seed real content into the
// very first render — including the server-rendered HTML on a cold visit.
//
// FIX: was 1200ms, then 350ms, then 80ms — each step still meant the SSR
// pass gambled some amount of time on the backend before the browser got
// its first byte of HTML. Set to 0: the loader no longer waits on the
// network at all, so the route is never held up by backend/latency,
// full stop. In practice this means SSR almost always resolves with an
// empty list and the *client* becomes the real source of first paint —
// useLiveFeed opens its WebSocket (falling back to a direct REST call)
// immediately on mount and fills in real data a moment later. There is
// no client-side cache/persistence layer anymore (removed — every load
// always goes straight to the backend), so this first client-side fetch
// is the only path to real content, same as any other visit.
const LOADER_TIMEOUT_MS = 0;

export async function loadFeedForRoute(category = "All"): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOADER_TIMEOUT_MS);
  try {
    const { items } = await fetchFeed(category, controller.signal);
    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}