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

/** Hard cap on how many articles this session's cache holds at once.
 * FIX: the cache used to be an unbounded `Map` that was never pruned —
 * every story a reader tapped stayed in memory for the rest of the tab's
 * lifetime. On a feed app that's built around fast, unlimited scrolling
 * (Home, Updates, Search, Saved, Related, live groups), a single long
 * session could seed hundreds of entries with nothing ever removing
 * them — a slow, silent memory leak that got worse the longer the app
 * stayed open, which matters a lot for a PWA people keep open all day.
 * `MAX_ENTRIES` bounds that: once the cache holds more than this many
 * articles, the least-recently-used ones are evicted first. */
const MAX_ENTRIES = 60;

/** Keyed by article id. Populated two ways:
 *  1. `seedArticle()` — called the moment a reader taps a headline
 *     anywhere in the app (see lib/articleViewer.tsx), from whatever
 *     shape of data that tap site already has in memory.
 *  2. A real fetch completing in routes/post.$id.tsx, which always
 *     overwrites a seeded entry with the complete one.
 * Not cleared on navigation — revisiting an id within the session
 * (Related, back button, tapping the same story from two different
 * feeds) reads from here instead of re-fetching. Bounded to `MAX_ENTRIES`
 * via LRU eviction (see `touch()` / `evictIfNeeded()` below) so this no
 * longer grows without limit over a long session. */
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

/** Moves `id` to the "most recently used" end of the Map (JS `Map`
 * iterates in insertion order, so re-inserting a key is what pushes it
 * to the end). Both reads and writes call this, so "least recently
 * used" always means "least recently looked at or updated" — not just
 * "oldest inserted". */
function touch(id: string, value: ArticleData): void {
  articleCache.delete(id);
  articleCache.set(id, value);
}

/** Evicts the oldest (least-recently-used) entries — the ones at the
 * front of the Map's iteration order — until the cache is back at or
 * under `MAX_ENTRIES`. Called after every insert, so the cache never
 * grows past the cap. */
function evictIfNeeded(): void {
  while (articleCache.size > MAX_ENTRIES) {
    const oldestKey = articleCache.keys().next().value;
    if (oldestKey === undefined) break;
    articleCache.delete(oldestKey);
  }
}

/**
 * Reads an article out of the cache, touching it so it counts as
 * recently used and survives future evictions. Prefer this over
 * `articleCache.get()` directly wherever a read should also refresh the
 * entry's recency (e.g. rendering /post/:id).
 */
export function getArticle(id: string): ArticleData | undefined {
  const existing = articleCache.get(id);
  if (existing) touch(id, existing);
  return existing;
}

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
  if (existing?.complete) {
    touch(partial.id, existing);
    return;
  }
  const post: FeedItem = { ...FALLBACK, ...existing?.post, ...partial, id: partial.id };
  touch(partial.id, { post, related: existing?.related ?? [], complete: false });
  evictIfNeeded();
}

/**
 * Writes the real, fully-fetched article into the cache (called once
 * `/api/article/:id` + the related-feed snapshot resolve in
 * routes/post.$id.tsx). Same recency + eviction handling as
 * `seedArticle`, so a freshly-completed article is never the one
 * evicted a moment later.
 */
export function setArticle(id: string, data: ArticleData): void {
  touch(id, data);
  evictIfNeeded();
}