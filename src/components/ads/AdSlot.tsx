import { useEffect, useState } from "react";
import { COLLAPSED_CLASS, useAdUnit } from "@/components/ads/useAdUnit";
import { readAdDebugFlag } from "@/components/ads/adDebug";

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

/**
 * Each page passes its own ad unit ID (see the AdSense dashboard names:
 * Channel page, Stands channels, Stands journal, Search discover grid,
 * Search results, Article bottom). They are requested as standard
 * RESPONSIVE DISPLAY units (data-ad-format="auto" +
 * data-full-width-responsive), the same kind of unit that already serves
 * on the Updates reel.
 *
 * Emergency switch: set VITE_ADSENSE_SHARED_SLOT=<unit id> in Vercel
 * (e.g. 6413880979) and every AdSlot will use that one unit as an in-feed
 * (fluid) ad instead of its own. Leave it unset for normal operation.
 */
const SHARED_SLOT = (import.meta.env.VITE_ADSENSE_SHARED_SLOT as string | undefined)?.trim() || "";

export type AdSlotFormat = "fluid" | "horizontal" | "rectangle" | "auto";

/**
 * A sponsored card for lists and pages (search, jobs, channels, journal,
 * showcase, job / post detail), inside a card that matches the app's
 * other cards, clearly labelled "Sponsored" / "Advertisement".
 *
 * Request / collapse behaviour lives in useAdUnit (one request, made near
 * the viewport; invisible and out of the layout until Google reports the
 * ad as filled; never unmounted by a timeout).
 *
 * `format` defaults to "auto" (responsive Display). "horizontal" /
 * "rectangle" are for units created with that exact shape.
 */
function AdSlotInner({
  slot: slotProp,
  className = "",
  label = "Sponsored",
  format: formatProp = "auto",
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
  // Own unit + format, unless the emergency shared-unit switch is set.
  const slot = SHARED_SLOT || slotProp;
  const format: AdSlotFormat = SHARED_SLOT ? "fluid" : formatProp;
  // FIX: on localhost / with a placeholder slot, this component used to
  // just return null everywhere -- every AdSlot-based page (Jobs, Search,
  // Job/Post detail, Stands tabs, Showcase) looked like it had no ad
  // placements at all, with no way to tell "not configured yet" apart
  // from "the spacing logic above this component is wrong". Same opt-in
  // debug switch InFeedAd already uses on the home feed (?adsdebug=1,
  // kept in localStorage): shows a clearly-labelled dashed placeholder
  // card instead of an ad. Normal visitors never see it, and it never
  // triggers a real request to Google.
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
    setDebug(readAdDebugFlag());
  }, [slot]);

  if (!enabled) {
    if (!debug) return null;
    return <AdSlotDebugPlaceholder slot={slot} label={label} className={className} />;
  }
  return <AdSlotUnit slot={slot} className={className} label={label} format={format} />;
}

/** Debug-only stand-in (?adsdebug=1): shows where this AdSlot sits in the
 * page without requesting real inventory -- lets you confirm the N-items
 * cadence (Jobs: every 4th, etc.) visually on localhost or an unverified
 * domain, where a real request would be rejected by AdSense anyway. */
function AdSlotDebugPlaceholder({
  slot,
  label,
  className,
}: {
  slot: string;
  label: string;
  className: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`mb-4 rounded-xl border border-dashed border-primary/60 bg-card px-3 py-2 text-[11px] leading-snug text-muted-foreground ${className}`}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em]">
        <span>{label}</span>
        <span>Advertisement</span>
      </div>
      <div className="mt-1 font-semibold text-foreground">Ad slot (debug)</div>
      <div>unit {slot} -- not requested (unconfigured host/slot)</div>
    </div>
  );
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
          {...(format === "auto" || format === "fluid"
            ? { "data-full-width-responsive": "true" }
            : {})}
        />
      </div>
    </div>
  );
}

export const AdSlot = AdSlotInner;