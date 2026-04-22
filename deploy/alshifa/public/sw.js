// Service Worker for مركز الشفاء
const CACHE_NAME = 'alshifa-v2';

self.addEventListener('install', (event) => {
  // Skip waiting and activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Don't cache API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // For static assets, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline', { status: 503 });
        });
      })
  );
});
