import { Sparkles } from "lucide-react";
import type { ScoredItem } from "@/lib/recommend";
import { InfiniteRail } from "@/components/common/InfiniteRail";
import { useArticleViewer } from "@/lib/articleViewer";

/**
 * "Recommended for you" — Google News' "For You" rail, built the same
 * way: ranked by topics/outlets you've actually engaged with (via Like),
 * your language, and recency (see lib/recommend.ts). Each card names the
 * specific reason it was picked, the same transparency Google News gives
 * ("Based on your interest in ...") rather than an unexplained black box.
 */
export function RecommendedRail({ picks }: { picks: ScoredItem[] }) {
  const { openArticle } = useArticleViewer();
  if (picks.length === 0) return null;

  return (
    <section className="border-y border-border bg-paper py-5">
      <div className="mb-3 flex items-center gap-2 px-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <div>
          <h3 className="serif text-xl font-bold leading-tight">Recommended for you</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Picked from your reading — like more stories to sharpen this
          </p>
        </div>
      </div>
      <InfiniteRail
        items={picks}
        className="gap-3 pb-2 pl-4 pr-4"
        renderItem={({ item, reason }, key) => (
          <button
            key={key}
            onClick={() =>
              openArticle({
                id: item.id,
                title: item.title,
                source: item.source,
                sourceUrl: item.sourceUrl,
              })
            }
            className="group w-44 flex-none text-left"
          >
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={item.image}
                alt=""
                loading="lazy"
                className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <span className="inline-block rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
                  {reason}
                </span>
                <div className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-white">
                  {item.title}
                </div>
              </div>
            </div>
            <div className="mt-1 truncate text-[11px] text-muted-foreground">{item.source}</div>
          </button>
        )}
      />
    </section>
  );
}
