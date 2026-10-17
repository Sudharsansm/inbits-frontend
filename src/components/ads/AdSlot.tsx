import { useEffect, useState } from "react";
import { COLLAPSED_CLASS, useAdUnit } from "@/components/ads/useAdUnit";

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

export type AdSlotFormat = "horizontal" | "rectangle" | "auto";

/**
 * A sponsored card for lists and pages (search, jobs, channels, journal,
 * showcase, job / post detail). Shows a *horizontal* banner-style creative
 * (320x100 on a phone, 728x90 on desktop) inside a card that matches the
 * app's other cards, clearly labelled "Sponsored" / "Advertisement".
 *
 * Request / collapse behaviour lives in useAdUnit (one request, made near
 * the viewport; invisible and out of the layout until Google reports the
 * ad as filled; never unmounted by a timeout).
 *
 * `format` defaults to "horizontal". Use "auto" for a slot that sits in a
 * card-shaped container (e.g. the sideways-scrolling Stands showcase row).
 * The unit must be a responsive Display unit for "horizontal" to be
 * honoured.
 */
function AdSlotInner({
  slot,
  className = "",
  label = "Sponsored",
  format = "horizontal",
}: {
  /** Numeric ad unit ID from the AdSense dashboard. */
  slot: string;
  className?: string;
  /** Caption shown in the card header. Required by AdSense's policies:
   * sponsored content must be clearly identified. */
  label?: string;
  format?: AdSlotFormat;
}) {
  // Decided after mount: isAdSenseConfigured() reads window.location, so
  // it is false on the server and true on the client -- rendering the
  // card straight away would make server and client HTML disagree.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
  }, [slot]);

  if (!enabled) return null;
  return <AdSlotUnit slot={slot} className={className} label={label} format={format} />;
}

function AdSlotUnit({
  slot,
  className,
  label,
  format,
}: {
  slot: string;
  className: string;
  label: string;
  format: AdSlotFormat;
}) {
  const { cardRef, insRef, status, filled, collapsedStyle } = useAdUnit<HTMLDivElement>();

  useEffect(() => {
    if (status !== "pending") console.debug(`[AdSlot] slot ${slot} status: ${status}`);
  }, [status, slot]);

  return (
    <div
      ref={cardRef}
      aria-hidden={!filled}
      aria-label={filled ? "Advertisement" : undefined}
      style={filled ? undefined : collapsedStyle}
      className={
        filled
          ? `mb-4 overflow-hidden rounded-xl border bg-card ${className}`
          : `${COLLAPSED_CLASS} ${className}`
      }
    >
      <div className="flex items-center justify-between px-3 pt-2 text-[10px] uppercase leading-4 tracking-[0.18em] text-muted-foreground">
        <span>{label}</span>
        <span>Advertisement</span>
      </div>
      {/* No padding on the <ins> itself (AdSense measures it); the
          creative is centred by the wrapper. overflow-hidden: clip rather
          than let a creative widen the page. */}
      <div className="w-full overflow-hidden pb-2 pt-1 text-center">
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          {...(format === "auto" ? { "data-full-width-responsive": "true" } : {})}
        />
      </div>
    </div>
  );
}

export const AdSlot = AdSlotInner;