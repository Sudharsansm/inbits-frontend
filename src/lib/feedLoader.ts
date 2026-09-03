import { fetchFeed, type FeedItem } from "@/lib/api";

// Used by route `loader`s (Home, Updates) to seed real content into the
// very first render — including the server-rendered HTML on a cold visit,
// which is the one case client-side caching (in-memory + localStorage,
// see hooks/useLiveFeed.ts + lib/feedPersist.ts) can never cover, since
// there's nothing to cache yet.
//
// Bounded with a short timeout on purpose: a loader that can hang
// indefinitely on a slow/unreachable backend would bring back exactly the
// "stuck loading" feel this is meant to fix. If it doesn't answer in
// time, resolve with an empty list — the route still renders immediately,
// and useLiveFeed's own WebSocket/REST-fallback + skeleton take over
// client-side exactly as before this change.
const LOADER_TIMEOUT_MS = 1200;

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
