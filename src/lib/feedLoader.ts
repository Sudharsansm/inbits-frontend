import { fetchFeed, type FeedItem } from "@/lib/api";

// Used by route `loader`s (Home, Updates) to seed real content into the
// very first render — including the server-rendered HTML on a cold visit.
//
// FIX: this was dropped all the way to 0ms on the theory that "never wait
// on the network" would make the route feel instant. It did the opposite:
// with 0ms the loader aborts before the (nginx-microcached, normally
// <50ms) backend request can ever come back, so SSR *always* resolves
// with an empty list and both Home and Updates rendered nothing until a
// second, client-only fetch finished after mount — the exact "takes a
// moment to appear" delay this was meant to prevent. 1200ms was too
// generous (a genuinely slow/unreachable backend held up navigation for
// over a second), so this now gives the loader a short, bounded window —
// long enough for the normal fast path to land real data before first
// paint, short enough that a slow backend still can't stall the route for
// more than a third of a second before it renders anyway with nothing,
// exactly as before, and lets useLiveFeed's socket/REST fallback take
// over from there.
const LOADER_TIMEOUT_MS = 300;

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