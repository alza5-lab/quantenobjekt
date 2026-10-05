const CACHE='lostisland-v2';
const ASSETS=[
  './','./index.html','./manifest.webmanifest',
  './apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png',
  './img/stars.jpg','./img/island-base.png','./img/tree-canopy.png','./img/water-mask.png',
  './img/char-bench.png','./img/char-grass.png','./img/char-door.png',
  './img/pet.png','./img/squirrel.png','./img/moon.png','./img/moth.png','./img/bee.png'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('lostisland-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&new URL(e.request.url).origin===location.origin){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
});
