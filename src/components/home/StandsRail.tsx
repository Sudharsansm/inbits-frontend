import { MoreVertical } from "lucide-react";
import type { ShowcasePanel } from "@/lib/content";
import { useArticleViewer } from "@/lib/articleViewer";
import { InfiniteRail } from "@/components/common/InfiniteRail";
import { RailHeader } from "@/components/home/RailHeader";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";

/** Stands — News Showcase panels, grouped live by publisher (same data
 * the Stands page itself uses — see src/lib/liveGroups.ts). */
export function StandsRail({ showcase }: { showcase: ShowcasePanel[] }) {
  const { openArticle } = useArticleViewer();
  if (showcase.length === 0) return null;
  return (
    <section className="border-y border-border bg-paper py-5">
      <RailHeader
        title="News Showcase"
        subtitle="Live, grouped by publisher"
        to="/stands"
        cta="More showcase panels"
      />
      <InfiniteRail
        items={showcase}
        className="snap-x snap-mandatory gap-3 pb-2 pl-4 pr-4"
        renderItem={(panel, key) => (
          <article
            key={key}
            className="w-[300px] flex-none snap-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <ChannelAvatar
                source={panel.publisher}
                sampleUrl={panel.stories[0]?.sourceUrl}
                className="h-6 w-6"
              />
              <div className="min-w-0 truncate font-serif text-base font-black uppercase tracking-tight">
                {panel.publisher}
              </div>
            </div>
            <div className="bg-ink px-4 py-2.5 text-sm font-semibold text-paper">
              {panel.banner}
            </div>
            <ul className="px-4">
              {panel.stories.slice(0, 3).map((s, i) => (
                <li key={s.id} className={i > 0 ? "border-t border-border" : ""}>
                  <button
                    onClick={() =>
                      openArticle({
                        id: s.id,
                        title: s.title,
                        source: panel.publisher,
                        sourceUrl: s.sourceUrl ?? "",
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
        )}
      />
    </section>
  );
}
