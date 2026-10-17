import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { z as formatRelativeTime } from "./router-B91z3HGk.mjs";
function RelativeTime({ iso, className }) {
  const [label, setLabel] = reactExports.useState(() => formatRelativeTime(iso));
  reactExports.useEffect(() => {
    setLabel(formatRelativeTime(iso));
    const id = setInterval(() => setLabel(formatRelativeTime(iso)), 6e4);
    return () => clearInterval(id);
  }, [iso]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { suppressHydrationWarning: true, className, children: label });
}
export {
  RelativeTime as R
};
