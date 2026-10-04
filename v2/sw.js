// Quantenobjekt 2 – Service Worker (Scope /quantenobjekt/v2/), Version 72d64bb7
// Netzwerk zuerst für HTML/Manifest (immer aktuell), Cache zuerst für Icons. Nutzt NUR den eigenen Cache.
const PREFIX='quantenobjekt2-', CACHE=PREFIX+'72d64bb7';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url); if(url.origin!==location.origin || !url.pathname.startsWith(new URL('./',self.registration.scope).pathname)) return;
  const fresh=req.mode==='navigate' || /\.(html|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if(fresh){
    e.respondWith(fetch(req).then(res=>{ if(res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); } return res; })
      .catch(()=>caches.open(CACHE).then(c=>c.match(req,{ignoreSearch:true}).then(r=>r||c.match('./index.html')))));
  } else {
    e.respondWith(caches.open(CACHE).then(c=>c.match(req,{ignoreSearch:true}).then(r=>r||fetch(req).then(res=>{ if(res.ok) c.put(req,res.clone()); return res; }))));
  }
});
