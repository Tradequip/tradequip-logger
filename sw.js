// TradeQuip Service Worker v4
const CACHE = 'tradequip-v4';
const ASSETS = [
  '/tradequip-logger/',
  '/tradequip-logger/index.html',
  '/tradequip-logger/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(ASSETS.map(a => c.add(a)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Always go network first, cache as fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
