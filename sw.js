/* 読書リーダー：ホーム画面のアプリとして、ネットがなくても開けるようにする。
   - ページ・スクリプト・設定：ネットがあれば最新を取り、取れたものを手元にとっておく（なければ、手元のもの）
   - フォント・演出の画像：一度取ったら、ずっと手元のものを使う（大きいので）
   - 外の部品（Tailwind・FontAwesome・Google Fonts など）：手元のものをすぐ出して、うしろで最新に入れ替える
   - Drive・VOICEVOX・書き込み（POST など）には、さわらない
   版を変えると、古い手元のものを全部捨てる。 */
const VERSION = 'v1';
const CORE = 'yomimono-core-' + VERSION, RUNTIME = 'yomimono-rt-' + VERSION;
const PRECACHE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const CDN = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('yomimono-') && k !== CORE && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip-waiting') self.skipWaiting(); });

async function put(req, res) { try { const c = await caches.open(RUNTIME); await c.put(req, res.clone()); } catch (e) {} return res; }
async function networkFirst(req) {
  try { const res = await fetch(req); if (res && res.ok) put(req, res); return res; }
  catch (e) {
    const hit = await caches.match(req, { ignoreSearch: false });
    if (hit) return hit;
    if (req.mode === 'navigate') { const idx = await caches.match('index.html') || await caches.match('./'); if (idx) return idx; }
    throw e;
  }
}
async function cacheFirst(req) {
  const hit = await caches.match(req); if (hit) return hit;
  const res = await fetch(req); if (res && res.ok) put(req, res); return res;
}
async function staleWhileRevalidate(req) {
  const hit = await caches.match(req);
  const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) put(req, res); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/sw.js')) return;
    if (/\/(fonts|fx\/a)\//.test(url.pathname) && !/\.txt$/.test(url.pathname)) { e.respondWith(cacheFirst(req)); return; }
    e.respondWith(networkFirst(req)); return;
  }
  if (CDN.includes(url.hostname)) e.respondWith(staleWhileRevalidate(req));
});
