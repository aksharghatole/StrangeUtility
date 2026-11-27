importScripts('./offline-assets.js');
const {version,files}=self.POCKETSCAN_ASSETS,prefix='strangeutility-pocketscan-',cacheName=prefix+version,scope=self.registration.scope;
const allowed=new Set(files.map(path=>new URL(path,scope).href));
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(cacheName);await cache.addAll(files.map(path=>new Request(new URL(path,scope),{cache:'reload'})))} )()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||!allowed.has(req.url))return;event.respondWith((async()=>{const cache=await caches.open(cacheName);return await cache.match(req)||fetch(req)})())});
