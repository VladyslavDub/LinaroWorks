const CACHE = "naryad-v2";
const ASSETS = [
  "./", "./index.html", "./config.js", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png",
  "./js/app.js", "./js/constants.js", "./js/i18n.js", "./js/helpers.js", "./js/supabaseClient.js",
  "./js/state.js", "./js/auth.js", "./js/entries.js", "./js/timeEntries.js", "./js/profiles.js", "./js/render.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache Supabase API calls — always go to network for live data
  if (url.hostname.includes("supabase.co")) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((res) => {
          if (res.ok && e.request.method === "GET") {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
