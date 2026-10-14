import { useEffect, useState, type RefObject } from "react";

export type AdFillStatus = "pending" | "filled" | "unfilled";

/**
 * Watches an `<ins class="adsbygoogle">` element and reports whether
 * AdSense actually filled it.
 *
 * Once AdSense resolves a slot it stamps the element with
 * `data-ad-status="filled"` or `data-ad-status="unfilled"`.
 *
 * IMPORTANT: callers must keep the `<ins>` mounted for as long as the
 * request is in flight, and hide the wrapper with CSS (not by returning
 * null) while status !== "filled". The old version let callers unmount
 * the `<ins>` after a short timeout, so on a slow network the ad
 * request finished *after* the element was already gone and the ad never
 * showed.
 *
 * - The timeout is only a fallback for "script blocked / never answered".
 * - The observer keeps running after the timeout, so a late "filled"
 *   still flips the status and the ad appears.
 * - `enabled` lets the caller delay observing until the `<ins>` exists.
 */
export function useAdFillStatus(
  insRef: RefObject<HTMLModElement | null>,
  { timeoutMs = 12000, enabled = true }: { timeoutMs?: number; enabled?: boolean } = {},
): AdFillStatus {
  const [status, setStatus] = useState<AdFillStatus>("pending");

  useEffect(() => {
    if (!enabled) return;
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

    readStatus();

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
  }, [insRef, timeoutMs, enabled]);

  return status;
}