import { useCallback, useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
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

/**
 * Debug mode: open any page of the live site with `?adsdebug=1` and every
 * ad slot shows a small badge with its ad unit ID and AdSense's answer
 * (pending / filled / unfilled), and empty slots stay visible instead of
 * collapsing. Use it to see exactly which slots AdSense is filling.
 */
export function useAdDebug(): boolean {
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    try {
      setDebug(new URLSearchParams(window.location.search).get("adsdebug") === "1");
    } catch {
      /* ignore */
    }
  }, []);
  return debug;
}

export function AdDebugBadge({ slot, status }: { slot: string; status: string }) {
  const color =
    status === "filled" ? "bg-green-600" : status === "unfilled" ? "bg-red-600" : "bg-amber-500";
  return (
    <div className={`mx-3 mb-2 rounded px-2 py-1 text-[10px] font-mono text-white ${color}`}>
      ad {slot} · {status}
    </div>
  );
}

/**
 * Shared logic for every ad component: decides (after mount, so server and
 * client HTML match) whether this slot can serve, pushes the request once,
 * and reports the fill status.
 *
 * `enabled` is null until the first client effect has run.
 */
export function useAdUnit(slot: string, timeoutMs?: number) {
  const nodeRef = useRef<HTMLModElement | null>(null);
  const pushed = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  // Callback ref: lets us know when the <ins> actually exists, even if the
  // component renders it later (e.g. a carousel that has no items yet).
  const insRef = useCallback((node: HTMLModElement | null) => {
    nodeRef.current = node;
    if (!node) pushed.current = false; // a re-mounted <ins> needs a new request
    setMounted(!!node);
  }, []);

  useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
  }, [slot]);

  const ready = enabled === true && mounted;
  const status = useAdFillStatus(nodeRef, { enabled: ready, timeoutMs });

  useEffect(() => {
    if (!ready || pushed.current || !nodeRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [ready]);

  return { insRef, enabled, status };
}

/**
 * Feed ad shaped like a post card (avatar-style icon, "Sponsored" label,
 * then the ad). The label is always shown — AdSense requires ads to be
 * clearly identified — but it lives in the same visual language as the
 * feed's own posts.
 *
 * The <ins> stays mounted while the request is in flight; the card is
 * collapsed (not unmounted) until AdSense reports "filled", so there is
 * never an empty "Sponsored" box and a slow response can still show.
 */
function AdSlotInner({
  slot,
  className = "",
  label = "Sponsored",
}: {
  /** Numeric ad unit ID from the AdSense dashboard. */
  slot: string;
  className?: string;
  label?: string;
}) {
  const { insRef, enabled, status } = useAdUnit(slot);
  const debug = useAdDebug();

  if (enabled !== true) return null;

  const visible = status === "filled" || debug;

  return (
    <article
      aria-hidden={!visible}
      className={
        visible
          ? `mb-4 w-full overflow-hidden rounded-xl border bg-card ${className}`
          : "pointer-events-none h-0 w-full overflow-hidden opacity-0"
      }
    >
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-secondary text-muted-foreground">
          <Megaphone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">{label}</div>
          <div className="text-[10px] text-muted-foreground">Advertisement</div>
        </div>
      </header>
      <div className="min-h-[120px] w-full px-3 pb-3">
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

export const AdSlot = AdSlotInner;