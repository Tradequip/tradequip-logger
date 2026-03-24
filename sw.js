// TradeQuip Service Worker v5
const CACHE = 'tradequip-v5';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Always fetch from network — no caching of HTML
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
