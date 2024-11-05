const CACHE_NAME = 'dairy-shed-checklist-cache-v6';
const DATA_CACHE_NAME = 'data-cache-v6';
const urlsToCache = [
    '/test/',
    '/test/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
    '/test/logo.png' // Update to use a locally cached logo
];

// Install service worker and cache files
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(function (error) {
                console.error('Failed to cache resources during install', error);
            })
    );
    self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', function (event) {
    if (event.request.mode !== 'navigate') {
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                    return response || fetch(event.request)
                        .catch(function () {
                            return new Response('Offline: Resource not available', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                })
        );
    } else {
        event.respondWith(
            fetch(event.request)
                .catch(function () {
                    return caches.match('/test/index.html');
                })
        );
    }
});
