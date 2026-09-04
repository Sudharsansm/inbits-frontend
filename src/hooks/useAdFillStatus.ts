import { useEffect, useState, type RefObject } from "react";

export type AdFillStatus = "pending" | "filled" | "unfilled";

/**
 * Watches an `<ins class="adsbygoogle">` element and reports whether
 * AdSense actually filled it.
 *
 * Once AdSense resolves a slot it stamps the element with
 * `data-ad-status="filled"` or `data-ad-status="unfilled"`. Google's
 * own CSS (`ins.adsbygoogle[data-ad-status="unfilled"] { display: none }`)
 * only collapses the `<ins>` itself — it doesn't know about the label,
 * padding, or border our wrapper components draw around it, so a "no
 * fill" response was still leaving a visibly empty card. Callers should
 * use this hook to hide the *whole* wrapper once status is "unfilled".
 *
 * If the AdSense script never loads at all (blocked by an ad blocker,
 * offline, script failed) `data-ad-status` never gets set, so this also
 * falls back to "unfilled" after `timeoutMs` — otherwise those slots
 * would stay reserved as blank space forever.
 */
export function useAdFillStatus(
  insRef: RefObject<HTMLModElement | null>,
  { timeoutMs = 4000 }: { timeoutMs?: number } = {},
): AdFillStatus {
  const [status, setStatus] = useState<AdFillStatus>("pending");

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    const readStatus = () => {
      const attr = el.getAttribute("data-ad-status");
      if (attr === "filled" || attr === "unfilled") {
        setStatus(attr);
        return true;
      }
      return false;
    };

    // Status may already be set (e.g. fast synchronous response, or a
    // remount after the attribute landed).
    if (readStatus()) return;

    const observer = new MutationObserver(() => {
      readStatus();
    });
    observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] });

    const timeout = window.setTimeout(() => {
      setStatus((current) => (current === "pending" ? "unfilled" : current));
    }, timeoutMs);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [insRef, timeoutMs]);

  return status;
}