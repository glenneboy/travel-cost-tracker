/**
 * Service Worker for Travel Cost Tracker PWA
 * Handles offline functionality and caching
 */

const CACHE_NAME = 'travel-cost-tracker-v2'; // UPDATED VERSION - forces cache refresh
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
    console.log('🔧 Service Worker: Installing v2...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('✅ Service Worker: Installed v2');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activating v2...');
    
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
                console.log('✅ Service Worker: Activated v2');
                return self.clients.claim();
            })
    );
});

// Fetch event - Network first for app.js to ensure we get updates
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Skip Google Apps Script requests - always go to network
    if (request.url.includes('script.google.com')) {
        return;
    }
    
    // Network first strategy for JavaScript files to ensure updates
    if (request.url.endsWith('.js')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the updated version
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    return response;
                })
                .catch(() => {
                    // Fall back to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }
    
    // Cache first for other assets
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
