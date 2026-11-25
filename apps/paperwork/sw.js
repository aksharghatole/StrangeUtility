/* Only the Paperwork shell and packaged dependencies are cached, never documents. */
importScripts('./offline-assets.js');
const {version,files}=self.PAPERWORK_ASSETS;
const PREFIX='strangeutility-paperwork-';
const CACHE=PREFIX+version;
const scope=self.registration.scope;
const allowed=new Set(files.map(file=>new URL(file,scope).href));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(files.map(file=>new Request(new URL(file,scope),{cache:'reload'})));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||!req.url.startsWith(scope)||!allowed.has(req.url))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  return (await cache.match(req))||fetch(req);
 })());
});
