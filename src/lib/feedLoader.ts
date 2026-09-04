import { fetchFeed, type FeedItem } from "@/lib/api";

// Used by route `loader`s (Home, Updates) to seed real content into the
// very first render — including the server-rendered HTML on a cold visit.
//
// FIX: was 1200ms, then 350ms, then 80ms — each step still meant the SSR
// pass gambled some amount of time on the backend before the browser got
// its first byte of HTML. Set to 0: the loader no longer waits on the
// network at all, so the route is never held up by backend/latency,
// full stop. In practice this means SSR almost always resolves with an
// empty list and the *client* becomes the only real source of first
// paint — via useLiveFeed's localStorage seed (lib/feedPersist.ts) for
// a near-instant repeat visit, then the WebSocket/REST fallback filling
// in real data a moment later. Worth knowing: this trades away
// "sometimes SSR ships real content in the initial HTML" for "SSR is
// never the bottleneck" — a genuinely first-ever visit (nothing cached
// anywhere yet) still has to wait on that first client-side fetch, same
// as before, it just no longer waits twice (once in SSR, again on the
// client).
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