import { useEffect, useRef, useState } from "react";
import type { FeedItem } from "@/lib/api";
import { useArticleViewer } from "@/lib/articleViewer";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { readAdDebugFlag } from "@/components/ads/adDebug";
import { useAdFillStatus, type AdFillStatus } from "@/hooks/useAdFillStatus";
import { useTranslatedById } from "@/lib/i18n";

/**
 * ------------------------------------------------------------------
 * CONFIG (all optional -- the default is the slot already in this repo)
 * ------------------------------------------------------------------
 *  VITE_ADSENSE_TRENDING_SLOT    numeric ad-unit ID for the sponsored slide.
 *  VITE_ADSENSE_TRENDING_FORMAT  "fluid" (default) | "horizontal" | "rectangle" | "auto".
 *
 * The slide reuses the home in-feed unit (6413880979), which serves as a
 * fluid + full-width-responsive unit, so "fluid" is the default. Use
 * "horizontal" / "rectangle" only if you point VITE_ADSENSE_TRENDING_SLOT
 * at a responsive Display unit. Baked in at build time -- redeploy after
 * changing.
 * ------------------------------------------------------------------
 */
const DEFAULT_TRENDING_SLOT = "6413880979";
const TRENDING_SLOT = (import.meta.env.VITE_ADSENSE_TRENDING_SLOT as string | undefined)?.trim();
const RAW_FORMAT = (import.meta.env.VITE_ADSENSE_TRENDING_FORMAT as string | undefined)?.trim();
// Default "fluid": this slide reuses the home in-feed unit (6413880979),
// which serves as fluid + full-width-responsive. Asking that unit for
// "horizontal" is a format mismatch Google answers with no ad.
const TRENDING_FORMAT: "fluid" | "horizontal" | "rectangle" | "auto" =
  RAW_FORMAT === "horizontal" || RAW_FORMAT === "rectangle" || RAW_FORMAT === "auto"
    ? RAW_FORMAT
    : "fluid";

/** How long a story slide stays up, and how long the ad slide does (it
 * needs time to load and to actually be seen). */
const STORY_DWELL_MS = 4000;
const AD_DWELL_MS = 8000;
/** No-fill timeout, counted from the moment the ad is requested. */
const AD_NO_FILL_TIMEOUT_MS = 5000;

/** Same footprint as a story slide (h-52 + rounded-2xl) so the carousel
 * never changes height when it rotates onto the ad. */
const SLIDE_BOX = "h-52 w-full flex-none snap-center overflow-hidden rounded-2xl";

/**
 * The sponsored slide. Mounted for as long as the carousel exists (so its
 * <ins> and status observer are never thrown away) but:
 *  - the AdSense request is made only once, when the slide is first shown
 *    (`active`), so a slide nobody rotates to never requests an impression;
 *  - if Google reports no fill (or never answers within the timeout) it is
 *    taken out of the layout -- no blank "Sponsored" card, no dead
 *    pagination dot -- and a late fill puts it back.
 */
