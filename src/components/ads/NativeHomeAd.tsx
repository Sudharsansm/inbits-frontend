import { useEffect, useRef } from "react";
import { Megaphone, MoreHorizontal } from "lucide-react";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { useAdFillStatus } from "@/hooks/useAdFillStatus";

/**
 * Home-feed ad, built on PostCard's own header/body shape rather than a
 * generic card. The "Sponsored" / "Advertisement" text sits exactly where
 * a real post's source name and category normally sit — same font size,
 * weight, and spacing — so it reads as part of the feed's own type
 * system instead of a foreign interruption. This is the same approach
 * Instagram and X use for feed ads: the disclosure is real and immediate
 * (required by AdSense policy and basic honesty), but it lives in the
 * page's existing visual language instead of a separate banner.
 *
 * No like/save/share row underneath — those actions are tied to
 * `recordLike`'s interest profile and saved-posts list elsewhere in the
 * app, and letting an ad silently feed either would quietly skew your
 * own recommendation and "saved" data with ad interactions.
 */
export function NativeHomeAd({ slot }: { slot: string }) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  // FIX: the home feed has a lot more happening at the moment this card
  // mounts than a simple page does — the live feed is still hydrating,
  // the WebSocket connection is spinning up, and two rail components
  // (Stands/Journal) are rendering around it. On a slow connection or a
  // mid-range phone that competition for the main thread can easily push
  // AdSense's response past the hook's default 4s window, so the ad got
  // marked "unfilled" and hidden before Google had actually answered —
  // even though the exact same ad unit works fine on simpler pages
  // (Updates, Channel, Article) that don't have that startup cost. A
  // longer, feed-specific grace period fixes that without touching the
  // simpler pages that never needed it.
  const status = useAdFillStatus(insRef, { timeoutMs: 8000 });

  useEffect(() => {
    if (pushed.current || !insRef.current) return;
    // FIX: skip the request entirely for a placeholder slot ID or on a
    // host AdSense won't serve on (e.g. localhost) — see AdSlot.tsx for
    // why this was causing 400s from googleads.g.doubleclick.net.
    if (!isAdSenseConfigured(slot)) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [slot]);

  // DEBUG: logs once the slot resolves, so you can see in the console
  // whether AdSense actually filled it ("filled"), explicitly declined
  // ("unfilled" — check the ad unit's status/type in the AdSense
  // dashboard), or never responded at all before the timeout above
  // (still "unfilled", but paired with no adsbygoogle.js request in the
  // Network tab — a script-loading problem instead). Safe to delete once
  // you've confirmed which case this is.
  useEffect(() => {
    if (status !== "pending") {
      console.info(`[NativeHomeAd] slot ${slot} resolved to: ${status}`);
    }
  }, [status, slot]);

  // Not a real, configured ad placement — render nothing instead of
  // reserving space for a request we know we didn't make.
  if (!isAdSenseConfigured(slot)) return null;

  // No fill — don't leave a "Sponsored" post-shaped card with a blank
  // gray box inside it sitting in the feed. Drop it so real posts fill
  // the space instead.
  if (status === "unfilled") return null;

  return (
    <article className="feed-card w-full border-b border-border bg-paper">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-secondary text-muted-foreground">
          <Megaphone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">Sponsored</div>
          <div className="text-[10px] text-muted-foreground">Advertisement</div>
        </div>
        <button
          type="button"
          aria-label="Ad options"
          className="rounded-full p-1.5 hover:bg-secondary"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      <div className="relative flex min-h-[220px] w-full items-center justify-center bg-secondary/30 px-3 py-3">
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
    </article>
  );
}