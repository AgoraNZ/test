const CACHE_NAME = 'dairy-shed-checklist-v1';
const urlsToCache = [
    '/',
    '/index.html',  // Assuming this is your main HTML file in the root of the repo
    '/bootstrap.min.css', // Example CSS file, replace with correct paths for your files
    '/script.js', // Replace with the path for your JavaScript file
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;  // Return cached version if available
                }
                return fetch(event.request);  // Otherwise fetch from network
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
