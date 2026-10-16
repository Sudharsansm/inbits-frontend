import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { readAdDebugFlag } from "@/components/ads/adDebug";

/**
 * ------------------------------------------------------------------
 * CONFIG (all optional -- the default slot is the one already in this repo)
 * ------------------------------------------------------------------
 *  VITE_ADSENSE_UPDATES_SLOT        numeric ad-unit ID for the Updates reels.
 *  VITE_ADSENSE_UPDATES_FORMAT      fluid (default) | adaptive | vertical |
 *                                   rectangle | auto
 *      fluid     Google's NATIVE card -- advertiser logo + name,
 *                "Sponsored", the (⋮) menu, a large image, a headline and
 *                the heart / share row: the Instagram-style sponsored
 *                post. Needs an In-feed / native ad unit.
 *      adaptive  a vertical banner (300x600...) when the screen is tall
 *                enough, else a medium rectangle. Needs a responsive
 *                Display unit.
 *      vertical | rectangle | auto   force one banner shape (Display unit).
 *  VITE_ADSENSE_UPDATES_LAYOUT_KEY  optional data-ad-layout-key from the
 *                                   unit's snippet (fluid only).
 *
 * What we control and what Google controls
 * ----------------------------------------
 * Everything INSIDE a native card -- logo, advertiser name, "Sponsored",
 * the menu, image, headline, heart and share -- is drawn by Google in its
 * own iframe from the advertiser's creative. It cannot be restyled or
 * re-created from here (ads may not be modified or imitated, and we have
 * no access to the advertiser's name or logo). What this component owns is
 * the FRAME: a full-height snap-scroll slot, content centred, the same
 * width (full on phones, 420px on desktop) and paper background as a real
 * reel, so it sits in the Updates feed like any other reel.
 *
 * Baked in at build time -- redeploy after changing.
 * ------------------------------------------------------------------
 */
const DEFAULT_UPDATES_SLOT = "7451735677";
const UPDATES_SLOT = (import.meta.env.VITE_ADSENSE_UPDATES_SLOT as string | undefined)?.trim();
const UPDATES_LAYOUT_KEY = (
  import.meta.env.VITE_ADSENSE_UPDATES_LAYOUT_KEY as string | undefined
)?.trim();

type AdMode = "fluid" | "adaptive" | "vertical" | "rectangle" | "auto";
type AdFormat = "fluid" | "vertical" | "rectangle" | "auto";

const VALID_MODES: AdMode[] = ["fluid", "adaptive", "vertical", "rectangle", "auto"];
const RAW_MODE = (import.meta.env.VITE_ADSENSE_UPDATES_FORMAT as string | undefined)?.trim();
const UPDATES_MODE: AdMode = VALID_MODES.includes(RAW_MODE as AdMode)
  ? (RAW_MODE as AdMode)
  : "fluid";

/** The reel frame is never wider than this (matches UpdateReel's md:max-w-[420px]). */
const FRAME_MAX_WIDTH = 420;
/**
 * (adaptive mode) tallest standard vertical creative is 300x600, plus ~48px
 * for the label strip and ~16px of padding. Shorter screens get a medium
 * rectangle instead so an ad is never clipped.
 */
const MIN_FRAME_HEIGHT_FOR_VERTICAL = 600 + 48 + 16;

function pickAdaptiveFormat(frameWidth: number, frameHeight: number): AdFormat {
  const width = Math.min(frameWidth, FRAME_MAX_WIDTH);
  const height = Math.min((width * 16) / 9, frameHeight);
  return height >= MIN_FRAME_HEIGHT_FOR_VERTICAL ? "vertical" : "rectangle";
}

/**
 * A full-screen "reel" slot for the Updates feed, in the style of an
 * Instagram sponsored reel/post: by default Google's native card, centred
 * in the same frame as a real reel, with no extra chrome of our own on top
 * of it (its own "Sponsored" label and ad menu are part of the creative).
 *
 * Client-only by construction: LazyAdReel (routes/updates.tsx) mounts this
 * only after the reader scrolls near it, so it is never server-rendered or
 * hydrated and needs no mounted-gate.
 *
 * Behaviour (see the root-cause notes that came with this change):
 *  - The <ins> is never hidden while it waits (no h-0 / opacity-0 tricks)
 *    and never unmounted by a timeout. An empty <ins> is naturally
 *    zero-height, so an unfilled slot leaves no blank full-screen reel and
 *    the snap list is unaffected; the full-height slot only appears once an
 *    ad has actually rendered (data-ad-status="filled" OR an ad iframe is
 *    present). A late answer still shows up.
 *  - One request per mounted <ins>; no retry loop; safe under StrictMode.
 *  - Plain banners (every mode except fluid) carry no label of their own,
 *    so ours ("Sponsored" + "Advertisement") is shown with them -- only once
 *    a banner exists. Native cards bring their own.
 *  - Never intercepts the double-tap-to-like gesture or autoplays anything.
 */
