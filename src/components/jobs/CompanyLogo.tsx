import { useMemo, useState } from "react";

/**
 * Hosts known to send a Cross-Origin-Resource-Policy header that blocks
 * cross-origin `<img>` requests outright (e.g. Remotive's `/job/:id/logo`
 * redirects). The browser refuses these before our `onError` handler ever
 * gets a chance to run, so they just spam the console with
 * `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` while still visually falling
 * back to initials. Skip requesting them in the first place.
 */
const HOTLINK_BLOCKED_HOSTS = ["remotive.com", "www.remotive.com"];

function isHotlinkBlocked(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return HOTLINK_BLOCKED_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    // Not a valid absolute URL — let the <img> tag's own error handling deal with it.
    return false;
  }
}

/**
 * Company logo with a real fallback: several of these listings' logo
 * URLs 404 or get blocked by the source site's hotlink protection. Just
 * rendering `<img src={logoUrl}>` left a broken-image icon sitting over
 * the initials in that case — this swaps to the initials the moment the
 * image actually fails to load, instead of only checking whether a URL
 * string was present. Known hotlink-blocked hosts are skipped up front
 * so the browser never issues (and logs) a doomed request for them.
 */
export function CompanyLogo({
  logoUrl,
  initials,
  size = "h-12 w-12",
  textSize = "text-xs",
}: {
  logoUrl: string;
  initials: string;
  size?: string;
  textSize?: string;
}) {
  const [failed, setFailed] = useState(false);
  const blocked = useMemo(
    () => Boolean(logoUrl) && isHotlinkBlocked(logoUrl),
    [logoUrl],
  );
  const showImage = Boolean(logoUrl) && !failed && !blocked;

  return (
    <div
      className={`grid ${size} flex-none place-items-center overflow-hidden rounded-full bg-secondary ${textSize} font-bold text-secondary-foreground`}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}