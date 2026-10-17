import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { M as MenuPage } from "./MenuPage-BkNHMhgc.mjs";
import { q as Route$4, h as useToggleSet } from "./router-B91z3HGk.mjs";
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
import "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
function SourcesPage() {
  const {
    channels
  } = Route$4.useLoaderData();
  const [q, setQ] = reactExports.useState("");
  const {
    list,
    has,
    toggle
  } = useToggleSet("sources.followed", channels.map((c) => c.slug));
  const shown = channels.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MenuPage, { title: "Sources", subtitle: `${list.length} of ${channels.length} publishers followed`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search publishers", className: "mb-3 w-full rounded-full border border-border bg-card px-4 py-2 text-sm" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2", children: [
      shown.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: c.cover, alt: "", loading: "lazy", className: "h-10 w-10 rounded-full object-cover" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/channel/$slug", params: {
          slug: c.slug
        }, className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: c.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[11px] text-muted-foreground", children: c.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggle(c.slug), className: `rounded-full px-3 py-1.5 text-xs font-semibold transition ${has(c.slug) ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`, children: has(c.slug) ? "Following" : "Follow" })
      ] }, c.slug)),
      shown.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground", children: [
        "No publishers match “",
        q,
        "”."
      ] })
    ] })
  ] });
}
export {
  SourcesPage as component
};
