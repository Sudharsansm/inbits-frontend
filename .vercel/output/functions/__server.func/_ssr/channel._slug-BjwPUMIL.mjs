import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { m as Route$f, u as useArticleViewer } from "./router-B91z3HGk.mjs";
import { C as ChannelAvatar } from "./ChannelAvatar-B0BqpXrc.mjs";
import { s as sourceOriginLabel } from "./sourceOrigin-B3ooOyf2.mjs";
import { a as AdSlot } from "./AdSlot-Do_We2Bz.mjs";
import { u as useTranslatedById } from "./i18n-CxTQNlYk.mjs";
import { n as ArrowLeft, o as Headphones } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
function ChannelPage() {
  const {
    channel
  } = Route$f.useLoaderData();
  const {
    openArticle
  } = useArticleViewer();
  const titles = useTranslatedById(channel.stories.map((s) => ({
    id: s.id,
    text: s.title
  })));
  const summaries = useTranslatedById(channel.stories.map((s) => ({
    id: s.id,
    text: s.summary
  })));
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: channel.name, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/stands", className: "flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
      " All channels"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-3 overflow-hidden rounded-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: channel.cover, alt: "", className: "h-36 w-full object-cover" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 bottom-0 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Headphones, { className: "h-3 w-3" }),
          " Channel"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelAvatar, { source: channel.name, sampleUrl: channel.stories[0]?.sourceUrl, className: "h-10 w-10 ring-2 ring-white/80" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "serif text-2xl font-bold leading-tight text-white", children: channel.name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs text-white/80", children: channel.description }),
        sourceOriginLabel(channel.location, channel.language) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] font-semibold text-white/90", children: sourceOriginLabel(channel.location, channel.language) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-lg font-bold", children: "Latest stories" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] uppercase tracking-[0.14em] text-primary", children: [
        channel.stories.length,
        " stories"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-3", children: channel.stories.map((s, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
      idx > 0 && idx % 5 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "2373352164" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openArticle({
        id: s.id,
        title: titles.get(s.id) ?? s.title,
        source: channel.name,
        sourceUrl: s.sourceUrl ?? "",
        image: s.image,
        excerpt: summaries.get(s.id) ?? s.summary,
        category: s.category,
        readTime: s.readTime
      }), className: "flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:bg-secondary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-bold uppercase tracking-[0.12em] text-primary", children: s.category }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif mt-1 line-clamp-2 text-base font-bold leading-snug", children: titles.get(s.id) ?? s.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: summaries.get(s.id) ?? s.summary }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { suppressHydrationWarning: true, className: "mt-1.5 text-[11px] text-muted-foreground", children: `${s.publishedAt} · ${s.readTime} min read` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.image, alt: "", loading: "lazy", className: "h-20 w-20 flex-none rounded-xl object-cover" })
      ] })
    ] }, s.id)) })
  ] }) });
}
export {
  ChannelPage as component
};
