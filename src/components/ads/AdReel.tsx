import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT, isAdSenseConfigured } from "@/components/ads/AdSlot";
import { readAdDebugFlag } from "@/components/ads/adDebug";

/**
 * ------------------------------------------------------------------
 * CONFIG (all optional -- the default slot is the one already in this repo)
 * ------------------------------------------------------------------
 *  VITE_ADSENSE_UPDATES_SLOT        numeric ad-unit ID for the Updates reels.
 *  VITE_ADSENSE_UPDATES_FORMAT      adaptive (default) | fluid | vertical |
 *                                   rectangle | auto
 *      adaptive  VERTICAL ad: a tall banner (300x600, 160x600 ...) filling
 *                the reel frame when the screen is tall enough to show it
 *                uncropped, else a medium rectangle. Needs a responsive
 *                DISPLAY ad unit.
 *      fluid     Google's native Instagram-style card (advertiser logo +
 *                name, "Sponsored", menu, image, headline, heart/share).
 *                Roughly square, not tall. Needs an In-feed / native unit.
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
  : "adaptive";

/** The reel frame is never wider than this (matches UpdateReel's md:max-w-[420px]). */
const FRAME_MAX_WIDTH = 420;
/** Same breakpoint as the `md:` classes below: from here up the frame is a 9:16 box. */
const DESKTOP_MIN_WIDTH = 768;
/** Label strip above the ad and "Ad" strip below it (px). They sit beside the
 * ad, never over it -- an ad may not be covered or cropped. */
const HEADER_HEIGHT = 36;
const FOOTER_HEIGHT = 28;
/**
 * (adaptive mode) tallest standard vertical creative is 300x600. If the reel
 * is shorter than the ad plus the two strips, a vertical ad would be cropped,
 * so a medium rectangle is requested instead.
 */
const MIN_FRAME_HEIGHT_FOR_VERTICAL = 600 + HEADER_HEIGHT + FOOTER_HEIGHT;

/**
 * Height the reel frame will actually have. On phones the frame fills the
 * whole snap slot; from `md` up it is a 9:16 box (like UpdateReel's), capped
 * by the slot -- same rules as the classes in the JSX below.
 */
function frameHeightFor(frameWidth: number, slotHeight: number): number {
  if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
    const width = Math.min(frameWidth, FRAME_MAX_WIDTH);
    return Math.min((width * 16) / 9, slotHeight);
  }
  return slotHeight;
}

function pickAdaptiveFormat(frameWidth: number, slotHeight: number): AdFormat {
  return frameHeightFor(frameWidth, slotHeight) >= MIN_FRAME_HEIGHT_FOR_VERTICAL
    ? "vertical"
    : "rectangle";
}

/**
 * A full-screen "reel" slot for the Updates feed, dressed like the reels
 * around it (see UpdateReel): the same snap slot and the same frame (full
 * width and height on phones, a 9:16 box capped at 420px on desktop), the
 * same dark immersive background, the same pill + small-caps overlay
 * language -- a "Sponsored" pill with "Advertisement" at the top-left, an
 * "Ad" tag at the bottom-right where the reel's own meta text sits -- and
 * by default a VERTICAL ad (the tallest standard AdSense shapes: 300x600,
 * 160x600 ...) centred between them.
 *
 * What it deliberately does NOT have: the like / comment / repost / share
 * column, follow button, engagement counts or CTA button that an Instagram
 * Reels ad shows. Those belong to Meta's ad platform. Here the ad is a
 * third-party creative inside Google's iframe: we have no access to its
 * advertiser, name or counts, ad controls of our own would imitate your
 * organic reels (and could be tapped by mistake), and invented numbers
 * would be fabricated. The advertiser's own button, if any, is part of the
 * creative itself. Full-screen 9:16 video creatives are likewise not
 * something AdSense serves to websites; the tallest it offers is the
 * half-page vertical.
 *
 * Set the format to "fluid" for Google's native card instead, centred in the
 * same dark frame with no extra chrome of our own (its own "Sponsored"
 * label and ad menu are part of the creative).
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

  // The element tree below is identical before and after an ad renders --
  // only classes change -- so the <ins> is never remounted (a remount would
  // discard the ad request). Until an ad renders everything is a plain
  // zero-height block and the strips are display:none.
  return (
    <section
      ref={cardRef}
      aria-label={rendered ? "Advertisement" : undefined}
      aria-hidden={!rendered}
      className={
        rendered ? "flex h-full w-full items-center justify-center bg-paper select-none" : "w-full"
      }
    >
      <div
        className={
          rendered
            ? // Phones: fill the whole slot. md+: a 9:16 box capped at 420px,
              // exactly like UpdateReel's frame.
              "relative flex h-full w-full max-w-full flex-col overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white md:aspect-[9/16] md:h-auto md:max-h-full md:max-w-[420px]"
            : "w-full"
        }
      >
        {/* Top-left: the same pill + small-caps label style as a reel's
            category line. Plain banners have no label of their own; native
            cards bring theirs, so this is hidden for fluid. */}
        <div
          className={
            rendered && !native
              ? "flex flex-none items-center gap-2 px-5 text-[10px] uppercase tracking-[0.18em]"
              : "hidden"
          }
          style={{ height: HEADER_HEIGHT }}
        >
          <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
            Sponsored
          </span>
          <span className="text-white/80">Advertisement</span>
        </div>

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

        {/* The ad, centred between the strips. Never covered by an overlay,
            never scaled or cropped: overflow-hidden here only stops a
            creative from widening the page. No fixed height -- Google sizes
            the unit. */}
        <div
          className={
            rendered
              ? "flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 text-center"
              : "w-full"
          }
        >
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

        {/* Bottom-right: the "Ad" tag, where Instagram (and the reel's own
            meta line) put it. */}
        <div
          className={
            rendered && !native ? "flex flex-none items-center justify-end px-5" : "hidden"
          }
          style={{ height: FOOTER_HEIGHT }}
        >
          <span className="rounded border border-white/40 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
            Ad
          </span>
        </div>
      </div>
    </section>
  );
}