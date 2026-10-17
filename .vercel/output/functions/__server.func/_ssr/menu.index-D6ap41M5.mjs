import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { U as User, B as Bookmark, i as Bell, G as Globe, r as Shield, I as Info, F as FileText, s as Mail, t as Settings, u as ChevronRight, v as LogIn } from "../_libs/lucide-react.mjs";
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
const items = [{
  icon: User,
  label: "Profile",
  hint: "Maya · @maya.reads",
  to: "/menu/profile"
}, {
  icon: Bookmark,
  label: "Saved",
  hint: "Stories you bookmarked",
  to: "/menu/saved"
}, {
  icon: Bell,
  label: "Notification preferences",
  hint: "Daily digest at 7am",
  to: "/menu/notifications"
}, {
  icon: Globe,
  label: "Sources",
  hint: "Publishers you follow",
  to: "/menu/sources"
}, {
  icon: Shield,
  label: "Privacy",
  hint: "How your data & ads work",
  to: "/menu/privacy"
}, {
  icon: Info,
  label: "About",
  hint: "What InBits is, and how it works",
  to: "/menu/about"
}, {
  icon: FileText,
  label: "Terms of Service",
  hint: "The rules of using InBits",
  to: "/menu/terms"
}, {
  icon: Mail,
  label: "Contact",
  hint: "Reach the team",
  to: "/menu/contact"
}, {
  icon: Settings,
  label: "Settings",
  hint: "Theme, language",
  to: "/menu/settings"
}];
function Menu() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: "Menu", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "px-4 pt-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-2xl bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-14 w-14 place-items-center rounded-full bg-primary text-xl font-bold text-primary-foreground", children: "M" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "serif text-lg font-bold", children: "Maya Iyer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Reader since 2024 · Bengaluru" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/menu/profile", className: "rounded-full border border-border px-3 py-1.5 text-xs font-semibold", children: "Edit" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 overflow-hidden rounded-2xl border border-border bg-card", children: items.map(({
      icon: Icon,
      label,
      hint,
      to
    }, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: i > 0 ? "border-t border-border" : "", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to, className: "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: hint })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
    ] }) }, label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/menu/login", className: "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-4 w-4" }),
      " Log in / Sign up"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "serif mt-6 text-center text-[11px] italic text-muted-foreground", children: '"The news you follow, summarised and linked back to the source — read slowly, like a good morning paper."' })
  ] }) });
}
export {
  Menu as component
};
