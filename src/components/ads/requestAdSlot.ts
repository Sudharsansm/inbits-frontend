/**
 * Shared, staggered AdSense request queue.
 *
 * Several cards using the SAME ad unit ID can enter "request range" in the
 * same scroll tick. Pushing several requests for the identical slot ID to
 * `adsbygoogle` back-to-back in the same instant tends to get the first
 * filled and the rest "unfilled". This spaces the actual push() calls apart.
 * Each component still decides for itself WHEN to request (its own
 * IntersectionObserver); this only serialises the pushes. The guard
 * (already-processed check) runs inside `run`, right before each push.
 */
const MIN_GAP_MS = 350;

/**
 * Hard cap on AdSense requests per page view. An infinite feed can mount
 * 100+ ad slots; requesting the same ad unit that many times in one page
 * view drives later requests to come back "unfilled" and looks like
 * excessive ad density to AdSense's review. Slots past the cap stay empty
 * (zero height) and never request.
 */
const MAX_REQUESTS_PER_PAGEVIEW = 8;
let pushedCount = 0;

let lastPushAt = 0;
let chain: Promise<void> = Promise.resolve();

export function queueAdRequest(run: () => void): void {
  if (pushedCount >= MAX_REQUESTS_PER_PAGEVIEW) return;
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