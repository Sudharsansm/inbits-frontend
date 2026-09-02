import { Link } from "@tanstack/react-router";
import { ArrowRight, MoreVertical } from "lucide-react";
import type { JournalCategory, ShowcasePanel } from "@/lib/content";
import { useArticleViewer } from "@/lib/articleViewer";

export function StandsTab({
  showcase,
  journal,
  onOpenJournalCategory,
}: {
  showcase: ShowcasePanel[];
  journal: JournalCategory[];
  onOpenJournalCategory: (id: string) => void;
}) {
  const { openArticle } = useArticleViewer();
  return (
    <section className="pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="serif text-xl font-bold leading-tight">News Showcase</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Live, grouped by publisher</p>
        </div>
        <Link
          to="/stands/showcase"
          aria-label="More showcase panels"
          className="mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="scrollbar-none -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pl-[50px] pr-[50px] pb-2">
        {showcase.length === 0 && (
          <p className="px-4 py-6 text-xs text-muted-foreground">Fetching the latest stories…</p>
        )}
        {showcase.map((panel) => (
          <article
            key={panel.id}
            className="w-full max-w-[340px] flex-none snap-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
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

      {/* Readable playlists by category */}
      <section className="pt-6">
        <div className="flex items-center justify-between">
          <h3 className="serif text-lg font-bold">Recommended playlists</h3>
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary">Trending</span>
        </div>
        <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto pb-2">
          {journal.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpenJournalCategory(c.id)}
              className="w-44 flex-none text-left"
            >
              <div className="relative overflow-hidden rounded-xl">
                <img src={c.cover} alt="" loading="lazy" className="h-44 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] font-semibold text-white">
                  {c.title}
                </div>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {c.articles.length} stories
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
