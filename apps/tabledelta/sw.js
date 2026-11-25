const CACHE='strangeutility-tabledelta-shell-v4';
const ROOT=new URL('./',self.location.href);
const URLS=['./','index.html','style.css','app.mjs','core.mjs'].map(p=>new URL(p,ROOT).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(URLS.map(url=>new Request(url,{cache:'reload'})));})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('strangeutility-tabledelta-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!URLS.includes(event.request.url))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(event.request.url);return cached||fetch(event.request);})());
});
