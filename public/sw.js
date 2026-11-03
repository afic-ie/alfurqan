// Offline support for the whole app.
// - Pages and the published data: network first, cached copy when offline.
// - Everything else (scripts, styles, fonts, images, hashed by the build):
//   cache first, refreshed in the background.
// Bump CACHE when the caching rules change; old caches are removed.
const CACHE = 'alfurqan-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const networkFirst = req.mode === 'navigate' || url.pathname.endsWith('/data/published.json') || url.pathname.endsWith('.webmanifest');
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    if (networkFirst) {
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? (await cache.match(new URL('./', url).href)) : null) || new Response('Offline', { status: 503 });
      }
    }
    const cached = await cache.match(req, { ignoreSearch: true });
    const refresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return cached || (await refresh) || new Response('Offline', { status: 503 });
  }));
});
