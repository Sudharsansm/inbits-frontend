// InBits service worker.
//
// Strategy — tuned for "open the app on a slow connection and see the
// same content instantly", the way installed apps like YouTube behave:
//
// - Navigations (HTML pages): stale-while-revalidate. If a cached copy of
//   this URL exists, respond with it IMMEDIATELY — don't wait on the
//   network at all — then fetch a fresh copy in the background to update
//   the cache for next time. Only fall back to actually waiting on the
//   network when there's nothing cached yet (a genuinely first-ever
//   visit), and only fall back to offline.html when that network request
//   also fails. This is a deliberate change from the previous
//   network-first strategy: network-first means a slow connection makes
//   *every* open wait for a slow response before the browser even
//   considers the cache, which is the exact opposite of "instant".
// - `/api/feed`, `/api/jobs`, `/api/article/*` (GET): same
//   stale-while-revalidate idea, applied to the JSON the app renders
//   instead of just the HTML shell. A repeat app open can now paint real
//   articles from the last cached response before the network has said
//   anything, while a background fetch quietly refreshes it — the live
//   WebSocket in useLiveFeed still layers real-time updates on top once
//   it connects.
// - Static assets (/assets/*, icons, fonts): cache-first, unchanged —
//   Vite fingerprints these filenames and they never change in place.

const CACHE_VERSION = "inbits-v2";
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

// The one set of GET endpoints worth serving stale-instantly: the data
// that actually paints Home/Updates/Jobs. Deliberately NOT search or
// health/translate — those are either per-query or wrong to serve stale.
function isCacheableApi(url) {
  return (
    url.pathname === "/api/feed" ||
    url.pathname === "/api/jobs" ||
    url.pathname.startsWith("/api/article/") ||
    url.pathname.startsWith("/api/jobs/")
  );
}

/** Respond from cache immediately if present; either way, kick off a
 * network fetch that updates the cache for the *next* request. Falls
 * back to `onNoCacheNoNetwork()` only when there's neither a cached
 * response nor a successful network response. */
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

  if (request.mode === "navigate") {
    event.respondWith(
      staleWhileRevalidate(request, () => caches.match(OFFLINE_URL)),
    );
    return;
  }

  if (isCacheableApi(url)) {
    event.respondWith(
      staleWhileRevalidate(
        request,
        () => new Response(JSON.stringify({ items: [], total: 0 }), {
          headers: { "content-type": "application/json" },
        }),
      ),
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
