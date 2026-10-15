import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { useAdFillStatus } from "@/hooks/useAdFillStatus";

/**
 * A single sponsored row for the Notifications list. Matches the exact
 * row shape every real notification uses — round icon, one line of text,
 * a timestamp slot — so it sits in the list at the same density instead
 * of dropping in a tall card between slim rows. The "Sponsored" label
 * takes the spot the relative-time stamp normally occupies, since that's
 * the one piece a real row always has and an ad never can (AdSense
 * requires the sponsored label to be at least as prominent as it would
 * be in that position).
 *
 * Reuses the "Home feed native" unit (6413880979) — both are small
 * in-stream native placements. Create a dedicated "Notifications" unit
 * later if you want this surface's fill rate reported separately.
 */
export function NotificationAd({ slot = "6413880979" }: { slot?: string }) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const status = useAdFillStatus(insRef);

  useEffect(() => {
    if (pushed.current || !insRef.current) return;
    if (!isAdSenseConfigured(slot)) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [slot]);

  // Not a real, configured ad placement — skip the request and don't
  // reserve a row for it.
  if (!isAdSenseConfigured(slot)) return null;

  // No fill — drop the row entirely instead of leaving a blank
  // "Sponsored" line sitting in the notifications list.
  if (status === "unfilled") return null;

  return (
    <li>
      <div className="flex items-start gap-3 py-4">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-secondary text-muted-foreground">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="min-h-[52px] w-full overflow-hidden rounded-lg bg-secondary/30">
            <ins
              ref={insRef}
              className="adsbygoogle block w-full"
              style={{ display: "block" }}
              data-ad-client={ADSENSE_CLIENT}
              data-ad-slot={slot}
              data-ad-format="fluid"
              data-ad-layout="in-article"
              data-full-width-responsive="true"
            />
          </div>
          <span className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Sponsored
          </span>
        </div>
      </div>
    </li>
  );
}