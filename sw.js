const CACHE = 'mcgano-plex-v3';
const ASSETS = [
  '/mcgano-plex/mcgano-plex.html',
  '/mcgano-plex/manifest.json',
  '/mcgano-plex/icon-192.png',
  '/mcgano-plex/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Courier+Prime:wght@400;700&display=swap'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for Sheet data, cache first for app shell
self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // Always go to network for Google Sheets / TMDB / OMDB data
  if (url.includes('docs.google.com') || 
      url.includes('sheets.googleapis.com') ||
      url.includes('themoviedb.org') ||
      url.includes('omdbapi.com') ||
      url.includes('accounts.google.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  
  // Cache first for app shell and assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/mcgano-plex/mcgano-plex.html'));
    })
  );
});
