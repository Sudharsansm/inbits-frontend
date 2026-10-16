import { useEffect, useState, type RefObject } from "react";

/**
 * "Is there an ad here that a person can actually see?"
 *
 * Why this exists: `data-ad-status="filled"` and "an <iframe> exists" both
 * become true BEFORE the creative has painted, and stay true when a mobile
 * browser's built-in ad blocker / tracking protection hides or zero-sizes the
 * creative. Treating either as "rendered" made our frame, labels and
 * full-height slot appear around nothing -- the blank space. So we measure:
 * an ad counts as visible only when
 *   - Google has not said "unfilled", and
 *   - there is an iframe (or, for the rare iframe-less creative, the <ins>
 *     itself) with a real size -- at least MIN_WIDTH x MIN_HEIGHT, the
 *     smallest standard banner being 320x50 -- that is not display:none,
 *     visibility:hidden or opacity:0.
 * It re-checks whenever the <ins> changes or resizes, and polls briefly
 * after mount because a blocker's stylesheet can hide an ad without any DOM
 * change that an observer could see.
 */
export const MIN_AD_WIDTH = 100;
export const MIN_AD_HEIGHT = 50;
const POLL_MS = 500;
const POLL_FOR_MS = 20_000;

export type AdMeasure = {
  /** An ad a person can see is in the slot. */
  visible: boolean;
  /** Google's own verdict, if it has given one. */
  status: string;
  /** Height of the visible ad creative in px (0 if none). */
  height: number;
  /** One-line summary for the debug overlay. */
  detail: string;
};

function isShown(el: Element): boolean {
  const cs = getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) !== 0;
}

export function measureAd(ins: HTMLElement): AdMeasure {
  const status = ins.getAttribute("data-ad-status") ?? "";
  const requested = ins.getAttribute("data-adsbygoogle-status") ? "yes" : "not yet";
  const iframes = Array.from(ins.querySelectorAll("iframe"));

  let height = 0;
  for (const f of iframes) {
    if (!isShown(f)) continue;
    const r = f.getBoundingClientRect();
    if (r.width >= MIN_AD_WIDTH && r.height >= MIN_AD_HEIGHT) height = Math.max(height, r.height);
  }
  // Rare iframe-less creative: fall back to the <ins> itself.
  if (height === 0 && iframes.length === 0 && status === "filled" && isShown(ins)) {
    const r = ins.getBoundingClientRect();
    if (r.width >= MIN_AD_WIDTH && r.height >= MIN_AD_HEIGHT) height = r.height;
  }

  const visible = status !== "unfilled" && height > 0 && isShown(ins);
  const detail = `${status || "no answer yet"} | requested: ${requested} | iframe: ${
    iframes.length === 0 ? "none" : height > 0 ? `visible ${Math.round(height)}px` : "HIDDEN/empty"
  }`;
  return { visible, status, height, detail };
}

export function useAdVisible(insRef: RefObject<HTMLModElement | null>): {
  visible: boolean;
  detail: string;
} {
  const [state, setState] = useState({ visible: false, detail: "waiting" });

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;

    const check = () => {
      const m = measureAd(ins);
      setState((prev) =>
        prev.visible === m.visible && prev.detail === m.detail
          ? prev
          : { visible: m.visible, detail: m.detail },
      );
    };
    check();

    const mo = new MutationObserver(check);
    mo.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status", "style", "class"],
      childList: true,
      subtree: true,
    });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    ro?.observe(ins);

    // A blocker's stylesheet can hide the creative with no DOM mutation.
    const started = Date.now();
    const id = window.setInterval(() => {
      check();
      if (Date.now() - started > POLL_FOR_MS) window.clearInterval(id);
    }, POLL_MS);

    return () => {
      mo.disconnect();
      ro?.disconnect();
      window.clearInterval(id);
    };
  }, [insRef]);

  return state;
}