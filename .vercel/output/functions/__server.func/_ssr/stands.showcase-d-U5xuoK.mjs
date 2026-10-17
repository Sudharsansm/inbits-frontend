import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { C as Route, u as useArticleViewer } from "./router-B91z3HGk.mjs";
import { u as useTranslatedById } from "./i18n-CxTQNlYk.mjs";
import { a as AdSlot } from "./AdSlot-Do_We2Bz.mjs";
import { n as ArrowLeft, a as EllipsisVertical } from "../_libs/lucide-react.mjs";
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
function ShowcasePage() {
  const {
    showcase
  } = Route.useLoaderData();
  const {
    openArticle
  } = useArticleViewer();
  const titles = useTranslatedById(showcase.flatMap((panel) => panel.stories.map((s) => ({
    id: s.id,
    text: s.title
  }))));
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: "News Showcase", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/stands", className: "mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Back to Stands"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "serif text-2xl font-bold leading-tight", children: "News Showcase" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Live, grouped by publisher" })
    ] }),
    showcase.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-10 text-center text-sm text-muted-foreground", children: "Fetching the latest stories…" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 pb-6", children: showcase.map((panel, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      idx > 0 && idx % 4 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "1589034906", label: "Sponsored" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "overflow-hidden rounded-2xl border border-border bg-card shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 truncate font-serif text-base font-black uppercase tracking-tight", children: panel.publisher }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-ink px-4 py-2.5 text-sm font-semibold text-paper", children: panel.banner }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "px-4", children: panel.stories.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: i > 0 ? "border-t border-border" : "", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openArticle({
          id: s.id,
          title: titles.get(s.id) ?? s.title,
          source: panel.publisher,
          sourceUrl: s.sourceUrl ?? "",
          image: s.image,
          category: s.kicker
        }), className: "flex w-full items-start gap-3 py-3.5 text-left transition hover:opacity-80", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: s.kicker }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 line-clamp-2 text-sm font-semibold leading-snug", children: titles.get(s.id) ?? s.title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.image, alt: "", loading: "lazy", className: "h-16 w-20 flex-none rounded-lg object-cover" })
        ] }) }, s.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 pb-3 pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { suppressHydrationWarning: true, className: "text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground", children: `Showcase · ${panel.updated}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": "More options", className: "rounded-full p-1 text-muted-foreground hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-4 w-4" }) })
        ] })
      ] })
    ] }, panel.id)) })
  ] }) });
}
export {
  ShowcasePage as component
};
