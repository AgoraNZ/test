// service-worker.js

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
    // Add any new assets here
];

// Dynamic cache for runtime caching
const DYNAMIC_CACHE = 'dairy-shed-dynamic-cache-v2';

// Utility function to limit cache size
const limitCacheSize = async (cacheName, maxSize) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxSize) {
        await cache.delete(keys[0]);
        await limitCacheSize(cacheName, maxSize);
    }
};

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

    // Ignore non-HTTP(S) requests
    if (!['http:', 'https:'].includes(url.protocol)) {
        return;
    }

    // Handle index.html with Network-First Strategy
    if (url.pathname === '/' || url.pathname === '/index.html') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    // Update cache with the latest index.html
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }

    // Handle API requests (e.g., farm_details/*.json) with Network-First Strategy
    if (url.pathname.startsWith('/farm_details/')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse.ok) {
                        return caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, networkResponse.clone());
                            return networkResponse;
                        });
                    }
                    throw new Error('Network response was not ok.');
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || new Response(JSON.stringify({}), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                })
        );
        return;
    }

    // Handle images from Firebase Storage and other cross-origin images dynamically
    if (url.origin === 'https://firebasestorage.googleapis.com' || url.origin === 'https://i.postimg.cc') {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.match(request).then((response) => {
                    return response || fetch(request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                            limitCacheSize(DYNAMIC_CACHE, 50); // Limit dynamic cache size
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Optionally, return a fallback image or nothing
                        return new Response(null, { status: 404 });
                    });
                });
            })
        );
        return;
    }

    // Handle CSS and JS files with Stale-While-Revalidate Strategy
    if (request.destination === 'style' || request.destination === 'script') {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.match(request).then((response) => {
                    const fetchPromise = fetch(request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                            limitCacheSize(DYNAMIC_CACHE, 50);
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Network request failed, proceed with cached response
                        return response;
                    });
                    // Return cached response immediately, and update cache in background
                    return response || fetchPromise;
                });
            })
        );
        return;
    }

    // For all other requests, use Cache-First Strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        return caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, networkResponse.clone());
                            limitCacheSize(DYNAMIC_CACHE, 50); // Limit dynamic cache size
                            return networkResponse;
                        });
                    }
                    return networkResponse;
                }).catch((error) => {
                    console.error(`[Service Worker] Fetch failed for: ${request.url}`, error);
                    // Optionally, return a fallback page or resource
                    if (request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                    return new Response(null, { status: 404 });
                });
            })
    );
});
