// Cross-visit persistence for the live feed, on top of `useLiveFeed`'s own
// in-memory module cache (see hooks/useLiveFeed.ts).
//
// The in-memory cache already makes Home ⇄ article ⇄ back instant within a
// session, but it's empty on a hard refresh or a brand-new tab — which is
// exactly the case a high-traffic, low-server, slow-network deployment
// needs to handle well: users landing again and again with nothing cached
// in JS memory yet. Persisting a small, capped snapshot to localStorage
// means that even a fresh page load can paint real content immediately,
// before the network (WebSocket or REST) has answered at all, and the
// live connection then quietly tops it up. Classic stale-while-revalidate,
// just applied to the feed instead of an HTTP response.
//
// Deliberately NOT used to replace the network — it's a first-paint seed
// only. Every mount still opens the socket / hits the REST fallback the
// same as before.

const CACHE_PREFIX = "inbits:feed:v1:";
// Keep the persisted snapshot small — this is a "paint something now"
// seed, not a full offline archive. Bounds both the localStorage payload
// size (matters on slow networks/low-end devices where JSON.parse of a
// huge blob would itself cost visible time) and the JSON.stringify cost
// on every write.
const MAX_PERSISTED_ITEMS = 40;
// Past this age the snapshot is more likely to confuse than help (e.g.
// showing a reader day-old headlines as if they were current), so treat
// it as absent rather than paint it. Well short of that, it's still a far
// better first paint than a bare skeleton.
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

type Persisted<T> = {
  items: T[];
  savedAt: number;
};

export function loadPersistedFeed<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted<T>;
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed.items;
  } catch {
    // Corrupt entry, private-mode storage throwing, etc. — just behave as
    // if nothing was cached rather than let this break the page.
    return null;
  }
}

export function savePersistedFeed<T>(key: string, items: T[]): void {
  if (typeof window === "undefined" || items.length === 0) return;
  try {
    const payload: Persisted<T> = {
      items: items.slice(0, MAX_PERSISTED_ITEMS),
      savedAt: Date.now(),
    };
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
  } catch {
    // Storage full or unavailable (private browsing in some browsers) —
    // persisting is a nice-to-have, never worth failing the page over.
  }
}
