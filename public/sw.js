const CACHE_NAME = 'drive-sim-runtime-v29';
const APP_SHELL_CACHE = [
  '/assets/style.css',
  '/assets/app.js',
  '/assets/mobile-experience.js',
  '/assets/ui-layout.js',
  '/assets/mesh-merge.js',
  '/assets/audio-engine.js',
  '/assets/sky.js',
  '/assets/car-model.js',
  '/assets/corolla-model.js',
  '/assets/cb400-model.js',
  '/assets/i18n.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/zh/manifest.webmanifest',
  '/en/manifest.webmanifest',
  '/ja/manifest.webmanifest',
];

// Code and config used to be served as immutable for a year under fixed URLs, so
// browsers may still hold old copies they consider fresh. Every fetch of those from
// here skips the HTTP cache; otherwise a new app.js could be paired with a stale
// module it no longer matches. Images keep normal caching: they are large and a
// changed map ships under a new file name.
const IMAGE_PATH = /\.(?:webp|jpe?g|png|gif|svg|ico)$/i;

function fetchFresh(request) {
  const url = new URL(typeof request === 'string' ? request : request.url, self.location.href);
  return IMAGE_PATH.test(url.pathname) ? fetch(request) : fetch(request, { cache: 'no-cache' });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(APP_SHELL_CACHE.map(async (path) => {
        const response = await fetchFresh(path);
        if (!response.ok) throw new Error(`App shell request failed: ${path} (${response.status})`);
        await cache.put(path, response);
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

function isHtmlRequest(request) {
  return request.mode === 'navigate'
    || request.destination === 'document'
    || (request.headers.get('accept') || '').includes('text/html');
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetchFresh(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isHtmlRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (
    event.request.destination === 'script'
    || event.request.destination === 'style'
    || event.request.destination === 'manifest'
    || event.request.destination === 'image'
  ) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      const fetchPromise = fetchFresh(event.request)
        .then((response) => {
          cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cachedResponse) {
        event.waitUntil(fetchPromise);
        return cachedResponse;
      }

      const networkResponse = await fetchPromise;
      if (networkResponse) return networkResponse;
      return fetchFresh(event.request);
    })());
    return;
  }

  event.respondWith(networkFirst(event.request));
});
