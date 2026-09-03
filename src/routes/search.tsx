import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { searchArticles, type FeedItem } from "@/lib/api";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { excludeSeen, markSeen } from "@/lib/seenArticles";
import { formatRelativeTime } from "@/lib/format";
import { useTranslated } from "@/lib/i18n";
import { useArticleViewer } from "@/lib/articleViewer";
import { DiscoverGridSkeleton } from "@/components/common/FeedSkeleton";
import { AdSlot } from "@/components/ads/AdSlot";
import { Loader2, Search as SearchIcon, X } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · InBits" },
      {
        name: "description",
        content: "Search InBits' live news feed, or browse what's live right now.",
      },
    ],
  }),
  // No loader — the default browse grid is populated client-side by
  // useLiveFeed below (same REST-fallback + WebSocket pattern as Home and
  // Updates), so opening Search is never blocked on a network round-trip.
  // Typed searches always hit the backend fresh regardless (see
  // handleSearch below).
  component: SearchPage,
});

const tags = [
  "Trending",
  "Tech",
  "Politics",
  "Food",
  "Travel",
  "Markets",
  "Sports",
  "Film",
  "Climate",
];

// Kept at module scope (not in loader/URL state) so leaving to read a
// result and coming back via the browser/app back button restores the
// exact query and results instead of resetting to a blank search box —
// same "come back to where you were" behavior as the feed pages.
const searchCache: { q: string; results: FeedItem[] } = { q: "", results: [] };

function SearchPage() {
  const { items: liveItems, showEmptyState } = useLiveFeed({
    category: "All",
    cacheKey: "search-discover",
  });
  // Same shared registry as Home/Updates — the browse grid shows articles
  // that weren't already the top story on those pages a moment ago.
  const discover = useMemo(() => excludeSeen(liveItems, "search", 8), [liveItems]);
  useEffect(() => {
    if (discover.length > 0) markSeen(discover.slice(0, 20).map((i) => i.id), "search");
  }, [discover]);

  const [q, setQ] = useState(searchCache.q);
  const [debouncedQ, setDebouncedQ] = useState(searchCache.q);
  const [results, setResults] = useState<FeedItem[]>(searchCache.results);
  const [loading, setLoading] = useState(false);

  // Debounce so we're not hitting the backend on every keystroke — it
  // fetches live from the web when nothing local matches, so it's worth
  // waiting for a pause in typing rather than firing on every letter.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    searchCache.q = q;
  }, [q]);

  useEffect(() => {
    if (!debouncedQ) {
      setResults([]);
      searchCache.results = [];
      return;
    }
    // Already have results cached for exactly this query (e.g. just
    // navigated back) — skip the redundant refetch.
    if (
      debouncedQ === searchCache.q &&
      searchCache.results.length > 0 &&
      results === searchCache.results
    ) {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    searchArticles(debouncedQ, controller.signal)
      .then(({ items }) => {
        setResults(items);
        searchCache.results = items;
      })
      .catch(() => {
        /* aborted (newer query typed) or backend unreachable — leave results as-is */
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running on `results`
  }, [debouncedQ]);

  const isSearching = q.trim().length > 0;
  const showLoading = loading && debouncedQ === q.trim();

  return (
    <AppShell title="Search">
      <div className="sticky top-[60px] z-20 bg-paper/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search live news, hosts, jobs…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {q && !loading && (
            <button onClick={() => setQ("")} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setQ(t)}
              className="flex-none rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      {isSearching ? (
        <div className="px-4 pt-1">
          {showLoading ? (
            <p className="pb-2 text-xs text-muted-foreground">Searching…</p>
          ) : (
            <p className="pb-2 text-xs text-muted-foreground">
              {results.length > 0
                ? `${results.length} result${results.length === 1 ? "" : "s"} for “${debouncedQ}”`
                : `No stories found for “${debouncedQ}”`}
            </p>
          )}
          <ul className="space-y-3 pb-6">
            {results.map((item, idx) => (
              <Fragment key={item.id}>
                {idx > 0 && idx % 6 === 0 && (
                  <li>
                    <AdSlot slot="0000000007" />
                  </li>
                )}
                <SearchResultRow item={item} />
              </Fragment>
            ))}
          </ul>
        </div>
      ) : (
        /* Live discover grid — default browse view when there's no query.
           Same live buffer as everywhere else, just laid out Pinterest-style. */
        <div className="columns-2 gap-2 px-3 [column-fill:_balance]">
          {discover.length === 0 && !showEmptyState ? (
            <DiscoverGridSkeleton />
          ) : (
            <>
              {discover.map((s, idx) => (
                <Fragment key={s.id}>
                  {idx > 0 && idx % 7 === 0 && (
                    <div className="mb-2 break-inside-avoid">
                      <AdSlot slot="0000000008" />
                    </div>
                  )}
                  <DiscoverCard item={s} />
                </Fragment>
              ))}
              {discover.length === 0 && (
                <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">
                  Nothing live yet — check back in a moment.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}

function SearchResultRow({ item }: { item: FeedItem }) {
  const [title, excerpt] = useTranslated([item.title, item.excerpt]);
  const { openArticle } = useArticleViewer();
  return (
    <li>
      <button
        onClick={() => openArticle(item)}
        className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:bg-secondary"
      >
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {item.category} · {item.source}
          </div>
          <h3 className="serif mt-1 line-clamp-2 text-base font-bold leading-snug">{title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {formatRelativeTime(item.publishedAt)} · {item.readTime} min read
          </div>
        </div>
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="h-20 w-20 flex-none rounded-xl object-cover"
        />
      </button>
    </li>
  );
}

function DiscoverCard({ item }: { item: FeedItem }) {
  const [title] = useTranslated([item.title]);
  const { openArticle } = useArticleViewer();
  return (
    <button
      onClick={() => openArticle(item)}
      className="mb-2 block w-full break-inside-avoid overflow-hidden rounded-xl bg-card text-left"
    >
      <img src={item.image} alt={title} className="w-full object-cover" loading="lazy" />
      <div className="px-2 py-2">
        <div className="text-[10px] uppercase tracking-[0.12em] text-primary">{item.category}</div>
        <div className="serif line-clamp-2 text-xs font-semibold leading-snug">{title}</div>
      </div>
    </button>
  );
}
