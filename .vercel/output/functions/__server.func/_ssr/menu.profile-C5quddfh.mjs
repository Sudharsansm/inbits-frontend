import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { M as MenuPage, C as Card, R as Row } from "./MenuPage-BkNHMhgc.mjs";
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
const interests = ["Tech", "World", "Business", "Culture", "Sports", "Science"];
function ProfilePage() {
  const [name, setName] = usePref("profile.name", "Maya Iyer");
  const [handle, setHandle] = usePref("profile.handle", "maya.reads");
  const [city, setCity] = usePref("profile.city", "Bengaluru");
  const [picked, setPicked] = usePref("profile.interests", ["Tech", "Culture"]);
  const [saved, setSaved] = usePref("profile.savedFlag", 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MenuPage, { title: "Profile", subtitle: "Your reader identity", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Display name", right: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-40 rounded-lg border border-border bg-paper px-2 py-1 text-right text-sm" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Handle", right: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: handle, onChange: (e) => setHandle(e.target.value), className: "w-40 rounded-lg border border-border bg-paper px-2 py-1 text-right text-sm" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "City", right: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: city, onChange: (e) => setCity(e.target.value), className: "w-40 rounded-lg border border-border bg-paper px-2 py-1 text-right text-sm" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: "Interests" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: interests.map((i) => {
        const on = picked.includes(i);
        return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setPicked(on ? picked.filter((x) => x !== i) : [...picked, i]), className: `rounded-full px-3 py-1.5 text-xs font-semibold transition ${on ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`, children: i }, i);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSaved(Date.now()), className: "w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground", children: saved ? "Saved ✓" : "Save profile" })
  ] }) });
}
export {
  ProfilePage as component
};