export function AdReel({
  slot = UPDATES_SLOT || DEFAULT_UPDATES_SLOT,
  mode = UPDATES_MODE,
  layoutKey = UPDATES_LAYOUT_KEY,
  frameHeight,
  ordinal,
  onRenderedChange,
}: {
  /** Numeric ad-unit ID from the AdSense dashboard. */
  slot?: string;
  mode?: AdMode;
  /** `data-ad-layout-key` of an In-feed unit (fluid only). */
  layoutKey?: string;
  /** Height of the scroll area the reel lives in (px); adaptive mode only. */
  frameHeight?: number;
  /** 1-based position of this ad in the feed; only labels the debug placeholder. */
  ordinal?: number;
  /** Tells the parent when an ad has actually rendered, so it can make
   * its snap slot full-height (and collapse it again if not). */
  onRenderedChange?: (rendered: boolean) => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const configured = isAdSenseConfigured(slot);
  const [format, setFormat] = useState<AdFormat | null>(mode === "adaptive" ? null : mode);
  const [rendered, setRendered] = useState(false);
  const [debug, setDebug] = useState(false);
  const [debugStatus, setDebugStatus] = useState("waiting");
  const native = format === "fluid";

  useEffect(() => {
    setDebug(readAdDebugFlag());
  }, []);

  // adaptive only: decide the banner shape before the request is made
  // (data-ad-format has to be on the <ins> when it is pushed).
  useLayoutEffect(() => {
    if (mode !== "adaptive") return;
    const card = cardRef.current;
    if (!card) return;
    setFormat(pickAdaptiveFormat(card.clientWidth, frameHeight ?? window.innerHeight));
  }, [mode, frameHeight]);

  // One request, as soon as the shape is known.
  useEffect(() => {
    const ins = insRef.current;
    if (!ins || !format || requested.current || !configured) return;
    requested.current = true; // set first: no retry even if push throws
    if (ins.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [format, configured]);

  // "Has an ad actually rendered?" -- read from the real DOM (status
  // attribute OR an <iframe> child) so it works for every format.
  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;
    let last = "";
    const check = () => {
      const attr = ins.getAttribute("data-ad-status") ?? "";
      const hasIframe = !!ins.querySelector("iframe");
      setRendered(attr === "filled" || hasIframe);
      setDebugStatus(
        `${attr || "no answer yet"}${hasIframe ? " + iframe" : ""} | requested: ${
          ins.getAttribute("data-adsbygoogle-status") ? "yes" : "not yet"
        }`,
      );
      const summary = `${attr || "pending"}${hasIframe ? "+iframe" : ""}`;
      if (summary !== last && summary !== "pending") {
        last = summary;
        console.debug(`[AdReel] slot ${slot} (${format}) status: ${summary}`);
      }
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
      childList: true,
      subtree: true,
    });
    return () => mo.disconnect();
  }, [slot, format, configured]);

  useEffect(() => {
    onRenderedChange?.(configured && rendered);
  }, [configured, rendered, onRenderedChange]);

  // Not a real, configured placement (placeholder ID / localhost): nothing.
  if (!configured) return null;

  return (
    <section
      ref={cardRef}
      aria-label={rendered ? "Advertisement" : undefined}
      aria-hidden={!rendered}
      // Until an ad renders this is a plain zero-height block (the empty
      // <ins> has no height), so nothing is shown and nothing is hidden.
      // Once rendered it becomes the full-height reel slot, content centred.
      className={
        rendered ? "flex h-full w-full items-center justify-center bg-paper select-none" : "w-full"
      }
    >
      <div
        className={
          rendered
            ? `relative w-full max-w-full overflow-hidden border-border bg-card md:max-w-[420px] md:border-x ${
                native ? "" : "px-3 pb-4 pt-12"
              }`
            : "w-full"
        }
      >
        {/* Plain banners have no label of their own -- ours, once there is a banner. */}
        {!native && rendered && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
            <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
              Sponsored
            </span>
            <span className="text-muted-foreground">Advertisement</span>
          </div>
        )}

        {debug && !rendered && (
          <div className="m-2 rounded border border-dashed border-primary/60 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
            <div className="font-semibold text-foreground">
              Ad reel{ordinal ? ` #${ordinal}` : ""} (debug)
            </div>
            <div>
              slot {slot} · {format ?? "choosing format"}
            </div>
            <div>Google: {debugStatus}</div>
          </div>
        )}

        {/* No padding around a native card -- the creative supplies its own
            and runs edge to edge. overflow-hidden: clip rather than let a
            creative widen the page. No fixed height: Google sizes the unit. */}
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          style={{ display: "block", minWidth: 250 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format ?? undefined}
          {...(format === "fluid" && layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
          {...(format === "auto" ? { "data-full-width-responsive": "true" } : {})}
        />
      </div>
    </section>
  );
}