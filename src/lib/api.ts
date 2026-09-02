// Client for the InBits News Backend (FastAPI + WebSocket, see
// inbits-backend). Every article on the site — home feed, post detail,
// "related stories" — flows through this file. Nothing here is mock data.

export type ArticleStatus = "draft" | "published" | "archived";

/** Mirrors `app/models.py: NewsItem` on the backend field-for-field. */
export type FeedItem = {
  id: string;
  originalArticleId: string;
  category: string;
  topic: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  source: string;
  sourceUrl: string;
  readTime: number;
  image: string;
  images: string[];
  publishedAt: string;
  updatedAt: string;
  likes: number;
  views: number;
  tags: string[];
  language: string;
  location: string;
  status: ArticleStatus;
};

/** Mirrors `app/jobs.py` normalizers on the backend — real remote
 * listings fetched from Remotive + RemoteOK's public job board APIs, not
 * sample data. */
export type RemoteJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  /** Best-effort country/region parsed from `location` — drives the
   * Country filter. Falls back to the board's own location text when it
   * doesn't match a known country/region. */
  country: string;
  /** Remote / Hybrid / On-site — inferred from the listing text. These
   * boards are remote-first, so almost everything is "Remote"; that's
   * accurate to what's actually available, not a filter bug. */
  workplaceType: string;
  type: string;
  /** Real category/field from the source board (Remotive's category,
   * RemoteOK's top tag, or Adzuna's category label) — drives the
   * Category filter. */
  category: string;
  salary: string;
  logo: string;
  logoUrl: string;
  posted: string;
  tags: string[];
  applyUrl: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
  /** Which board this listing actually came from — Remotive, RemoteOK, or
   * Adzuna — so provenance is visible, not implied to be one unified feed. */
  source: string;
};

// Resolves the backend base URL with three tiers, in priority order:
//  1. VITE_API_BASE_URL, if set — baked in at build time (see .env.example).
//     Use this for a plain "frontend talks directly to a public backend
//     URL" setup.
//  2. Browser runtime: same origin the page was served from. This is what
//     makes the docker-compose deployment work with *no* rebuild needed
//     per environment — nginx proxies /api and /ws to the backend under
//     the same public domain, so the client never needs to know it.
//  3. Server runtime (SSR loaders, no `window`): INTERNAL_API_BASE_URL,
//     a plain process.env var read at request time (not build time) —
//     set this to the backend's internal docker-compose hostname.
function resolveApiBase(): string {
  const buildTimeBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (buildTimeBase) return buildTimeBase.replace(/\/+$/, "");

  if (typeof window !== "undefined") return window.location.origin;

  const runtimeBase =
    typeof process !== "undefined" ? process.env.INTERNAL_API_BASE_URL : undefined;
  return (runtimeBase ?? "http://localhost:8000").replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBase();
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!res.ok) throw new Error(`${path} failed: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchFeed(
  category = "All",
  signal?: AbortSignal,
): Promise<{ items: FeedItem[]; total: number }> {
  return getJson(`/api/feed?category=${encodeURIComponent(category)}`, signal);
}

/** Returns null (not a thrown error) on 404 — callers decide what "not
 * found" means for their route (e.g. `notFound()` in a loader). */
export async function fetchArticle(id: string, signal?: AbortSignal): Promise<FeedItem | null> {
  const res = await fetch(`${API_BASE_URL}/api/article/${encodeURIComponent(id)}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`/api/article/${id} failed: HTTP ${res.status}`);
  return res.json();
}

export async function fetchHealth(
  signal?: AbortSignal,
): Promise<{ status: string; connected_clients: number }> {
  return getJson(`/api/health`, signal);
}

/** Searches the live buffer first; if that's thin, the backend fetches
 * fresh results from the web on the spot instead of returning empty —
 * see app/search.py. Never throws on "no results", only on a genuine
 * network/backend failure. */
export async function searchArticles(
  query: string,
  signal?: AbortSignal,
): Promise<{ items: FeedItem[]; total: number; query: string }> {
  return getJson(`/api/search?q=${encodeURIComponent(query)}`, signal);
}

/** Real, currently-open remote job listings — see app/jobs.py. Cached
 * server-side, so this is cheap to call from every page that shows jobs. */
export async function fetchJobs(signal?: AbortSignal): Promise<{ items: RemoteJob[]; total: number }> {
  return getJson(`/api/jobs`, signal);
}

export async function fetchJob(id: string, signal?: AbortSignal): Promise<RemoteJob | null> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`/api/jobs/${id} failed: HTTP ${res.status}`);
  return res.json();
}

/* ---------------- WebSocket protocol types ---------------- */
// Matches the docstring in the backend's `app/main.py: ws_feed`.

export type WsServerMessage =
  | { type: "initial"; items: FeedItem[] }
  | { type: "new_item"; item: FeedItem }
  | { type: "more_items"; items: FeedItem[]; next_cursor: number; has_more: boolean }
  | { type: "pong" }
  | { type: "error"; message: string };

export type WsClientMessage =
  | { type: "ping" }
  | { type: "set_category"; category: string }
  | { type: "load_more"; cursor: number; page_size?: number; category?: string };

export function feedSocketUrl(category: string): string {
  return `${WS_BASE_URL}/ws/feed?category=${encodeURIComponent(category)}`;
}