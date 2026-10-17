import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { M as MenuPage } from "./MenuPage-BkNHMhgc.mjs";
import { l as usePref } from "./router-B91z3HGk.mjs";
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
function LoginPage() {
  const [mode, setMode] = reactExports.useState("login");
  const [email, setEmail] = reactExports.useState("");
  const [signedIn, setSignedIn] = usePref("account.email", "");
  if (signedIn) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MenuPage, { title: "Account", subtitle: signedIn, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm", children: [
        "You're signed in as ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: signedIn }),
        "."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSignedIn(""), className: "mt-4 w-full rounded-2xl border border-border py-3 text-sm font-semibold text-primary", children: "Log out" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-3 inline-block text-xs text-muted-foreground underline", children: "Back to the feed" })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MenuPage, { title: mode === "login" ? "Log in" : "Create account", subtitle: "Sync saves across devices", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 flex rounded-full border border-border bg-card p-1 text-xs font-semibold", children: ["login", "signup"].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMode(m), className: `flex-1 rounded-full py-2 ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`, children: m === "login" ? "Log in" : "Sign up" }, m)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      if (email.includes("@")) setSignedIn(email);
    }, className: "space-y-3 rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-semibold text-muted-foreground", children: [
        "Email",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com", className: "mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-semibold text-muted-foreground", children: [
        "Password",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", required: true, minLength: 6, placeholder: "••••••••", className: "mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground", children: mode === "login" ? "Log in" : "Create account" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[11px] text-muted-foreground", children: "Demo mode: your session is remembered locally on this device only." })
  ] });
}
export {
  LoginPage as component
};
