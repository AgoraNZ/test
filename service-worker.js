const CACHE_NAME = 'dairy-shed-cache-v2';
const urlsToCache = [
  '/test/', // Root page
  '/test/index.html', // HTML page
  '/test/service-worker.js', // Service worker script itself
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css', // Bootstrap CSS
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js', // jsPDF
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js', // jsPDF AutoTable
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js', // Firebase App
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js', // Firebase Storage
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js', // Firebase Firestore
  '/test/logo-89.png' // Logo image
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.error('Failed to cache', url, err);
            });
          })
        );
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
