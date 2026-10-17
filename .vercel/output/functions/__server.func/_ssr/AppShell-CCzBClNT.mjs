import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useLocation, L as Link } from "../_libs/tanstack__react-router.mjs";
import { e as House, N as Newspaper, f as Mic, g as Briefcase, h as Search, i as Bell, j as Menu, a as EllipsisVertical } from "../_libs/lucide-react.mjs";
const bottomNav = [
  { to: "/", label: "Home", icon: House },
  { to: "/updates", label: "Updates", icon: Newspaper },
  { to: "/stands", label: "Stands", icon: Mic },
  { to: "/jobs", label: "Jobs", icon: Briefcase }
];
const sideNav = [
  ...bottomNav,
  { to: "/search", label: "Search", icon: Search },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/menu", label: "More", icon: Menu }
];
function Sidebar({ isActive }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-border bg-paper px-2 py-4 text-ink md:flex xl:w-[245px] xl:px-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "mb-6 flex items-baseline justify-center gap-1 px-2 xl:justify-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "serif text-2xl font-black tracking-tight", children: "In" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "serif text-2xl font-black tracking-tight text-primary xl:inline", children: "Bits" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex flex-1 flex-col gap-1", children: sideNav.map(({ to, label, icon: Icon }) => {
      const active = isActive(to);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to,
          "aria-label": label,
          className: `flex items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-secondary ${active ? "font-bold text-ink" : "text-muted-foreground"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `h-6 w-6 shrink-0 ${active ? "stroke-[2.4]" : ""}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden truncate text-sm xl:inline", children: label })
          ]
        },
        to
      );
    }) })
  ] });
}
function MobileHeader({ title, action }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-paper/85 px-4 py-3 backdrop-blur md:hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-baseline gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "serif text-2xl font-black tracking-tight", children: "In" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "serif text-2xl font-black tracking-tight text-primary", children: "Bits" }),
      title && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-xs uppercase tracking-[0.18em] text-muted-foreground", children: title })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex items-center gap-1", children: [
      action,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/search", "aria-label": "Search", className: "rounded-full p-2 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/notifications",
          "aria-label": "Notifications",
          className: "relative rounded-full p-2 hover:bg-secondary",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/menu", "aria-label": "Menu", className: "rounded-full p-2 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "h-5 w-5" }) })
    ] })
  ] });
}
function MobileBottomNav({ isActive }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 border-t border-border bg-paper/95 backdrop-blur md:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "grid grid-cols-4", children: bottomNav.map(({ to, label, icon: Icon }) => {
    const active = isActive(to);
    return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to,
        className: `flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition ${active ? "text-primary" : "text-muted-foreground"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `h-5 w-5 ${active ? "stroke-[2.4]" : ""}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `h-0.5 w-6 rounded-full ${active ? "bg-primary" : "bg-transparent"}`
            }
          )
        ]
      }
    ) }, to);
  }) }) });
}
function AppShell({
  children,
  title,
  aside,
  fullWidth,
  headerAction
}) {
  const { pathname } = useLocation();
  const isActive = (to) => pathname === to || to !== "/" && pathname.startsWith(to);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background paper-grain", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, { isActive }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:pl-[72px] xl:pl-[245px] lg:pr-[320px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `mx-auto flex w-full justify-center ${fullWidth ? "" : aside ? "" : "max-w-[440px] md:max-w-[600px] lg:max-w-[630px]"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `flex min-h-screen w-full flex-col bg-paper text-ink shadow-[0_0_60px_-20px_rgba(0,0,0,0.25)] md:shadow-none ${fullWidth ? "" : aside ? "mx-auto w-full max-w-[440px] md:max-w-[470px]" : ""}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MobileHeader, { title, action: headerAction }),
                (title || headerAction) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden items-center justify-between border-b border-border px-4 py-3 md:flex", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-[0.18em] text-muted-foreground", children: title }),
                  headerAction
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 pb-24 md:pb-10", children })
              ]
            }
          )
        }
      ),
      aside && /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "fixed right-0 top-0 z-30 hidden h-screen w-[320px] overflow-y-auto border-l border-border bg-paper py-8 pl-6 pr-4 scrollbar-none lg:block", children: aside })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MobileBottomNav, { isActive })
  ] });
}
export {
  AppShell as A
};
