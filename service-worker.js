const CACHE_NAME = 'dairy-shed-checklist-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
    'https://i.postimg.cc/htZPjx5g/logo-89.png'
];

// Install service worker and cache necessary files
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate service worker and clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
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

// Fetch handler to serve cached files when offline
self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('/farm_details/') || event.request.url.includes('/customers/')) {
        // Network-first approach for Firebase data
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    if (response && response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(DATA_CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(function() {
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache-first approach for static assets
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    return response || fetch(event.request);
                })
        );
    }
});

// Listen for messages from the main script for saving the PDF offline
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SAVE_PDF_OFFLINE') {
        savePDFOffline(event.data.dairyNumber, event.data.pdfBlob);
    }
});

// Function to save PDF offline for later sync
async function savePDFOffline(dairyNumber, pdfBlob) {
    try {
        const dbPromise = idb.open('pdf-store', 1, upgradeDB => {
            if (!upgradeDB.objectStoreNames.contains('pdfs')) {
                upgradeDB.createObjectStore('pdfs', { keyPath: 'id' });
            }
        });

        const db = await dbPromise;
        const tx = db.transaction('pdfs', 'readwrite');
        const store = tx.objectStore('pdfs');
        await store.put({
            id: dairyNumber,
            pdfBlob: pdfBlob,
            timestamp: Date.now()
        });

        console.log('PDF saved offline successfully');
    } catch (error) {
        console.error('Error saving PDF offline:', error);
    }
}

// Sync the saved PDFs when the connection is back
self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-pdfs') {
        event.waitUntil(syncPDFs());
    }
});

// Function to sync PDFs from the indexedDB to Firebase
async function syncPDFs() {
    try {
        const dbPromise = idb.open('pdf-store', 1);
        const db = await dbPromise;
        const tx = db.transaction('pdfs', 'readonly');
        const store = tx.objectStore('pdfs');
        const allPdfs = await store.getAll();

        for (const pdf of allPdfs) {
            const dairyNumber = pdf.id;
            const timestamp = new Date(pdf.timestamp).toISOString().split('T')[0];
            const fileName = `${dairyNumber}-form-${timestamp}.pdf`;
            const storageRef = firebase.storage().ref(`customers/${dairyNumber}/${fileName}`);

            try {
                await storageRef.put(pdf.pdfBlob);
                console.log('PDF synced successfully:', fileName);

                // Remove synced PDF from indexedDB
                const deleteTx = db.transaction('pdfs', 'readwrite');
                const deleteStore = deleteTx.objectStore('pdfs');
                await deleteStore.delete(pdf.id);
            } catch (error) {
                console.error('Error syncing PDF to Firebase:', error);
            }
        }
    } catch (error) {
        console.error('Error syncing PDFs:', error);
    }
}
