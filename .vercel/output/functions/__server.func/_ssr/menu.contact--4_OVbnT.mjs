import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { M as MenuPage, C as Card } from "./MenuPage-BkNHMhgc.mjs";
import { s as Mail } from "../_libs/lucide-react.mjs";
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
const CONTACT_EMAIL = "manisri88877@gmail.com";
function ContactPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MenuPage, { title: "Contact", subtitle: "Reach the team behind InBits", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 text-[13px] leading-relaxed text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Questions about a story, a takedown or correction request from a publisher, feedback on the app, or an advertising inquiry — all of it can go to the same address:" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `mailto:${CONTACT_EMAIL}`, className: "flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm font-semibold text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4 flex-none" }),
      CONTACT_EMAIL
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "We aim to respond within a few business days." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "serif text-sm font-bold text-foreground", children: "Publisher requests" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "If you represent a publisher whose content appears on InBits and you'd like a story removed, a link corrected, or an excerpt shortened further, email us with the story URL and we'll act on it promptly." })
  ] }) }) });
}
export {
  ContactPage as component
};
