import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { useAdFillStatus, type AdFillStatus } from "@/hooks/useAdFillStatus";

/**
 * ------------------------------------------------------------------
 * CONFIG (all optional -- the default is the slot already in this repo)
 * ------------------------------------------------------------------
 *  VITE_ADSENSE_UPDATES_SLOT    numeric ad-unit ID for the Updates reels.
 *  VITE_ADSENSE_UPDATES_FORMAT  force "vertical" | "rectangle" | "auto".
 *                               Normally leave unset: the shape is picked
 *                               from the room the reel frame actually has
 *                               (see pickFormat below).
 *
 * The unit must be a responsive *Display* unit (AdSense > Ads > By ad
 * unit > Display ads > Responsive) for `vertical` / `rectangle` to be
 * honoured. Baked in at build time -- redeploy after changing.
 * ------------------------------------------------------------------
 */
const DEFAULT_UPDATES_SLOT = "7451735677";
const UPDATES_SLOT = (import.meta.env.VITE_ADSENSE_UPDATES_SLOT as string | undefined)?.trim();
const FORMAT_OVERRIDE = (import.meta.env.VITE_ADSENSE_UPDATES_FORMAT as string | undefined)?.trim();

type AdFormat = "vertical" | "rectangle" | "auto";

/** The reel frame is never wider than this (matches UpdateReel's md:max-w-[420px]). */
const FRAME_MAX_WIDTH = 420;
/**
 * Tallest standard vertical creative is 300x600. Plus ~48px for the
 * "Sponsored" strip and ~16px of bottom padding. If the frame is shorter
 * than this, a vertical ad would be clipped (ads must never be cropped),
 * so a medium rectangle is requested instead.
 */
const MIN_FRAME_HEIGHT_FOR_VERTICAL = 600 + 48 + 16;

function pickFormat(frameWidth: number, frameHeight: number): AdFormat {
  if (
    FORMAT_OVERRIDE === "vertical" ||
    FORMAT_OVERRIDE === "rectangle" ||
    FORMAT_OVERRIDE === "auto"
  )
    return FORMAT_OVERRIDE;
  // Same geometry as the frame below: 9:16, capped by the scroll area.
  const width = Math.min(frameWidth, FRAME_MAX_WIDTH);
  const height = Math.min((width * 16) / 9, frameHeight);
  return height >= MIN_FRAME_HEIGHT_FOR_VERTICAL ? "vertical" : "rectangle";
}

/**
 * A full-screen "reel" slot for the Updates feed. Same frame as
 * UpdateReel (9:16, full width on phones, 420px max on desktop, paper
 * background) with a vertical ad centred in it, so it sits in the
 * snap-scroll rhythm like any other reel. It never autoplays, never
 * intercepts the double-tap-to-like gesture, and always carries the
 * "Sponsored" + "Advertisement" labels.
 *
 * Differences from the previous version (see root-cause notes):
 *  - Asks Google for a *vertical* creative (300x600 etc.) instead of
 *    `auto`, which normally returned a short horizontal banner floating in
 *    a mostly empty 9:16 card. Falls back to a medium rectangle when the
 *    screen is too short for a vertical unit, so an ad is never clipped.
 *  - The <ins> is never unmounted because of a timeout. The reel reports
 *    its status upward and the parent only collapses it; a slow response
 *    can still appear.
 *  - One request per mounted <ins>; no retry loop.
 */
export function AdReel({
  slot = UPDATES_SLOT || DEFAULT_UPDATES_SLOT,
  frameHeight,
  onStatusChange,
}: {
  /** Numeric ad-unit ID from the AdSense dashboard. */
  slot?: string;
  /** Height of the scroll area the reel lives in (px). Used to choose a
   * vertical vs rectangle creative that fits without clipping. */
  frameHeight?: number;
  /** Notifies the parent once AdSense resolves the request, so it can
   * show or collapse its full-height snap slot. */
  onStatusChange?: (status: AdFillStatus) => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const [format, setFormat] = useState<AdFormat | null>(null);
  const status = useAdFillStatus(insRef, { timeoutMs: 10000 });
  const configured = isAdSenseConfigured(slot);

  // Decide the creative shape before the request is made: data-ad-format
  // has to be on the <ins> when it is pushed. The <ins> itself is
  // rendered from the first pass (useAdFillStatus attaches its observer
  // once, at mount, so the element must already exist); the push effect
  // below waits for `format`.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    setFormat(pickFormat(card.clientWidth, frameHeight ?? window.innerHeight));
  }, [frameHeight]);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins || !format || requested.current || !configured) return;
    requested.current = true; // set first: no retry even if push throws
    if (ins.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [format, configured]);

  useEffect(() => {
    onStatusChange?.(configured ? status : "unfilled");
  }, [status, configured, onStatusChange]);

  useEffect(() => {
    if (configured && status !== "pending") {
      console.debug(`[AdReel] slot ${slot} (${format}) status: ${status}`);
    }
  }, [status, configured, slot, format]);

  // Not a real, configured placement (placeholder ID / localhost):
  // render nothing. The parent has already been told "unfilled".
  if (!configured) return null;

  return (
    <section
      ref={cardRef}
      aria-label="Advertisement"
      className="flex h-full w-full items-center justify-center bg-paper select-none"
    >
      <div className="relative aspect-[9/16] w-full max-w-full h-auto max-h-full overflow-hidden border-border bg-card md:max-w-[420px] md:border-x">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
          <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
            Sponsored
          </span>
          <span className="text-muted-foreground">Advertisement</span>
        </div>
        {/* overflow-hidden: clip rather than let a creative widen the page.
            No fixed height -- Google sizes the unit; pt-12 clears the label. */}
        <div className="flex h-full w-full items-center justify-center overflow-hidden px-3 pb-4 pt-12">
          <ins
            ref={insRef}
            className="adsbygoogle block w-full"
            style={{ display: "block", width: "100%" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
            data-ad-format={format ?? undefined}
            {...(format === "auto" ? { "data-full-width-responsive": "true" } : {})}
          />
        </div>
      </div>
    </section>
  );
}