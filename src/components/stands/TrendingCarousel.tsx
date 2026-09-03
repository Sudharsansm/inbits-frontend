import { useEffect, useRef, useState } from "react";
import type { FeedItem } from "@/lib/api";
import { useArticleViewer } from "@/lib/articleViewer";
import { ADSENSE_CLIENT } from "@/components/ads/AdSlot";

/** Auto-rotating trending slot — the most-read-looking live stories right
 * now (longest read time as a proxy for "substantial story"), not a
 * separate curated/mock set, so every slide links to a real article.
 * One sponsored slide is appended at the end of the rotation — same
 * height/rounding as the real slides so it doesn't jump the layout when
 * it comes into view, just clearly labeled so it reads as an ad rather
 * than a 6th "real" story. */
export function TrendingCarousel({ items }: { items: FeedItem[] }) {
  const { openArticle } = useArticleViewer();
  const slides = [...items].sort((a, b) => b.readTime - a.readTime).slice(0, 5);
  const slideCount = slides.length + (slides.length > 0 ? 1 : 0);
  const [i, setI] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const adInsRef = useRef<HTMLModElement>(null);
  const adPushed = useRef(false);

  useEffect(() => {
    if (slideCount === 0) return;
    const t = setInterval(() => setI((p) => (p + 1) % slideCount), 4000);
    return () => clearInterval(t);
  }, [slideCount]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    // The ad slide only mounts once its turn comes around — push it into
    // AdSense's queue the first time that happens rather than on mount,
    // so a slide nobody scrolls to never requests an impression.
    if (i === slides.length && !adPushed.current && adInsRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushed.current = true;
      } catch (error) {
        console.error("AdSense push failed", error);
      }
    }
  }, [i, slides.length]);

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

        {/* Sponsored slide */}
        <div className="relative flex h-52 w-full flex-none snap-center items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
          <span className="absolute left-3 top-3 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
            Sponsored
          </span>
          <ins
            ref={adInsRef}
            className="adsbygoogle block w-full px-4"
            style={{ display: "block" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot="0000000002"
            data-ad-format="fluid"
            data-full-width-responsive="true"
          />
        </div>
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
        <button
          aria-label="Go to sponsored slide"
          onClick={() => setI(slides.length)}
          className={`h-1.5 rounded-full transition-all ${i === slides.length ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
        />
      </div>
    </div>
  );
}

