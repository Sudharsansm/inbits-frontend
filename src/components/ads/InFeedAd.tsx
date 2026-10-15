import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { useAdFillStatus } from "@/hooks/useAdFillStatus";

/**
 * ------------------------------------------------------------------
 * CONFIG (all optional -- the defaults are the values already in this repo)
 * ------------------------------------------------------------------
 *  VITE_ADSENSE_HOME_SLOT        numeric ad-unit ID of the home in-feed unit
 *  VITE_ADSENSE_HOME_LAYOUT_KEY  the `data-ad-layout-key` from the unit's
 *                                code snippet (AdSense > Ads > By ad unit >
 *                                your In-feed unit > Get code). Only
 *                                in-feed units have one. When set, the
 *                                unit is requested as `fluid` (Google's
 *                                official in-feed markup); when unset it
 *                                is requested as a responsive display
 *                                unit (`auto`).
 *
 * The publisher ID stays in one place: ADSENSE_CLIENT in AdSlot.tsx (it
 * must match public/ads.txt and the loader in routes/__root.tsx).
 * Publisher and slot IDs are public values -- they are visible in any
 * page's HTML -- so VITE_ variables are fine here. Vite bakes them in at
 * BUILD time: after changing them, redeploy.
 * ------------------------------------------------------------------
 */
const DEFAULT_HOME_SLOT = "6413880979";
const HOME_SLOT = (import.meta.env.VITE_ADSENSE_HOME_SLOT as string | undefined)?.trim();
const HOME_LAYOUT_KEY = (
  import.meta.env.VITE_ADSENSE_HOME_LAYOUT_KEY as string | undefined
)?.trim();

/** Start the ad request when the card is this close to the viewport. */
const REQUEST_MARGIN = "400px 0px";

/**
 * Sponsored card for the home feed. Replaces NativeHomeAd.
 *
 * Why this is a separate component from the old NativeHomeAd (see the
 * root-cause notes that came with this change):
 *
 *  1. No `feed-card` class. That class applies `content-visibility: auto`
 *     (styles.css), which makes the browser skip layout for off-screen
 *     cards -- so the <ins> measured 0px wide when the request was made
 *     and AdSense had nothing to size an ad into. (An earlier version of
 *     NativeHomeAd documented exactly this; the warning was lost when the
 *     file was rewritten.)
 *  2. It never unmounts the <ins>. The old version returned `null` as soon
 *     as the fill-status timer expired, throwing away a request that
 *     might still have been answered. Here the <ins> stays mounted and
 *     the card is only collapsed (zero height) until Google reports
 *     `data-ad-status="filled"`, so a slow response can still appear and
 *     an unfilled slot leaves no empty box.
 *  3. Enabled only after mount (same pattern as TrendingCarousel).
 *     isAdSenseConfigured() depends on window.location, so on the server
 *     it is false and on the client true; rendering the card straight
 *     away made server HTML and first client render disagree (a
 *     hydration mismatch on the page's main feed).
 *  4. One request per mounted <ins>, made when the card is near the
 *     viewport -- not for ads 40 posts down that are never scrolled to.
 *     No retry loop.
 *
 * The "Sponsored" / "Advertisement" disclosure is always visible
 * whenever the card is shown. There is deliberately no like/save/share
 * row: those feed the interest profile and saved-posts list, and ads
 * must not skew either.
 */
export function InFeedAd({
  slot = HOME_SLOT || DEFAULT_HOME_SLOT,
  layoutKey = HOME_LAYOUT_KEY,
}: {
  /** Numeric ad-unit ID from the AdSense dashboard. */
  slot?: string;
  /** `data-ad-layout-key` of an In-feed unit; omit for a display unit. */
  layoutKey?: string;
}) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
  }, [slot]);

  if (!enabled) return null;
  return <InFeedAdUnit slot={slot} layoutKey={layoutKey || undefined} />;
}

function InFeedAdUnit({ slot, layoutKey }: { slot: string; layoutKey?: string }) {
  const cardRef = useRef<HTMLElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  // Guards React StrictMode's dev double-effect and any re-run: this
  // <ins> is pushed to AdSense at most once.
  const requested = useRef(false);
  const status = useAdFillStatus(insRef, { timeoutMs: 8000 });
  const filled = status === "filled";

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const request = () => {
      const ins = insRef.current;
      if (!ins || requested.current) return;
      requested.current = true; // set first: no retry even if push throws
      // Google stamps processed units; pushing one again throws.
      if (ins.getAttribute("data-adsbygoogle-status")) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("AdSense push failed", error);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      request();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          request();
          io.disconnect();
        }
      },
      { rootMargin: REQUEST_MARGIN },
    );
    io.observe(card);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (status !== "pending") console.debug(`[InFeedAd] slot ${slot} status: ${status}`);
  }, [status, slot]);

  return (
    <article
      ref={cardRef}
      aria-hidden={!filled}
      aria-label={filled ? "Advertisement" : undefined}
      className={
        filled
          ? "w-full border-b border-border bg-paper"
          : "pointer-events-none h-0 w-full overflow-hidden opacity-0"
      }
    >
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-secondary text-muted-foreground">
          <Megaphone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">Sponsored</div>
          <div className="text-[10px] text-muted-foreground">Advertisement</div>
        </div>
      </header>

      {/* overflow-hidden: responsive units can try to widen themselves
          past their container on narrow screens; clip instead of letting
          the page scroll sideways. No fixed height: Google sizes the unit. */}
      <div className="w-full overflow-hidden px-3 pb-3">
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          style={{ display: "block", minWidth: 250 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          {...(layoutKey
            ? { "data-ad-format": "fluid", "data-ad-layout-key": layoutKey }
            : { "data-ad-format": "auto", "data-full-width-responsive": "true" })}
        />
      </div>
    </article>
  );
}