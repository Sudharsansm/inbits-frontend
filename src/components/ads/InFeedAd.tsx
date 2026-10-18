import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { readAdDebugFlag } from "@/components/ads/adDebug";
import { useAdVisible } from "@/components/ads/useAdVisible";
import { queueAdRequest } from "@/components/ads/requestAdSlot";

/**
 * ------------------------------------------------------------------
 * CONFIG (all optional -- the defaults are the values already in this repo)
 * ------------------------------------------------------------------
 *  VITE_ADSENSE_HOME_SLOT        numeric ad-unit ID of the home in-feed unit
 *  VITE_ADSENSE_HOME_FORMAT      "fluid" (default) | "auto"
 *                                  fluid = Google's NATIVE in-feed creative:
 *                                  advertiser logo + name, "Sponsored", the
 *                                  (⋮) ad menu, a large image, a headline and
 *                                  the heart / share row -- the Instagram-
 *                                  style card. auto = a plain responsive
 *                                  display banner (the old look).
 *  VITE_ADSENSE_HOME_LAYOUT_KEY  optional `data-ad-layout-key` from the
 *                                unit's snippet (AdSense > Ads > By ad unit >
 *                                your In-feed unit > Get code). Only used
 *                                with fluid. Leave unset if the unit works
 *                                without it.
 *
 * What we control and what Google controls
 * ----------------------------------------
 * Everything INSIDE the card -- logo, advertiser name, the "Sponsored"
 * tag, the ⋮ menu, the image, the headline and the heart/share icons -- is
 * drawn by Google in its own iframe, from the advertiser's creative. It
 * cannot be restyled or re-created from here (and must not be: ads may not
 * be modified or imitated). What this component controls is the FRAME
 * around it: full-bleed, flat, the same separators/background as a post
 * card, no extra chrome, right width, no layout shift.
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
/** Optional: comma-separated list of in-feed ad unit IDs (all must be In-feed /
 * fluid units). Ads rotate through them by position so one unit ID is not
 * requested over and over in a single page view. Unset = single slot. */
const HOME_SLOTS = ((import.meta.env.VITE_ADSENSE_HOME_SLOTS as string | undefined) ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => /^\d+$/.test(s));

function pickHomeSlot(ordinal?: number): string {
  if (HOME_SLOTS.length > 0) return HOME_SLOTS[((ordinal ?? 1) - 1) % HOME_SLOTS.length];
  return HOME_SLOT || DEFAULT_HOME_SLOT;
}
const HOME_FORMAT: InFeedAdFormat =
  (import.meta.env.VITE_ADSENSE_HOME_FORMAT as string | undefined)?.trim() === "auto"
    ? "auto"
    : "fluid";
/** FIX: an in-feed ("fluid") ad unit needs its data-ad-layout-key or Google
 * commonly answers "unfilled". The version of this app that was serving ads
 * sent "-fb+5w+4e-db+86" with fluid; that key was dropped in a later rewrite
 * and the home feed has requested fluid with no key since. Restored as the
 * default. If your In-feed unit's own snippet (AdSense > Ads > By ad unit >
 * Get code) shows a different data-ad-layout-key, set
 * VITE_ADSENSE_HOME_LAYOUT_KEY to that value and redeploy. */
const DEFAULT_HOME_LAYOUT_KEY = "-fb+5w+4e-db+86";
const HOME_LAYOUT_KEY =
  (import.meta.env.VITE_ADSENSE_HOME_LAYOUT_KEY as string | undefined)?.trim() ||
  DEFAULT_HOME_LAYOUT_KEY;

export type InFeedAdFormat = "fluid" | "auto";

/** Start the ad request when the card is this close to the viewport.
 * FIX: was "1200px 0px" (~2 screens) -- too close for a normal scroll
 * speed to leave Google's ad server enough time to answer before the
 * reader actually reached the card, so the native creative often hadn't
 * painted yet and the card still read as a plain post for a beat.
 * Widened to ~4 screens so the request is well in flight by the time the
 * card is on screen; `requested` still guards a single push per mount. */
const REQUEST_MARGIN = "2600px 0px";

/**
 * Sponsored card for the home feed.
 *
 *  - fluid (default): a flush, edge-to-edge native card that looks like the
 *    posts around it -- same `w-full border-b border-border bg-paper` frame
 *    as PostCard, nothing added on top of Google's own creative. Google's
 *    creative already carries the "Sponsored" label and the (⋮) ad menu,
 *    so no second header is stacked on it. The card also carries an
 *    aria-label="Advertisement" for screen readers.
 *  - auto: a display banner, shown under our own "Sponsored /
 *    Advertisement" header (a plain banner has no label of its own).
 *
 * Why it is its own component (see the root-cause notes):
 *  1. No `feed-card` class: that class applies `content-visibility: auto`,
 *     which made the <ins> measure 0px wide at request time.
 *  2. The <ins> is never unmounted by a timeout, and it is NOT hidden while
 *     it waits (no h-0 / opacity-0 / overflow tricks -- some mobile browsers
 *     and AdSense itself treat a hidden slot as not worth filling). An empty
 *     <ins> is naturally zero-height, so an unfilled slot leaves no gap; the
 *     card's border/header only appear once an ad has actually rendered
 *     (a sized, visible ad iframe -- see useAdVisible). A slow response
 *     still appears whenever it arrives.
 *  3. Enabled only after mount (isAdSenseConfigured reads window.location),
 *     so server and client render the same HTML.
 *  4. One request per mounted <ins>, made when the card is near the
 *     viewport; no retry loop.
 *
 * There is deliberately no like/save/share row of our own: Google's native
 * creative already includes one, and ours would feed the interest profile
 * and saved-posts list with ads.
 */
