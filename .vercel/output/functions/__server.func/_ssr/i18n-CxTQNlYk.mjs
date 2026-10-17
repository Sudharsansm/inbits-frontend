import { r as reactExports } from "../_libs/react.mjs";
import { l as usePref, D as API_BASE_URL } from "./router-B91z3HGk.mjs";
const LANGUAGE_CODES = {
  English: "en",
  Tamil: "ta",
  Telugu: "te",
  Kannada: "kn",
  Malayalam: "ml",
  Hindi: "hi",
  Bengali: "bn",
  Marathi: "mr",
  Gujarati: "gu",
  Punjabi: "pa",
  Chinese: "zh",
  Russian: "ru",
  Japanese: "ja",
  Korean: "ko",
  French: "fr",
  "British English": "en-GB",
  "American English": "en-US",
  Spanish: "es"
};
function isEnglishVariant(code) {
  return code === "en" || code === "en-GB" || code === "en-US";
}
function useLanguageCode() {
  const [lang] = usePref("settings.language", "English");
  return LANGUAGE_CODES[lang] ?? "en";
}
const cache = /* @__PURE__ */ new Map();
let queue = [];
let flushTimer = null;
function flushQueue() {
  const batch = queue;
  queue = [];
  flushTimer = null;
  if (batch.length === 0) return;
  const byTarget = /* @__PURE__ */ new Map();
  for (const entry of batch) {
    const list = byTarget.get(entry.target) ?? [];
    list.push(entry);
    byTarget.set(entry.target, list);
  }
  for (const [target, entries] of byTarget) {
    for (let i = 0; i < entries.length; i += 20) {
      const chunk = entries.slice(i, i + 20);
      fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: chunk.map((e) => e.text), target })
      }).then((res) => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))).then((data) => {
        chunk.forEach((entry, j) => {
          const translated = data.translations[j] ?? entry.text;
          cache.set(`${entry.target}::${entry.text}`, translated);
          entry.resolve(translated);
        });
      }).catch((error) => {
        console.error(`[i18n] translate request to "${target}" failed:`, error);
        chunk.forEach((entry) => entry.resolve(entry.text));
      });
    }
  }
}
function translate(text, target) {
  if (!text.trim() || isEnglishVariant(target)) return Promise.resolve(text);
  const key = `${target}::${text}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    queue.push({ text, target, resolve });
    if (!flushTimer) flushTimer = setTimeout(flushQueue, 30);
  });
}
function useTranslated(texts) {
  const target = useLanguageCode();
  const [translated, setTranslated] = reactExports.useState(texts);
  reactExports.useEffect(() => {
    if (isEnglishVariant(target)) {
      setTranslated(texts);
      return;
    }
    let cancelled = false;
    setTranslated(texts);
    Promise.all(texts.map((t) => translate(t, target))).then((result) => {
      if (!cancelled) setTranslated(result);
    });
    return () => {
      cancelled = true;
    };
  }, [target, texts.join("\0")]);
  return translated;
}
function useTranslatedById(entries) {
  const ids = entries.map((e) => e.id).join("\0");
  const texts = entries.map((e) => e.text);
  const translated = useTranslated(texts);
  return reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    entries.forEach((e, i) => map.set(e.id, translated[i] ?? e.text));
    return map;
  }, [ids, translated]);
}
export {
  useTranslated as a,
  useTranslatedById as u
};
