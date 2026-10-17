import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { u as useLiveFeed } from "./useLiveFeed-BwhfFFBV.mjs";
import { j as Route$g, c as consumeFeedReturnIntent, k as diversifyBySource, a as useSavedPosts, l as usePref, r as readAdDebugFlag, u as useArticleViewer } from "./router-B91z3HGk.mjs";
import { h as hasImage, u as useInterestProfile, a as usePullToRefresh, t as trackForItem, b as useShortLoop, I as ImageCarousel, M as MusicEqualizer } from "./MusicEqualizer-DPWdti9T.mjs";
import { e as excludeSeen, m as markSeen } from "./seenArticles-K7DuCxq4.mjs";
import { s as sourceOriginLabel } from "./sourceOrigin-B3ooOyf2.mjs";
import { R as RelativeTime } from "./RelativeTime-6LiQ26XO.mjs";
import { a as useTranslated } from "./i18n-CxTQNlYk.mjs";
import { i as isAdSenseConfigured, u as useAdVisible, A as ADSENSE_CLIENT } from "./AdSlot-Do_We2Bz.mjs";
import { L as LoaderCircle, X, d as Share2, k as Link2, l as Check, H as Heart, B as Bookmark, V as VolumeX, c as Volume2, A as ArrowRight, m as Music2 } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/seroval.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
const STORAGE_KEY = "inbits:updatesLastReel";
let memoryId = null;
function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
function setLastReelId(id) {
  if (!id) return;
  memoryId = id;
  try {
    getStorage()?.setItem(STORAGE_KEY, id);
  } catch {
  }
}
function getLastReelId() {
  if (memoryId) return memoryId;
  return getStorage()?.getItem(STORAGE_KEY) ?? null;
}
const prefetched = /* @__PURE__ */ new Set();
const MAX_TRACKED = 500;
function markPrefetched(url) {
  prefetched.add(url);
  if (prefetched.size > MAX_TRACKED) {
    const excess = prefetched.size - MAX_TRACKED;
    const it = prefetched.values();
    for (let i = 0; i < excess; i++) {
      const next = it.next().value;
      if (next !== void 0) prefetched.delete(next);
    }
  }
}
function shouldSkipPrefetching() {
  if (typeof navigator === "undefined") return true;
  const connection = navigator.connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
}
function prefetchImageUrls(urls) {
  if (typeof window === "undefined") return;
  if (shouldSkipPrefetching()) return;
  for (const url of urls) {
    if (!url || prefetched.has(url)) continue;
    markPrefetched(url);
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.decoding = "async";
    img.src = url;
  }
}
function prefetchFeedItemImages(items) {
  prefetchImageUrls(items.map((item) => item.image));
}
function ActionBtn({
  children,
  label,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick,
      className: "flex flex-col items-center gap-1 text-white transition active:scale-90",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/20", children }),
        label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold drop-shadow", children: label })
      ]
    }
  );
}
function UpdateReelInner({
  post: p,
  isLiked,
  isSaved,
  burstKey,
  active,
  muted,
  onDoubleTap,
  onToggleLike,
  onToggleSave,
  onShare,
  onToggleMute,
  onImageUnavailable
}) {
  const { track, category } = trackForItem(p);
  const { openArticle } = useArticleViewer();
  const audioRef = reactExports.useRef(null);
  const [trackFailed, setTrackFailed] = reactExports.useState(false);
  const [title, excerpt] = useTranslated([p.title, p.excerpt]);
  useShortLoop(audioRef);
  const readPost = () => (
    // Full item, already loaded in full here — see PostCard's readPost
    // for why this (not a trimmed id/title/source/sourceUrl) is what
    // makes /post/:id open instantly.
    openArticle(p)
  );
  reactExports.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (active) {
      audio.play().catch(() => {
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [active]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "section",
    {
      className: "flex h-full w-full snap-start snap-always items-center justify-center bg-paper select-none",
      onClick: onDoubleTap,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-[9/16] w-full max-w-full h-auto max-h-full overflow-hidden md:max-w-[420px]", children: [
        !trackFailed && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "audio",
          {
            ref: audioRef,
            src: track.src,
            loop: true,
            muted,
            playsInline: true,
            preload: "none",
            onError: () => setTrackFailed(true)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ImageCarousel,
          {
            images: p.image ? [p.image, ...p.images.filter((img) => img !== p.image)] : p.images,
            alt: p.title,
            className: "h-full w-full",
            imgClassName: "h-full object-cover",
            onUnavailable: onImageUnavailable
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/50 to-transparent" }),
        burstKey > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "pointer-events-none absolute inset-0 z-30 grid place-items-center",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "instagram-heart-burst h-32 w-32 fill-white text-white" })
          },
          burstKey
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "absolute right-3 bottom-5 z-20 flex flex-col items-center gap-3",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: onToggleLike, label: "Like", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Heart,
                {
                  className: `h-4 w-4 transition-transform duration-150 ${isLiked ? "fill-primary text-primary" : ""}`
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: onToggleSave, label: "Save", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: `h-4 w-4 ${isSaved ? "fill-white" : ""}` }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: onShare, label: "Share", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" }) }),
              !trackFailed && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: onToggleMute, label: muted ? "Unmute" : "Mute", children: muted ? /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: readPost, label: "Read", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "absolute inset-x-0 bottom-0 z-10 space-y-3 p-5 pr-20 text-white",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary px-2 py-0.5 text-primary-foreground", children: p.category }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/80", children: [
                  p.source,
                  " · ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RelativeTime, { iso: p.publishedAt }),
                  sourceOriginLabel(p.location, p.language) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    " · ",
                    sourceOriginLabel(p.location, p.language)
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: readPost, className: "block text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-2xl font-bold leading-tight drop-shadow-md", children: title }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "line-clamp-3 text-sm leading-relaxed text-white/90", children: excerpt }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 pt-1 text-[11px] text-white/75", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "By ",
                  p.author,
                  " · ",
                  p.readTime,
                  " min read"
                ] }),
                !trackFailed && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex min-w-0 items-center gap-1 text-white/80", children: [
                  active ? /* @__PURE__ */ jsxRuntimeExports.jsx(MusicEqualizer, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(Music2, { className: "h-3 w-3 flex-none" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
                    category,
                    " · ",
                    track.title,
                    " — ",
                    track.artist
                  ] })
                ] })
              ] })
            ]
          }
        )
      ] })
    }
  );
}
const UpdateReel = reactExports.memo(UpdateReelInner);
const DEFAULT_UPDATES_SLOT = "7451735677";
const UPDATES_LAYOUT_KEY = void 0;
const VALID_MODES = ["fluid", "adaptive", "vertical", "rectangle", "auto"];
const RAW_MODE = void 0;
const UPDATES_MODE = VALID_MODES.includes(RAW_MODE) ? RAW_MODE : "adaptive";
const FRAME_MAX_WIDTH = 420;
const DESKTOP_MIN_WIDTH = 768;
const HEADER_HEIGHT = 36;
const FOOTER_HEIGHT = 28;
const MIN_FRAME_HEIGHT_FOR_VERTICAL = 600 + HEADER_HEIGHT + FOOTER_HEIGHT;
function frameHeightFor(frameWidth, slotHeight) {
  if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
    const width = Math.min(frameWidth, FRAME_MAX_WIDTH);
    return Math.min(width * 16 / 9, slotHeight);
  }
  return slotHeight;
}
function pickAdaptiveFormat(frameWidth, slotHeight) {
  return frameHeightFor(frameWidth, slotHeight) >= MIN_FRAME_HEIGHT_FOR_VERTICAL ? "vertical" : "rectangle";
}
function AdReel({
  slot = DEFAULT_UPDATES_SLOT,
  mode = UPDATES_MODE,
  layoutKey = UPDATES_LAYOUT_KEY,
  frameHeight,
  ordinal,
  onRenderedChange
}) {
  const cardRef = reactExports.useRef(null);
  const insRef = reactExports.useRef(null);
  const requested = reactExports.useRef(false);
  const configured = isAdSenseConfigured(slot);
  const [format, setFormat] = reactExports.useState(mode === "adaptive" ? null : mode);
  const { visible: rendered, detail: debugStatus } = useAdVisible(insRef);
  const [debug, setDebug] = reactExports.useState(false);
  const native = format === "fluid";
  reactExports.useEffect(() => {
    setDebug(readAdDebugFlag());
  }, []);
  reactExports.useLayoutEffect(() => {
    if (mode !== "adaptive") return;
    const card = cardRef.current;
    if (!card) return;
    setFormat(pickAdaptiveFormat(card.clientWidth, frameHeight ?? window.innerHeight));
  }, [mode, frameHeight]);
  reactExports.useEffect(() => {
    const ins = insRef.current;
    if (!ins || !format || requested.current || !configured) return;
    requested.current = true;
    if (ins.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [format, configured]);
  reactExports.useEffect(() => {
    onRenderedChange?.(configured && rendered);
  }, [configured, rendered, onRenderedChange]);
  if (!configured) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "section",
    {
      ref: cardRef,
      "aria-label": rendered ? "Advertisement" : void 0,
      "aria-hidden": !rendered,
      className: rendered ? "flex h-full w-full items-center justify-center bg-paper select-none" : "w-full",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: rendered ? (
            // Phones: fill the whole slot. md+: a 9:16 box capped at 420px,
            // exactly like UpdateReel's frame.
            "relative flex h-full w-full max-w-full flex-col overflow-hidden text-foreground md:aspect-[9/16] md:h-auto md:max-h-full md:max-w-[420px]"
          ) : "w-full",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: rendered && !native ? "flex flex-none items-center gap-2 px-5 text-[10px] uppercase tracking-[0.18em]" : "hidden",
                style: { height: HEADER_HEIGHT },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary px-2 py-0.5 text-primary-foreground", children: "Sponsored" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Advertisement" })
                ]
              }
            ),
            debug && !rendered && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "m-2 rounded border border-dashed border-primary/60 px-3 py-2 text-[11px] leading-snug text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold text-foreground", children: [
                "Ad reel",
                ordinal ? ` #${ordinal}` : "",
                " (debug)"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                "slot ",
                slot,
                " · ",
                format ?? "choosing format"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                "Google: ",
                debugStatus
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: rendered ? "flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 text-center" : "w-full",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "ins",
                  {
                    ref: insRef,
                    className: "adsbygoogle block w-full",
                    style: { display: "block", minWidth: 250 },
                    "data-ad-client": ADSENSE_CLIENT,
                    "data-ad-slot": slot,
                    "data-ad-format": format ?? void 0,
                    ...format === "fluid" && layoutKey ? { "data-ad-layout-key": layoutKey } : {},
                    ...format === "auto" ? { "data-full-width-responsive": "true" } : {}
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: rendered && !native ? "flex flex-none items-center justify-end px-5" : "hidden",
                style: { height: FOOTER_HEIGHT },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded border border-border px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground", children: "Ad" })
              }
            )
          ]
        }
      )
    }
  );
}
function ShareOption({
  children,
  label,
  color,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick, className: "flex flex-col items-center gap-2 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: "grid h-14 w-14 place-items-center rounded-2xl shadow-md transition active:scale-95",
        style: { background: color },
        children
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium text-ink", children: label })
  ] });
}
function ShareSheet({
  post,
  onClose,
  onToast
}) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/post/${post.id}` : `/post/${post.id}`;
  const text = `${post.title} — via InBits`;
  const openWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text}
${url}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  };
  const openLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  };
  const shareVia = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url });
        onClose();
        return;
      } catch {
      }
    }
    onToast("Sharing not supported — link copied");
    await copy();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onToast("Link copied");
    } catch {
      onToast("Could not copy");
    }
    onClose();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm",
      onClick: onClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "w-full max-w-[440px] rounded-t-3xl bg-paper p-5 text-ink shadow-2xl animate-in slide-in-from-bottom",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-lg font-bold", children: "Share" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: onClose,
                  className: "rounded-full p-1 hover:bg-secondary",
                  "aria-label": "Close",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-3 pb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShareOption, { color: "#25D366", label: "WhatsApp", onClick: openWhatsApp, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", className: "h-6 w-6 fill-white", "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.09.55 4.13 1.6 5.93L0 24l6.34-1.66a11.9 11.9 0 0 0 5.7 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.42-8.41ZM12.05 21.5h-.01a9.6 9.6 0 0 1-4.9-1.34l-.35-.21-3.76.98 1-3.66-.23-.38a9.55 9.55 0 0 1-1.47-5.09c0-5.29 4.31-9.6 9.62-9.6 2.57 0 4.98 1 6.8 2.82a9.53 9.53 0 0 1 2.82 6.8c0 5.3-4.32 9.68-9.52 9.68Zm5.5-7.19c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.6.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.24-.24-.58-.48-.5-.68-.51l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35Z" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShareOption, { color: "#0A66C2", label: "LinkedIn", onClick: openLinkedIn, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", className: "h-6 w-6 fill-white", "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5.001ZM3 9h4v12H3V9Zm7 0h3.8v1.71h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.35c0-1.28-.02-2.93-1.78-2.93-1.79 0-2.06 1.39-2.06 2.83V21h-4V9Z" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShareOption, { color: "hsl(var(--primary))", label: "Share via", onClick: shareVia, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-6 w-6 text-white" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShareOption, { color: "#1f2937", label: "Copy link", onClick: copy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-6 w-6 text-white" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: url })
            ] })
          ]
        }
      )
    }
  );
}
let savedScrollTop = 0;
const AD_EVERY = 2;
function LazyAdReel({
  slot,
  ordinal,
  scrollRootRef
}) {
  const placeholderRef = reactExports.useRef(null);
  const [shouldLoad, setShouldLoad] = reactExports.useState(false);
  const [rendered, setRendered] = reactExports.useState(false);
  const onRenderedChange = reactExports.useCallback((next) => setRendered(next), []);
  reactExports.useEffect(() => {
    if (shouldLoad) return;
    const el = placeholderRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setShouldLoad(true);
        io.disconnect();
      }
    }, {
      root: scrollRootRef.current,
      rootMargin: "300% 0px"
    });
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRootRef, shouldLoad]);
  if (!shouldLoad) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: placeholderRef, className: "min-h-px w-full" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": !rendered, className: rendered ? "ad-fade-in h-full w-full snap-start snap-always" : "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdReel, { slot, ordinal, frameHeight: scrollRootRef.current?.clientHeight, onRenderedChange }) });
}
function Updates() {
  const initialItems = Route$g.useLoaderData();
  const [{
    resetOnMount,
    returnToPostId
  }] = reactExports.useState(() => {
    const {
      intent,
      postId
    } = consumeFeedReturnIntent();
    if (intent === "preserve") return {
      resetOnMount: false,
      returnToPostId: postId
    };
    const lastReelId = getLastReelId();
    return {
      resetOnMount: !lastReelId,
      returnToPostId: lastReelId
    };
  });
  const scrollRef = reactExports.useRef(null);
  const {
    items: liveItems,
    hasMore,
    loadMore,
    refresh
  } = useLiveFeed({
    category: "All",
    // FIX: "Smart Batches" — Instagram's cursor-based pagination pulls
    // roughly 10-15 posts per page, not a handful at a time (too many
    // round trips) or everything at once (wasted bandwidth for content
    // the reader may never scroll to). 12 lands in that same range.
    pageSize: 12,
    cacheKey: "updates",
    initialItems,
    // Updates scrolls inside its own reel-list div (see `scrollRef`
    // below), not the window — telling the hook about that container is
    // what makes fresh content actually bring the reader to the top of
    // *that* list instead of trying (and failing) to scroll the window.
    scrollContainerRef: scrollRef,
    // FIX: same issue Home had — the socket's first "initial" message
    // fires on every mount (including a genuinely fresh visit), and
    // without this it always took the position-*preserving* merge path,
    // so a reel scraped between the SSR fetch and the socket connecting
    // landed above reel #1 — already scrolled past, so the reader kept
    // seeing older reels and the "fresh" content never actually showed
    // up. `resetOnMount` is already false when this mount is genuinely
    // resuming a remembered reel position, so that case is unaffected.
    treatInitialMergeAsFresh: resetOnMount
  });
  const unseenPool = reactExports.useMemo(() => excludeSeen(liveItems, "updates", 8), [liveItems]);
  const [brokenImageIds, setBrokenImageIds] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const markImageBroken = reactExports.useCallback((id) => {
    setBrokenImageIds((prev) => prev.has(id) ? prev : new Set(prev).add(id));
  }, []);
  const stableOrderRef = reactExports.useRef([]);
  const posts = reactExports.useMemo(() => {
    const availableById = new Map(unseenPool.map((item) => [item.id, item]));
    const existingIds = stableOrderRef.current.filter((id) => availableById.has(id) && !brokenImageIds.has(id));
    const existingSet = new Set(existingIds);
    const brandNewItems = unseenPool.filter((item) => !existingSet.has(item.id) && hasImage(item) && !brokenImageIds.has(item.id));
    const diversifiedNewIds = diversifyBySource(brandNewItems).map((item) => item.id);
    const nextOrder = [...diversifiedNewIds, ...existingIds];
    stableOrderRef.current = nextOrder;
    return nextOrder.map((id) => availableById.get(id)).filter((item) => Boolean(item));
  }, [unseenPool, brokenImageIds]);
  reactExports.useEffect(() => {
    if (posts.length > 0) markSeen(posts.map((p) => p.id), "updates");
  }, [posts]);
  const [liked, setLiked] = reactExports.useState({});
  const {
    recordLike
  } = useInterestProfile();
  const {
    has: isSavedId,
    toggleSave
  } = useSavedPosts();
  const [burst, setBurst] = reactExports.useState({});
  const [shareFor, setShareFor] = reactExports.useState(null);
  const [toast, setToast] = reactExports.useState(null);
  const tapRef = reactExports.useRef({});
  const sentinel = reactExports.useRef(null);
  const reelRefs = reactExports.useRef(/* @__PURE__ */ new Map());
  const [activeId, setActiveId] = reactExports.useState(null);
  const [muted, setMuted] = usePref("reels.muted", true);
  reactExports.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);
  const restoredRef = reactExports.useRef(false);
  reactExports.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (resetOnMount) {
      el.scrollTo({
        top: 0
      });
      savedScrollTop = 0;
      restoredRef.current = true;
    }
    const onScroll = () => {
      savedScrollTop = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll, {
      passive: true
    });
    return () => {
      savedScrollTop = el.scrollTop;
      el.removeEventListener("scroll", onScroll);
    };
  }, [resetOnMount]);
  reactExports.useLayoutEffect(() => {
    if (restoredRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!returnToPostId) {
      if (savedScrollTop > 0 && posts.length > 0) {
        el.scrollTop = savedScrollTop;
        restoredRef.current = true;
      }
      return;
    }
    const target = el.querySelector(`[data-post-id="${CSS.escape(returnToPostId)}"]`);
    if (target) {
      target.scrollIntoView({
        block: "start"
      });
      restoredRef.current = true;
    }
  }, [posts, returnToPostId]);
  reactExports.useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    }, {
      root: scrollRef.current,
      rootMargin: "800px 0px"
    });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);
  reactExports.useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      const mostVisible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (mostVisible) {
        const id = mostVisible.target.getAttribute("data-post-id");
        setActiveId(id);
        setLastReelId(id);
      }
    }, {
      root,
      threshold: [0.6, 0.75, 0.9]
    });
    reelRefs.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [posts]);
  const PREFETCH_AHEAD = 3;
  reactExports.useEffect(() => {
    if (!activeId) return;
    const index = posts.findIndex((p) => p.id === activeId);
    if (index === -1) return;
    prefetchFeedItemImages(posts.slice(index + 1, index + 1 + PREFETCH_AHEAD));
  }, [activeId, posts]);
  const {
    pullDistance,
    refreshing,
    triggerDistance
  } = usePullToRefresh({
    onRefresh: refresh,
    scrollRef
  });
  const toggleLike = (id, force) => {
    setLiked((s) => {
      const next = force ?? !s[id];
      if (next && !s[id]) {
        const p = posts.find((post) => post.id === id);
        if (p) recordLike(p.category, p.source);
      }
      return {
        ...s,
        [id]: next
      };
    });
  };
  const triggerLikeBurst = (id) => {
    setBurst((s) => ({
      ...s,
      [id]: (s[id] ?? 0) + 1
    }));
  };
  const handleDoubleTap = (id) => {
    const now = Date.now();
    const last = tapRef.current[id] ?? 0;
    if (now - last < 300) {
      toggleLike(id, true);
      triggerLikeBurst(id);
      tapRef.current[id] = 0;
    } else {
      tapRef.current[id] = now;
    }
  };
  const currentPost = posts.find((p) => p.id === shareFor);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { title: "Updates", fullWidth: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: scrollRef,
        "data-scroll-restoration-id": "updates-reel-scroll",
        className: "-mt-0 h-[calc(100vh-129px)] md:h-[calc(100vh-2.5rem)] w-full overflow-y-auto snap-y snap-mandatory scrollbar-none",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center overflow-hidden text-[11px] text-white/70 transition-[height]", style: {
            height: refreshing ? 32 : Math.min(pullDistance, triggerDistance)
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: `h-4 w-4 ${refreshing || pullDistance >= triggerDistance ? "animate-spin" : ""}` }) }),
          posts.flatMap((p, idx) => {
            const isLiked = liked[p.id];
            const isSaved = isSavedId(p.id);
            const burstKey = burst[p.id] ?? 0;
            const adOrdinal = idx > 0 && idx % AD_EVERY === 0 ? idx / AD_EVERY : null;
            const nodes = [];
            if (adOrdinal !== null) {
              nodes.push(/* @__PURE__ */ jsxRuntimeExports.jsx(LazyAdReel, { ordinal: adOrdinal, scrollRootRef: scrollRef }, `reel-ad-${adOrdinal}`));
            }
            nodes.push(/* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-post-id": p.id, ref: (el) => {
              if (el) reelRefs.current.set(p.id, el);
              else reelRefs.current.delete(p.id);
            }, className: "reel-card h-full w-full snap-start snap-always", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UpdateReel, { post: p, isLiked, isSaved, burstKey, active: activeId === p.id, muted, onDoubleTap: () => handleDoubleTap(p.id), onToggleLike: () => toggleLike(p.id), onToggleSave: () => {
              toggleSave(p.id);
              setToast(isSaved ? "Removed from saved" : "Saved");
            }, onShare: () => setShareFor(p.id), onToggleMute: () => setMuted(!muted), onImageUnavailable: () => markImageBroken(p.id) }) }, p.id));
            return nodes;
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: sentinel, className: "flex h-16 items-center justify-center text-[11px] text-muted-foreground", children: hasMore && posts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) })
        ]
      }
    ),
    currentPost && /* @__PURE__ */ jsxRuntimeExports.jsx(ShareSheet, { post: currentPost, onClose: () => setShareFor(null), onToast: (m) => setToast(m) }),
    toast && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-ink/90 px-4 py-2 text-xs font-medium text-paper shadow-lg", children: toast }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @keyframes heartBurst {
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        .heart-burst { animation: heartBurst 900ms ease-out forwards; }
        @keyframes adFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ad-fade-in { animation: adFadeIn 300ms ease-out; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      ` })
  ] });
}
export {
  Updates as component
};
