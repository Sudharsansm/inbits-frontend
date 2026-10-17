import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function ArticleSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse px-5 pt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-16 rounded bg-secondary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 h-3 w-40 rounded bg-secondary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-5 w-11/12 rounded bg-secondary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-5 w-2/3 rounded bg-secondary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 h-16 w-full rounded bg-secondary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 h-64 w-full rounded-2xl bg-secondary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-full rounded bg-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-full rounded bg-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-5/6 rounded bg-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-full rounded bg-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-3/4 rounded bg-secondary" })
    ] })
  ] });
}
function DiscoverGridSkeleton({ count = 8 }) {
  const heights = [180, 140, 200, 150, 170, 130, 190, 160];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "columns-2 gap-2 px-3 [column-fill:_balance]", children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "mb-2 w-full animate-pulse break-inside-avoid rounded-xl bg-secondary",
      style: { height: heights[i % heights.length] }
    },
    i
  )) });
}
export {
  ArticleSkeleton as A,
  DiscoverGridSkeleton as D
};
