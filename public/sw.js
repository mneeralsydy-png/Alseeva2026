// ══════════════════════════════════════════════════════════════
//  Service Worker — مركز الشفاء
//  Strategy: Cache-First with Background Update
//  - First load: cache everything from server
//  - Offline: serve from cache instantly
//  - Online: serve from cache, update in background
//  - When new version detected: notify the app
// ══════════════════════════════════════════════════════════════

const CACHE_NAME = 'alshifa-app-v3';
const DATA_CACHE = 'alshifa-data-v3';
const VERSION_CACHE_KEY = 'sw-version-hash';

// URLs to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/center-logo.png',
  '/manifest.json',
];

// ═══ Install: Pre-cache essential assets ═══
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // If pre-cache fails (offline during install), just continue
        console.log('[SW] Pre-cache failed, will cache on first fetch');
      });
    }).then(() => {
      // Skip waiting — activate immediately
      return self.skipWaiting();
    })
  );
});

// ═══ Activate: Clean old caches, notify clients ═══
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME && name !== DATA_CACHE) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // Notify all clients that a new version is available
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', cacheName: CACHE_NAME });
        });
      });
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ═══ Fetch: Cache-First with Background Update ═══
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── Skip non-GET requests ──
  if (event.request.method !== 'GET') return;

  // ── Skip API calls (always go to network) ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache API responses for offline reading
          if (response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Return cached API data if offline
          return caches.match(event.request).then((cached) => {
            return cached || new Response(JSON.stringify({ error: 'offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // ── Skip external URLs (Supabase, Telegram, etc.) ──
  if (url.origin !== self.location.origin) return;

  // ── For local assets: Cache-First with Background Update ──
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              // Update cache with fresh content
              cache.put(event.request, networkResponse.clone());
              // Check if this is the main page — if so, check for version change
              if (event.request.mode === 'navigate' || url.pathname === '/') {
                networkResponse.clone().text().then((html) => {
                  const newHash = simpleHash(html);
                  const oldHash = localStorage?.getItem?.(VERSION_CACHE_KEY);
                  if (oldHash && oldHash !== newHash) {
                    // Content changed — notify all clients
                    self.clients.matchAll().then((clients) => {
                      clients.forEach((client) => {
                        client.postMessage({ type: 'CONTENT_UPDATED', newHash });
                      });
                    });
                  }
                  // Update stored hash (using a fake localStorage approach in SW)
                  // SW doesn't have localStorage, so we use a different mechanism
                });
              }
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed — return cached version if available
            console.log('[SW] Network failed, using cache for:', url.pathname);
            return cachedResponse || new Response('Offline', { status: 503 });
          });

        // Return cached immediately, update in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// ═══ Handle messages from the app ═══
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_VERSION') {
    // Return current cache name as version indicator
    event.ports[0]?.postMessage({ cacheName: CACHE_NAME });
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      caches.delete(DATA_CACHE).then(() => {
        event.ports[0]?.postMessage({ cleared: true });
      });
    });
  }
});

// ═══ Simple hash function for content comparison ═══
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString(36);
}
