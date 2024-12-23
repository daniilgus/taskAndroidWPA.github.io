const CACHE_NAME = 'task-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/authorization.html',
    '/Administrator.html',
    '/registration.html',
    '/img.jpg',
    '/style.css', // Если у вас есть файл стилей
    // Добавьте другие файлы, которые нужно кэшировать
];

// Установка кэша
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
    );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
    console.log('Service Worker: Fetching...', event.request.url);
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем ответ из кэша, если он есть, иначе делаем сетевой запрос
                return response || fetch(event.request);
            })
    );
});

// Обновление кэша
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
