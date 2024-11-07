const CACHE_NAME = 'dairy-shed-cache-v6';
const CACHE_FILES = [
    './index.html',
    './service-worker.js',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
    'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.0.3/dexie.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
    'https://i.postimg.cc/htZPjx5g/logo-89.png'
];

// Additional cache for dynamic content
const DYNAMIC_CACHE = 'dairy-shed-dynamic-cache-v1';

// Install Event - Caching Static Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(CACHE_FILES);
            })
            .catch((error) => {
                console.error('Failed to cache during install', error);
            })
    );
    self.skipWaiting();
});

// Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
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
    const requestUrl = new URL(event.request.url);

    // Handle API requests differently if needed
    // For example, farm_details/*.json can be cached dynamically
    if (requestUrl.pathname.startsWith('/test/farm_details/')) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
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

    // Handle image requests from Firebase Storage
    if (requestUrl.origin === 'https://firebasestorage.googleapis.com') {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Optionally, return a fallback image
                        return caches.match('https://i.postimg.cc/htZPjx5g/logo-89.png');
                    });
                });
            })
        );
        return;
    }

    // For all other requests, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        return caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    }
                    return networkResponse;
                }).catch((error) => {
                    console.error('Fetch failed, serving offline page', error);
                    return caches.match('./index.html');
                });
            })
    );
});