export function InFeedAd({
  slot: slotProp,
  format = HOME_FORMAT,
  layoutKey = HOME_LAYOUT_KEY,
  ordinal,
}: {
  /** Numeric ad-unit ID from the AdSense dashboard. */
  slot?: string;
  /** "fluid" = native Instagram-style card; "auto" = display banner. */
  format?: InFeedAdFormat;
  /** `data-ad-layout-key` of an In-feed unit (fluid only). */
  layoutKey?: string;
  /** 1-based position of this ad in the feed; only used to label the
   * debug placeholder (?adsdebug=1). */
  ordinal?: number;
}) {
  const slot = slotProp ?? pickHomeSlot(ordinal);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
  }, [slot]);

  if (!enabled) return null;
  return (
    <InFeedAdUnit
      slot={slot}
      format={format}
      layoutKey={layoutKey || undefined}
      ordinal={ordinal}
    />
  );
}

function InFeedAdUnit({
  slot,
  format,
  layoutKey,
  ordinal,
}: {
  slot: string;
  format: InFeedAdFormat;
  layoutKey?: string;
  ordinal?: number;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  // Guards React StrictMode's dev double-effect and any re-run: this
  // <ins> is pushed to AdSense at most once.
  const requested = useRef(false);
  // True only when an ad a person can SEE is in the <ins> (a sized, shown
  // iframe) -- not merely when Google says "filled" or an iframe exists, which
  // are true before the creative paints and when a mobile browser hides it.
  const { visible: rendered, detail: debugStatus } = useAdVisible(insRef);
  // Debug only (?adsdebug=1): a visible placeholder where the ad goes, so
  // you can tell "the 2-posts-1-ad PLACEMENT works" apart from "Google
  // returned no ad". Normal visitors never see it.
  const [debug, setDebug] = useState(false);
  const native = format === "fluid";

  useEffect(() => {
    setDebug(readAdDebugFlag());
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const request = () => {
      if (requested.current) return;
      requested.current = true; // set first: no retry even if push throws
      // Staggered: avoids several same-slot-ID in-feed ads (common while
      // scrolling a long feed) pushing to adsbygoogle in the same instant,
      // which Google tends to answer with "filled" for only the first of
      // the burst and "unfilled" for the rest.
      queueAdRequest(() => {
        const ins = insRef.current;
        if (!ins) return;
        // Google stamps processed units; pushing one again throws.
        if (ins.getAttribute("data-adsbygoogle-status")) return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
          console.error("AdSense push failed", error);
        }
      });
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

  return (
    <article
      ref={cardRef}
      aria-hidden={!rendered}
      aria-label={rendered ? "Advertisement" : undefined}
      // min-h-px: a real (1px) box, so the "near the viewport" observer
      // always has something to observe even while the <ins> is empty.
      // The border is part of the frame only once there is an ad in it.
      className={`min-h-px w-full overflow-hidden bg-paper ${
        rendered ? "border-b border-border" : ""
      }`}
    >
      {/* Plain banners have no label of their own, so ours stays -- but only
          once there is a banner to label. Native (fluid) creatives bring
          "Sponsored" + the ad menu themselves. */}
      {!native && rendered && (
        <header className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-secondary text-muted-foreground">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold leading-tight">Sponsored</div>
            <div className="text-[10px] text-muted-foreground">Advertisement</div>
          </div>
        </header>
      )}

      {debug && !rendered && (
        <div className="m-2 rounded border border-dashed border-primary/60 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
          <div className="font-semibold text-foreground">
            Ad position{ordinal ? ` #${ordinal}` : ""} (debug)
          </div>
          <div>
            slot {slot} · {format}
          </div>
          <div>Google: {debugStatus}</div>
        </div>
      )}

      {/* Native: no padding at all -- the creative supplies its own inner
          padding and runs edge to edge like a post. overflow-hidden: clip
          rather than let a creative widen the page. No fixed height:
          Google sizes the unit. */}
      <div
        className={
          native
            ? "w-full overflow-hidden"
            : `w-full overflow-hidden ${rendered ? "px-3 pb-3" : ""}`
        }
      >
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          style={{ display: "block", minWidth: 250 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          {...(native
            ? layoutKey
              ? { "data-ad-layout-key": layoutKey }
              : {}
            : { "data-full-width-responsive": "true" })}
        />
      </div>
    </article>
  );
}