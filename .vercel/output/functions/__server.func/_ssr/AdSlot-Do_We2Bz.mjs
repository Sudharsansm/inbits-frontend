import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
function useAdFillStatus(insRef, {
  timeoutMs = 4e3,
  // When false the "no fill" timer does not run yet (the status stays
  // "pending"). For slots whose request is made later than mount --
  // e.g. a carousel slide that only requests once it is shown -- so the
  // timer measures time since the request, not since the component
  // mounted. Defaults to true: existing callers are unchanged.
  armed = true
} = {}) {
  const [status, setStatus] = reactExports.useState("pending");
  reactExports.useEffect(() => {
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
    if (readStatus()) return;
    const observer = new MutationObserver(() => {
      readStatus();
    });
    observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] });
    if (!armed) return () => observer.disconnect();
    const timeout = window.setTimeout(() => {
      setStatus((current) => current === "pending" ? "unfilled" : current);
    }, timeoutMs);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [insRef, timeoutMs, armed]);
  return status;
}
const MIN_AD_WIDTH = 100;
const MIN_AD_HEIGHT = 50;
const POLL_MS = 500;
const POLL_FOR_MS = 2e4;
function isShown(el) {
  const cs = getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) !== 0;
}
function measureAd(ins) {
  const status = ins.getAttribute("data-ad-status") ?? "";
  const requested = ins.getAttribute("data-adsbygoogle-status") ? "yes" : "not yet";
  const iframes = Array.from(ins.querySelectorAll("iframe"));
  let height = 0;
  for (const f of iframes) {
    if (!isShown(f)) continue;
    const r = f.getBoundingClientRect();
    if (r.width >= MIN_AD_WIDTH && r.height >= MIN_AD_HEIGHT) height = Math.max(height, r.height);
  }
  if (height === 0 && iframes.length === 0 && status === "filled" && isShown(ins)) {
    const r = ins.getBoundingClientRect();
    if (r.width >= MIN_AD_WIDTH && r.height >= MIN_AD_HEIGHT) height = r.height;
  }
  const visible = status !== "unfilled" && height > 0 && isShown(ins);
  const detail = `${status || "no answer yet"} | requested: ${requested} | iframe: ${iframes.length === 0 ? "none" : height > 0 ? `visible ${Math.round(height)}px` : "HIDDEN/empty"}`;
  return { visible, status, height, detail };
}
function useAdVisible(insRef) {
  const [state, setState] = reactExports.useState({ visible: false, detail: "waiting" });
  reactExports.useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;
    const check = () => {
      const m = measureAd(ins);
      setState(
        (prev) => prev.visible === m.visible && prev.detail === m.detail ? prev : { visible: m.visible, detail: m.detail }
      );
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status", "style", "class"],
      childList: true,
      subtree: true
    });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    ro?.observe(ins);
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
const REQUEST_MARGIN = "1000px 0px";
const NO_FILL_TIMEOUT_MS = 8e3;
function useAdUnit() {
  const cardRef = reactExports.useRef(null);
  const insRef = reactExports.useRef(null);
  const requested = reactExports.useRef(false);
  const [armed, setArmed] = reactExports.useState(false);
  const [parentWidth, setParentWidth] = reactExports.useState(0);
  const status = useAdFillStatus(insRef, {
    timeoutMs: NO_FILL_TIMEOUT_MS,
    armed
  });
  reactExports.useLayoutEffect(() => {
    setParentWidth(cardRef.current?.parentElement?.clientWidth ?? 0);
  }, []);
  reactExports.useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const request = () => {
      const ins = insRef.current;
      if (!ins || requested.current) return;
      requested.current = true;
      setArmed(true);
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
      { rootMargin: REQUEST_MARGIN }
    );
    io.observe(card);
    return () => io.disconnect();
  }, []);
  const collapsedStyle = {
    width: parentWidth > 0 ? parentWidth : "100%",
    height: 0
  };
  const { visible } = useAdVisible(insRef);
  return { cardRef, insRef, status, filled: visible, collapsedStyle };
}
const COLLAPSED_CLASS = "pointer-events-none absolute overflow-hidden opacity-0";
const ADSENSE_CLIENT = "ca-pub-5505424042187351";
function isPlaceholderSlot(slot) {
  return /^0+$/.test(slot.trim());
}
function isLikelyUnservableHost() {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "" || host.endsWith(".local");
}
function isAdSenseConfigured(slot) {
  return !isPlaceholderSlot(slot) && !isLikelyUnservableHost();
}
function AdSlotInner({
  slot,
  className = "",
  label = "Sponsored",
  format = "horizontal"
}) {
  const [enabled, setEnabled] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
  }, [slot]);
  if (!enabled) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlotUnit, { slot, className, label, format });
}
function AdSlotUnit({
  slot,
  className,
  label,
  format
}) {
  const { cardRef, insRef, status, filled, collapsedStyle } = useAdUnit();
  reactExports.useEffect(() => {
    if (status !== "pending") console.debug(`[AdSlot] slot ${slot} status: ${status}`);
  }, [status, slot]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: cardRef,
      "aria-hidden": !filled,
      "aria-label": filled ? "Advertisement" : void 0,
      style: filled ? void 0 : collapsedStyle,
      className: filled ? `mb-4 overflow-hidden rounded-xl border bg-card ${className}` : `${COLLAPSED_CLASS} ${className}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 pt-2 text-[10px] uppercase leading-4 tracking-[0.18em] text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Advertisement" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-hidden pb-2 pt-1 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "ins",
          {
            ref: insRef,
            className: "adsbygoogle block w-full",
            style: { display: "block" },
            "data-ad-client": ADSENSE_CLIENT,
            "data-ad-slot": slot,
            "data-ad-format": format,
            ...format === "auto" ? { "data-full-width-responsive": "true" } : {}
          }
        ) })
      ]
    }
  );
}
const AdSlot = AdSlotInner;
export {
  ADSENSE_CLIENT as A,
  COLLAPSED_CLASS as C,
  AdSlot as a,
  useAdUnit as b,
  useAdFillStatus as c,
  isAdSenseConfigured as i,
  useAdVisible as u
};
