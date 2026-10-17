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
const sizes = ["Small", "Medium", "Large"];
const languages = ["English", "Tamil", "Telugu", "Kannada", "Malayalam", "Hindi", "Bengali", "Marathi", "Gujarati", "Punjabi", "Chinese", "Russian", "Japanese", "Korean", "French", "British English", "American English", "Spanish"];
function SettingsPage() {
  const [dark, setDark] = usePref("settings.dark", false);
  const [size, setSize] = usePref("settings.textSize", "Medium");
  const [lang, setLang] = usePref("settings.language", "English");
  const [dataSaver, setDataSaver] = usePref("settings.dataSaver", false);
  const [autoplay, setAutoplay] = usePref("settings.autoplay", true);
  reactExports.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  reactExports.useEffect(() => {
    const px = size === "Small" ? "15px" : size === "Large" ? "18px" : "16px";
    document.documentElement.style.fontSize = px;
  }, [size]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MenuPage, { title: "Settings", subtitle: "Theme, language and reading comfort", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Dark mode", hint: "Easier on late-night eyes", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Dark mode", on: dark, onToggle: () => setDark(!dark) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Text size", hint: "Applies across the app", right: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1", children: sizes.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSize(s), className: `rounded-full px-2.5 py-1 text-[11px] font-semibold ${size === s ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`, children: s }, s)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Language", right: /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: lang, onChange: (e) => setLang(e.target.value), className: "rounded-lg border border-border bg-paper px-2 py-1 text-sm", children: languages.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: l, children: l }, l)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Data saver", hint: "Load lighter images", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Data saver", on: dataSaver, onToggle: () => setDataSaver(!dataSaver) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Autoplay media", hint: "Play video in Updates automatically", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Autoplay media", on: autoplay, onToggle: () => setAutoplay(!autoplay) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-center text-[11px] text-muted-foreground", children: "· InBits ·" })
  ] });
}
export {
  SettingsPage as component
};
