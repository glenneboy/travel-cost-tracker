/**
 * Service Worker for Travel Cost Tracker PWA
 * Lightweight version optimized for mobile performance
 */

const CACHE_NAME = 'tct-v3';
const ESSENTIAL_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js'
];

// Quick install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ESSENTIAL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Fast activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
            ))
            .then(() => self.clients.claim())
    );
});

// Network-first (faster on mobile with good connection)
self.addEventListener('fetch', (event) => {
    // Skip API calls
    if (event.request.url.includes('script.google.com')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache in background, don't block
                if (response.status === 200 && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});