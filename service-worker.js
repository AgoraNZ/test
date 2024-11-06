const CACHE_NAME = 'dairy-shed-checklist-cache';
const urlsToCache = [
    'https://madkiwi98.github.io/test/',
    'https://madkiwi98.github.io/test/index.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request).then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            }).catch(() => {
                return caches.match('index.html');
            })
    );
});
