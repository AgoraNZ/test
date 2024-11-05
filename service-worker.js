const CACHE_NAME = 'dairy-shed-checklist-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/service-worker.js',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        // Handle fetch errors by falling back to cache if available
        return caches.match('/index.html');
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pdf-uploads') {
    event.waitUntil(
      syncPendingPDFUploads()
    );
  }
});

async function syncPendingPDFUploads() {
  // Assuming you have a way to access any locally stored PDFs that were not uploaded
  // Iterate over each and upload it to Firebase
}
