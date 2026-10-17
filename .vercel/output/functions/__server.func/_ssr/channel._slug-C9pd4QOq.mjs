import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
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
import "../_libs/lucide-react.mjs";
function ChannelNotFound() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: "Channel", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-10 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "serif text-2xl font-bold", children: "Channel not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "This channel is no longer available." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/stands", className: "mt-4 inline-block text-sm font-semibold text-primary", children: "Back to Stands" })
  ] }) });
}
export {
  ChannelNotFound as notFoundComponent
};
