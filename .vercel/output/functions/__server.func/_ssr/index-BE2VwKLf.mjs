import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { u as useLiveFeed } from "./useLiveFeed-BwhfFFBV.mjs";
import { R as Route$m, c as consumeFeedReturnIntent, g as groupShowcaseFromFeed, b as groupJournalFromFeed, d as groupChannelsFromFeed, u as useArticleViewer, f as fetchJobs, a as useSavedPosts, r as readAdDebugFlag } from "./router-B91z3HGk.mjs";
import { h as hasImage, u as useInterestProfile, a as usePullToRefresh, t as trackForItem, b as useShortLoop, I as ImageCarousel, M as MusicEqualizer } from "./MusicEqualizer-DPWdti9T.mjs";
import { e as excludeSeen, m as markSeen } from "./seenArticles-K7DuCxq4.mjs";
import { R as RelativeTime } from "./RelativeTime-6LiQ26XO.mjs";
import { C as ChannelAvatar } from "./ChannelAvatar-B0BqpXrc.mjs";
import { s as sourceOriginLabel } from "./sourceOrigin-B3ooOyf2.mjs";
import { u as useTranslatedById, a as useTranslated } from "./i18n-CxTQNlYk.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CompanyLogo } from "./CompanyLogo-CJNU1DHt.mjs";
import { i as isAdSenseConfigured, u as useAdVisible, A as ADSENSE_CLIENT } from "./AdSlot-Do_We2Bz.mjs";
import { L as LoaderCircle, a as EllipsisVertical, A as ArrowRight, R as Radio, S as Sparkles, b as Ellipsis, H as Heart, V as VolumeX, c as Volume2, d as Share2, B as Bookmark, M as Megaphone } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
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
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const STORAGE_KEY$1 = "inbits:homeLastPost";
let memoryId = null;
function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
function setLastPostId(id) {
  if (!id) return;
  memoryId = id;
  try {
    getStorage()?.setItem(STORAGE_KEY$1, id);
  } catch {
  }
}
function getLastPostId() {
  if (memoryId) return memoryId;
  return getStorage()?.getItem(STORAGE_KEY$1) ?? null;
}
function browserLanguage() {
  if (typeof navigator === "undefined") return "en";
  return (navigator.language || "en").split("-")[0].toLowerCase();
}
function scoreForYou(items, profile, language) {
  Object.entries(profile.categories).sort((a, b) => b[1] - a[1])[0]?.[0];
  Object.entries(profile.sources).sort((a, b) => b[1] - a[1])[0]?.[0];
  const hasAnyProfile = Object.keys(profile.categories).length > 0 || Object.keys(profile.sources).length > 0;
  const now = Date.now();
  return items.map((item) => {
    let score = 0;
    const reasons = [];
    const categoryHits = profile.categories[item.category] ?? 0;
    const sourceHits = profile.sources[item.source] ?? 0;
    if (categoryHits > 0) {
      score += Math.min(categoryHits, 5) * 3;
      reasons.push(`You like ${item.category}`);
    }
    if (sourceHits > 0) {
      score += Math.min(sourceHits, 5) * 2;
      if (reasons.length === 0) reasons.push(`You follow ${item.source}`);
    }
    if (item.language && item.language.toLowerCase() === language) {
      score += 2;
      if (reasons.length === 0)
        reasons.push(`In ${language === "en" ? "English" : "your language"}`);
    }
    const ageHours = (now - new Date(item.publishedAt).getTime()) / 36e5;
    score += Math.max(0, 2 - ageHours / 12);
    if (reasons.length === 0) {
      reasons.push(hasAnyProfile ? "Trending now" : `Popular in ${item.category}`);
    }
    return { item, score, reason: reasons[0] };
  }).sort((a, b) => b.score - a.score);
}
function pickForYou(items, profile, language, excludeIds, count = 8) {
  return scoreForYou(
    items.filter((i) => !excludeIds.has(i.id)),
    profile,
    language
  ).slice(0, count);
}
let currentAudio = null;
function stopOtherPreviews(except) {
  if (currentAudio && currentAudio !== except) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (except) currentAudio = except;
}
function clearActivePreview(audio) {
  if (currentAudio === audio) currentAudio = null;
}
const STORAGE_KEY = "inbits:home.muted";
const listeners = /* @__PURE__ */ new Set();
function readInitial() {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw == null ? true : JSON.parse(raw);
  } catch {
    return true;
  }
}
let muted = readInitial();
function emit() {
  listeners.forEach((l) => l());
}
function getHomeMuted() {
  return muted;
}
function setHomeMuted(next) {
  muted = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
  }
  emit();
}
function toggleHomeMuted() {
  setHomeMuted(!muted);
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function useHomeMuted() {
  return reactExports.useSyncExternalStore(subscribe, getHomeMuted, () => true);
}
function PostCardInner({
  post,
  priority = false,
  onImageUnavailable
}) {
  const { openArticle } = useArticleViewer();
  const { has, toggleSave } = useSavedPosts();
  const saved = has(post.id);
  const [liked, setLiked] = reactExports.useState(false);
  const [copied, setCopied] = reactExports.useState(false);
  const [burst, setBurst] = reactExports.useState(false);
  const { recordLike } = useInterestProfile();
  const tapRef = reactExports.useRef({
    time: 0,
    timer: null
  });
  const { track, category } = trackForItem(post);
  const mediaRef = reactExports.useRef(null);
  const audioRef = reactExports.useRef(null);
  const [playing, setPlaying] = reactExports.useState(false);
  const [trackFailed, setTrackFailed] = reactExports.useState(false);
  const homeMuted = useHomeMuted();
  useShortLoop(audioRef);
  reactExports.useEffect(() => {
    const audio = audioRef.current;
    const element = mediaRef.current;
    if (!audio || !element || trackFailed) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stopOtherPreviews(audio);
          audio.muted = homeMuted;
          audio.currentTime = 0;
          audio.play().then(() => {
            setPlaying(true);
          }).catch(() => {
            setPlaying(false);
          });
        } else {
          audio.pause();
          audio.currentTime = 0;
          setPlaying(false);
        }
      },
      {
        threshold: 0.6
      }
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      audio.pause();
      audio.currentTime = 0;
    };
  }, [trackFailed, homeMuted]);
  reactExports.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.muted = homeMuted;
  }, [homeMuted]);
  reactExports.useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        clearActivePreview(audio);
      }
    };
  }, []);
  const readPost = () => {
    openArticle(post);
  };
  const [title, excerpt] = useTranslated([post.title, post.excerpt]);
  const onMediaClick = () => {
    const now = Date.now();
    if (now - tapRef.current.time < 300) {
      if (tapRef.current.timer) {
        clearTimeout(tapRef.current.timer);
      }
      tapRef.current.timer = null;
      tapRef.current.time = 0;
      setLiked(true);
      recordLike(post.category, post.source);
      setBurst(true);
      setTimeout(() => {
        setBurst(false);
      }, 700);
      return;
    }
    tapRef.current.time = now;
    tapRef.current.timer = setTimeout(() => {
      tapRef.current.timer = null;
      readPost();
    }, 300);
  };
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/post/${post.id}` : "";
  const share = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl
        });
      } catch {
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { "data-post-id": post.id, className: "feed-card w-full border-b border-border bg-paper", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center gap-2.5 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelAvatar, { source: post.source, sampleUrl: post.sourceUrl }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[13px] font-semibold leading-tight", children: post.source }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
          post.category,
          " · ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(RelativeTime, { iso: post.publishedAt }),
          sourceOriginLabel(post.location, post.language) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            " · ",
            sourceOriginLabel(post.location, post.language)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "More", className: "rounded-full p-1.5 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        role: "link",
        tabIndex: 0,
        onClick: onMediaClick,
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            readPost();
          }
        },
        className: "block cursor-pointer select-none",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: mediaRef, className: "relative w-full", children: [
          !trackFailed && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "audio",
            {
              ref: audioRef,
              src: track.src,
              loop: true,
              muted: homeMuted,
              playsInline: true,
              preload: "none",
              onPlay: () => setPlaying(true),
              onPause: () => setPlaying(false),
              onEnded: () => setPlaying(false),
              onError: () => setTrackFailed(true)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ImageCarousel,
            {
              images: post.image ? [post.image, ...post.images.filter((img) => img !== post.image)] : post.images,
              alt: post.title,
              imgClassName: "aspect-square object-cover",
              priority,
              onUnavailable: onImageUnavailable
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" }),
          burst && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "pointer-events-none absolute inset-0 z-20 grid place-items-center",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "instagram-heart-burst h-24 w-24 fill-white text-white" })
            },
            "heart-burst"
          ),
          !trackFailed && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "\n                absolute\n                right-3\n                bottom-4\n                z-30\n                flex\n                flex-col\n                items-center\n              ",
              onClick: (event) => {
                event.stopPropagation();
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleHomeMuted();
                  },
                  "aria-label": homeMuted ? "Unmute" : "Mute",
                  title: homeMuted ? "Unmute" : "Mute",
                  className: "\n                  flex\n                  h-8\n                  w-8\n                  items-center\n                  justify-center\n                  rounded-full\n                  border\n                  border-white/20\n                  bg-black/55\n                  text-white\n                  shadow-md\n                  backdrop-blur-md\n                  transition\n                  hover:bg-black/70\n                  active:scale-90\n                ",
                  children: homeMuted ? /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { className: "h-4 w-4", strokeWidth: 2 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-4 w-4", strokeWidth: 2 })
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "\n              absolute\n              inset-x-0\n              bottom-0\n              z-10\n              space-y-1\n              p-3\n              pr-16\n              text-white\n            ",
              onClick: (event) => {
                event.stopPropagation();
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary px-2 py-0.5 text-primary-foreground", children: post.category }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/85", children: [
                    post.source,
                    " · ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RelativeTime, { iso: post.publishedAt })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: readPost, className: "block w-full text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif line-clamp-3 text-[20px] font-bold leading-[1.2] tracking-[-0.01em] text-white/95 drop-shadow-md sm:text-[22px] sm:leading-[1.2]", children: title }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: " line-clamp-2 text-[12px] leading-[1.45] text-white/90 sm:text-[13px] sm:leading-[1.5]", children: excerpt }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 pt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/70", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 truncate", children: [
                    post.author,
                    " · ",
                    post.readTime,
                    " min read"
                  ] }),
                  !trackFailed && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      className: "\n                    inline-flex\n                    min-w-0\n                    max-w-[48%]\n                    shrink-0\n                    items-center\n                    gap-1\n                    text-white/80\n                  ",
                      children: [
                        playing ? /* @__PURE__ */ jsxRuntimeExports.jsx(MusicEqualizer, {}) : null,
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
                          category,
                          " · ",
                          track.title,
                          " — ",
                          track.artist
                        ] })
                      ]
                    }
                  )
                ] })
              ]
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 px-3 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            setLiked((value) => {
              if (!value) {
                recordLike(post.category, post.source);
              }
              return !value;
            });
          },
          "aria-label": "Like",
          className: `like-button transition active:scale-90 ${liked ? "is-liked" : ""}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Heart,
            {
              className: `h-5 w-5 transition-transform duration-150 ${liked ? "fill-primary text-primary" : ""}`
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: share,
          "aria-label": copied ? "Link copied" : "Share",
          className: "transition active:scale-90",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => toggleSave(post.id),
          "aria-label": "Save",
          className: "ml-auto transition active:scale-90",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: `h-5 w-5 ${saved ? "fill-ink text-ink" : ""}` })
        }
      )
    ] })
  ] });
}
const PostCard = reactExports.memo(PostCardInner);
function SuggestionsSidebar({
  showcase,
  channels
}) {
  const { openArticle } = useArticleViewer();
  const news = showcase.flatMap((p) => p.stories.map((s) => ({ ...s, publisher: p.publisher }))).slice(0, 6);
  const newsTitles = useTranslatedById(news.map((s) => ({ id: s.id, text: s.title })));
  const [jobs, setJobs] = reactExports.useState([]);
  reactExports.useEffect(() => {
    let cancelled = false;
    fetchJobs().then(({ items }) => {
      if (!cancelled) setJobs(items.slice(0, 3));
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-7 pr-2", children: [
    channels.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-ink", children: "Channels for you" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/stands",
            search: { tab: "channels" },
            className: "text-xs font-semibold text-primary hover:underline",
            children: "See all"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: channels.slice(0, 5).map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/channel/$slug",
          params: { slug: c.slug },
          className: "flex items-center gap-3 group",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: c.cover,
                alt: "",
                loading: "lazy",
                className: "h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-primary/50"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-sm font-semibold text-ink group-hover:underline", children: c.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "truncate text-[11px] text-muted-foreground", children: [
                c.stories.length,
                " stories · Live"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Radio, { className: "h-4 w-4 shrink-0 text-primary" })
          ]
        }
      ) }, c.slug)) })
    ] }),
    news.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-ink", children: "Trending news" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/stands", className: "text-xs font-semibold text-primary hover:underline", children: "See all" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: news.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => openArticle({
            id: s.id,
            title: newsTitles.get(s.id) ?? s.title,
            source: s.publisher,
            sourceUrl: s.sourceUrl ?? "",
            image: s.image,
            category: s.kicker
          }),
          className: "group flex w-full items-start gap-3 text-left",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: s.image,
                alt: "",
                loading: "lazy",
                className: "h-14 w-16 shrink-0 rounded-lg object-cover"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: s.publisher }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink group-hover:underline", children: newsTitles.get(s.id) ?? s.title })
            ] })
          ]
        }
      ) }, s.id)) })
    ] }),
    jobs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-ink", children: "Jobs for you" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jobs", className: "text-xs font-semibold text-primary hover:underline", children: "See all" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2.5", children: jobs.map((j) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/job/$id", params: { id: j.id }, className: "flex items-center gap-3 group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CompanyLogo,
          {
            logoUrl: j.logoUrl,
            initials: j.logo,
            size: "h-10 w-10",
            textSize: "text-xs"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[13px] font-semibold text-ink group-hover:underline", children: j.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "truncate text-[11px] text-muted-foreground", children: [
            j.company,
            " · ",
            j.location
          ] })
        ] })
      ] }) }, j.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "pb-8 text-[11px] leading-relaxed text-muted-foreground", children: "InBits · News & Updates worth your time" })
  ] });
}
function InfiniteRail({
  items,
  renderItem,
  className = ""
}) {
  const [cycles, setCycles] = reactExports.useState(2);
  const ref = reactExports.useRef(null);
  const onScroll = reactExports.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 240) {
      setCycles((c) => c < 12 ? c + 1 : c);
    }
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      onScroll,
      className: `scrollbar-none flex overflow-x-auto ${className}`,
      children: Array.from({ length: cycles }).flatMap(
        (_, c) => items.map((item, i) => renderItem(item, `${c}-${i}`))
      )
    }
  );
}
function RailHeader({
  title,
  subtitle,
  to,
  cta
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-start justify-between gap-3 px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-xl font-bold leading-tight", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to,
        "aria-label": cta,
        className: "mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5" })
      }
    )
  ] });
}
function StandsRail({ showcase }) {
  const { openArticle } = useArticleViewer();
  const titles = useTranslatedById(
    showcase.flatMap(
      (panel) => panel.stories.slice(0, 3).map((s) => ({ id: s.id, text: s.title }))
    )
  );
  if (showcase.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "border-y border-border bg-paper py-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RailHeader,
      {
        title: "News Showcase",
        subtitle: "Live, grouped by publisher",
        to: "/stands",
        cta: "More showcase panels"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InfiniteRail,
      {
        items: showcase,
        className: "snap-x snap-mandatory gap-3 pb-2 pl-4 pr-4",
        renderItem: (panel, key) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "article",
          {
            className: "w-[300px] flex-none snap-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChannelAvatar,
                  {
                    source: panel.publisher,
                    sampleUrl: panel.stories[0]?.sourceUrl,
                    className: "h-6 w-6"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 truncate font-serif text-base font-black uppercase tracking-tight", children: panel.publisher })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-ink px-4 py-2.5 text-sm font-semibold text-paper", children: panel.banner }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "px-4", children: panel.stories.slice(0, 3).map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: i > 0 ? "border-t border-border" : "", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => openArticle({
                    id: s.id,
                    title: titles.get(s.id) ?? s.title,
                    source: panel.publisher,
                    sourceUrl: s.sourceUrl ?? "",
                    image: s.image,
                    category: s.kicker
                  }),
                  className: "flex w-full items-start gap-3 py-3.5 text-left transition hover:opacity-80",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: s.kicker }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 line-clamp-2 text-sm font-semibold leading-snug", children: titles.get(s.id) ?? s.title })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: s.image,
                        alt: "",
                        loading: "lazy",
                        className: "h-16 w-20 flex-none rounded-lg object-cover"
                      }
                    )
                  ]
                }
              ) }, s.id)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 pb-3 pt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    suppressHydrationWarning: true,
                    className: "text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground",
                    children: `Showcase · ${panel.updated}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    "aria-label": "More options",
                    className: "rounded-full p-1 text-muted-foreground hover:bg-secondary",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-4 w-4" })
                  }
                )
              ] })
            ]
          },
          key
        )
      }
    )
  ] });
}
function JournalRail({ journal }) {
  if (journal.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "border-y border-border bg-paper py-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-start justify-between gap-3 px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-xl font-bold leading-tight", children: "Journal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Read-ready news playlists by category" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/stands",
          search: { tab: "journal" },
          "aria-label": "All categories",
          className: "mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InfiniteRail,
      {
        items: journal,
        className: "gap-3 pb-2 pl-4 pr-4",
        renderItem: (c, key) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/stands",
            search: { tab: "journal", cat: c.id },
            className: "group w-44 flex-none text-left",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: c.cover,
                    alt: "",
                    loading: "lazy",
                    className: "h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold text-white", children: c.title }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
                c.articles.length,
                " stories"
              ] })
            ]
          },
          key
        )
      }
    )
  ] });
}
function ChannelsRail({ channels }) {
  if (channels.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "border-y border-border bg-paper py-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-start justify-between gap-3 px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-xl font-bold leading-tight", children: "Channels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-primary" }),
          " Tune into a newsroom"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/stands",
          search: { tab: "channels" },
          "aria-label": "All channels",
          className: "mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InfiniteRail,
      {
        items: channels,
        className: "gap-4 pb-2 pl-4 pr-4",
        renderItem: (c, key) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/channel/$slug",
            params: { slug: c.slug },
            className: "group w-[100px] flex-none text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto h-[84px] w-[84px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border border-dashed border-border transition group-hover:border-primary/60" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-[6px] overflow-hidden rounded-full ring-2 ring-primary/70", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: c.cover,
                    alt: "",
                    loading: "lazy",
                    className: "h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChannelAvatar,
                  {
                    source: c.name,
                    sampleUrl: c.stories[0]?.sourceUrl,
                    className: "absolute -right-0.5 -top-0.5 h-6 w-6 ring-2 ring-paper"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Radio, { className: "h-2.5 w-2.5" }),
                  " Live"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 truncate text-xs font-bold text-foreground", children: c.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 flex items-end justify-center gap-[3px]", children: [5, 9, 7, 11, 7, 4, 10].map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  style: { height: `${h}px`, animationDelay: `${i * 110}ms` },
                  className: "w-[3px] animate-pulse rounded-full bg-primary/70"
                },
                i
              )) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                c.stories.length,
                " stories"
              ] })
            ]
          },
          key
        )
      }
    )
  ] });
}
function JobsRail() {
  const [jobs, setJobs] = reactExports.useState([]);
  reactExports.useEffect(() => {
    let cancelled = false;
    fetchJobs().then(({ items }) => {
      if (!cancelled) setJobs(items.slice(0, 10));
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (jobs.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "border-y border-border bg-paper py-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RailHeader,
      {
        title: "Jobs for you",
        subtitle: "Real, currently-open remote roles",
        to: "/jobs",
        cta: "See all jobs"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InfiniteRail,
      {
        items: jobs,
        className: "gap-3 pb-2 pl-4 pr-4",
        renderItem: (j, key) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/job/$id",
            params: { id: j.id },
            className: "flex w-64 flex-none items-center gap-3 rounded-2xl border border-border bg-card p-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyLogo, { logoUrl: j.logoUrl, initials: j.logo }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "truncate text-sm font-bold leading-tight", children: j.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  j.company,
                  " · ",
                  j.location
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground", children: j.type }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold text-primary", children: j.salary })
                ] })
              ] })
            ]
          },
          key
        )
      }
    )
  ] });
}
function RecommendedRail({ picks }) {
  const { openArticle } = useArticleViewer();
  const titles = useTranslatedById(picks.map(({ item }) => ({ id: item.id, text: item.title })));
  if (picks.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "border-y border-border bg-paper py-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-2 px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-xl font-bold leading-tight", children: "Recommended for you" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Picked from your reading — like more stories to sharpen this" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InfiniteRail,
      {
        items: picks,
        className: "gap-3 pb-2 pl-4 pr-4",
        renderItem: ({ item, reason }, key) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => openArticle(item),
            className: "group w-44 flex-none text-left",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: item.image,
                    alt: "",
                    loading: "lazy",
                    className: "h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary-foreground", children: reason }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-white", children: titles.get(item.id) ?? item.title })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 truncate text-[11px] text-muted-foreground", children: item.source })
            ]
          },
          key
        )
      }
    )
  ] });
}
const DEFAULT_HOME_SLOT = "6413880979";
const HOME_FORMAT = "fluid";
const HOME_LAYOUT_KEY = void 0;
const REQUEST_MARGIN = "1200px 0px";
function InFeedAd({
  slot = DEFAULT_HOME_SLOT,
  format = HOME_FORMAT,
  layoutKey = HOME_LAYOUT_KEY,
  ordinal
}) {
  const [enabled, setEnabled] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
  }, [slot]);
  if (!enabled) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    InFeedAdUnit,
    {
      slot,
      format,
      layoutKey: layoutKey || void 0,
      ordinal
    }
  );
}
function InFeedAdUnit({
  slot,
  format,
  layoutKey,
  ordinal
}) {
  const cardRef = reactExports.useRef(null);
  const insRef = reactExports.useRef(null);
  const requested = reactExports.useRef(false);
  const { visible: rendered, detail: debugStatus } = useAdVisible(insRef);
  const [debug, setDebug] = reactExports.useState(false);
  const native = format === "fluid";
  reactExports.useEffect(() => {
    setDebug(readAdDebugFlag());
  }, []);
  reactExports.useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const request = () => {
      const ins = insRef.current;
      if (!ins || requested.current) return;
      requested.current = true;
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "article",
    {
      ref: cardRef,
      "aria-hidden": !rendered,
      "aria-label": rendered ? "Advertisement" : void 0,
      className: `min-h-px w-full overflow-hidden bg-paper ${rendered ? "border-b border-border" : ""}`,
      children: [
        !native && rendered && /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center gap-2.5 px-3 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-9 w-9 flex-none place-items-center rounded-full bg-secondary text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[13px] font-semibold leading-tight", children: "Sponsored" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: "Advertisement" })
          ] })
        ] }),
        debug && !rendered && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "m-2 rounded border border-dashed border-primary/60 px-3 py-2 text-[11px] leading-snug text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold text-foreground", children: [
            "Ad position",
            ordinal ? ` #${ordinal}` : "",
            " (debug)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "slot ",
            slot,
            " · ",
            format
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "Google: ",
            debugStatus
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: native ? "w-full overflow-hidden" : `w-full overflow-hidden ${rendered ? "px-3 pb-3" : ""}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "ins",
              {
                ref: insRef,
                className: "adsbygoogle block w-full",
                style: { display: "block", minWidth: 250 },
                "data-ad-client": ADSENSE_CLIENT,
                "data-ad-slot": slot,
                "data-ad-format": format,
                ...native ? layoutKey ? { "data-ad-layout-key": layoutKey } : {} : { "data-full-width-responsive": "true" }
              }
            )
          }
        )
      ]
    }
  );
}
const IN_FEED_AD_EVERY = 2;
function adOrdinalAfter(index, total) {
  const position = index + 1;
  if (position % IN_FEED_AD_EVERY !== 0) return null;
  if (index >= total - 1) return null;
  return position / IN_FEED_AD_EVERY;
}
const SCROLL_STORAGE_KEY = "inbits:homeScrollY";
function readSavedWindowScrollY() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
function writeSavedWindowScrollY(value) {
  savedWindowScrollY = value;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, String(value));
  } catch {
  }
}
function AutoRefreshOnDisconnect({
  connected,
  refresh
}) {
  reactExports.useEffect(() => {
    if (connected) return;
    const t = setTimeout(() => refresh(), 4e3);
    return () => clearTimeout(t);
  }, [connected, refresh]);
  return null;
}
function AutoRefreshWhenCaughtUp({
  hasMore,
  refresh
}) {
  reactExports.useEffect(() => {
    if (hasMore) return;
    const interval = setInterval(() => refresh(), 45e3);
    return () => clearInterval(interval);
  }, [hasMore, refresh]);
  return null;
}
let savedWindowScrollY = readSavedWindowScrollY();
function Home() {
  const initialItems = Route$m.useLoaderData();
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
    const lastPostId = getLastPostId();
    return {
      resetOnMount: !lastPostId,
      returnToPostId: lastPostId
    };
  });
  const {
    items,
    hasMore,
    connected,
    showEmptyState,
    loadMore,
    refresh
  } = useLiveFeed({
    category: "All",
    pageSize: 10,
    initialItems,
    // Same reasoning as Updates: on a genuinely fresh mount there's no
    // remembered position to protect, so let the socket's first
    // "initial" message reveal anything scraped between the SSR fetch
    // and the socket connecting the same way a real refresh would,
    // instead of merging it in invisibly above content there's nothing
    // to preserve for.
    treatInitialMergeAsFresh: resetOnMount
  });
  const sentinel = reactExports.useRef(null);
  const feedSectionRef = reactExports.useRef(null);
  const restoredRef = reactExports.useRef(false);
  const restoreMisses = reactExports.useRef(0);
  const MAX_RESTORE_ATTEMPTS = 8;
  reactExports.useLayoutEffect(() => {
    if (!resetOnMount) return;
    window.scrollTo({
      top: 0
    });
    writeSavedWindowScrollY(0);
    restoredRef.current = true;
  }, [resetOnMount]);
  reactExports.useEffect(() => {
    const onScroll = () => {
      writeSavedWindowScrollY(window.scrollY);
    };
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    return () => {
      writeSavedWindowScrollY(window.scrollY);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  const [brokenImageIds, setBrokenImageIds] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const markImageBroken = reactExports.useCallback((id) => {
    setBrokenImageIds((prev) => prev.has(id) ? prev : new Set(prev).add(id));
  }, []);
  const feedPool = reactExports.useMemo(() => excludeSeen(items, "home", 10).filter((item) => hasImage(item) && !brokenImageIds.has(item.id)), [items, brokenImageIds]);
  const reassertRestore = reactExports.useCallback(() => {
    let cancelled = false;
    let userMoved = false;
    const onUserMove = () => {
      userMoved = true;
    };
    window.addEventListener("wheel", onUserMove, {
      passive: true,
      once: true
    });
    window.addEventListener("touchmove", onUserMove, {
      passive: true,
      once: true
    });
    const reapply = () => {
      if (cancelled || userMoved) return;
      if (returnToPostId) {
        const el = document.querySelector(`[data-post-id="${CSS.escape(returnToPostId)}"]`);
        el?.scrollIntoView({
          block: "start"
        });
      } else if (savedWindowScrollY > 0) {
        window.scrollTo({
          top: savedWindowScrollY
        });
      }
    };
    const timers = [120, 400, 1e3].map((ms) => setTimeout(reapply, ms));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("wheel", onUserMove);
      window.removeEventListener("touchmove", onUserMove);
    };
  }, [returnToPostId]);
  reactExports.useLayoutEffect(() => {
    if (restoredRef.current) return;
    if (!returnToPostId) {
      if (savedWindowScrollY > 0 && feedPool.length > 0) {
        window.scrollTo({
          top: savedWindowScrollY
        });
        restoredRef.current = true;
        reassertRestore();
      }
      return;
    }
    const target = document.querySelector(`[data-post-id="${CSS.escape(returnToPostId)}"]`);
    if (target) {
      target.scrollIntoView({
        block: "start"
      });
      restoredRef.current = true;
      reassertRestore();
      return;
    }
    restoreMisses.current += 1;
    const giveUp = !hasMore || restoreMisses.current >= MAX_RESTORE_ATTEMPTS;
    if (giveUp) {
      if (savedWindowScrollY > 0) {
        window.scrollTo({
          top: savedWindowScrollY
        });
      }
      restoredRef.current = true;
      reassertRestore();
      return;
    }
    loadMore();
  }, [feedPool, returnToPostId, hasMore, loadMore, reassertRestore]);
  reactExports.useEffect(() => {
    const root = feedSectionRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setLastPostId(visible.target.getAttribute("data-post-id"));
        }
      },
      // A band through the middle of the viewport, rather than "any
      // overlap": Home's cards are taller than the screen, so plain
      // intersection would often flag two adjacent cards as both
      // "visible" at once. Narrowing to a horizontal strip around the
      // center means only whichever post is actually centered in view
      // counts as "currently reading".
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0
      }
    );
    const cards = root.querySelectorAll("[data-post-id]");
    cards.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [feedPool]);
  const visibleIds = reactExports.useMemo(() => new Set(feedPool.slice(0, 24).map((i) => i.id)), [feedPool]);
  const railPool = reactExports.useMemo(() => {
    const rest = feedPool.filter((i) => !visibleIds.has(i.id));
    return rest.length >= 6 ? rest : items;
  }, [feedPool, items, visibleIds]);
  const showcase = reactExports.useMemo(() => groupShowcaseFromFeed(railPool), [railPool]);
  const journal = reactExports.useMemo(() => groupJournalFromFeed(railPool), [railPool]);
  const channels = reactExports.useMemo(() => groupChannelsFromFeed(railPool), [railPool]);
  const {
    profile
  } = useInterestProfile();
  const language = reactExports.useMemo(() => browserLanguage(), []);
  const recommended = reactExports.useMemo(() => {
    return pickForYou(feedPool, profile, language, visibleIds, 8);
  }, [feedPool, profile, language, visibleIds]);
  reactExports.useEffect(() => {
    if (feedPool.length > 0) markSeen(feedPool.slice(0, 24).map((i) => i.id), "home");
  }, [feedPool]);
  reactExports.useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    }, {
      rootMargin: "600px 0px"
    });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);
  const {
    pullDistance,
    refreshing,
    triggerDistance
  } = usePullToRefresh({
    onRefresh: refresh
  });
  const [showReconnecting, setShowReconnecting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (connected) {
      setShowReconnecting(false);
      return;
    }
    const t = setTimeout(() => setShowReconnecting(true), 2500);
    return () => clearTimeout(t);
  }, [connected]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { aside: /* @__PURE__ */ jsxRuntimeExports.jsx(SuggestionsSidebar, { showcase, channels }), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center overflow-hidden text-[11px] text-muted-foreground transition-[height]", style: {
      height: refreshing ? 40 : Math.min(pullDistance, triggerDistance)
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: `h-4 w-4 ${refreshing || pullDistance >= triggerDistance ? "animate-spin" : ""}` }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref: feedSectionRef, className: "flex flex-col", children: [
      feedPool.length === 0 && showEmptyState && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 py-10 text-center text-sm text-muted-foreground", children: "No stories yet — check back in a moment." }),
      feedPool.flatMap((item, index) => {
        const slot = index % 8;
        const adOrdinal = adOrdinalAfter(index, feedPool.length);
        const nodes = [/* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "post-card-enter", style: {
            "--post-card-delay": `${Math.min(index, 10) * 45}ms`
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(PostCard, { post: item, priority: index === 0, onImageUnavailable: () => markImageBroken(item.id) }) }),
          slot === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(StandsRail, { showcase }),
          slot === 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(JournalRail, { journal }),
          slot === 5 && /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelsRail, { channels }),
          slot === 6 && /* @__PURE__ */ jsxRuntimeExports.jsx(RecommendedRail, { picks: recommended }),
          slot === 7 && /* @__PURE__ */ jsxRuntimeExports.jsx(JobsRail, {})
        ] }, item.id)];
        if (adOrdinal !== null) {
          nodes.push(/* @__PURE__ */ jsxRuntimeExports.jsx(InFeedAd, { ordinal: adOrdinal }, `in-feed-ad-${adOrdinal}`));
        }
        return nodes;
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: sentinel, className: "flex items-center justify-center gap-2 px-4 pb-2 pt-6 text-[11px] text-muted-foreground", children: hasMore && feedPool.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
      "Loading more bits…"
    ] }) : feedPool.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "You're all caught up." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AutoRefreshWhenCaughtUp, { hasMore, refresh })
    ] }) : null }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AutoRefreshOnDisconnect, { connected, refresh })
  ] });
}
export {
  Home as component
};
