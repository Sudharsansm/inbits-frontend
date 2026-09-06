import { useEffect, useId, useRef } from "react";
import { useAdFillStatus } from "@/hooks/useAdFillStatus";

/**
 * ------------------------------------------------------------------
 * ADSENSE CONFIG
 * ------------------------------------------------------------------
 *
 * Replace these two values from your AdSense dashboard:
 *
 *  - ADSENSE_CLIENT: Account > Settings > Account information > "Publisher ID"
 *    (looks like "ca-pub-1234567890123456")
 *  - Each <AdSlot slot="..." /> below takes the numeric "ad unit ID" you get
 *    from Ads > By ad unit > Display ads > (create one, e.g. "In-feed native").
 *
 * The loader <script> itself is injected once, client-side after first
 * paint, from src/routes/__root.tsx (RootComponent's idle-load effect) —
 * not here, and not in head() -- this file only renders the per-slot
 * <ins> tag. That's safe even if this component's push({}) runs before
 * the script has loaded: adsbygoogle's array-based API just queues the
 * request until the real script arrives and drains the queue.
 * ------------------------------------------------------------------
 */
export const ADSENSE_CLIENT = "ca-pub-5505424042187351";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * FIX: every ad slot in this app was requesting real inventory from
 * Google's ad server using placeholder unit IDs ("0000000000" etc.) that
 * were never created in an AdSense dashboard, and doing it from
 * localhost, which AdSense never serves real ads on regardless of slot
 * validity (the domain has to be added and verified under Ads > Sites
 * first). Google's ad server correctly rejects both cases with a 400 —
 * that's not a bug on our end, it's "this isn't a real, approved ad
 * placement yet". Every ad component below now checks this before
 * pushing a request, so local development and any not-yet-configured
 * slot fail silently (component renders nothing) instead of spamming
 * the console with rejected network requests.
 *
 * Swap the two conditions below for your real setup once you have one:
 *  - `isPlaceholderSlot`: true for slot IDs still using this repo's demo
 *    values. Once you replace a `slot="..."` prop with a real ad unit ID
 *    from your AdSense dashboard, this returns false for it automatically.
 *  - `isLikelyUnservableHost`: true on localhost/127.0.0.1/private IPs.
 *    Remove this check (or add your staging domain to the allowlist)
 *    once the domain serving this app is verified in AdSense.
 */
function isPlaceholderSlot(slot: string): boolean {
  return /^0+$/.test(slot.trim());
}

function isLikelyUnservableHost(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "" || host.endsWith(".local");
}

export function isAdSenseConfigured(slot: string): boolean {
  return !isPlaceholderSlot(slot) && !isLikelyUnservableHost();
}

function AdSlotInner({
  slot,
  className = "",
  label = "Sponsored",
}: {
  /** Numeric ad unit ID from the AdSense dashboard. */
  slot: string;
  className?: string;
  /** Small caption shown above the unit, matching how the feed already
   * labels its own rails (Stands, Journal, etc). Required by AdSense's
   * policies: sponsored content must be clearly identified. */
  label?: string;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const reactId = useId();
  const status = useAdFillStatus(insRef);

  useEffect(() => {
    // Guards against React 18 StrictMode's double-invoke in dev, and
    // against this component remounting if the feed re-renders the
    // Fragment it lives in — pushing the same <ins> twice throws.
    if (pushed.current) return;
    if (!insRef.current) return;
    if (!isAdSenseConfigured(slot)) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [slot]);

  // Same "not a real ad placement yet" skip as the push above — render
  // nothing rather than reserving space for a request we know we didn't
  // make.
  if (!isAdSenseConfigured(slot)) return null;

  // No ad came back (or the request never resolved) — don't leave the
  // card's border/label/padding sitting there empty, drop the slot
  // entirely so the feed collapses around it.
  if (status === "unfilled") return null;

  return (
    <div className={`mb-4 overflow-hidden rounded-xl border bg-card ${className}`}>
      <div className="flex items-center gap-2 px-3 pt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>{label}</span>
      </div>
      <ins
        ref={insRef}
        key={reactId}
        className="adsbygoogle block px-3 pb-3 pt-1"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
        data-full-width-responsive="true"
      />
    </div>
  );
}

export const AdSlot = AdSlotInner;