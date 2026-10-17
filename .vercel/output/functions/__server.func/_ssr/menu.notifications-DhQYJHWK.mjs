import { j as jsxRuntimeExports } from "../_libs/react.mjs";
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
function NotificationPrefs() {
  const [digest, setDigest] = usePref("notif.digest", true);
  const [time, setTime] = usePref("notif.time", "07:00");
  const [breaking, setBreaking] = usePref("notif.breaking", true);
  const [channels, setChannels] = usePref("notif.channels", false);
  const [jobs, setJobs] = usePref("notif.jobs", true);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MenuPage, { title: "Notification preferences", subtitle: "Only what you asked for", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Daily digest", hint: "One quiet roundup each morning", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Daily digest", on: digest, onToggle: () => setDigest(!digest) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Digest time", hint: "Delivered in your local time", right: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "time", value: time, onChange: (e) => setTime(e.target.value), className: "rounded-lg border border-border bg-paper px-2 py-1 text-sm" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Breaking news", hint: "Rare, high-signal alerts", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Breaking news", on: breaking, onToggle: () => setBreaking(!breaking) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Channel updates", hint: "New episodes from channels you follow", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Channel updates", on: channels, onToggle: () => setChannels(!channels) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Job matches", hint: "Roles that fit your interests", right: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { label: "Job matches", on: jobs, onToggle: () => setJobs(!jobs) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[11px] text-muted-foreground", children: "Changes save automatically on this device." })
  ] });
}
export {
  NotificationPrefs as component
};
