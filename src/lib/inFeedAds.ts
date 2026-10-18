/**
 * Where in-feed ads go in the home feed.
 *
 * Kept as a pure function (no React, no window) so the spacing rules are
 * unit-testable -- see inFeedAds.test.ts.
 *
 * Rules:
 *  - one ad after every IN_FEED_AD_EVERY organic posts. At 4 the feed reads
 *    "post, post, post, post, ad, post, post, post, post, ad, ..." -- change
 *    the one number below to show ads more or less often (3-5 is gentler on
 *    readers and on AdSense's "excessive ads" policy review; 2 is the
 *    densest sensible setting);
 *  - never after the very last post, so the feed never ends on an ad with
 *    no organic content below it.
 */
export const IN_FEED_AD_EVERY = 4;

/**
 * Returns the 1-based ordinal of the ad that should render right after
 * the post at `index` (0-based) in a feed of `total` posts, or `null`
 * when no ad goes there.
 *
 * The ordinal (not the post id, not the index) is what the caller uses
 * as the React key, so an ad keeps its identity -- and doesn't re-request
 * -- when posts are prepended on refresh or filtered out.
 */
export function adOrdinalAfter(index: number, total: number): number | null {
  const position = index + 1;
  if (position % IN_FEED_AD_EVERY !== 0) return null;
  if (index >= total - 1) return null;
  return position / IN_FEED_AD_EVERY;
}