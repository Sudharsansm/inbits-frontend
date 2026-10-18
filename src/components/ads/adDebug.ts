/**
 * Ad debug tools are DISABLED in production.
 *
 * The visible "Ad position #N (debug)" placeholders (InFeedAd, AdSlot,
 * NotificationAd, TrendingCarousel) only render when this returns true.
 * It now always returns false, and it also wipes the old saved
 * ?adsdebug=1 switch from localStorage, so a phone that was switched on
 * earlier stops showing the dashed debug boxes after its next page load.
 *
 * To debug ads again, temporarily make readAdDebugFlag return true.
 */
export const AD_DEBUG_KEY = "inbits:adsdebug";

export function readAdDebugFlag(): boolean {
  if (typeof window === "undefined") return false;
  clearAdDebugFlag();
  return false;
}

export function clearAdDebugFlag(): void {
  try {
    window.localStorage.removeItem(AD_DEBUG_KEY);
  } catch {
    /* ignore */
  }
}