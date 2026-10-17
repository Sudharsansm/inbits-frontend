import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { A as Avatar$1, a as AvatarImage$1, b as AvatarFallback$1 } from "../_libs/radix-ui__react-avatar.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Avatar = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Avatar$1,
  {
    ref,
    className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
    ...props
  }
));
Avatar.displayName = Avatar$1.displayName;
const AvatarImage = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  AvatarImage$1,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarImage$1.displayName;
const AvatarFallback = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  AvatarFallback$1,
  {
    ref,
    className: cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = AvatarFallback$1.displayName;
const KNOWN_SOURCE_DOMAINS = {
  ndtv: "ndtv.com",
  "the hindu": "thehindu.com",
  "indian express": "indianexpress.com",
  "times of india": "timesofindia.indiatimes.com",
  "bbc news": "bbc.com",
  bbc: "bbc.com",
  reuters: "reuters.com",
  "the new york times": "nytimes.com",
  "new york times": "nytimes.com",
  nytimes: "nytimes.com"
};
function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function domainForSource(source, sampleUrl) {
  const known = KNOWN_SOURCE_DOMAINS[source.trim().toLowerCase()];
  if (known) return known;
  const fromUrl = sampleUrl ? domainFromUrl(sampleUrl) : "";
  if (fromUrl && !fromUrl.includes("news.google.com")) return fromUrl;
  return "";
}
function channelLogoUrl(domain, size = 64) {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}
function logoForItem(source, sampleUrl, size = 64) {
  return channelLogoUrl(domainForSource(source, sampleUrl), size);
}
function ChannelAvatar({
  source,
  sampleUrl,
  className
}) {
  const logoUrl = logoForItem(source, sampleUrl, 64);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: cn("h-8 w-8 ring-2 ring-paper", className), children: [
    logoUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: logoUrl, alt: "", loading: "lazy" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-gradient-to-tr from-primary via-primary/70 to-primary/30 text-[11px] font-black text-primary-foreground", children: source.slice(0, 2).toUpperCase() })
  ] });
}
export {
  ChannelAvatar as C
};
