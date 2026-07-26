const CACHE_NAME = 'nh-pwa-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS = ['/', OFFLINE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // iOS Safari relies on byte-range requests for video/audio playback. Let media
  // requests go straight to the network so the browser receives proper 206
  // Partial Content responses instead of an app-shell/offline fallback.
  if (
    request.headers.has('range') ||
    request.destination === 'video' ||
    request.destination === 'audio'
  ) {
    return;
  }

  if (request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL))
  );
});
