import { usePref } from "@/hooks/usePrefs";

// A lightweight interest profile built from what someone actually likes
// — not a vanity counter. Every time the Like button is tapped (Home or
// Reels), the post's category and source get a point here. That's the
// real signal "Recommended for you" (see lib/recommend.ts) uses to rank
// stories, the same basic idea as Google News weighting your feed by
// topics and outlets you engage with — just kept simple and fully local
// (no account, no server-side profile) since this app doesn't have
// accounts to attach it to.

export type InterestProfile = {
  categories: Record<string, number>;
  sources: Record<string, number>;
};

const EMPTY_PROFILE: InterestProfile = { categories: {}, sources: {} };

function bump(record: Record<string, number>, key: string): Record<string, number> {
  if (!key) return record;
  return { ...record, [key]: (record[key] ?? 0) + 1 };
}

export function useInterestProfile() {
  const [profile, setProfile] = usePref<InterestProfile>("interestProfile", EMPTY_PROFILE);

  const recordLike = (category: string, source: string) => {
    setProfile({
      categories: bump(profile.categories, category),
      sources: bump(profile.sources, source),
    });
  };

  return { profile, recordLike };
}
