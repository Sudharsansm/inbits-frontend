// Resolves a publisher's real website favicon/logo to use as its channel
// avatar, instead of a generic two-letter monogram. We don't scrape or
// store logos ourselves — Google's public favicon service fetches the
// live icon straight from the outlet's own domain, so it's always the
// publisher's actual mark and stays current if they ever change it.

/** Known outlets → their real domain, for the sources this app's default
 * feed list pulls from (see backend/app/config.py: DEFAULT_FEEDS). Kept
 * as an explicit map rather than guessing from the display name, since
 * "NDTV" or "BBC News" don't trivially reduce to "ndtv.com"/"bbc.com". */
const KNOWN_SOURCE_DOMAINS: Record<string, string> = {
  ndtv: "ndtv.com",
  "the hindu": "thehindu.com",
  "indian express": "indianexpress.com",
  "times of india": "timesofindia.indiatimes.com",
  "bbc news": "bbc.com",
  bbc: "bbc.com",
  reuters: "reuters.com",
  "the new york times": "nytimes.com",
  "new york times": "nytimes.com",
  nytimes: "nytimes.com",
};

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Best-effort real domain for a channel, from its known-outlet map first,
 * falling back to whatever domain its article links actually resolve to
 * (skipping the Google News redirect domain, which isn't the publisher). */
export function domainForSource(source: string, sampleUrl?: string): string {
  const known = KNOWN_SOURCE_DOMAINS[source.trim().toLowerCase()];
  if (known) return known;
  const fromUrl = sampleUrl ? domainFromUrl(sampleUrl) : "";
  if (fromUrl && !fromUrl.includes("news.google.com")) return fromUrl;
  return "";
}

/** Publisher favicon URL for a given domain, at the requested pixel size.
 * Empty domain returns "" so callers can fall back to an initials avatar. */
export function channelLogoUrl(domain: string, size: 32 | 64 | 128 = 64): string {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/** One-stop lookup: source name + a sample article URL in, ready-to-use
 * (possibly empty) logo URL out. */
export function logoForItem(source: string, sampleUrl?: string, size: 32 | 64 | 128 = 64): string {
  return channelLogoUrl(domainForSource(source, sampleUrl), size);
}
