const CACHE_NAME = 'dairy-shed-checklist-cache-v2';
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

// Store pending uploads for offline use
let pendingUploads = [];

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
            return response || fetch(event.request).catch(() => {
                return caches.match('/index.html');
            });
        })
    );
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-pdf-uploads') {
        event.waitUntil(syncPendingPDFUploads());
    }
});

async function syncPendingPDFUploads() {
    // Iterate over pending uploads and attempt to upload them to Firebase
    for (let i = 0; i < pendingUploads.length; i++) {
        const { dairyNumber, pdfBlob, timestamp } = pendingUploads[i];
        try {
            const fileName = `${dairyNumber}-form-${timestamp}.pdf`;
            const storageRef = firebase.storage().ref(`customers/${dairyNumber}/${fileName}`);
            await storageRef.put(pdfBlob);
            console.log(`PDF for ${dairyNumber} uploaded successfully`);
            pendingUploads.splice(i, 1); // Remove successfully uploaded file from pending
            i--; // Adjust index after removal
        } catch (error) {
            console.error('Error uploading PDF:', error);
        }
    }
}

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'store-pdf-offline') {
        pendingUploads.push(event.data.payload);
        self.registration.sync.register('sync-pdf-uploads');
    }
});
