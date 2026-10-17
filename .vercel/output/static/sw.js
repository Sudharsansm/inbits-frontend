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

const CACHE_VERSION = "inbits-v5";
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
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
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

// FIX: navigations (the actual HTML document) used to be served
// stale-while-revalidate — cache first, instantly, and only refresh the
// cache quietly in the background. That's fine for a pure static shell,
// but this app's HTML is server-rendered with real feed data baked into
// it for first paint (see feedLoader.ts / the route `loader`s). Serving
// a *cached* copy of that document instantly means the very first thing
// a reader sees on reopening the app/PWA is whatever snapshot happened
// to be on screen the last time the network was reached — old articles,
// stale counts, sometimes a half-broken error page if that's what got
// cached — with real content only swapping in a moment later once
// useLiveFeed's socket/REST fallback catches up. That's exactly the
// "shows old data first" symptom. Network-first fixes it: always try
// the network for the document itself (bounded to a short timeout so a
// dead connection doesn't hang the app open), and only fall back to
// whatever's cached — or the offline page — when the network genuinely
// isn't reachable. The cache is still kept warm on every successful
// fetch purely as that offline fallback, never as the primary source.
const NAVIGATION_NETWORK_TIMEOUT_MS = 3000;

function networkFirst(request, onOffline) {
  return caches.open(CACHE_VERSION).then((cache) => {
    const networkFetch = fetch(request).then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    });

    // Prevent an unhandled-rejection warning if the network loses the
    // race below and then fails anyway — the cache-put above already
    // only runs on success, so there's nothing else to do with it here.
    networkFetch.catch(() => {});

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("navigation-timeout")), NAVIGATION_NETWORK_TIMEOUT_MS),
    );

    return Promise.race([networkFetch, timeout]).catch(() =>
      cache.match(request).then((cached) => cached ?? onOffline()),
    );
  });
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
    event.respondWith(networkFirst(request, () => caches.match(OFFLINE_URL)));
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
