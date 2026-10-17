/**
 * Where in-feed ads go in the home feed.
 *
 * Kept as a pure function (no React, no window) so the spacing rules are
 * unit-testable -- see inFeedAds.test.ts.
 *
 * Rules:
 *  - one ad after every IN_FEED_AD_EVERY organic posts. At 2 the feed reads
 *    "post, post, ad, post, post, ad, ..." -- change the one number below to
 *    show ads more or less often (3-5 is gentler on readers and on AdSense's
 *    "excessive ads" policy review; 2 is the densest sensible setting);
 *  - never after the very last post, so the feed never ends on an ad with
 *    no organic content below it;
 *  - never more than MAX_IN_FEED_ADS_PER_SESSION ads in one continuous
 *    scroll session (no full page reload). An infinite-scroll feed has no
 *    natural "page boundary", so without a ceiling a reader who keeps
 *    scrolling can end up with 100+ mounted instances of the *same* ad
 *    unit -- which is exactly the pattern Google's own infinite-scroll
 *    guidance warns against (it reads as excessive density / possible
 *    invalid-traffic shape to their systems, on top of simply being more
 *    identical-creative requests than there is advertiser demand for,
 *    especially for a native "fluid" unit, which already fills less often
 *    than a standard display unit). Past the cap, later posts render with
 *    no trailing ad at all rather than keep stacking more.
 */
export const IN_FEED_AD_EVERY = 2;
export const MAX_IN_FEED_ADS_PER_SESSION = 20;

/**
 * Returns the 1-based ordinal of the ad that should render right after
 * the post at `index` (0-based) in a feed of `total` posts, or `null`
 * when no ad goes there (including past MAX_IN_FEED_ADS_PER_SESSION).
 *
 * The ordinal (not the post id, not the index) is what the caller uses
 * as the React key, so an ad keeps its identity -- and doesn't re-request
 * -- when posts are prepended on refresh or filtered out.
 */
export function adOrdinalAfter(index: number, total: number): number | null {
  const position = index + 1;
  if (position % IN_FEED_AD_EVERY !== 0) return null;
  if (index >= total - 1) return null;
  const ordinal = position / IN_FEED_AD_EVERY;
  if (ordinal > MAX_IN_FEED_ADS_PER_SESSION) return null;
  return ordinal;
}