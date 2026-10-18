import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { readAdDebugFlag } from "@/components/ads/adDebug";
import { COLLAPSED_CLASS, useAdUnit } from "@/components/ads/useAdUnit";

/**
 * A sponsored row for the Notifications list, showing a *horizontal*
 * banner-style creative (320x100 on a phone) at the full width of the
 * list, under a one-line header that matches the density of a real
 * notification row: small megaphone icon + "Sponsored" on the left,
 * "Advertisement" on the right (where a real row has its timestamp).
 *
 * Previously this asked for `fluid` + `in-article`, which is only valid
 * for an In-article / In-feed unit with a layout key; on a normal Display
 * unit that returns nothing. It now requests `horizontal`, which needs a
 * responsive Display unit.
 *
 * Request / collapse behaviour lives in useAdUnit: one request near the
 * viewport, and the <li> stays out of the list (no divider line, no gap)
 * until Google reports the ad as filled.
 *
 * Reuses the "Home feed native" unit (6413880979). Create a dedicated
 * "Notifications" unit later to report this surface separately.
 */
export function NotificationAd({ slot = "6413880979" }: { slot?: string }) {
  // Decided after mount (isAdSenseConfigured reads window.location), so
  // server and client render the same HTML.
  const [enabled, setEnabled] = useState(false);
  // FIX: this was the one ad surface with no ?adsdebug=1 fallback -- on
  // an unconfigured host it just returned null, same as a normal
  // visitor, with no way to tell "this row's placement is wrong" apart
  // from "ads aren't configured yet here" (which is expected locally).
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
    setDebug(readAdDebugFlag());
  }, [slot]);

  if (!enabled) {
    if (!debug) return null;
    return <NotificationAdDebugRow slot={slot} />;
  }
  return <NotificationAdUnit slot={slot} />;
}

/** Debug-only stand-in (?adsdebug=1): confirms the "every 8th row" slot
 * fires in the right place without requesting a real ad. Normal visitors
 * never see it. */
function NotificationAdDebugRow({ slot }: { slot: string }) {
  return (
    <li aria-hidden="true" className="py-4">
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Megaphone className="h-3.5 w-3.5" />
          Sponsored
        </span>
        <span className="font-normal">Advertisement</span>
      </div>
      <div className="w-full rounded-lg border border-dashed border-primary/60 bg-secondary/30 px-3 py-3 text-center text-[11px] leading-snug text-muted-foreground">
        <div className="font-semibold text-foreground">Notification ad row (debug)</div>
        <div>slot {slot} -- not requested (unconfigured host/slot)</div>
      </div>
    </li>
  );
}

function NotificationAdUnit({ slot }: { slot: string }) {
  const { cardRef, insRef, status, filled, collapsedStyle } = useAdUnit<HTMLLIElement>();

  useEffect(() => {
    if (status !== "pending") console.debug(`[NotificationAd] slot ${slot} status: ${status}`);
  }, [status, slot]);

  return (
    <li
      ref={cardRef}
      aria-hidden={!filled}
      aria-label={filled ? "Advertisement" : undefined}
      style={filled ? undefined : collapsedStyle}
      // Collapsed: border-0 cancels the list's `divide-y` line so an
      // invisible row doesn't leave a double divider behind.
      className={filled ? "py-4" : `${COLLAPSED_CLASS} border-0`}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Megaphone className="h-3.5 w-3.5" />
          Sponsored
        </span>
        <span className="font-normal">Advertisement</span>
      </div>
      <div className="w-full overflow-hidden rounded-lg bg-secondary/30 text-center">
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="horizontal"
        />
      </div>
    </li>
  );
}