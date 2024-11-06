// Define a cache name. Update the version to force cache updates.
const CACHE_NAME = 'dairy-shed-hygiene-cache-v1';

// List of assets to cache during the installation of the Service Worker.
// Ensure all paths are correct relative to the Service Worker's location.
const urlsToCache = [
    '/test/index.html',
    '/test/service-worker.js',
    '/test/assets/css/bootstrap.min.css',
    '/test/assets/js/firebase-app-compat.js',
    '/test/assets/js/firebase-storage-compat.js',
    '/test/assets/js/firebase-firestore-compat.js',
    '/test/assets/js/dexie.min.js',
    '/test/assets/js/jspdf.umd.min.js',
    '/test/assets/js/jspdf.plugin.autotable.min.js',
    '/test/assets/images/logo-89.png',
    // Add any additional assets you want to cache here
];

// Install Event - Cache essential assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Install Event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching all assets');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[Service Worker] Failed to cache assets during install:', error);
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate Event');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cache => {
                        if (cache !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .catch(error => {
                console.error('[Service Worker] Failed to delete old caches during activate:', error);
            })
    );
});

// Fetch Event - Serve cached assets when offline
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Asset found in cache, return it
                    return response;
                }

                // Clone the request as it's a stream and can only be consumed once
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then(networkResponse => {
                        // Check for a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone the response as it's a stream
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                                console.log('[Service Worker] New asset cached:', event.request.url);
                            })
                            .catch(error => {
                                console.error('[Service Worker] Failed to cache new asset:', error);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Optional: Fallback page if both cache and network are unavailable
                        if (event.request.destination === 'document') {
                            return caches.match('/test/index.html');
                        }
                    });
            })
    );
});

// Listen for messages from the client (optional)
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
