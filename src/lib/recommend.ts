import type { FeedItem } from "@/lib/api";
import type { InterestProfile } from "@/lib/interests";

/** Reader's browser language (e.g. "en", "hi") — the same signal Google
 * News itself uses to prefer editions/sources in your language when it
 * doesn't have an explicit account preference to go on. */
export function browserLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  return (navigator.language || "en").split("-")[0].toLowerCase();
}

export type ScoredItem = { item: FeedItem; score: number; reason: string };

/**
 * Ranks a pool of articles for one reader, folding together the three
 * signals Google News-style "For You" ranking is built on: topics/outlets
 * they've actually engaged with (via Like), the language they read in,
 * and — as a proxy for "place" absent real account/geo data — the
 * regional editions they've already been reading. Recency still matters
 * (a great match from three days ago shouldn't beat fresh news), so it's
 * blended in rather than used as a hard filter.
 */
export function scoreForYou(
  items: FeedItem[],
  profile: InterestProfile,
  language: string,
): ScoredItem[] {
  const topCategory = Object.entries(profile.categories).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSource = Object.entries(profile.sources).sort((a, b) => b[1] - a[1])[0]?.[0];
  const hasAnyProfile =
    Object.keys(profile.categories).length > 0 || Object.keys(profile.sources).length > 0;

  const now = Date.now();

  return items
    .map((item): ScoredItem => {
      let score = 0;
      const reasons: string[] = [];

      const categoryHits = profile.categories[item.category] ?? 0;
      const sourceHits = profile.sources[item.source] ?? 0;
      if (categoryHits > 0) {
        score += Math.min(categoryHits, 5) * 3;
        reasons.push(`You like ${item.category}`);
      }
      if (sourceHits > 0) {
        score += Math.min(sourceHits, 5) * 2;
        if (reasons.length === 0) reasons.push(`You follow ${item.source}`);
      }

      // Language match — a real, always-available signal even for a
      // reader with no like history yet.
      if (item.language && item.language.toLowerCase() === language) {
        score += 2;
        if (reasons.length === 0)
          reasons.push(`In ${language === "en" ? "English" : "your language"}`);
      }

      // Recency, gently — half-life of roughly a day so this nudges
      // ties toward fresher stories without drowning out a strong topic
      // match from earlier today.
      const ageHours = (now - new Date(item.publishedAt).getTime()) / 36e5;
      score += Math.max(0, 2 - ageHours / 12);

      if (reasons.length === 0) {
        reasons.push(hasAnyProfile ? "Trending now" : `Popular in ${item.category}`);
      }

      return { item, score, reason: reasons[0] };
    })
    .sort((a, b) => b.score - a.score);
}

/** Top N recommended items, skipping whatever's already visible
 * elsewhere on the page (`excludeIds`) so this rail adds new stories
 * instead of repeating ones already right above it in the feed. */
export function pickForYou(
  items: FeedItem[],
  profile: InterestProfile,
  language: string,
  excludeIds: Set<string>,
  count = 8,
): ScoredItem[] {
  return scoreForYou(
    items.filter((i) => !excludeIds.has(i.id)),
    profile,
    language,
  ).slice(0, count);
}
