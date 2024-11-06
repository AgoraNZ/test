const CACHE_NAME = 'dairy-shed-hygiene-cache-v2';
const urlsToCache = [
    '/',
    '/test/index.html', // Updated to include /test/ prefix
    '/test/service-worker.js', // Updated to include /test/ prefix
    '/test/assets/css/bootstrap.min.css', // Updated paths for assets
    '/test/assets/images/logo-89.png',
    // Remove or adjust external URLs to avoid CORS issues
    // Consider hosting essential assets locally within /test/ if possible
];

// Install event: Cache necessary files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to cache during install:', error);
            })
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    // Remove old caches
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    console.log('Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// Fetch event: Serve cached content when offline
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Cache hit - return the response
                    return response;
                }

                // Clone the request as it's a stream and can only be consumed once
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone the response as it's a stream and can only be consumed once
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(error => {
                                console.error('Failed to cache after fetch:', error);
                            });

                        return networkResponse;
                    }
                ).catch(() => {
                    // Fallback content if fetch fails (optional)
                    if (event.request.destination === 'document') {
                        return caches.match('/test/index.html'); // Updated to include /test/ prefix
                    }
                });
            })
    );
});
