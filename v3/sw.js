// Quantenobjekt 3 – Service Worker (nur Scope v3/, Version 070029f4)
const PREFIX='quantenobjekt-v3-', CACHE=PREFIX+'070029f4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())); });
// nur eigene alte v3-Caches löschen – v1/v2-Caches bleiben unberührt
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin || !url.pathname.startsWith(new URL('./',self.registration.scope).pathname)) return;
  // Netzwerk zuerst für die Seite (Updates), Cache als Offline-Fallback; Assets cache-first
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(res=>{ const cp=res.clone(); caches.open(CACHE).then(c=>c.put('./index.html',cp)); return res; })
      .catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{
    if(res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); } return res; })));
});
