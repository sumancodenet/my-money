// Minimal service worker to enable PWA installability (desktop shortcut / install).
// Pass-through: does not cache, so no stale content.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle the request normally.
  event.respondWith(fetch(event.request));
});
