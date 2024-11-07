// Name and version for the cache
const CACHE_NAME = 'dairy-shed-cache-v2';

// Files to be cached
const CACHE_FILES = [
    '/',
    '/index.html', // Make sure this points to your main HTML file
    '/css/styles.css', // Update with your CSS path if any
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    '/js/app.js', // Update with your JavaScript path if applicable
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
    'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.0.3/dexie.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
    'https://i.postimg.cc/htZPjx5g/logo-89.png' // Update if using other resources
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            for (const file of CACHE_FILES) {
                try {
                    const response = await fetch(file, { mode: 'no-cors' });
                    if (response.ok || response.type === 'opaque') {
                        await cache.put(file, response);
                    } else {
                        console.warn(`Failed to cache ${file}: Response was not ok.`);
                    }
                } catch (error) {
                    console.error(`Failed to fetch and cache ${file}:`, error);
                }
            }
        })()
    );
});

// Fetch Cached Content
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    }
                    return networkResponse;
                });
            }).catch((error) => {
                console.error('Fetch failed; returning offline page instead.', error);
                return caches.match('/offline.html'); // Optional: fallback page
            })
    );
});

// Activate the Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Sync the form data and PDFs when the device is back online
self.addEventListener('sync', async (event) => {
    if (event.tag === 'sync-forms') {
        event.waitUntil(syncFormDataWithFirebase());
    }
});

// Function to sync form data and PDFs with Firebase
async function syncFormDataWithFirebase() {
    const db = new Dexie("OfflineData");
    db.version(2).stores({
        forms: "++id, dairyNumber, formData, pdfBlob",
        drafts: "++id, dairyNumber, formData, photos, timestamp"
    });

    try {
        const offlineForms = await db.forms.toArray();
        for (const record of offlineForms) {
            const dairyNumber = record.dairyNumber;
            const pdfBlob = record.pdfBlob;

            // Upload the PDF to Firebase
            const timestamp = new Date().toISOString().split('T')[0];
            const fileName = `${dairyNumber}-form-${timestamp}.pdf`;
            const storageRef = firebase.storage().ref(`customers/${dairyNumber}/${fileName}`);

            await storageRef.put(pdfBlob);
            console.log(`Form with dairyNumber ${dairyNumber} synced with Firebase`);

            // Remove the synced record from IndexedDB
            await db.forms.delete(record.id);
        }
    } catch (error) {
        console.error('Error syncing data with Firebase:', error);
    }
}
