export type Track = { id: string; title: string; artist: string; src: string; categories: string[] };

/** How long a post's background track loops for before jumping back to
 * the start — the same short-clip loop Instagram/Reels uses (rather than
 * playing a whole multi-minute track end-to-end) so the music stays a
 * catchy, repeating hook instead of fading into the background. Applied
 * in JS (see useShortLoop) since the HTML `loop` attribute alone only
 * repeats at the *track's* natural end, which is usually minutes away.
 * 60s (rather than a shorter clip) gives each track room to actually
 * develop before it loops, on both the Home feed and Updates/Reels. */
export const SHORT_LOOP_SECONDS = 60;

/** The full set of mood/use-case tags a track (and therefore a post) can
 * carry — matches the taxonomy real stock-music libraries (Epidemic
 * Sound, Artlist, etc.) organize by, so "what kind of music is this" is
 * a real, recognizable answer rather than an invented label. */
export const MUSIC_CATEGORIES = [
  "News Theme", "Breaking News", "Documentary", "Cinematic Score", "Epic",
  "Dramatic", "Suspense", "Mystery", "Inspirational", "Motivational",
  "Emotional", "Uplifting", "Corporate", "Technology", "Futuristic",
  "Adventure", "Horror", "Comedy", "Romantic", "Chill", "Relaxing",
  "Meditation", "Study Music", "Focus Music", "Workout Music", "Gaming Music",
  "Travel Music", "Podcast Music", "Vlog Music", "Intro Music", "Outro Music",
  "Background Music", "Trending Beat", "Viral Beat", "Acoustic Background",
  "Ambient Background", "Instrumental Background",
] as const;

export type MusicCategory = (typeof MUSIC_CATEGORIES)[number];

/**
 * A handful of Creative Commons–licensed instrumental tracks, hosted on
 * Wikimedia Commons (stable, hotlink-friendly via Special:FilePath — the
 * same mechanism Wikipedia itself uses to embed these files). All by
 * Kevin MacLeod, whose CC BY-licensed catalog is exactly what this kind
 * of "free background music for short video" use case is for — credit is
 * shown on-screen (the license requires attribution, not more).
 *
 * Each is tagged with every mood category from MUSIC_CATEGORIES it
 * genuinely fits, covering the full taxonomy without inventing tracks
 * that don't exist — real files, real license, nothing invented. See
 * each track's page: https://commons.wikimedia.org/wiki/File:Kevin_MacLeod_-_<title>.ogg
 */
export const MUSIC_LIBRARY: Track[] = [
  {
    id: "early-riser",
    title: "Early Riser",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_Early_Riser.ogg",
    categories: [
      "News Theme", "Breaking News", "Corporate", "Technology", "Focus Music",
      "Podcast Music", "Vlog Music", "Background Music", "Trending Beat",
      "Intro Music",
    ],
  },
  {
    id: "enchanted-journey",
    title: "Enchanted Journey",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_Enchanted_Journey.ogg",
    categories: [
      "Documentary", "Adventure", "Travel Music", "Inspirational", "Uplifting",
      "Relaxing", "Chill", "Ambient Background", "Instrumental Background",
      "Meditation",
    ],
  },
  {
    id: "impact-prelude",
    title: "Impact Prelude",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_01_-_Impact_Prelude.ogg",
    categories: [
      "Cinematic Score", "Epic", "Dramatic", "Suspense", "Mystery", "Horror",
      "Gaming Music", "Workout Music", "Viral Beat", "Outro Music",
    ],
  },
  {
    id: "master-of-the-feast",
    title: "Master of the Feast",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_Master_of_the_Feast.ogg",
    categories: [
      "Motivational", "Comedy", "Romantic", "Futuristic", "Study Music",
      "Corporate", "Trending Beat",
    ],
  },
  {
    id: "waterford",
    title: "Waterford",
    artist: "Kevin MacLeod",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/MacLeod,_Kevin_-_Waterford.ogg",
    categories: [
      "Emotional", "Inspirational", "Relaxing", "Meditation", "Chill",
      "Acoustic Background", "Ambient Background", "Instrumental Background",
      "Focus Music",
    ],
  },
];

