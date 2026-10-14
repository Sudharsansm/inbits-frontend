import { Megaphone } from "lucide-react";
import { ADSENSE_CLIENT, AdDebugBadge, useAdDebug, useAdUnit } from "@/components/ads/AdSlot";

/**
 * Home-feed ad, built on PostCard's own header/body shape so it reads as
 * part of the feed (the same approach Instagram uses). The "Sponsored" /
 * "Advertisement" disclosure is always visible, as AdSense policy requires.
 *
 * The <ins> stays mounted while the request is in flight; the card is
 * collapsed (not removed) until AdSense reports "filled". That avoids an
 * empty "Sponsored" box, and a slow response can still appear.
 *
 * Do NOT add the `feed-card` class here. It applies
 * `content-visibility: auto`, which makes the browser skip layout for
 * off-screen cards, so the <ins> measures 0px wide when the ad request is
 * made and AdSense never fills it (and it reserves a 640px gap).
 *
 * No like/save/share row: those feed the interest profile and saved list,
 * and ads must not skew either.
 */
export function NativeHomeAd({ slot }: { slot: string }) {
  const { insRef, enabled, status } = useAdUnit(slot);
  const debug = useAdDebug();

  if (enabled !== true) return null;

  const visible = status === "filled" || debug;

  return (
    <article
      aria-hidden={!visible}
      className={
        visible
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

      <div className="relative flex min-h-[200px] w-full items-center justify-center bg-secondary/30 px-3 py-3">
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
      {debug && <AdDebugBadge slot={slot} status={status} />}
    </article>
  );
}