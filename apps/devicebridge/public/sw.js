'use strict';
// Cache only the versioned public shell. Never intercept signaling, QR codes or files.
const CACHE='devicebridge-shell-v2.0.0';
const SHELL=['/','/app.js','/zip.js','/style.css','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(p=>new Request(p,{cache:'reload'}))))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('devicebridge-shell-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin)return;
 if(r.mode==='navigate'&&u.pathname==='/'){event.respondWith(caches.open(CACHE).then(async c=>(await c.match('/'))||fetch(r)));return;}
 if(SHELL.includes(u.pathname)&&!u.search)event.respondWith(caches.open(CACHE).then(async c=>(await c.match(u.pathname))||fetch(r)));
});

self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});if(clients.length)await clients[0].focus();else await self.clients.openWindow('/');})());});
