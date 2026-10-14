import { useEffect } from "react";
import { ADSENSE_CLIENT, useAdUnit } from "@/components/ads/AdSlot";
import type { AdFillStatus } from "@/hooks/useAdFillStatus";

/**
 * A "reel" slot for the Updates feed. It uses exactly the same frame as
 * UpdateReel (9:16 box, full width on phones, max 420px on desktop, same
 * paper background and snap-scroll slot), so it fills the screen like the
 * reels around it. The ad itself is centered inside that frame.
 *
 * AdSense display ads come in fixed creative sizes and policy forbids
 * stretching or cropping them, so the ad is centered at its natural size
 * on a dark backdrop rather than scaled to the full height.
 *
 * "Sponsored" is always shown. Nothing overlaps the ad (no controls on
 * top of it), and double-tap-to-like is not attached here.
 */
export function AdReel({
  slot,
  onStatusChange,
}: {
  slot: string;
  /** Lets the parent LazyAdReel collapse its snap-scroll wrapper when
   * the slot has no fill. */
  onStatusChange?: (status: AdFillStatus) => void;
}) {
  // Longer timeout than feed ads: this slot is mounted ahead of the
  // reader, and a late fill is fine.
  const { insRef, enabled, status } = useAdUnit(slot, 15000);

  useEffect(() => {
    if (enabled === null) return;
    onStatusChange?.(enabled ? status : "unfilled");
  }, [enabled, status, onStatusChange]);

  if (enabled !== true) return null;
  if (status === "unfilled") return null;

  const loading = status === "pending";

  return (
    <section className="flex h-full w-full snap-start snap-always items-center justify-center bg-paper select-none">
      <div className="relative aspect-[9/16] h-auto max-h-full w-full max-w-full overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-800 to-black md:max-w-[420px]">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-4 text-[10px] uppercase tracking-[0.18em]">
          <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
            Sponsored
          </span>
          <span className="text-white/70">Advertisement</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-3 py-16">
          <div
            className={`w-full overflow-hidden rounded-2xl bg-white shadow-xl ${
              loading ? "animate-pulse" : ""
            }`}
            style={{ minHeight: 250 }}
          >
            <ins
              ref={insRef}
              className="adsbygoogle block w-full"
              style={{ display: "block" }}
              data-ad-client={ADSENSE_CLIENT}
              data-ad-slot={slot}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-center text-[11px] text-white/60">
          Scroll to continue
        </div>
      </div>
    </section>
  );
}