// v4 - network first for HTML, cache for assets only
const CACHE = 'mcgano-plex-v4';

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // NEVER cache the main HTML file - always fetch fresh
  if (url.includes('mcgano-plex.html')) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  // Always go to network for data APIs
  if (url.includes('docs.google.com') || 
      url.includes('sheets.googleapis.com') ||
      url.includes('drive.googleapis.com') ||
      url.includes('themoviedb.org') ||
      url.includes('omdbapi.com') ||
      url.includes('accounts.google.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }
  
  // Cache fonts and icons
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
