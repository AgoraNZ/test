self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('dairy-shed-cache').then(function(cache) {
            return cache.addAll([
                '/',
                '/index.html',
                '/test/service-worker.js',
                'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
                'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
                'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js'
            ]);
        }).catch(function(error) {
            console.error('Failed to cache assets during service worker installation:', error);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        }).catch(function(error) {
            console.error('Failed to fetch:', error);
        })
    );
});
