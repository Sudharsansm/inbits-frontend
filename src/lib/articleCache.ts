import type { FeedItem } from "@/lib/api";

export type ArticleData = {
  post: FeedItem;
  related: FeedItem[];
  /** True once this entry came from a real `/api/article/:id` fetch (full
   * body + real related list). False means it's a stand-in built from
   * whatever fields were already on hand when the reader tapped the
   * story (a feed card, a rail, a search result) — good enough to paint
   * the page immediately, but still due a background refresh. */
  complete: boolean;
};

/** Keyed by article id. Populated two ways:
 *  1. `seedArticle()` — called the moment a reader taps a headline
 *     anywhere in the app (see lib/articleViewer.tsx), from whatever
 *     shape of data that tap site already has in memory.
 *  2. A real fetch completing in routes/post.$id.tsx, which always
 *     overwrites a seeded entry with the complete one.
 * Never cleared on navigation — revisiting an id within the session
 * (Related, back button, tapping the same story from two different
 * feeds) reads from here instead of re-fetching. */
export const articleCache = new Map<string, ArticleData>();

// Safe stand-ins for whatever fields a given tap site doesn't have on
// hand. `content` deliberately stays empty — PostArticle already falls
// back to `excerpt` when `content` is blank, so leaving it out here means
// the seeded render shows the real excerpt rather than an invented body.
const FALLBACK: FeedItem = {
  id: "",
  originalArticleId: "",
  category: "",
  topic: "",
  title: "",
  excerpt: "",
  content: "",
  author: "",
  source: "",
  sourceUrl: "",
  readTime: 1,
  image: "",
  images: [],
  publishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  likes: 0,
  views: 0,
  tags: [],
  language: "",
  location: "",
  status: "published",
};

/**
 * Seeds the cache with whatever's already known about a story at the
 * exact moment a reader taps it, *before* navigation happens — this is
 * what lets /post/:id skip its loading state entirely for every in-app
 * tap. Callers range from a full live `FeedItem` (the main feed, Updates,
 * Search, Saved, Related) down to a thin rail summary that only has an
 * id/title/image/category — either way, whatever's missing is patched
 * with a safe fallback so the page never crashes, and gets filled in for
 * real moments later by the background fetch in post.$id.tsx.
 *
 * Never downgrades an already-`complete` entry: tapping into a story a
 * second time (e.g. from a different rail) after its full content has
 * already loaded once shouldn't throw that away for a thinner stand-in.
 */
export function seedArticle(partial: Partial<FeedItem> & { id: string }): void {
  const existing = articleCache.get(partial.id);
  if (existing?.complete) return;
  const post: FeedItem = { ...FALLBACK, ...existing?.post, ...partial, id: partial.id };
  articleCache.set(partial.id, { post, related: existing?.related ?? [], complete: false });
}
