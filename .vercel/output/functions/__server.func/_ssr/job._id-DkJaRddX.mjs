import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { R as RelativeTime } from "./RelativeTime-6LiQ26XO.mjs";
import { n as Route$e, h as useToggleSet } from "./router-B91z3HGk.mjs";
import { C as CompanyLogo } from "./CompanyLogo-CJNU1DHt.mjs";
import { a as AdSlot } from "./AdSlot-Do_We2Bz.mjs";
import { n as ArrowLeft, p as MapPin, g as Briefcase, q as DollarSign, B as Bookmark } from "../_libs/lucide-react.mjs";
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
function JobPage() {
  const {
    job
  } = Route$e.useLoaderData();
  const {
    has,
    toggle
  } = useToggleSet("savedJobs");
  const saved = has(job.id);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: "Jobs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "px-4 pt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/jobs", className: "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
      " Back to jobs"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyLogo, { logoUrl: job.logoUrl, initials: job.logo, size: "h-14 w-14", textSize: "text-sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "serif text-xl font-black leading-tight", children: job.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          job.company,
          " · ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(RelativeTime, { iso: job.posted })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5" }),
        " ",
        job.location
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "h-3.5 w-3.5" }),
        " ",
        job.type,
        " · ",
        job.workplaceType
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-3.5 w-3.5" }),
        " ",
        job.salary
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: job.tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground", children: tag }, tag)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: job.applyUrl, target: "_blank", rel: "noreferrer noopener", className: "flex-1 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground", children: "Apply now" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggle(job.id), "aria-label": saved ? "Unsave job" : "Save job", className: "rounded-full border border-border p-2.5 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: `h-5 w-5 ${saved ? "fill-ink text-ink" : ""}` }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8 space-y-6 text-sm leading-relaxed text-foreground/85", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-lg font-bold text-foreground", children: "About the role" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2", children: job.about })
      ] }),
      job.responsibilities.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-lg font-bold text-foreground", children: "What the role involves" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 list-disc space-y-1 pl-5", children: job.responsibilities.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: r }, r)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-lg font-bold text-foreground", children: "Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 list-disc space-y-1 pl-5", children: job.perks.filter(Boolean).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: r }, r)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "4019651928", label: "Sponsored" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-10 text-center text-[11px] text-muted-foreground", children: "— End of listing —" })
  ] }) });
}
export {
  JobPage as component
};
