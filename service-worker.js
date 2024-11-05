const CACHE_NAME = 'v1';
const urlsToCache = [
    '/test/', // Include this to cache the directory
    '/test/index.html', 
    '/test/css/bootstrap.min.css', 
    '/test/service-worker.js',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
    '/test/logo-89.png'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
            .catch(function(error) {
                console.error('Failed to cache:', error);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request).catch(() => caches.match('/test/index.html'));
        })
    );
});

self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
