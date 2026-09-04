import { useEffect, useRef } from "react";
import { Megaphone, MoreHorizontal } from "lucide-react";
import { ADSENSE_CLIENT } from "@/components/ads/AdSlot";
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
  const status = useAdFillStatus(insRef);

  useEffect(() => {
    if (pushed.current || !insRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, []);

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
          data-ad-format="fluid"
          data-full-width-responsive="true"
        />
      </div>
    </article>
  );
}