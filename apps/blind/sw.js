const CACHE='strangeutility-blind-v1';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg'];
const urls=new Set(FILES.map(f=>new URL(f,self.registration.scope).href));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(new URL(f,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('strangeutility-blind-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET'||new URL(req.url).origin!==location.origin||!req.url.startsWith(self.registration.scope))return;
 if(req.mode!=='navigate'&&!urls.has(req.url))return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const res=await fetch(req);if(res.ok&&urls.has(req.url))await cache.put(req,res.clone());return res}catch(err){return (await cache.match(req))||(req.mode==='navigate'?await cache.match('./index.html'):null)||Response.error()}})());
});