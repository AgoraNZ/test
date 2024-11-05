// service-worker.js

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install Event processing');

    event.waitUntil(
        caches.open('dairy-shed-cache-v1').then((cache) => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll([
                // Ensure these paths are correct and accessible.
                '/test/', // This should be your main page (index.html).
                '/test/index.html',
                '/test/service-worker.js',
                'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
                'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
                'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
                '/test/styles.css', // Add any additional styles or scripts that are locally hosted.
            ]).catch((error) => {
                console.error('[Service Worker] Failed to cache all files', error);
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    console.log('[Service Worker] Fetching resource: ', event.request.url);

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                console.log('[Service Worker] Found in cache', event.request.url);
                return response;
            }

            console.log('[Service Worker] Fetching from network', event.request.url);
            return fetch(event.request).catch((error) => {
                console.error('[Service Worker] Network request failed', error);
            });
        })
    );
});
