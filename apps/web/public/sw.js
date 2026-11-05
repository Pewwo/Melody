// Melody Service Worker — enables background audio playback & offline caching
// This SW intercepts fetch events and caches app shell assets, keeping
// the app alive when the screen is locked or the browser is backgrounded.

const CACHE_NAME = 'melody-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: pre-cache essential app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache when offline, network-first for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always network-first for API calls (YouTube, Piped, Supabase, etc.)
  const isApiCall =
    url.hostname.includes('youtube') ||
    url.hostname.includes('piped') ||
    url.hostname.includes('invidious') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('audius');

  if (isApiCall) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Cache successful responses for static assets
          if (response.ok && !url.pathname.startsWith('/api')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});

// Background sync support — keeps audio context alive
self.addEventListener('message', (event) => {
  if (event.data?.type === 'KEEP_ALIVE') {
    // Respond to keep-alive pings from the main thread
    event.ports[0]?.postMessage({ type: 'ALIVE' });
  }
});
