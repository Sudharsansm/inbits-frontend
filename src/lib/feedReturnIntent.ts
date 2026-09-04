// Home and Updates always fetch a fresh live feed on mount (useLiveFeed
// keeps no stored feed data of its own — see hooks/useLiveFeed.ts). What
// this tiny module preserves across that remount is just the reader's
// *scroll position*: opening an article and hitting Back should land you
// exactly where you were reading, once the fresh feed has loaded, rather
// than always dropping you back at the top.
//
// That scroll restore shouldn't survive a trip to a completely different
// page (Jobs, Search, Stands, Menu, ...) — leaving Home for Jobs and
// coming back should show fresh content from the top, the same way
// switching away from Instagram's Home tab and back to it does, not
// resume a frozen scroll position from ten minutes ago.
//
// This tiny module is the switch between those two cases: `openArticle`
// (lib/articleViewer.tsx) marks intent to "preserve" immediately before
// navigating to a story. Home/Updates each consume that intent exactly
// once on mount — if it says "preserve", they scroll the remembered post
// back into view once it reappears in the fresh feed; otherwise
// (including a browser refresh, where this resets to its default anyway)
// they just start scrolled to the top.
//
// FIX (1): this used to carry only the preserve/reset flag, and
// Home/Updates separately tried to restore a raw pixel scroll offset
// (window.scrollY / a div's scrollTop) captured right before leaving.
// That's fragile: ad slots lazy-mount as you scroll near them, images
// finish loading and change card heights, a pull-to-refresh can append
// new items -- any of which shifts the pixel position of the post you
// were actually reading between the moment you left and the moment you
// come back. Carrying the *post id* here instead lets Home/Updates
// scroll that exact post's element into view on return, correct
// regardless of any height/order shift.
//
// FIX (2): this used to live in a plain module-level variable, which
// only survives an in-app (client-side/SPA) navigation. This app opens a
// live WebSocket for the feed (see hooks/useLiveFeed.ts), and pages with
// an open WebSocket are excluded from the browser's back-forward cache
// in every major browser -- so tapping the device/browser Back button
// (as opposed to the in-app arrow, which also just calls
// `window.history.back()`) is very often a genuine full page reload from
// the server, not a same-JS-context pop navigation. A plain module
// variable is wiped the instant that happens, before this module ever
// gets to read it again -- which is exactly why the post-id fix above
// still landed on the first post/reel: the value never made it back.
// sessionStorage survives a full reload (that's its entire purpose), so
// this now reads/writes there instead, with the in-memory variables kept
// only as the fast path for same-JS-context navigations and as a no-op
// fallback during SSR (where there's no `window`/`sessionStorage`).
const STORAGE_KEY = "inbits:feedReturnIntent";

type StoredIntent = { intent: "preserve"; postId: string };

let memoryIntent: StoredIntent | null = null;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    // Private-browsing modes / disabled storage can throw on access.
    return null;
  }
}

export function markLeavingForArticle(postId: string): void {
  const value: StoredIntent = { intent: "preserve", postId };
  memoryIntent = value;
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(value));
}

export type FeedReturnIntent = {
  intent: "preserve" | "reset";
  /** The post that was tapped to leave, when intent is "preserve" —
   * null for "reset" or if nothing was recorded. Scroll that exact post
   * back into view on return instead of trusting a raw pixel offset. */
  postId: string | null;
};

/** Reads (and resets) the current intent. Call this exactly once per
 * mount, before initializing anything that depends on it — see
 * routes/index.tsx and routes/updates.tsx. */
export function consumeFeedReturnIntent(): FeedReturnIntent {
  const storage = getStorage();
  let stored: StoredIntent | null = memoryIntent;

  if (!stored && storage) {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        stored = JSON.parse(raw) as StoredIntent;
      } catch {
        stored = null;
      }
    }
  }

  memoryIntent = null;
  storage?.removeItem(STORAGE_KEY);

  if (!stored) return { intent: "reset", postId: null };
  return { intent: "preserve", postId: stored.postId };
}