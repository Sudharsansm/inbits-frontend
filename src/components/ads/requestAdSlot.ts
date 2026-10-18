/**
 * Shared, staggered AdSense request queue.
 *
 * Why this exists: in an infinite-scroll feed, several cards using the
 * SAME ad unit ID (e.g. the home in-feed slot, reused on every ad
 * position) can enter "request range" within the same scroll tick --
 * widening each component's IntersectionObserver margin (see
 * useAdUnit.ts / InFeedAd.tsx -- done to make ads appear sooner) makes
 * this more likely, since several cards can now be "near" the viewport
 * at once on a fast scroll.
 *
 * Pushing several requests for the identical slot ID to `adsbygoogle`
 * back-to-back in the same instant is a known cause of some of them
 * coming back `unfilled`: Google's ad server tends to answer the first
 * of a burst and decline the rest, which is exactly "slot #1 filled,
 * slot #2 unfilled, both show requested: yes".
 *
 * This does NOT change when any component decides to request an ad --
 * that is still each component's own IntersectionObserver. It only
 * makes sure that once several of them decide to request around the same
 * moment, the actual `adsbygoogle.push({})` calls go out spaced apart
 * instead of in the same tick. The guard (has this <ins> already been
 * processed?) is re-checked right before each queued push fires, since
 * state can change while a request is waiting in the queue.
 */
const MIN_GAP_MS = 350;

/**
 * Cap on AdSense requests per SCREEN. An infinite feed can mount 100+ ad
 * slots; requesting the same ad unit that many times at once drives later
 * requests to come back "unfilled" and looks like excessive ad density.
 * Slots past the cap stay empty (zero height) and never request.
 *
 * IMPORTANT: this is an SPA -- navigating between Home / Jobs / Search /
 * Notifications never reloads the page, so a plain page-lifetime counter
 * would run out after the first few screens and block EVERY ad for the
 * rest of the session. The count therefore resets whenever the route
 * (pathname) changes.
 */
const MAX_REQUESTS_PER_SCREEN = 10;
let pushedCount = 0;
let countedPath = "";

function resetCountOnNavigation(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path !== countedPath) {
    countedPath = path;
    pushedCount = 0;
  }
}

let lastPushAt = 0;
let chain: Promise<void> = Promise.resolve();

/**
 * Queue an AdSense push. `run` should both re-check whatever guard applies
 * (e.g. "has this <ins> already been processed?") and perform the actual
 * `(window.adsbygoogle = window.adsbygoogle || []).push({})` call -- do
 * the check inside `run`, not before calling `queueAdRequest`, so it's
 * evaluated at push time, not enqueue time.
 */
export function queueAdRequest(run: () => void): void {
  resetCountOnNavigation();
  if (pushedCount >= MAX_REQUESTS_PER_SCREEN) return;
  pushedCount += 1;
  chain = chain.then(
    () =>
      new Promise<void>((resolve) => {
        const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastPushAt));
        setTimeout(() => {
          lastPushAt = Date.now();
          try {
            run();
          } finally {
            resolve();
          }
        }, wait);
      }),
  );
}