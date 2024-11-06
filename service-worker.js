// service-worker.js

const CACHE_NAME = 'dairy-shed-cache-v2';
const urlsToCache = [
    '/', // Cache the root
    '/index.html', // Cache the main HTML file
    '/assets/css/bootstrap.min.css',
    '/assets/css/styles.css',
    '/assets/js/bootstrap.bundle.min.js',
    '/assets/js/dexie.min.js',
    '/assets/js/jspdf.umd.min.js',
    '/assets/js/jspdf.plugin.autotable.min.js',
    '/assets/js/script.js',
    '/assets/images/logo-89.png',
    '/assets/images/Picture3.jpg',
    '/fallback.html' // Fallback page
];

// Install event - cache essential assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(function(error) {
                console.error('Failed to cache resources during install:', error);
            })
    );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') {
        // Only handle GET requests
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Check if response is valid
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                // Open the cache and store the response
                caches.open(CACHE_NAME)
                    .then(function(cache) {
                        cache.put(event.request, responseToCache);
                    })
                    .catch(function(error) {
                        console.error('Failed to cache the response:', error);
                    });

                return response;
            })
            .catch(function() {
                // If network request fails, try to serve from cache
                return caches.match(event.request)
                    .then(function(response) {
                        if (response) {
                            return response;
                        }
                        // Optionally, return a fallback page or image
                        if (event.request.destination === 'document') {
                            return caches.match('/fallback.html');
                        }
                    });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if (!cacheWhitelist.includes(cacheName)) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
});
