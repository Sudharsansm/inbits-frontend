import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useRouter } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { t as Route$2, v as getArticle, o as fetchArticle, w as fetchFeed, x as setArticle, y as articleCache, a as useSavedPosts, u as useArticleViewer } from "./router-B91z3HGk.mjs";
import { R as RelativeTime } from "./RelativeTime-6LiQ26XO.mjs";
import { s as sourceOriginLabel } from "./sourceOrigin-B3ooOyf2.mjs";
import { a as useTranslated } from "./i18n-CxTQNlYk.mjs";
import { A as ArticleSkeleton } from "./FeedSkeleton-BzAq4P7Z.mjs";
import { a as AdSlot } from "./AdSlot-Do_We2Bz.mjs";
import { n as ArrowLeft, y as Clock, H as Heart, B as Bookmark, E as ExternalLink, T as Twitter, z as Facebook, l as Check, k as Link2, d as Share2 } from "../_libs/lucide-react.mjs";
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
function ShareButton({
  children,
  onClick,
  label
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      onClick,
      "aria-label": label,
      className: "grid h-9 w-9 place-items-center rounded-full border border-border bg-paper hover:bg-secondary",
      children
    }
  );
}
function PostPage() {
  const {
    id
  } = Route$2.useParams();
  const router = useRouter();
  const [data, setData] = reactExports.useState(() => getArticle(id) ?? null);
  const [notFound, setNotFound] = reactExports.useState(false);
  const [errored, setErrored] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setNotFound(false);
    setErrored(false);
    const seeded = getArticle(id);
    setData(seeded ?? null);
    if (seeded?.complete) return;
    let cancelled = false;
    Promise.all([fetchArticle(id), fetchFeed("All").catch(() => ({
      items: [],
      total: 0
    }))]).then(([post, feedSnapshot]) => {
      if (cancelled) return;
      if (!post) {
        if (!seeded) {
          setNotFound(true);
        }
        return;
      }
      const related = feedSnapshot.items.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3);
      const result = {
        post,
        related,
        complete: true
      };
      setArticle(id, result);
      setData(result);
    }).catch(() => {
      if (!cancelled && !seeded) {
        setErrored(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  reactExports.useEffect(() => {
    if (data) {
      document.title = `${data.post.title} · InBits`;
    }
  }, [data]);
  if (notFound) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: "Not found", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "serif text-2xl font-bold", children: "Story not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "It may have scrolled out of the live buffer, been moved, or unpublished." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => window.history.back(), className: "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
        "Back"
      ] })
    ] }) });
  }
  if (errored) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: "Error", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "serif text-2xl font-bold", children: "Something broke" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
        articleCache.delete(id);
        setErrored(false);
        router.invalidate();
      }, className: "mt-6 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground", children: "Try again" })
    ] }) });
  }
  if (!data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ArticleSkeleton, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PostArticle, { post: data.post, related: data.related });
}
function PostArticle({
  post,
  related
}) {
  const [progress, setProgress] = reactExports.useState(0);
  const {
    has,
    toggleSave
  } = useSavedPosts();
  const {
    openArticle
  } = useArticleViewer();
  const saved = has(post.id);
  const [liked, setLiked] = reactExports.useState(false);
  const [copied, setCopied] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, h.scrollTop / max * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [post.id]);
  const MAX_TEASER_PARAGRAPHS = 3;
  const bodyParagraphs = (post.content || post.excerpt).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, MAX_TEASER_PARAGRAPHS);
  const isFullArticleMissing = !post.content || post.content.trim() === post.excerpt.trim();
  const [translatedTitle, translatedExcerpt, ...translatedParagraphs] = useTranslated([post.title, post.excerpt, ...bodyParagraphs]);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(post.title);
  const share = async (kind) => {
    if (kind === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer");
    } else if (kind === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer");
    } else if (kind === "copy") {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1600);
      } catch (err) {
        console.error("Copy link failed:", err);
      }
    } else if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Native share failed:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1600);
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-[60px] z-20 h-1 bg-border/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary transition-[width] duration-150", style: {
      width: `${progress}%`
    } }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "px-5 pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => window.history.back(), className: "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
        "Back"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.category }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          "· ",
          post.source,
          " ·",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(RelativeTime, { iso: post.publishedAt }),
          sourceOriginLabel(post.location, post.language) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            " ",
            "·",
            " ",
            sourceOriginLabel(post.location, post.language)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "serif mt-3 max-w-3xl text-base font-medium leading-7 text-foreground/75", children: translatedTitle }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "serif mt-3 text-base leading-relaxed text-foreground/75", children: translatedExcerpt }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between border-y border-border py-3 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 place-items-center rounded-full bg-secondary serif font-bold text-ink", children: post.author.charAt(0) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: post.author }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
              post.readTime,
              " min read"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setLiked((v) => !v), "aria-label": "Like", "aria-pressed": liked, className: "rounded-full p-2 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: `h-4 w-4 ${liked ? "fill-primary text-primary" : ""}` }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => toggleSave(post.id), "aria-label": "Save", "aria-pressed": saved, className: "rounded-full p-2 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: `h-4 w-4 ${saved ? "fill-primary text-primary" : ""}` }) })
        ] })
      ] }),
      post.image && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.image, alt: translatedTitle, className: "mt-6 h-auto max-h-[520px] w-full rounded-2xl object-cover", loading: "eager" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "serif mt-6 max-w-3xl space-y-6 text-justify text-[17px] leading-8 tracking-[0.005em] text-foreground/90 sm:text-[18px]", children: [
          translatedParagraphs.map((para, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.85] first-letter:text-primary" : void 0, children: para }),
            i === 0 && translatedParagraphs.length >= 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "4019651928", label: "Sponsored", className: "not-italic" })
          ] }, i)),
          isFullArticleMissing && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm not-italic text-muted-foreground", children: [
            "(",
            post.source,
            " didn't publish more than this — that's the complete story as released.)"
          ] })
        ] }),
        !isFullArticleMissing && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" })
      ] }),
      post.sourceUrl && !isFullArticleMissing && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: post.sourceUrl, target: "_blank", rel: "noreferrer noopener", className: "mt-2 flex items-center justify-between gap-2 rounded-xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Read the full story on ",
          post.source
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-5 w-5 flex-none" })
      ] }),
      post.sourceUrl && isFullArticleMissing && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: post.sourceUrl, target: "_blank", rel: "noreferrer noopener", className: "mt-6 flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "View original on ",
          post.source
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4 flex-none" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "4019651928", label: "Sponsored" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 rounded-2xl border border-border bg-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-[0.16em] text-muted-foreground", children: "Share this story" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "serif mt-1 text-sm font-semibold", children: "Pass it on" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShareButton, { onClick: () => share("twitter"), label: "Twitter", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Twitter, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShareButton, { onClick: () => share("facebook"), label: "Facebook", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Facebook, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShareButton, { onClick: () => share("copy"), label: "Copy link", children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-primary" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShareButton, { onClick: () => share("native"), label: "Share", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" }) })
        ] })
      ] }) }),
      related.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-lg font-bold", children: "Related stories" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-3", children: related.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => openArticle(p), className: "flex w-full items-start gap-3 rounded-xl bg-card p-3 text-left transition hover:bg-secondary", children: [
          p.image && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.image, alt: "", className: "h-20 w-20 flex-none rounded-lg object-cover", loading: "lazy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.16em] text-primary", children: p.category }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "serif line-clamp-2 font-semibold leading-snug", children: p.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
              p.source,
              " · ",
              p.readTime,
              " min"
            ] })
          ] })
        ] }) }, p.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-10 text-center text-[11px] text-muted-foreground", children: "— End of story —" })
    ] })
  ] });
}
export {
  PostPage as component
};
