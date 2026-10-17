import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { w as ChevronLeft } from "../_libs/lucide-react.mjs";
function MenuPage({
  title,
  subtitle,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { title: "Menu", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "px-4 pt-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/menu",
          "aria-label": "Back to menu",
          className: "rounded-full border border-border p-2 hover:bg-secondary",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "serif text-xl font-bold leading-tight", children: title }),
        subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: subtitle })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children })
  ] }) });
}
function Row({ label, hint, right }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: label }),
      hint && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: hint })
    ] }),
    right
  ] });
}
function Card({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card", children });
}
function Switch({
  on,
  onToggle,
  label
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      role: "switch",
      "aria-checked": on,
      "aria-label": label,
      onClick: onToggle,
      className: `h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-secondary border border-border"}`,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `block h-5 w-5 rounded-full bg-paper shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`
        }
      )
    }
  );
}
export {
  Card as C,
  MenuPage as M,
  Row as R,
  Switch as S
};
