const CACHE_NAME = 'expedition33-planner-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './css/main.css',
  './css/themes.css',
  './css/responsive.css',
  './js/app.js',
  './js/modules/character-builder.js',
  './js/modules/pictos-manager.js',
  './js/modules/party-composer.js',
  './js/modules/damage-calculator.js',
  './js/modules/collectibles-tracker.js',
  './js/modules/data-manager.js',
  './js/modules/storage.js',
  './js/utils/validators.js',
  './js/utils/formatters.js',
  './js/utils/constants.js',
  './data/characters.json',
  './data/weapons.json',
  './data/pictos.json',
  './data/luminas.json',
  './data/skills.json',
  './data/attributes.json',
  './data/collectibles.json',
  './data/synergies.json',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources during install:', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response because it's a stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.error('Fetch failed:', error);

          // Return offline fallback for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }

          throw error;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for data updates (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Placeholder for background data synchronization
  return Promise.resolve();
}

// Push notification handler (optional)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Something has happened',
    icon: './assets/icons/icon-192x192.png',
    badge: './assets/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Planner',
        icon: './assets/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './assets/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Expedition 33 Planner', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Update available notification
self.addEventListener('updatefound', event => {
  const newWorker = event.target.installing;

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed') {
      if (navigator.serviceWorker.controller) {
        // New update available
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE'
            });
          });
        });
      }
    }
  });
});