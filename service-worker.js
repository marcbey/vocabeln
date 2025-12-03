const CACHE_VERSION = 'v1';
const CACHE_NAME = `vokabeln-cache-${CACHE_VERSION}`;

const OFFLINE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles.css',
  './app.js',
  './vocab_data.js',
  './irregular_vocab_data.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
].map(path => new URL(path, self.location).toString());

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
      return fetch(request);
    }

    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    } catch (err) {
      if (request.mode === 'navigate') {
        const fallback = await caches.match(new URL('./index.html', self.location));
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
