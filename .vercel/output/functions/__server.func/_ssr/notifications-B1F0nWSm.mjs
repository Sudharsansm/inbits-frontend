import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { R as RelativeTime } from "./RelativeTime-6LiQ26XO.mjs";
import { u as useTranslatedById } from "./i18n-CxTQNlYk.mjs";
import { i as isAdSenseConfigured, b as useAdUnit, C as COLLAPSED_CLASS, A as ADSENSE_CLIENT } from "./AdSlot-Do_We2Bz.mjs";
import { i as Route$k } from "./router-B91z3HGk.mjs";
import { N as Newspaper, g as Briefcase, M as Megaphone } from "../_libs/lucide-react.mjs";
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
function NotificationAd({ slot = "6413880979" }) {
  const [enabled, setEnabled] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setEnabled(isAdSenseConfigured(slot));
  }, [slot]);
  if (!enabled) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationAdUnit, { slot });
}
function NotificationAdUnit({ slot }) {
  const { cardRef, insRef, status, filled, collapsedStyle } = useAdUnit();
  reactExports.useEffect(() => {
    if (status !== "pending") console.debug(`[NotificationAd] slot ${slot} status: ${status}`);
  }, [status, slot]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "li",
    {
      ref: cardRef,
      "aria-hidden": !filled,
      "aria-label": filled ? "Advertisement" : void 0,
      style: filled ? void 0 : collapsedStyle,
      className: filled ? "py-4" : `${COLLAPSED_CLASS} border-0`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-3.5 w-3.5" }),
            "Sponsored"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal", children: "Advertisement" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-hidden rounded-lg bg-secondary/30 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "ins",
          {
            ref: insRef,
            className: "adsbygoogle block w-full",
            style: { display: "block" },
            "data-ad-client": ADSENSE_CLIENT,
            "data-ad-slot": slot,
            "data-ad-format": "horizontal"
          }
        ) })
      ]
    }
  );
}
const tabs = ["All", "Updates", "Jobs"];
function NotificationsPage() {
  const {
    articles,
    jobs
  } = Route$k.useLoaderData();
  const [active, setActive] = reactExports.useState("All");
  const titles = useTranslatedById(articles.map((a) => ({
    id: a.id,
    text: a.title
  })));
  const items = [...articles.map((a) => ({
    kind: "update",
    id: a.id,
    time: a.publishedAt,
    icon: Newspaper,
    text: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: a.source }),
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-foreground/80", children: [
        "published “",
        titles.get(a.id) ?? a.title,
        "”"
      ] })
    ] }),
    link: {
      to: "/post/$id",
      params: {
        id: a.id
      }
    }
  })), ...jobs.map((j) => ({
    kind: "job",
    id: j.id,
    time: j.posted,
    icon: Briefcase,
    text: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: j.company }),
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-foreground/80", children: [
        "is hiring for “",
        j.title,
        "”"
      ] })
    ] }),
    link: {
      to: "/job/$id",
      params: {
        id: j.id
      }
    }
  }))].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const filtered = items.filter((n) => {
    if (active === "All") return true;
    if (active === "Updates") return n.kind === "update";
    if (active === "Jobs") return n.kind === "job";
    return true;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { title: "Notifications", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scrollbar-none sticky top-[60px] z-20 flex gap-2 overflow-x-auto bg-paper/90 px-4 py-3 backdrop-blur", children: tabs.map((t) => {
      const on = t === active;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActive(t), className: `flex-none rounded-full border px-3 py-1 text-xs font-medium transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`, children: t }, t);
    }) }),
    filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 py-10 text-center text-sm text-muted-foreground", children: "Nothing here yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border px-4", children: filtered.map((n, idx) => {
      const Icon = n.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
        idx > 0 && idx % 8 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationAd, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { ...n.link, className: "flex items-start gap-3 py-4 active:bg-secondary/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 flex-none place-items-center rounded-full bg-secondary text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-snug", children: n.text }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RelativeTime, { iso: n.time }) })
          ] })
        ] }) })
      ] }, `${n.kind}-${n.id}`);
    }) })
  ] });
}
export {
  NotificationsPage as component
};
