const CACHE_NAME = 'dairy-shed-cache-v8'; // Incremented version
const CACHE_FILES = [
    './index.html',
    './service-worker.js',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
    'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.0.3/dexie.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

// Additional cache for dynamic content
const DYNAMIC_CACHE = 'dairy-shed-dynamic-cache-v2';

// Install Event - Caching Static Assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install Event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching App Shell');
                return cache.addAll(CACHE_FILES);
            })
            .catch((error) => {
                console.error('[Service Worker] Failed to cache during install', error);
            })
    );
    self.skipWaiting();
});

// Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate Event');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                        console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Handling Network Requests
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // **Ignore non-HTTP(S) requests to prevent errors (e.g., chrome-extension://)**
    if (!['http:', 'https:'].includes(url.protocol)) {
        return; // Do not handle this request
    }

    // **Handle API requests differently if needed**
    // For example, farm_details/*.json can be cached dynamically
    if (url.pathname.startsWith('/farm_details/')) { // Adjusted path
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.match(request).then((response) => {
                    if (response) {
                        console.log(`[Service Worker] Serving from cache: ${request.url}`);
                        return response;
                    }
                    return fetch(request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                            console.log(`[Service Worker] Fetched and cached: ${request.url}`);
                        }
                        return networkResponse;
                    }).catch(() => {
                        console.warn(`[Service Worker] Fetch failed for: ${request.url}`);
                        // Optionally, return a fallback JSON or handle offline scenario
                        return new Response(JSON.stringify({}), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                });
            })
        );
        return;
    }

    // **Handle image requests from Firebase Storage**
    if (url.origin === 'https://firebasestorage.googleapis.com') {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.match(request).then((response) => {
                    if (response) {
                        console.log(`[Service Worker] Serving image from cache: ${request.url}`);
                        return response;
                    }
                    return fetch(request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                            console.log(`[Service Worker] Fetched and cached image: ${request.url}`);
                        }
                        return networkResponse;
                    }).catch(() => {
                        console.warn(`[Service Worker] Fetch failed for image: ${request.url}`);
                        // Optionally, return a fallback image or nothing
                        return new Response(null, { status: 404 });
                    });
                });
            })
        );
        return;
    }

    // **For all other requests, use cache-first strategy**
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log(`[Service Worker] Serving from cache: ${request.url}`);
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        return caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, networkResponse.clone());
                            console.log(`[Service Worker] Fetched and cached: ${request.url}`);
                            return networkResponse;
                        });
                    }
                    return networkResponse;
                }).catch((error) => {
                    console.error(`[Service Worker] Fetch failed for: ${request.url}`, error);
                    // Optionally, return a fallback page or resource
                    return caches.match('./index.html');
                });
            })
    );
});
