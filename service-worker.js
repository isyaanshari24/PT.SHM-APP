const CACHE_NAME = 'ptshm-v1';

const OFFLINE_FILES = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'
];

// Install — cache semua file offline
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_FILES);
    })
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first untuk file lokal, network-first untuk absensi
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Absensi (iframe) — selalu dari network, jangan di-cache
  if (url.includes('isyaanshari24.github.io/PT.SHM')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // File lokal — cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Simpan ke cache kalau berhasil fetch
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
