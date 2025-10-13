self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'AI Platform Status';
    const options = {
      body: data.body || 'New incident detected',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      tag: data.data?.incident_id || 'incident',
      requireInteraction: data.notification_type === 'incident_started',
      vibrate: data.notification_type === 'incident_started' ? [200, 100, 200] : [100],
      data: {
        url: data.data?.url || '/',
        incident_id: data.data?.incident_id,
        provider_id: data.data?.provider_id,
        provider_name: data.data?.provider_name,
        notification_type: data.data?.notification_type,
      },
      actions: [
        {
          action: 'view',
          title: 'View Details',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';
  const providerId = event.notification.data?.provider_id;

  let targetUrl = url;
  if (providerId && event.action === 'view') {
    targetUrl = `${url}?provider=${providerId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrlObj = new URL(targetUrl, self.location.origin);

          if (clientUrl.origin === targetUrlObj.origin && 'focus' in client) {
            client.focus();
            if (providerId) {
              client.postMessage({
                type: 'NAVIGATE_TO_PROVIDER',
                providerId: providerId,
              });
            }
            return client;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

const CACHE_NAME = 'ai-status-monitor-v2.0.0';
const RUNTIME_CACHE = 'ai-status-runtime-v2.0.0';
const IMAGE_CACHE = 'ai-status-images-v2.0.0';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

const CACHE_STRATEGIES = {
  api: 'network-first',
  static: 'cache-first',
  images: 'cache-first'
};

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.log('Cache install failed:', err))
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== IMAGE_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.origin === location.origin && url.pathname.startsWith('/functions/')) {
    event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
  }
  else if (event.request.destination === 'image') {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
  }
  else if (url.origin === location.origin) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
  }
});

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. Please check your connection.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}
