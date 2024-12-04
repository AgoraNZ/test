const CACHE_NAME = 'dairy-shed-cache-v2';
const urlsToCache = [
    // Local files
    '/',
    '/index.html',
    '/styles.css', // If you have a separate CSS file
    '/service-worker.js',

    // Images
    'https://i.postimg.cc/htZPjx5g/logo-89.png',
    'https://i.postimg.cc/htZPjx5g/Picture3.jpg', // The logo used in the PDF

    // External CSS and JS libraries
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.0.3/dexie.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',

    // Firebase scripts
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',

    // Fonts (if any)
    // e.g., 'https://fonts.googleapis.com/css?family=Roboto',

    // Any other assets that are required for the app to function and display correctly
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(function (error) {
                console.error('Failed to cache resources:', error);
            })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                // Cache hit - return the response from the cached version
                if (response) {
                    return response;
                }
                // IMPORTANT: Clone the request. A request is a stream and can only be consumed once.
                // Because we are consuming this once by cache and once by the browser for fetch, we need to clone it.
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function (response) {
                        // Check if we received a valid response
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        // IMPORTANT: Clone the response. A response is a stream and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need to clone it so we have two streams.
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function (cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            }).catch(function () {
                // If both the network and the cache fail, show a generic fallback:
                return caches.match('/index.html');
            })
    );
});

self.addEventListener('activate', function (event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys()
            .then(function (cacheNames) {
                return Promise.all(
                    cacheNames.map(function (cacheName) {
                        if (cacheWhitelist.indexOf(cacheName) === -1) {
                            console.log('Deleting cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
});
