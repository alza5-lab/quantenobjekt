// EYE CORE – Service Worker (network-first, eigener Scope ./eyecore/)
const CACHE = 'eyecore-v5';
const ASSETS = ['./', './index.html', './main.js', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png',
  './lib/three.module.min.js', './lib/addons/postprocessing/EffectComposer.js', './lib/addons/postprocessing/RenderPass.js', './lib/addons/postprocessing/UnrealBloomPass.js',
  './lib/addons/postprocessing/ShaderPass.js', './lib/addons/postprocessing/OutputPass.js', './lib/addons/postprocessing/MaskPass.js', './lib/addons/postprocessing/Pass.js',
  './lib/addons/shaders/CopyShader.js', './lib/addons/shaders/LuminosityHighPassShader.js', './lib/addons/shaders/OutputShader.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('eyecore-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || !url.pathname.includes('/eyecore/')) return;
  e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
