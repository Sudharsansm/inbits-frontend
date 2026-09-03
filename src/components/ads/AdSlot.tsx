import { useEffect, useId, useRef } from "react";

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
 * The loader <script> itself is added once in src/routes/__root.tsx's
 * head(), not here — this file only renders the per-slot <ins> tag.
 * ------------------------------------------------------------------
 */
export const ADSENSE_CLIENT = "ca-pub-5505424042187351";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
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

  useEffect(() => {
    // Guards against React 18 StrictMode's double-invoke in dev, and
    // against this component remounting if the feed re-renders the
    // Fragment it lives in — pushing the same <ins> twice throws.
    if (pushed.current) return;
    if (!insRef.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, []);

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
