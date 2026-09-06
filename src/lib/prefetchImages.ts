/**
 * Instagram-style background prefetching: while the reader is looking at
 * the current post/reel, quietly start downloading the next few posts'
 * images so they're already sitting in the browser's HTTP cache by the
 * time the reader actually scrolls/swipes to them — instead of only
 * starting that request the moment the `<img>` itself scrolls into view
 * (which is all `loading="lazy"` gives you on its own).
 *
 * This deliberately does the simplest thing that gets that result: a
 * plain `new Image()` whose `src` we set and then never attach to the
 * DOM. The browser fetches it and stores it in its normal HTTP cache
 * keyed by URL, so the *real* `<img>` that mounts later for the same URL
 * resolves instantly from cache instead of hitting the network again.
 * No extra library, no service worker, no custom cache to invalidate —
 * this rides entirely on the browser's own caching.
 */

// Module-scope, not per-component: the same article can appear in both
// Home and Updates in one session, and re-issuing a request for a URL
// that's already prefetched (or already showing on screen) wastes
// bandwidth for no benefit. Capped so a very long session doesn't grow
// this forever — old entries are the least likely to matter anyway.
const prefetched = new Set<string>();
const MAX_TRACKED = 500;

function markPrefetched(url: string) {
  prefetched.add(url);
  if (prefetched.size > MAX_TRACKED) {
    const excess = prefetched.size - MAX_TRACKED;
    const it = prefetched.values();
    for (let i = 0; i < excess; i++) {
      const next = it.next().value;
      if (next !== undefined) prefetched.delete(next);
    }
  }
}

/**
 * True on a metered/slow connection (the same signal Chrome's own
 * data-saver features key off) — prefetching *ahead* of what the reader
 * has actually asked to see is exactly the kind of extra data use Data
 * Saver mode exists to avoid, so this skips it entirely rather than
 * silently burning someone's data plan in the background.
 */
function shouldSkipPrefetching(): boolean {
  if (typeof navigator === "undefined") return true;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
}

/** Prefetch a handful of image URLs in the background. Silently skips
 * anything already prefetched, anything falsy, and everything when the
 * reader is on Data Saver / a 2G connection. */
export function prefetchImageUrls(urls: Array<string | undefined | null>): void {
  if (typeof window === "undefined") return;
  if (shouldSkipPrefetching()) return;
  for (const url of urls) {
    if (!url || prefetched.has(url)) continue;
    markPrefetched(url);
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.decoding = "async";
    img.src = url;
  }
}

/** Convenience for feed items: prefetches each item's primary `image`
 * (the one shown before any carousel swipe — that's what's actually
 * worth warming ahead of time). */
export function prefetchFeedItemImages(items: Array<{ image?: string }>): void {
  prefetchImageUrls(items.map((item) => item.image));
}