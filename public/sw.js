const CACHE_NAME    = "tradebook-v2";
const STATIC_ASSETS = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // ── Skip in development — never intercept Vite dev server ──
  if (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.port === "5173"
  ) return;

  // Only handle GET requests
  if (e.request.method !== "GET") return;

  // Skip Supabase API — always fetch live
  if (url.hostname.includes("supabase.co")) return;

  // Skip WebSocket upgrades
  if (e.request.headers.get("upgrade") === "websocket") return;

  // Skip browser-extension and non-http requests
  if (!url.protocol.startsWith("http")) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type !== "opaque") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached ?? new Response("Offline", { status: 503 }));
      return cached ?? fetchPromise;
    })
  );
});