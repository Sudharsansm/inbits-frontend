import type { FeedItem } from "@/lib/api";

/**
 * True only if this post actually has at least one non-empty image URL.
 * Used to filter posts with no image OUT of the feed entirely — Home and
 * Updates both call this before rendering, so a post with no image is
 * simply never shown, rather than showing with a placeholder.
 *
 * This only catches the "no image to begin with" case. A post whose
 * image URL exists but fails to load at runtime (dead link, blocked by
 * the source) is caught separately — see ImageCarousel's `onUnavailable`
 * callback, which the Home/Updates routes use to remove that post too
 * once the failure is actually known.
 */
export function hasImage(post: Pick<FeedItem, "image" | "images">): boolean {
  if (post.images?.some((src) => !!src?.trim())) return true;
  return !!post.image?.trim();
}