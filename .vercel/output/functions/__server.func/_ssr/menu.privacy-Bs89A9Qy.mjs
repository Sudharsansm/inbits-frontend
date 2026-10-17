import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { M as MenuPage, C as Card, R as Row, S as Switch } from "./MenuPage-BkNHMhgc.mjs";
import { l as usePref } from "./router-B91z3HGk.mjs";
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
import "./AppShell-CCzBClNT.mjs";
import "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
function PrivacyPage() {
  const [personalise, setPersonalise] = usePref("privacy.personalise", true);
  const [history, setHistory] = usePref("privacy.history", true);
  const [analytics, setAnalytics] = usePref("privacy.analytics", false);
  const [cleared, setCleared] = reactExports.useState(false);
  const clearAll = () => {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("inbits:")).forEach((k) => localStorage.removeItem(k));
    } catch {
    }
    setCleared(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MenuPage, { title: "Privacy", subtitle: "No trackers. Everything stays on this device.", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Personalised feed", hint: "Use your interests to order stories", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Personalised feed", on: personalise, onToggle: () => setPersonalise(!personalise) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Reading history", hint: "Remember what you've opened", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Reading history", on: history, onToggle: () => setHistory(!history) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Anonymous analytics", hint: "Off by default", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Anonymous analytics", on: analytics, onToggle: () => setAnalytics(!analytics) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: clearAll, className: "mt-4 w-full rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-primary", children: cleared ? "Local data cleared ✓" : "Clear local data" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[11px] leading-relaxed text-muted-foreground", children: "The toggles above control preferences, saved stories and followed sources, which InBits stores in your browser only. Clearing local data removes them permanently." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-sm font-bold", children: "Advertising & cookies" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[12px] leading-relaxed text-muted-foreground", children: "InBits shows ads served by Google AdSense. Google and its advertising partners use cookies and similar technologies to serve ads based on your prior visits to this and other websites, and to measure how ads perform. InBits itself does not sell your data, but Google's use of advertising cookies on this site is governed by Google's own policies, not ours." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[12px] leading-relaxed text-muted-foreground", children: [
        "You can see and adjust how Google personalises ads for you at",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://adssettings.google.com/", target: "_blank", rel: "noreferrer noopener", className: "font-semibold text-primary underline", children: "adssettings.google.com" }),
        ", or opt out of personalised advertising from participating companies at",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://www.aboutads.info/choices/", target: "_blank", rel: "noreferrer noopener", className: "font-semibold text-primary underline", children: "aboutads.info/choices" }),
        ". Read more about how Google uses information from sites that use its services at",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://policies.google.com/technologies/partner-sites", target: "_blank", rel: "noreferrer noopener", className: "font-semibold text-primary underline", children: "policies.google.com/technologies/partner-sites" }),
        "."
      ] })
    ] }) })
  ] });
}
export {
  PrivacyPage as component
};
