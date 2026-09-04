import { fetchFeed, type FeedItem } from "@/lib/api";

// Used by route `loader`s (Home, Updates) to seed real content into the
// very first render — including the server-rendered HTML on a cold visit,
// which is the one case client-side caching (in-memory + localStorage,
// see hooks/useLiveFeed.ts + lib/feedPersist.ts) can never cover, since
// there's nothing to cache yet.
//
// FIX: was 1200ms. That let a slow/unreachable backend add over a
// second to *every* cold SSR response, which alone blew the "loads in
// under 1s" target before a single byte reached the browser. 350ms is
// enough for a same-region, nginx-microcached backend (see
// deploy/nginx/nginx.conf) to answer comfortably, while guaranteeing the
// route can never be held up by more than a third of a second. If it
// doesn't answer in time, resolve with an empty list — the route still
// renders immediately, and useLiveFeed's own WebSocket/REST-fallback +
// skeleton take over client-side exactly as before.
const LOADER_TIMEOUT_MS = 350;

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