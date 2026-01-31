/**
 * Service Worker for Travel Cost Tracker PWA
 * Handles offline functionality and caching
 */

const CACHE_NAME = 'travel-cost-tracker-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('✅ Service Worker: Installed');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Skip Google Apps Script requests - always go to network
    if (request.url.includes('script.google.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('📦 Service Worker: Serving from cache:', request.url);
                    return cachedResponse;
                }
                
                console.log('🌐 Service Worker: Fetching from network:', request.url);
                return fetch(request)
                    .then((response) => {
                        // Cache successful responses
                        if (response && response.status === 200) {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                        }
                        return response;
                    });
            })
            .catch((error) => {
                console.error('❌ Service Worker: Fetch failed:', error);
                // Return offline page if available
                return caches.match('/index.html');
            })
    );
});

// Background sync event (for future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-entries') {
        console.log('🔄 Service Worker: Background sync triggered');
        event.waitUntil(syncEntries());
    }
});

// Helper function for background sync
async function syncEntries() {
    // This would communicate with the main app to sync queued entries
    // For now, it's a placeholder for future enhancement
    console.log('🔄 Syncing queued entries...');
}