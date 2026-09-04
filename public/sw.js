// InBits service worker.
//
// Scope, on purpose: this only ever caches things that are safe to serve
// stale — the app shell (HTML) for offline/slow-network access, and
// fingerprinted static assets (JS/CSS/icons, which Vite renames on every
// build, so a cached one is never wrong). It never caches API data.
//
// FIX: `/api/feed`, `/api/jobs`, `/api/article/*` used to be cached here
// too (first stale-while-revalidate, then a network-first-with-fallback
// version). Both turned out to be the wrong idea for this app: every one
// of the app's own refresh mechanisms (the WebSocket's REST fallback,
// pull-to-refresh, the 20s auto-poll in useLiveFeed, and the
// visibilitychange/pageshow refresh on reopen) calls `fetch("/api/feed")`
// under the hood, and *any* caching layer in front of that — service
// worker or the browser's own HTTP cache — could silently answer those
// calls with old data instead of a real network round trip. That's also
// why an installed app and a plain Chrome tab could show identical,
// stale content: they share one Cache Storage per origin.
//
// The fix is simply not caching this data at all, anywhere: these
// requests are left alone below (not intercepted), so they go straight
// to the network exactly as `lib/api.ts` sends them — which also sets
// `cache: "no-store"` itself, bypassing the browser's native HTTP cache
// too. The backend is the single source of truth for this data; nothing
// in the frontend keeps its own copy of it across requests.

const CACHE_VERSION = "inbits-v4";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  );
}

/** Respond from cache immediately if present; either way, kick off a
 * network fetch that updates the cache for the *next* request. Used for
 * navigations (the HTML shell) only — never for API data, see the NOTE
 * at the top of this file. */
function staleWhileRevalidate(request, onNoCacheNoNetwork) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => undefined);

      if (cached) {
        // Don't block the response on the network at all — that's the
        // whole point on a slow connection. Let it update the cache
        // quietly in the background instead.
        networkFetch.catch(() => {});
        return cached;
      }

      return networkFetch.then((response) => response ?? onNoCacheNoNetwork());
    }),
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API calls: deliberately not intercepted at all. Not caching them,
  // not falling back to a cached copy — this service worker has nothing
  // to do with them, they go straight to the network. See the NOTE at
  // the top of this file for why.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      staleWhileRevalidate(request, () => caches.match(OFFLINE_URL)),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});