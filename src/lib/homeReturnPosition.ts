// Which post the reader was on in Home, kept across navigating to *any*
// other page and back -- Jobs, Search, Updates, Menu, an article, all of
// it -- the same way reelReturnPosition.ts does for Updates.
//
// This is deliberately different from feedReturnIntent.ts, which only
// preserves scroll position for the one specific case of "tapped into an
// article, hit Back". Home should behave like Updates: switching to
// another tab (Jobs, Search, Menu, ...) and back to Home should drop the
// reader on the same post they were reading, not back at the top -- so
// this module tracks the *current* post continuously (not a one-shot
// handoff consumed on read, like feedReturnIntent) and Home always tries
// to resume it on mount, regardless of where the reader is coming back
// from. Only a genuinely fresh session -- nothing recorded yet -- starts
// at the top.
//
// Persisted the same two-layer way feedReturnIntent.ts/
// reelReturnPosition.ts are, for the same reason: an in-memory variable
// as the fast path for same-JS-context SPA navigations, plus
// sessionStorage because this page holds an open feed WebSocket, which
// excludes it from the browser's back-forward cache in every major
// browser -- so Back is very often a genuine full page reload, which
// wipes a plain module variable before Home ever gets to read it again.
// sessionStorage survives that (and is cleared on a real new session,
// e.g. a new tab), which is exactly the "fresh session" line this is
// meant to draw.
const STORAGE_KEY = "inbits:homeLastPost";

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

/** Call whenever the post actually on screen changes, so this always
 * reflects where the reader currently is, not where they started. */
export function setLastPostId(id: string | null): void {
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
export function getLastPostId(): string | null {
  if (memoryId) return memoryId;
  return getStorage()?.getItem(STORAGE_KEY) ?? null;
}