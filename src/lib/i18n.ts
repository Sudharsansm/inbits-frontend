import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { usePref } from "@/hooks/usePrefs";

/** Matches the `languages` list in routes/menu.settings.tsx exactly —
 * that's the only place this preference is set. */
export const LANGUAGE_CODES: Record<string, string> = {
  English: "en",
  "हिंदी": "hi",
  "தமிழ்": "ta",
  Español: "es",
};

/** Current language as a backend-ready ISO code, reading the same
 * `settings.language` preference the Settings page writes to. */
export function useLanguageCode(): string {
  const [lang] = usePref<string>("settings.language", "English");
  return LANGUAGE_CODES[lang] ?? "en";
}

// Never expires — a given (text, target language) pair always translates
// to the same thing, and this is what keeps scrolling back through
// already-seen posts free (no repeat network calls, no repeat spend of
// the underlying API's rate limit).
const cache = new Map<string, string>();

// Requests made within the same tick are batched into one backend call —
// a feed rendering ten post cards at once would otherwise fire ten
// separate network requests instead of one.
type QueueEntry = { text: string; target: string; resolve: (v: string) => void };
let queue: QueueEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushQueue() {
  const batch = queue;
  queue = [];
  flushTimer = null;
  if (batch.length === 0) return;

  // Same (target) grouping — the endpoint translates one target per call.
  const byTarget = new Map<string, QueueEntry[]>();
  for (const entry of batch) {
    const list = byTarget.get(entry.target) ?? [];
    list.push(entry);
    byTarget.set(entry.target, list);
  }

  for (const [target, entries] of byTarget) {
    // The backend caps a single request at 20 texts.
    for (let i = 0; i < entries.length; i += 20) {
      const chunk = entries.slice(i, i + 20);
      fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: chunk.map((e) => e.text), target }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data: { translations: string[] }) => {
          chunk.forEach((entry, j) => {
            const translated = data.translations[j] ?? entry.text;
            cache.set(`${entry.target}::${entry.text}`, translated);
            entry.resolve(translated);
          });
        })
        .catch(() => {
          // Translation service unreachable/rate-limited — fall back to
          // the original text rather than leaving the UI stuck loading.
          chunk.forEach((entry) => entry.resolve(entry.text));
        });
    }
  }
}

function translate(text: string, target: string): Promise<string> {
  if (!text.trim() || target === "en") return Promise.resolve(text);
  const key = `${target}::${text}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    queue.push({ text, target, resolve });
    if (!flushTimer) flushTimer = setTimeout(flushQueue, 30);
  });
}

/**
 * Translates a set of strings into whatever language is set in Settings.
 * Returns the originals immediately (English never needs a round trip),
 * then swaps in translations as they arrive. Falls back to the original
 * text on any failure — a translation hiccup should never block reading.
 */
export function useTranslated(texts: string[]): string[] {
  const target = useLanguageCode();
  const [translated, setTranslated] = useState<string[]>(texts);

  useEffect(() => {
    if (target === "en") {
      setTranslated(texts);
      return;
    }
    let cancelled = false;
    // Show the original immediately, then upgrade in place as translations
    // land — never show a blank/loading state for text that already exists.
    setTranslated(texts);
    Promise.all(texts.map((t) => translate(t, target))).then((result) => {
      if (!cancelled) setTranslated(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `texts` compared by content via join below
  }, [target, texts.join("\u0000")]);

  return translated;
}
