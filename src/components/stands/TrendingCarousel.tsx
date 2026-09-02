import { useEffect, useRef, useState } from "react";
import type { FeedItem } from "@/lib/api";
import { useArticleViewer } from "@/lib/articleViewer";

/** Auto-rotating trending slot — the most-read-looking live stories right
 * now (longest read time as a proxy for "substantial story"), not a
 * separate curated/mock set, so every slide links to a real article. */
export function TrendingCarousel({ items }: { items: FeedItem[] }) {
  const { openArticle } = useArticleViewer();
  const slides = [...items].sort((a, b) => b.readTime - a.readTime).slice(0, 5);
  const [i, setI] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slides.length === 0) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, [i]);

  if (slides.length === 0) return null;

  return (
    <div className="pb-4">
      <div
        ref={scroller}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-2xl"
      >
        {slides.map((s) => (
          <button
            key={s.id}
            onClick={() =>
              openArticle({
                id: s.id,
                title: s.title,
                source: s.source,
                sourceUrl: s.sourceUrl,
                image: s.image,
                category: s.category,
              })
            }
            className="relative block w-full flex-none snap-center overflow-hidden rounded-2xl text-left"
          >
            <img src={s.image} alt="" className="h-52 w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="inline-flex items-center rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                {s.category}
              </span>
              <h3 className="serif mt-2 line-clamp-2 text-xl font-bold leading-tight text-white">
                {s.title}
              </h3>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="truncate text-xs text-white/80">
                  {s.source} · {s.readTime} min read
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}
