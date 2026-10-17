import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { s as searchArticles, u as useArticleViewer } from "./router-B91z3HGk.mjs";
import { u as useLiveFeed } from "./useLiveFeed-BwhfFFBV.mjs";
import { e as excludeSeen, m as markSeen } from "./seenArticles-K7DuCxq4.mjs";
import { R as RelativeTime } from "./RelativeTime-6LiQ26XO.mjs";
import { a as useTranslated } from "./i18n-CxTQNlYk.mjs";
import { D as DiscoverGridSkeleton } from "./FeedSkeleton-BzAq4P7Z.mjs";
import { a as AdSlot } from "./AdSlot-Do_We2Bz.mjs";
import { h as Search, L as LoaderCircle, X } from "../_libs/lucide-react.mjs";
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
const tags = ["Trending", "Tech", "Politics", "Food", "Travel", "Markets", "Sports", "Film", "Climate"];
const searchCache = {
  q: "",
  results: []
};
function SearchPage() {
  const {
    items: liveItems,
    showEmptyState
  } = useLiveFeed({
    category: "All",
    cacheKey: "search-discover"
  });
  const discover = reactExports.useMemo(() => excludeSeen(liveItems, "search", 8), [liveItems]);
  reactExports.useEffect(() => {
    if (discover.length > 0) markSeen(discover.slice(0, 20).map((i) => i.id), "search");
  }, [discover]);
  const [q, setQ] = reactExports.useState(searchCache.q);
  const [debouncedQ, setDebouncedQ] = reactExports.useState(searchCache.q);
  const [results, setResults] = reactExports.useState(searchCache.results);
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);
  reactExports.useEffect(() => {
    searchCache.q = q;
  }, [q]);
  reactExports.useEffect(() => {
    if (!debouncedQ) {
      setResults([]);
      searchCache.results = [];
      return;
    }
    if (debouncedQ === searchCache.q && searchCache.results.length > 0 && results === searchCache.results) {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    searchArticles(debouncedQ, controller.signal).then(({
      items
    }) => {
      setResults(items);
      searchCache.results = items;
    }).catch(() => {
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedQ]);
  const isSearching = q.trim().length > 0;
  const showLoading = loading && debouncedQ === q.trim();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { title: "Search", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-[60px] z-20 bg-paper/90 px-4 py-3 backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search live news, hosts, jobs…", className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" }),
        loading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" }),
        q && !loading && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setQ(""), className: "text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scrollbar-none mt-3 flex gap-2 overflow-x-auto", children: tags.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setQ(t), className: "flex-none rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary", children: [
        "#",
        t
      ] }, t)) })
    ] }),
    isSearching ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-1", children: [
      showLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "pb-2 text-xs text-muted-foreground", children: "Searching…" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "pb-2 text-xs text-muted-foreground", children: results.length > 0 ? `${results.length} result${results.length === 1 ? "" : "s"} for “${debouncedQ}”` : `No stories found for “${debouncedQ}”` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3 pb-6", children: results.map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
        idx > 0 && idx % 6 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "9759063760" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SearchResultRow, { item })
      ] }, item.id)) })
    ] }) : (
      /* Live discover grid — default browse view when there's no query.
         Same live buffer as everywhere else, just laid out Pinterest-style. */
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "columns-2 gap-2 px-3 [column-fill:_balance]", children: discover.length === 0 && !showEmptyState ? /* @__PURE__ */ jsxRuntimeExports.jsx(DiscoverGridSkeleton, {}) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        discover.map((s, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
          idx > 0 && idx % 7 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "6051024090", className: "[column-span:all]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DiscoverCard, { item: s })
        ] }, s.id)),
        discover.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "col-span-2 py-10 text-center text-sm text-muted-foreground", children: "Nothing live yet — check back in a moment." })
      ] }) })
    )
  ] });
}
function SearchResultRow({
  item
}) {
  const [title, excerpt] = useTranslated([item.title, item.excerpt]);
  const {
    openArticle
  } = useArticleViewer();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openArticle(item), className: "flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:bg-secondary", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] font-bold uppercase tracking-[0.12em] text-primary", children: [
        item.category,
        " · ",
        item.source
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif mt-1 line-clamp-2 text-base font-bold leading-snug", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: excerpt }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 text-[11px] text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RelativeTime, { iso: item.publishedAt }),
        " · ",
        item.readTime,
        " min read"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.image, alt: "", loading: "lazy", className: "h-20 w-20 flex-none rounded-xl object-cover" })
  ] }) });
}
function DiscoverCard({
  item
}) {
  const [title] = useTranslated([item.title]);
  const {
    openArticle
  } = useArticleViewer();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openArticle(item), className: "mb-2 block w-full break-inside-avoid overflow-hidden rounded-xl bg-card text-left", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.image, alt: title, className: "w-full object-cover", loading: "lazy" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-2 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.12em] text-primary", children: item.category }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "serif line-clamp-2 text-xs font-semibold leading-snug", children: title })
    ] })
  ] });
}
export {
  SearchPage as component
};
