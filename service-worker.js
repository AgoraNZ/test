// Cache version and files to cache
const CACHE_NAME = 'dairy-shed-hygiene-checklist-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.0.3/dexie.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
  // Include any other essential files for offline functionality here
];

// Install event: cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: clear old caches if any
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve cached files if offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) {
          return response;
        } else {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Sync event: handle background sync for unsent data
self.addEventListener('sync', async (event) => {
  if (event.tag === 'syncOfflineData') {
    event.waitUntil(syncOfflineData());
  }
});

// Function to sync offline data from IndexedDB to Firebase
async function syncOfflineData() {
  const db = new Dexie("OfflineData");
  db.version(2).stores({
    forms: "++id, dairyNumber, formData, pdfBlob",
    drafts: "++id, dairyNumber, formData, photos, timestamp",
    farmDetails: "++id, dairyNumber, details"
  });

  // Retrieve offline forms, drafts, and farm details to sync with Firebase
  const forms = await db.forms.toArray();
  const drafts = await db.drafts.toArray();
  const farmDetails = await db.farmDetails.toArray();

  // Handle Firebase uploading for each dataset (implement Firebase logic in main code)
  for (const form of forms) {
    uploadToFirebase(form.dairyNumber, form.pdfBlob);  // Define this in main code
    await db.forms.delete(form.id);
  }

  for (const draft of drafts) {
    uploadToFirebase(draft.dairyNumber, draft.formData); // Define this in main code
    await db.drafts.delete(draft.id);
  }

  for (const detail of farmDetails) {
    uploadToFirebase(detail.dairyNumber, detail.details); // Define this in main code
    await db.farmDetails.delete(detail.id);
  }
}
