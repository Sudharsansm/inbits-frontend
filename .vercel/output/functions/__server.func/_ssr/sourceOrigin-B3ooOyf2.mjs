const LANGUAGE_NAMES = {
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
  ru: "Russian"
};
const COUNTRY_FLAGS = {
  India: "🇮🇳",
  "United Kingdom": "🇬🇧",
  "United States": "🇺🇸",
  Global: "🌐"
};
function languageName(code) {
  if (!code) return "";
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}
function countryFlag(location) {
  return COUNTRY_FLAGS[location] ?? (location ? "📍" : "");
}
function sourceOriginLabel(location, language) {
  const parts = [location, languageName(language)].filter(Boolean);
  if (parts.length === 0) return "";
  const flag = countryFlag(location);
  return `${flag ? flag + " " : ""}${parts.join(" · ")}`;
}
export {
  sourceOriginLabel as s
};
