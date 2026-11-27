/*
 * Service worker: makes the app work OFFLINE after the first visit.
 *
 * Strategy ("cache first, then network"):
 *   - On install, we pre-cache the app shell (the entry HTML + manifest + icons).
 *   - On every request, we answer from the cache if we can; otherwise we fetch
 *     from the network and store a copy for next time.
 *
 * Bump CACHE_VERSION whenever you deploy a new build so users get the update.
 */
const CACHE_VERSION = 'fishbone-v1';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  // Pre-cache the shell, then activate immediately.
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete caches from older versions so storage doesn't pile up.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle simple GET requests for our own origin.
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          const copy = response.clone(); // a response body can only be read once
          caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
          return response;
        })
    )
  );
});
