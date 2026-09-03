import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/components/ads/AdSlot";

/**
 * A full-screen "reel" slot for the Updates feed. Visually matches
 * UpdateReel's frame (same aspect box, same paper background) so it sits
 * in the snap-scroll rhythm without looking like a broken card, but never
 * autoplays sound/video and never intercepts the double-tap-to-like
 * gesture other reels use — it's a still ad, not content pretending not
 * to be one.
 *
 * Swap `slot` for the ad unit ID you create for "Updates reels" in the
 * AdSense dashboard (keep it separate from the Home feed unit so you can
 * see performance per-surface).
 */
export function AdReel({ slot }: { slot: string }) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !insRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, []);

  return (
    <section className="flex h-full w-full snap-start snap-always items-center justify-center bg-paper select-none">
      <div className="relative aspect-[9/16] w-full max-w-full h-auto max-h-full overflow-hidden rounded-2xl border border-border bg-card md:max-w-[420px]">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
          <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
            Sponsored
          </span>
        </div>
        <div className="flex h-full w-full items-center justify-center px-4">
          <ins
            ref={insRef}
            className="adsbygoogle block w-full"
            style={{ display: "block" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
            data-ad-format="fluid"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </section>
  );
}