function SponsoredSlide({
  slot,
  active,
  collapsed,
  onStatusChange,
}: {
  slot: string;
  active: boolean;
  collapsed: boolean;
  onStatusChange: (status: AdFillStatus) => void;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const [armed, setArmed] = useState(false);
  const status = useAdFillStatus(insRef, { timeoutMs: AD_NO_FILL_TIMEOUT_MS, armed });

  useEffect(() => {
    if (!active || requested.current) return;
    const ins = insRef.current;
    if (!ins) return;
    requested.current = true; // set first: no retry even if push throws
    setArmed(true);
    if (ins.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [active]);

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (status !== "pending") console.debug(`[TrendingAd] slot ${slot} status: ${status}`);
  }, [status, slot]);

  return (
    <div
      aria-hidden={collapsed}
      aria-label={collapsed ? undefined : "Advertisement"}
      className={
        collapsed
          ? "pointer-events-none absolute inset-x-0 top-0 h-0 overflow-hidden opacity-0"
          : `relative flex items-center justify-center border border-border bg-card ${SLIDE_BOX}`
      }
    >
      <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
        Sponsored
      </span>
      <span className="absolute bottom-2 right-3 z-10 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        Advertisement
      </span>
      {/* overflow-hidden: clip rather than let a creative widen the page.
          pt-9 / pb-6 clear the two labels; no fixed height on the unit. */}
      <div className="flex h-full w-full items-center justify-center overflow-hidden px-3 pb-6 pt-9">
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          style={{ display: "block", width: "100%" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={TRENDING_FORMAT}
          {...(TRENDING_FORMAT === "auto" || TRENDING_FORMAT === "fluid"
            ? { "data-full-width-responsive": "true" }
            : {})}
        />
      </div>
    </div>
  );
}

/**
 * Debug-only stand-in (?adsdebug=1): shown in place of SponsoredSlide
 * when the slot isn't actually configured yet (localhost, or a
 * placeholder slot id -- see isAdSenseConfigured in AdSlot.tsx). Without
 * this, the trending carousel on Stands silently dropped the sponsored
 * slide and its pagination dot entirely, which looked like "the ad never
 * shows here" rather than "this is the normal unconfigured-host state".
 * Static (no AdSense request, no fill/timeout logic) -- it only confirms
 * the ROTATION includes a 6th, ad slide at the right position. Normal
 * visitors never see it.
 */
function SponsoredSlideDebug({ slot }: { slot: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center border border-dashed border-primary/60 bg-card ${SLIDE_BOX}`}
    >
      <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
        Sponsored
      </span>
      <span className="absolute bottom-2 right-3 z-10 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        Advertisement
      </span>
      <div className="px-4 text-center text-[11px] leading-snug text-muted-foreground">
        <div className="font-semibold text-foreground">Trending ad slide (debug)</div>
        <div>slot {slot} -- not requested (unconfigured host/slot)</div>
      </div>
    </div>
  );
}

/** Auto-rotating trending slot — the most-read-looking live stories right
 * now (longest read time as a proxy for "substantial story"), not a
 * separate curated/mock set, so every slide links to a real article.
 * One sponsored slide is appended at the end of the rotation — same
 * height/rounding as the real slides so it doesn't jump the layout when
 * it comes into view, just clearly labeled so it reads as an ad rather
 * than a 6th "real" story. It only joins the rotation (and the
 * pagination dots) once AdSense has actually filled it. */
export function TrendingCarousel({ items }: { items: FeedItem[] }) {
  const { openArticle } = useArticleViewer();
  const slides = [...items].sort((a, b) => b.readTime - a.readTime).slice(0, 5);
  const titles = useTranslatedById(slides.map((s) => ({ id: s.id, text: s.title })));
  // Decided after mount so server and client render the same HTML
  // (isAdSenseConfigured depends on window.location).
  const [adEnabled, setAdEnabled] = useState(false);
  const [adDebug, setAdDebug] = useState(false);
  const adSlot = TRENDING_SLOT || DEFAULT_TRENDING_SLOT;
  useEffect(() => {
    setAdEnabled(isAdSenseConfigured(adSlot));
    setAdDebug(readAdDebugFlag());
  }, [adSlot]);
  const [adStatus, setAdStatus] = useState<AdFillStatus>("pending");
  // The ad is part of the rotation unless Google said (or implied, by
  // timing out) that there is nothing to show.
  const showAd = adEnabled && slides.length > 0 && adStatus !== "unfilled";
  // Debug-only placeholder (?adsdebug=1): only when there's no real ad to
  // show, so it never displaces an actual ad once one is configured.
  const showDebugAd = !adEnabled && adDebug && slides.length > 0;
  const hasAdSlide = showAd || showDebugAd;
  const slideCount = slides.length + (hasAdSlide ? 1 : 0);
  const [i, setI] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const onAdSlide = hasAdSlide && i === slides.length;

  // If the ad slide drops out while it is the current one, go back to the first.
  useEffect(() => {
    if (slideCount > 0 && i >= slideCount) setI(0);
  }, [i, slideCount]);

  // Chained timeout (not setInterval): restarts after a manual tap, and the
  // ad slide gets a longer dwell than a story.
  useEffect(() => {
    if (slideCount < 2) return;
    const t = setTimeout(
      () => setI((p) => (p + 1) % slideCount),
      onAdSlide ? AD_DWELL_MS : STORY_DWELL_MS,
    );
    return () => clearTimeout(t);
  }, [slideCount, i, onAdSlide]);

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
        className="scrollbar-none relative flex snap-x snap-mandatory overflow-x-auto rounded-2xl"
      >
        {slides.map((s) => (
          <button
            key={s.id}
            onClick={() =>
              openArticle({
                id: s.id,
                title: titles.get(s.id) ?? s.title,
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
                {titles.get(s.id) ?? s.title}
              </h3>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="truncate text-xs text-white/80">
                  {s.source} · {s.readTime} min read
                </span>
              </div>
            </div>
          </button>
        ))}

        {adEnabled && (
          <SponsoredSlide
            slot={adSlot}
            active={onAdSlide}
            collapsed={adStatus === "unfilled"}
            onStatusChange={setAdStatus}
          />
        )}
        {showDebugAd && <SponsoredSlideDebug slot={adSlot} />}
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
        {hasAdSlide && (
          <button
            aria-label="Go to sponsored slide"
            onClick={() => setI(slides.length)}
            className={`h-1.5 rounded-full transition-all ${i === slides.length ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
          />
        )}
      </div>
    </div>
  );
}