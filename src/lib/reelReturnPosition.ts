// Which reel the reader was on in Updates, kept across navigating to *any*
// other page and back -- Jobs, Search, Menu, an article, all of it.
//
// This is deliberately different from feedReturnIntent.ts, which only
// preserves Home/Updates' scroll position for the one specific case of
// "tapped into an article, hit Back" -- everything else (switching to
// another tab and back) is treated there as a fresh visit that should
// reset to the top, the same way Instagram's Home tab behaves.
//
// Updates is a reels feed, not a Home feed, and reels tabs don't work that
// way: switching to Instagram's Jobs/Search/whatever-equivalent and back to
// Reels drops you on the same reel, not back at the top. So this module
// tracks the *current* reel continuously (not a one-shot handoff consumed
// on read, like feedReturnIntent) and Updates always tries to resume it on
// mount, regardless of where the reader is coming back from. Only a
// genuinely fresh session -- nothing recorded yet -- starts at the top.
//
// Persisted the same two-layer way feedReturnIntent.ts is, for the same
// reason: an in-memory variable as the fast path for same-JS-context SPA
// navigations, plus sessionStorage because this page holds an open feed
// WebSocket, which excludes it from the browser's back-forward cache in
// every major browser -- so Back is very often a genuine full page reload,
// which wipes a plain module variable before Updates ever gets to read it
// again. sessionStorage survives that (and is cleared on a real new
// session, e.g. a new tab), which is exactly the "fresh session" line this
// is meant to draw.
const STORAGE_KEY = "inbits:updatesLastReel";

let memoryId: string | null = null;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    // Private-browsing modes / disabled storage can throw on access.
    return null;
  }
}

/** Call whenever the reel actually on screen changes, so this always
 * reflects where the reader currently is, not where they started. */
export function setLastReelId(id: string | null): void {
  if (!id) return;
  memoryId = id;
  try {
    getStorage()?.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

/** Read-only -- unlike feedReturnIntent's consume, this isn't a one-shot
 * handoff, so reading it doesn't clear it. Call once on mount to decide
 * where to resume. */
export function getLastReelId(): string | null {
  if (memoryId) return memoryId;
  return getStorage()?.getItem(STORAGE_KEY) ?? null;
}