/** Best-fit music category for a news item, from its editorial category/
 * topic — e.g. a Business story gets "Corporate", Sports gets "Epic". A
 * story tagged "Breaking" anywhere gets "Breaking News" regardless of
 * subject, since urgency trumps topic for what music fits it. */
export function categoryForItem(item: { category?: string; topic?: string; title?: string; tags?: string[] }): MusicCategory {
  const haystack = `${item.title ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
  if (haystack.includes("breaking")) return "Breaking News";

  const subject = (item.topic || item.category || "").toLowerCase();
  const map: Record<string, MusicCategory> = {
    politics: "News Theme",
    business: "Corporate",
    technology: "Technology",
    tech: "Technology",
    sports: "Epic",
    health: "Emotional",
    science: "Documentary",
    entertainment: "Cinematic Score",
    world: "Documentary",
    india: "News Theme",
    general: "Background Music",
  };
  return map[subject] ?? "News Theme";
}

/** Deterministic pick within a category so the same post always gets the
 * same track (across refreshes/re-renders) instead of a new random one
 * every time, while still varying by which category it's carrying. */
export function trackForCategory(category: string, seed: string): Track {
  const pool = MUSIC_LIBRARY.filter((t) => t.categories.includes(category));
  const candidates = pool.length > 0 ? pool : MUSIC_LIBRARY;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return candidates[hash % candidates.length];
}

/** Per-post track assignments, and a rotating cursor per category —
 * together these are what keep the feed from feeling stuck on one song.
 * A pure hash-of-id pick (the old approach) draws from a small pool (each
 * mood category only has a handful of tracks) so scrolling past several
 * posts in the same category kept landing on the same track, or
 * ping-ponging between the same two. Cycling round-robin through the
 * category's whole pool instead means a track only repeats once every
 * `pool.length` posts of that category — while `trackAssignments` still
 * makes the pick sticky per post id, so revisiting/re-rendering the same
 * post never reshuffles what it sounds like. Both maps are module-level
 * (not component state) so Home and Updates/Reels — which mount separate
 * components for the same post id — agree on one assignment, and so the
 * cursor keeps advancing across the *whole* session rather than resetting
 * every time a card mounts. */
const trackAssignments = new Map<string, Track>();
const categoryCursor = new Map<string, number>();

function nextInCategory(category: string): Track {
  const pool = MUSIC_LIBRARY.filter((t) => t.categories.includes(category));
  const candidates = pool.length > 0 ? pool : MUSIC_LIBRARY;
  const cursor = categoryCursor.get(category) ?? 0;
  categoryCursor.set(category, (cursor + 1) % candidates.length);
  return candidates[cursor % candidates.length];
}

/** One-stop lookup for "what track (and mood label) should this post's
 * background music be" — used by both the Home feed post and the
 * Updates/Reels post so they agree on the same track per item. */
export function trackForItem(item: { id: string; category?: string; topic?: string; title?: string; tags?: string[] }): {
  track: Track;
  category: MusicCategory;
} {
  const category = categoryForItem(item);
  let track = trackAssignments.get(item.id);
  if (!track) {
    track = nextInCategory(category);
    trackAssignments.set(item.id, track);
  }
  return { track, category };
}

/** Deterministic pick so the same reel always gets the same track (across
 * refreshes/re-renders) instead of a new random one every time.
 * @deprecated prefer `trackForItem`, which also picks a fitting mood
 * category instead of an unweighted random track. Kept for any caller
 * that only has an id and no category/topic to go on. */
export function trackForId(id: string): Track {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return MUSIC_LIBRARY[hash % MUSIC_LIBRARY.length];
}
