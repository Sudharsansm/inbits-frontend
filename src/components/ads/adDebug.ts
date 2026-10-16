/**
 * Shared on/off switch for the ad debug tools (AdDebugPanel, and the
 * visible placeholder InFeedAd shows where an ad goes when debug is on).
 *
 * Off by default and invisible to normal visitors. Open the site once with
 * ?adsdebug=1 to switch it on -- the flag is kept in this origin's
 * localStorage, so it also applies to the installed app on the same phone.
 * ?adsdebug=0 switches it off.
 */
export const AD_DEBUG_KEY = "inbits:adsdebug";

export function readAdDebugFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("adsdebug");
    if (q === "1") window.localStorage.setItem(AD_DEBUG_KEY, "1");
    if (q === "0") window.localStorage.removeItem(AD_DEBUG_KEY);
    return window.localStorage.getItem(AD_DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearAdDebugFlag(): void {
  try {
    window.localStorage.removeItem(AD_DEBUG_KEY);
  } catch {
    /* ignore */
  }
}