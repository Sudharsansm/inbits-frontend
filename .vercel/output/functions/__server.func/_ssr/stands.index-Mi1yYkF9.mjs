import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { A as Route$1, g as groupShowcaseFromFeed, b as groupJournalFromFeed, d as groupChannelsFromFeed, u as useArticleViewer } from "./router-B91z3HGk.mjs";
import { i as isAdSenseConfigured, a as AdSlot, c as useAdFillStatus, A as ADSENSE_CLIENT } from "./AdSlot-Do_We2Bz.mjs";
import { u as useTranslatedById } from "./i18n-CxTQNlYk.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useLiveFeed } from "./useLiveFeed-BwhfFFBV.mjs";
import { N as Newspaper, J as BookOpen, R as Radio, A as ArrowRight, a as EllipsisVertical, n as ArrowLeft } from "../_libs/lucide-react.mjs";
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
const DEFAULT_TRENDING_SLOT = "6413880979";
const TRENDING_FORMAT = "horizontal";
const STORY_DWELL_MS = 4e3;
const AD_DWELL_MS = 8e3;
const AD_NO_FILL_TIMEOUT_MS = 5e3;
const SLIDE_BOX = "h-52 w-full flex-none snap-center overflow-hidden rounded-2xl";
function SponsoredSlide({
  slot,
  active,
  collapsed,
  onStatusChange
}) {
  const insRef = reactExports.useRef(null);
  const requested = reactExports.useRef(false);
  const [armed, setArmed] = reactExports.useState(false);
  const status = useAdFillStatus(insRef, { timeoutMs: AD_NO_FILL_TIMEOUT_MS, armed });
  reactExports.useEffect(() => {
    if (!active || requested.current) return;
    const ins = insRef.current;
    if (!ins) return;
    requested.current = true;
    setArmed(true);
    if (ins.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense push failed", error);
    }
  }, [active]);
  reactExports.useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);
  reactExports.useEffect(() => {
    if (status !== "pending") console.debug(`[TrendingAd] slot ${slot} status: ${status}`);
  }, [status, slot]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "aria-hidden": collapsed,
      "aria-label": collapsed ? void 0 : "Advertisement",
      className: collapsed ? "pointer-events-none absolute inset-x-0 top-0 h-0 overflow-hidden opacity-0" : `relative flex items-center justify-center border border-border bg-card ${SLIDE_BOX}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-3 z-10 inline-flex items-center rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground", children: "Sponsored" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-2 right-3 z-10 text-[10px] uppercase tracking-[0.12em] text-muted-foreground", children: "Advertisement" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center overflow-hidden px-3 pb-6 pt-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "ins",
          {
            ref: insRef,
            className: "adsbygoogle block w-full",
            style: { display: "block", width: "100%" },
            "data-ad-client": ADSENSE_CLIENT,
            "data-ad-slot": slot,
            "data-ad-format": TRENDING_FORMAT,
            ...{}
          }
        ) })
      ]
    }
  );
}
function TrendingCarousel({ items }) {
  const { openArticle } = useArticleViewer();
  const slides = [...items].sort((a, b) => b.readTime - a.readTime).slice(0, 5);
  const titles = useTranslatedById(slides.map((s) => ({ id: s.id, text: s.title })));
  const [adEnabled, setAdEnabled] = reactExports.useState(false);
  const adSlot = DEFAULT_TRENDING_SLOT;
  reactExports.useEffect(() => {
    setAdEnabled(isAdSenseConfigured(adSlot));
  }, [adSlot]);
  const [adStatus, setAdStatus] = reactExports.useState("pending");
  const showAd = adEnabled && slides.length > 0 && adStatus !== "unfilled";
  const slideCount = slides.length + (showAd ? 1 : 0);
  const [i, setI] = reactExports.useState(0);
  const scroller = reactExports.useRef(null);
  const onAdSlide = showAd && i === slides.length;
  reactExports.useEffect(() => {
    if (slideCount > 0 && i >= slideCount) setI(0);
  }, [i, slideCount]);
  reactExports.useEffect(() => {
    if (slideCount < 2) return;
    const t = setTimeout(
      () => setI((p) => (p + 1) % slideCount),
      onAdSlide ? AD_DWELL_MS : STORY_DWELL_MS
    );
    return () => clearTimeout(t);
  }, [slideCount, i, onAdSlide]);
  reactExports.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, [i]);
  if (slides.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pb-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: scroller,
        className: "scrollbar-none relative flex snap-x snap-mandatory overflow-x-auto rounded-2xl",
        children: [
          slides.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => openArticle({
                id: s.id,
                title: titles.get(s.id) ?? s.title,
                source: s.source,
                sourceUrl: s.sourceUrl,
                image: s.image,
                category: s.category
              }),
              className: "relative block w-full flex-none snap-center overflow-hidden rounded-2xl text-left",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.image, alt: "", className: "h-52 w-full object-cover" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 bottom-0 p-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground", children: s.category }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif mt-2 line-clamp-2 text-xl font-bold leading-tight text-white", children: titles.get(s.id) ?? s.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate text-xs text-white/80", children: [
                    s.source,
                    " · ",
                    s.readTime,
                    " min read"
                  ] }) })
                ] })
              ]
            },
            s.id
          )),
          adEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx(
            SponsoredSlide,
            {
              slot: adSlot,
              active: onAdSlide,
              collapsed: adStatus === "unfilled",
              onStatusChange: setAdStatus
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2.5 flex justify-center gap-1.5", children: [
      slides.map((s, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          "aria-label": `Go to slide ${idx + 1}`,
          onClick: () => setI(idx),
          className: `h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-primary" : "w-1.5 bg-border"}`
        },
        s.id
      )),
      showAd && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          "aria-label": "Go to sponsored slide",
          onClick: () => setI(slides.length),
          className: `h-1.5 rounded-full transition-all ${i === slides.length ? "w-5 bg-primary" : "w-1.5 bg-border"}`
        }
      )
    ] })
  ] });
}
function StandsTab({
  showcase,
  journal,
  onOpenJournalCategory
}) {
  const { openArticle } = useArticleViewer();
  const titles = useTranslatedById(
    showcase.flatMap((panel) => panel.stories.map((s) => ({ id: s.id, text: s.title })))
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "pt-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-xl font-bold leading-tight", children: "News Showcase" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Live, grouped by publisher" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/stands/showcase",
          "aria-label": "More showcase panels",
          className: "mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "scrollbar-none -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pl-[50px] pr-[50px] pb-2", children: [
      showcase.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 py-6 text-xs text-muted-foreground", children: "Fetching the latest stories…" }),
      showcase.map((panel, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "article",
          {
            className: "w-full max-w-[340px] flex-none snap-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 truncate font-serif text-base font-black uppercase tracking-tight", children: panel.publisher }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-ink px-4 py-2.5 text-sm font-semibold text-paper", children: panel.banner }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "px-4", children: panel.stories.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: i > 0 ? "border-t border-border" : "", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
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
          }
        ),
        idx === 1 && showcase.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          AdSlot,
          {
            slot: "8888835229",
            label: "Sponsored",
            format: "auto",
            className: "w-full max-w-[340px] flex-none snap-center"
          }
        )
      ] }, panel.id))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "pt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-lg font-bold", children: "Recommended playlists" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] uppercase tracking-[0.14em] text-primary", children: "Trending" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scrollbar-none mt-3 flex gap-3 overflow-x-auto pb-2", children: journal.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => onOpenJournalCategory(c.id),
          className: "w-44 flex-none text-left",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: c.cover, alt: "", loading: "lazy", className: "h-44 w-full object-cover" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] font-semibold text-white", children: c.title })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
              c.articles.length,
              " stories"
            ] })
          ]
        },
        c.id
      )) })
    ] })
  ] });
}
function JournalTab({
  categories,
  openCategory,
  onOpenCategory,
  onCloseCategory
}) {
  const { openArticle } = useArticleViewer();
  const openArticles = openCategory?.articles ?? [];
  const titles = useTranslatedById(openArticles.map((a) => ({ id: a.id, text: a.title })));
  const summaries = useTranslatedById(openArticles.map((a) => ({ id: a.id, text: a.summary })));
  if (openCategory) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: onCloseCategory,
          className: "flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            " All categories"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-3 overflow-hidden rounded-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: openCategory.cover, alt: "", className: "h-32 w-full object-cover" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 bottom-0 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground", children: [
            openCategory.articles.length,
            " stories"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif mt-2 text-2xl font-bold leading-tight text-white", children: openCategory.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 line-clamp-1 text-xs text-white/80", children: openCategory.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 space-y-3", children: openCategory.articles.map((a, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
        idx > 0 && idx % 5 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "1589034906" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => openArticle({
              id: a.id,
              title: titles.get(a.id) ?? a.title,
              source: a.source,
              sourceUrl: a.sourceUrl ?? "",
              image: a.image,
              excerpt: summaries.get(a.id) ?? a.summary,
              readTime: a.readTime
            }),
            className: "flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:bg-secondary",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-bold uppercase tracking-[0.12em] text-primary", children: a.source }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif mt-1 line-clamp-2 text-base font-bold leading-snug", children: titles.get(a.id) ?? a.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: summaries.get(a.id) ?? a.summary }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    suppressHydrationWarning: true,
                    className: "mt-1.5 text-[11px] text-muted-foreground",
                    children: `${a.publishedAt} · ${a.readTime} min read`
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: a.image,
                  alt: "",
                  loading: "lazy",
                  className: "h-20 w-20 flex-none rounded-xl object-cover"
                }
              )
            ]
          }
        )
      ] }, a.id)) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "pt-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-xl font-bold", children: "Journal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Live news, grouped by category" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] uppercase tracking-[0.14em] text-primary", children: [
        categories.length,
        " categories"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [
      categories.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "col-span-2 py-6 text-center text-xs text-muted-foreground", children: "Fetching the latest stories…" }),
      categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "article",
        {
          onClick: () => onOpenCategory(c.id),
          className: "group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-[4/5]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: c.cover,
                  alt: "",
                  className: "h-full w-full object-cover transition duration-500 group-hover:scale-105"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-3 top-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink", children: [
                c.articles.length,
                " stories"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 bottom-0 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-lg font-bold leading-tight text-white", children: c.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 line-clamp-2 text-xs text-white/80", children: c.description })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-primary", children: "Read playlist" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  "aria-label": `Open ${c.title}`,
                  className: "flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3.5 w-3.5" })
                }
              )
            ] })
          ]
        },
        c.id
      ))
    ] })
  ] });
}
function ChannelsTab({ channels }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "pt-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-xl font-bold", children: "Channels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Every publisher live right now" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] uppercase tracking-[0.14em] text-primary", children: [
        channels.length,
        " channels"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-3", children: [
      channels.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-6 text-center text-xs text-muted-foreground", children: "Fetching the latest stories…" }),
      channels.map((c, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        idx > 0 && idx % 5 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "8888835229" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/channel/$slug",
            params: { slug: c.slug },
            className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/40",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: c.cover,
                  alt: "",
                  loading: "lazy",
                  className: "h-16 w-16 flex-none rounded-xl object-cover"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "serif text-base font-bold leading-snug", children: c.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 line-clamp-2 text-xs text-muted-foreground", children: c.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] font-semibold text-primary", children: [
                  c.stories.length,
                  " stories"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 flex-none text-muted-foreground" })
            ]
          }
        )
      ] }, c.slug))
    ] })
  ] });
}
const TABS = [{
  k: "stands",
  label: "Stands",
  icon: Newspaper
}, {
  k: "journal",
  label: "Journal",
  icon: BookOpen
}, {
  k: "channels",
  label: "Channels",
  icon: Radio
}];
function Stands() {
  const {
    tab: tabParam,
    cat
  } = Route$1.useSearch();
  const [tab, setTab] = reactExports.useState(tabParam ?? "stands");
  const [openId, setOpenId] = reactExports.useState(cat ?? null);
  const {
    items
  } = useLiveFeed({
    category: "All",
    pageSize: 50
  });
  const showcase = reactExports.useMemo(() => groupShowcaseFromFeed(items), [items]);
  const journal = reactExports.useMemo(() => groupJournalFromFeed(items), [items]);
  const channels = reactExports.useMemo(() => groupChannelsFromFeed(items), [items]);
  reactExports.useEffect(() => {
    if (tabParam) setTab(tabParam);
    setOpenId(cat ?? null);
  }, [tabParam, cat]);
  const openCategory = journal.find((c) => c.id === openId) ?? null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: "Stands", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingCarousel, { items }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex rounded-full bg-secondary p-1 text-xs font-semibold", children: TABS.map(({
      k,
      label,
      icon: Icon
    }) => {
      const on = tab === k;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setTab(k), className: `flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 transition ${on ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" }),
        " ",
        label
      ] }, k);
    }) }),
    tab === "stands" && /* @__PURE__ */ jsxRuntimeExports.jsx(StandsTab, { showcase, journal, onOpenJournalCategory: (id) => {
      setOpenId(id);
      setTab("journal");
    } }),
    tab === "journal" && /* @__PURE__ */ jsxRuntimeExports.jsx(JournalTab, { categories: journal, openCategory, onOpenCategory: (id) => setOpenId(id), onCloseCategory: () => setOpenId(null) }),
    tab === "channels" && /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelsTab, { channels })
  ] }) });
}
export {
  Stands as component
};
