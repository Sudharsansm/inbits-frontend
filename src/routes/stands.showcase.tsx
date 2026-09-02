import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { fetchFeed, type FeedItem } from "@/lib/api";
import { groupShowcaseFromFeed } from "@/lib/liveGroups";
import { useArticleViewer } from "@/lib/articleViewer";
import { ArrowLeft, MoreVertical } from "lucide-react";

export const Route = createFileRoute("/stands/showcase")({
  head: () => ({
    meta: [
      { title: "News Showcase · InBits" },
      {
        name: "description",
        content: "Every publisher's top stories, grouped live from the current crawl.",
      },
    ],
  }),
  // Same live buffer the Stands tab and Home's rail use — grouped by
  // publisher client-side, not a separate curated mock set.
  // staleTime: Infinity means re-opening this page (e.g. Stands -> Showcase
  // -> back -> Showcase) reuses what's already loaded instead of blocking
  // the navigation on a fresh network round-trip every time.
  staleTime: Infinity,
  loader: async () => {
    try {
      const { items } = await fetchFeed("All");
      return { showcase: groupShowcaseFromFeed(items, 12, 5) };
    } catch {
      return { showcase: [] as ReturnType<typeof groupShowcaseFromFeed> };
    }
  },
  component: ShowcasePage,
});

function ShowcasePage() {
  const { showcase } = Route.useLoaderData();
  const { openArticle } = useArticleViewer();
  return (
    <AppShell title="News Showcase">
      <div className="px-4 pt-3">
        <Link
          to="/stands"
          className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Stands
        </Link>

        <div className="mb-4">
          <h1 className="serif text-2xl font-bold leading-tight">News Showcase</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Live, grouped by publisher</p>
        </div>

        {showcase.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Fetching the latest stories…
          </p>
        ) : (
          <div className="space-y-4 pb-6">
            {showcase.map((panel) => (
              <article
                key={panel.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="min-w-0 truncate font-serif text-base font-black uppercase tracking-tight">
                    {panel.publisher}
                  </div>
                </div>

                <div className="bg-ink px-4 py-2.5 text-sm font-semibold text-paper">
                  {panel.banner}
                </div>

                <ul className="px-4">
                  {panel.stories.map((s, i) => (
                    <li key={s.id} className={i > 0 ? "border-t border-border" : ""}>
                      <button
                        onClick={() =>
                          openArticle({
                            id: s.id,
                            title: s.title,
                            source: panel.publisher,
                            sourceUrl: s.sourceUrl ?? "",
                            image: s.image,
                            category: s.kicker,
                          })
                        }
                        className="flex w-full items-start gap-3 py-3.5 text-left transition hover:opacity-80"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-muted-foreground">{s.kicker}</div>
                          <div className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">
                            {s.title}
                          </div>
                        </div>
                        <img
                          src={s.image}
                          alt=""
                          loading="lazy"
                          className="h-16 w-20 flex-none rounded-lg object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between px-4 pb-3 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Showcase · {panel.updated}
                  </span>
                  <button
                    aria-label="More options"
                    className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
