import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { l as usePref } from "./router-B91z3HGk.mjs";
const TRIGGER_DISTANCE = 70;
const MAX_PULL = 110;
function usePullToRefresh({
  onRefresh,
  scrollRef,
  disabled = false
}) {
  const [pullDistance, setPullDistance] = reactExports.useState(0);
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const startY = reactExports.useRef(null);
  const pulling = reactExports.useRef(false);
  const pullDistanceRef = reactExports.useRef(0);
  const refreshingRef = reactExports.useRef(false);
  const setPullDistanceTracked = (value) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  };
  reactExports.useEffect(() => {
    if (disabled || typeof window === "undefined") return;
    const target = scrollRef?.current ?? window;
    const atTop = () => {
      if (scrollRef?.current) return scrollRef.current.scrollTop <= 0;
      return window.scrollY <= 0;
    };
    const onTouchStart = (e) => {
      if (!atTop() || refreshingRef.current) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };
    const onTouchMove = (e) => {
      if (!pulling.current || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPullDistanceTracked(0);
        return;
      }
      if (!atTop()) {
        pulling.current = false;
        setPullDistanceTracked(0);
        return;
      }
      if (delta > 4) e.preventDefault();
      setPullDistanceTracked(Math.min(delta * 0.55, MAX_PULL));
    };
    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      if (pullDistanceRef.current >= TRIGGER_DISTANCE) {
        refreshingRef.current = true;
        setRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullDistanceTracked(0);
        });
      } else {
        setPullDistanceTracked(0);
      }
    };
    target.addEventListener("touchstart", onTouchStart, { passive: true });
    target.addEventListener("touchmove", onTouchMove, { passive: false });
    target.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchmove", onTouchMove);
      target.removeEventListener("touchend", onTouchEnd);
    };
  }, [disabled, onRefresh, scrollRef]);
  return { pullDistance, refreshing, triggerDistance: TRIGGER_DISTANCE };
}
const EMPTY_PROFILE = { categories: {}, sources: {} };
function bump(record, key) {
  if (!key) return record;
  return { ...record, [key]: (record[key] ?? 0) + 1 };
}
function useInterestProfile() {
  const [profile, setProfile] = usePref("interestProfile", EMPTY_PROFILE);
  const recordLike = (category, source) => {
    setProfile({
      categories: bump(profile.categories, category),
      sources: bump(profile.sources, source)
    });
  };
  return { profile, recordLike };
}
function hasImage(post) {
  if (post.images?.some((src) => !!src?.trim())) return true;
  return !!post.image?.trim();
}
function normalizeImageUrl(src) {
  const trimmed = src?.trim() ?? "";
  if (!trimmed) return "";
  if (typeof window !== "undefined" && window.location.protocol === "https:" && trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
}
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 700;
function ImageCarousel({
  images,
  alt = "",
  className = "",
  imgClassName = "",
  priority = false,
  onUnavailable
}) {
  const [active, setActive] = reactExports.useState(0);
  const [failed, setFailed] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const [pending, setPending] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const [retryTick, setRetryTick] = reactExports.useState({});
  const trackRef = reactExports.useRef(null);
  const reportedRef = reactExports.useRef(false);
  const attemptsRef = reactExports.useRef({});
  const timersRef = reactExports.useRef({});
  const totalWithUrl = reactExports.useMemo(
    () => images.filter((src) => !!normalizeImageUrl(src)).length,
    [images]
  );
  reactExports.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);
  const scheduleRetry = (index) => {
    const attempts = (attemptsRef.current[index] ?? 0) + 1;
    attemptsRef.current[index] = attempts;
    if (attempts > MAX_RETRIES) {
      setPending((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      setFailed((prev) => prev.has(index) ? prev : new Set(prev).add(index));
      return;
    }
    setPending((prev) => prev.has(index) ? prev : new Set(prev).add(index));
    timersRef.current[index] = setTimeout(() => {
      setPending((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      setRetryTick((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
    }, RETRY_BASE_DELAY_MS * attempts);
  };
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };
  const visible = images.map((src, i) => ({ src: normalizeImageUrl(src), i })).filter(({ src, i }) => src && !failed.has(i) && !pending.has(i));
  reactExports.useEffect(() => {
    if (pending.size > 0) return;
    if (failed.size >= totalWithUrl && !reportedRef.current) {
      reportedRef.current = true;
      onUnavailable?.();
    }
  }, [failed.size, pending.size, totalWithUrl]);
  if (visible.length === 0) return null;
  if (visible.length === 1) {
    const { src, i } = visible[0];
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src,
        alt,
        loading: priority ? "eager" : "lazy",
        decoding: priority ? "sync" : "async",
        fetchPriority: priority ? "high" : "auto",
        referrerPolicy: "no-referrer",
        draggable: false,
        className: `w-full ${imgClassName}`,
        onError: () => scheduleRetry(i)
      },
      `${i}-${retryTick[i] ?? 0}`
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: trackRef,
        onScroll,
        className: "scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth",
        children: visible.map(({ src, i }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src,
            alt,
            loading: i === 0 ? "eager" : "lazy",
            decoding: i === 0 && priority ? "sync" : "async",
            fetchPriority: i === 0 && priority ? "high" : "auto",
            referrerPolicy: "no-referrer",
            draggable: false,
            className: `w-full flex-none snap-center ${imgClassName}`,
            onError: () => scheduleRetry(i)
          },
          `${i}-${retryTick[i] ?? 0}`
        ))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white", children: [
      Math.min(active + 1, visible.length),
      "/",
      visible.length
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1", children: visible.map(({ i }, dotIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: `h-1.5 rounded-full transition-all ${dotIndex === active ? "w-3 bg-white" : "w-1.5 bg-white/50"}`
      },
      i
    )) })
  ] });
}
const SHORT_LOOP_SECONDS = 60;
const MUSIC_LIBRARY = [
  {
    id: "early-riser",
    title: "Early Riser",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_Early_Riser.ogg",
    categories: [
      "News Theme",
      "Breaking News",
      "Corporate",
      "Technology",
      "Focus Music",
      "Podcast Music",
      "Vlog Music",
      "Background Music",
      "Trending Beat",
      "Intro Music"
    ]
  },
  {
    id: "enchanted-journey",
    title: "Enchanted Journey",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_Enchanted_Journey.ogg",
    categories: [
      "Documentary",
      "Adventure",
      "Travel Music",
      "Inspirational",
      "Uplifting",
      "Relaxing",
      "Chill",
      "Ambient Background",
      "Instrumental Background",
      "Meditation"
    ]
  },
  {
    id: "impact-prelude",
    title: "Impact Prelude",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_01_-_Impact_Prelude.ogg",
    categories: [
      "Cinematic Score",
      "Epic",
      "Dramatic",
      "Suspense",
      "Mystery",
      "Horror",
      "Gaming Music",
      "Workout Music",
      "Viral Beat",
      "Outro Music"
    ]
  },
  {
    id: "master-of-the-feast",
    title: "Master of the Feast",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_Master_of_the_Feast.ogg",
    categories: [
      "Motivational",
      "Comedy",
      "Romantic",
      "Futuristic",
      "Study Music",
      "Corporate",
      "Trending Beat"
    ]
  },
  {
    id: "waterford",
    title: "Waterford",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/MacLeod,_Kevin_-_Waterford.ogg",
    categories: [
      "Emotional",
      "Inspirational",
      "Relaxing",
      "Meditation",
      "Chill",
      "Acoustic Background",
      "Ambient Background",
      "Instrumental Background",
      "Focus Music"
    ]
  }
];
function categoryForItem(item) {
  const haystack = `${item.title ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
  if (haystack.includes("breaking")) return "Breaking News";
  const subject = (item.topic || item.category || "").toLowerCase();
  const map = {
    politics: "News Theme",
    business: "Corporate",
    technology: "Technology",
    tech: "Technology",
    sports: "Epic",
    health: "Emotional",
    science: "Documentary",
    entertainment: "Cinematic Score",
    world: "Documentary",
    india: "News Theme",
    general: "Background Music"
  };
  return map[subject] ?? "News Theme";
}
const trackAssignments = /* @__PURE__ */ new Map();
const categoryCursor = /* @__PURE__ */ new Map();
function nextInCategory(category) {
  const pool = MUSIC_LIBRARY.filter((t) => t.categories.includes(category));
  const candidates = pool.length > 0 ? pool : MUSIC_LIBRARY;
  const cursor = categoryCursor.get(category) ?? 0;
  categoryCursor.set(category, (cursor + 1) % candidates.length);
  return candidates[cursor % candidates.length];
}
function trackForItem(item) {
  const category = categoryForItem(item);
  let track = trackAssignments.get(item.id);
  if (!track) {
    track = nextInCategory(category);
    trackAssignments.set(item.id, track);
  }
  return { track, category };
}
function useShortLoop(audioRef) {
  reactExports.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      if (audio.currentTime >= SHORT_LOOP_SECONDS) {
        audio.currentTime = 0;
      }
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [audioRef]);
}
function MusicEqualizer({ className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `inline-flex h-3 flex-none items-end gap-[2px] ${className}`,
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "eq-bar w-[2.5px] rounded-full bg-current",
            style: { height: "60%", animationDelay: "-0.9s" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "eq-bar w-[2.5px] rounded-full bg-current",
            style: { height: "100%", animationDelay: "-0.5s" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "eq-bar w-[2.5px] rounded-full bg-current",
            style: { height: "80%", animationDelay: "-0.2s" }
          }
        )
      ]
    }
  );
}
export {
  ImageCarousel as I,
  MusicEqualizer as M,
  usePullToRefresh as a,
  useShortLoop as b,
  hasImage as h,
  trackForItem as t,
  useInterestProfile as u
};
