import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
const HOTLINK_BLOCKED_HOSTS = ["remotive.com", "www.remotive.com"];
function isHotlinkBlocked(url) {
  try {
    const { hostname } = new URL(url);
    return HOTLINK_BLOCKED_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}
function CompanyLogo({
  logoUrl,
  initials,
  size = "h-12 w-12",
  textSize = "text-xs"
}) {
  const [failed, setFailed] = reactExports.useState(false);
  const blocked = reactExports.useMemo(
    () => Boolean(logoUrl) && isHotlinkBlocked(logoUrl),
    [logoUrl]
  );
  const showImage = Boolean(logoUrl) && !failed && !blocked;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `grid ${size} flex-none place-items-center overflow-hidden rounded-full bg-secondary ${textSize} font-bold text-secondary-foreground`,
      children: showImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: logoUrl,
          alt: "",
          loading: "lazy",
          className: "h-full w-full object-cover",
          onError: () => setFailed(true)
        }
      ) : initials
    }
  );
}
export {
  CompanyLogo as C
};
