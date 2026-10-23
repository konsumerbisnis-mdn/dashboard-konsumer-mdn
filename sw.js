/* Service worker Dashboard Konsumer: membuat web bisa dipasang sebagai aplikasi dan terbuka cepat.
   - Halaman, JS, CSS: ambil dari jaringan (selalu versi terbaru); bila offline pakai salinan terakhir.
   - Gambar, suara, font, pustaka CDN: pakai salinan lokal dulu, diperbarui di belakang.
   - Panggilan data ke Google Apps Script TIDAK pernah disimpan (data & login selalu langsung ke server). */
const V = "ksm-pwa-v1", CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (req, res) => { if (res && (res.ok || res.type === "opaque")) { const c = res.clone(); caches.open(V).then(ch => ch.put(req, c)).catch(() => {}); } return res; };
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url), same = u.origin === location.origin;
  if (!same && !CDN.test(r.url)) return;                     // termasuk script.google.com: langsung ke jaringan
  if (same && u.pathname.endsWith("/sw.js")) return;
  const shell = same && (r.mode === "navigate" || /\.(html|js|css|webmanifest)$/.test(u.pathname) || u.pathname.endsWith("/"));
  if (shell) {
    e.respondWith(fetch(r).then(res => put(r, res)).catch(() => caches.match(r).then(m => m || (r.mode === "navigate" ? caches.match("./") || caches.match("index.html") : undefined))));
    return;
  }
  e.respondWith(caches.match(r).then(m => { const net = fetch(r).then(res => put(r, res)).catch(() => m); return m || net; }));
});
