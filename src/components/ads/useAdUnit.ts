import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useAdFillStatus, type AdFillStatus } from "@/hooks/useAdFillStatus";
import { useAdVisible } from "@/components/ads/useAdVisible";

/** Start the ad request when the unit is this close to the viewport (about
 * a screen and a half: ask early so the ad is there when the reader arrives). */
const REQUEST_MARGIN = "2600px 0px";
/** No-fill timeout, counted from the moment the ad is requested. */
const NO_FILL_TIMEOUT_MS = 8000;

/**
 * Shared request / visibility logic for the list-style ad units
 * (AdSlot, NotificationAd). Behaviour:
 *
 *  - ONE AdSense request per mounted <ins>, made when the unit scrolls
 *    within ~400px of the viewport -- not for every ad in a long list
 *    the moment the page opens. No retry loop; safe under StrictMode.
 *  - The unit stays *mounted* the whole time. Until Google reports
 *    `filled` it is rendered "collapsed": out of the layout flow
 *    (absolute, zero height, invisible) but with the same width the real
 *    unit will have, which is what AdSense needs to size a horizontal
 *    creative. So the list never shows an empty "Sponsored" box, a late
 *    answer still appears (the old code unmounted after a 4s timer and
 *    threw it away), and a collapsed unit doesn't disturb flex / grid /
 *    column layouts.
 *
 * Usage: attach `cardRef` to the outermost element, `insRef` to the
 * <ins>, spread `collapsedStyle` on the outer element while !filled.
 */
export function useAdUnit<T extends HTMLElement = HTMLDivElement>() {
  const cardRef = useRef<T>(null);
  const insRef = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const [armed, setArmed] = useState(false);
  const [parentWidth, setParentWidth] = useState(0);
  const status: AdFillStatus = useAdFillStatus(insRef, {
    timeoutMs: NO_FILL_TIMEOUT_MS,
    armed,
  });

  // Width the unit will have once shown = the width of the box it sits in.
  useLayoutEffect(() => {
    setParentWidth(cardRef.current?.parentElement?.clientWidth ?? 0);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const request = () => {
      const ins = insRef.current;
      if (!ins || requested.current) return;
      requested.current = true; // set first: no retry even if push throws
      setArmed(true);
      // Google stamps processed units; pushing one again throws.
      if (ins.getAttribute("data-adsbygoogle-status")) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("AdSense push failed", error);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      request();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          request();
          io.disconnect();
        }
      },
      { rootMargin: REQUEST_MARGIN },
    );
    io.observe(card);
    return () => io.disconnect();
  }, []);

  const collapsedStyle: CSSProperties = {
    width: parentWidth > 0 ? parentWidth : "100%",
    height: 0,
  };

  // "filled" only once an ad a person can SEE is in the slot (see
  // useAdVisible) -- Google's own `filled` flag can be set before the
  // creative paints, or while a mobile browser hides it, which showed an
  // empty card (the blank space).
  const { visible } = useAdVisible(insRef);

  return { cardRef, insRef, status, filled: visible, collapsedStyle };
}

/** Classes for the outer element while the unit is waiting for / lacks an ad. */
export const COLLAPSED_CLASS = "pointer-events-none absolute overflow-hidden opacity-0";