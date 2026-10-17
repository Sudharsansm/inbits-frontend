import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { M as MenuPage } from "./MenuPage-BkNHMhgc.mjs";
import { a as useSavedPosts, u as useArticleViewer, h as useToggleSet, o as fetchArticle, p as fetchJob } from "./router-B91z3HGk.mjs";
import { u as useTranslatedById } from "./i18n-CxTQNlYk.mjs";
import { B as Bookmark, x as BookmarkCheck, g as Briefcase } from "../_libs/lucide-react.mjs";
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
import "./AppShell-CCzBClNT.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
function SavedPage() {
  const {
    savedIds,
    has,
    toggleSave
  } = useSavedPosts();
  const {
    openArticle
  } = useArticleViewer();
  const [posts, setPosts] = reactExports.useState([]);
  const [missingCount, setMissingCount] = reactExports.useState(0);
  const titles = useTranslatedById(posts.map((p) => ({
    id: p.id,
    text: p.title
  })));
  const {
    list: savedJobIds,
    has: hasJob,
    toggle: toggleJob
  } = useToggleSet("savedJobs");
  const [jobs, setJobs] = reactExports.useState([]);
  const [missingJobCount, setMissingJobCount] = reactExports.useState(0);
  reactExports.useEffect(() => {
    let cancelled = false;
    Promise.all(savedIds.map((id) => fetchArticle(id))).then((results) => {
      if (cancelled) return;
      setPosts(results.filter((p) => p !== null));
      setMissingCount(results.filter((p) => p === null).length);
    });
    return () => {
      cancelled = true;
    };
  }, [savedIds]);
  reactExports.useEffect(() => {
    let cancelled = false;
    Promise.all(savedJobIds.map((id) => fetchJob(id))).then((results) => {
      if (cancelled) return;
      setJobs(results.filter((j) => j !== null));
      setMissingJobCount(results.filter((j) => j === null).length);
    });
    return () => {
      cancelled = true;
    };
  }, [savedJobIds]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MenuPage, { title: "Saved", subtitle: `${savedIds.length} stories · ${savedJobIds.length} jobs bookmarked`, children: [
    savedIds.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "mx-auto h-6 w-6 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Nothing saved yet. Tap the bookmark on any story." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-3 inline-block rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground", children: "Browse the feed" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: posts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3 rounded-2xl border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openArticle(p), className: "min-w-0 flex-1 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.16em] text-primary", children: p.category }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "serif mt-1 text-sm font-bold leading-snug", children: titles.get(p.id) ?? p.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
            p.source,
            " · ",
            p.readTime,
            " min read"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.image, alt: "", loading: "lazy", className: "h-16 w-16 shrink-0 rounded-xl object-cover" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": has(p.id) ? "Remove bookmark" : "Save story", onClick: () => toggleSave(p.id), className: "self-start rounded-full p-1.5 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookmarkCheck, { className: "h-4 w-4 text-primary" }) })
      ] }, p.id)) }),
      missingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[11px] text-muted-foreground", children: [
        missingCount,
        " saved ",
        missingCount === 1 ? "story has" : "stories have",
        " rolled out of the live buffer and can't be shown anymore."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-sm font-bold", children: "Saved jobs" })
    ] }),
    savedJobIds.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-2xl border border-border bg-card p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "mx-auto h-6 w-6 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No jobs saved yet. Tap save on any listing." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jobs", className: "mt-3 inline-block rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground", children: "Browse jobs" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-3", children: jobs.map((j) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3 rounded-2xl border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/job/$id", params: {
          id: j.id
        }, className: "flex min-w-0 flex-1 items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-lg bg-secondary text-xs font-bold text-secondary-foreground", children: j.logoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: j.logoUrl, alt: "", loading: "lazy", className: "h-full w-full object-cover" }) : j.logo }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "serif text-sm font-bold leading-snug", children: j.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 text-[11px] text-muted-foreground", children: [
              j.company,
              " · ",
              j.location
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": hasJob(j.id) ? "Remove from saved jobs" : "Save job", onClick: () => toggleJob(j.id), className: "self-start rounded-full p-1.5 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookmarkCheck, { className: "h-4 w-4 text-primary" }) })
      ] }, j.id)) }),
      missingJobCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[11px] text-muted-foreground", children: [
        missingJobCount,
        " saved ",
        missingJobCount === 1 ? "job has" : "jobs have",
        " since closed or been removed."
      ] })
    ] })
  ] });
}
export {
  SavedPage as component
};
