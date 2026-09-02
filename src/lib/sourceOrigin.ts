// Small display helpers for the country/language metadata each feed
// source already carries (see backend/app/config.py's FeedConfig —
// `location` and `language` are populated per-outlet there and passed
// straight through on every article). That data existed already but
// was never actually shown anywhere in the UI — this is what surfaces
// it, the way Google News labels each source's home edition and
// language next to its headlines.

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  pt: "Portuguese",
  ru: "Russian",
};

const COUNTRY_FLAGS: Record<string, string> = {
  India: "🇮🇳",
  "United Kingdom": "🇬🇧",
  "United States": "🇺🇸",
  Global: "🌐",
};

export function languageName(code: string): string {
  if (!code) return "";
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}

export function countryFlag(location: string): string {
  return COUNTRY_FLAGS[location] ?? (location ? "📍" : "");
}

/** One compact "🇮🇳 India · English" label for a source's origin and
 * language, or "" if neither is known so callers can skip rendering. */
export function sourceOriginLabel(location: string, language: string): string {
  const parts = [location, languageName(language)].filter(Boolean);
  if (parts.length === 0) return "";
  const flag = countryFlag(location);
  return `${flag ? flag + " " : ""}${parts.join(" · ")}`;
}
