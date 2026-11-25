const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {randomBytes,randomUUID,timingSafeEqual} = require('node:crypto');
const QRCode = require('./vendor/QRCode');
const rooms = new Map(), limits = new Map();
const MAX_LIMIT_KEYS=4096, MAX_ROOMS=500, MAX_MEMBERS=6, MAX_JSON=100000;
function allowAttempt(ip,kind,max){const now=Date.now(),key=kind+':'+ip;let entry=limits.get(key);if(!entry||entry.until<=now){if(!entry&&limits.size>=MAX_LIMIT_KEYS)return false;entry={count:0,until:now+60000};limits.set(key,entry);}return ++entry.count<=max;}
function writeStream(p,frame){const s=p.stream;if(!s||s.destroyed||s.writableEnded)return;if(s.writableLength>262144){s.destroy();return;}s.write(frame);}
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code=()=>Array.from(randomBytes(10), b=>alphabet[b%32]).join('');
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const push=(p,type,data)=>writeStream(p,`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
const list=r=>Array.from(r.members.values()).filter(p=>p.stream).map(({id,name})=>({id,name}));
const broadcast=r=>{const peers=list(r); for(const p of r.members.values())push(p,'peers',peers);};
function remove(r,p){if(p.stream){p.stream.end();p.stream=null;}r.members.delete(p.id);if(r.resets)for(const key of r.resets.keys())if(key.split(':').includes(p.id))r.resets.delete(key);broadcast(r);if(!r.members.size)rooms.delete(r.code);}
async function body(req){if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))throw Error('JSON required');const declared=req.headers['content-length'];if(declared!==undefined&&(!/^\d+$/.test(declared)||Number(declared)>MAX_JSON))throw Object.assign(Error('Request too large'),{status:413});let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>MAX_JSON)throw Object.assign(Error('Request too large'),{status:413});chunks.push(chunk);}const value=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Object required');return value;}
function auth(r,token){if(!r||typeof token!=='string'||!/^[0-9a-f]{48}$/.test(token))return;const candidate=Buffer.from(token,'hex');return Array.from(r.members.values()).find(p=>timingSafeEqual(Buffer.from(p.token,'hex'),candidate));}
const assets={'/sw.js':['sw.js','text/javascript; charset=utf-8'],'/zip.js':['zip.js','text/javascript; charset=utf-8'],'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/manifest.webmanifest':['manifest.webmanifest','application/manifest+json'],'/icon.svg':['icon.svg','image/svg+xml']};
const iceServers=(()=>{try{return JSON.parse(process.env.ICE_SERVERS||'[{"urls":"stun:stun.l.google.com:19302"}]');}catch{return [];}})();
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Frame-Options','DENY');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
 try{
 const u=new URL(req.url,'http://localhost');const route=u.pathname;
 if(route.startsWith('/api/')&&['cross-site','same-site'].includes(req.headers['sec-fetch-site']))return json(res,403,{error:'Cross-origin API requests are not allowed'});
 const ip=req.socket.remoteAddress||'unknown';
 if(req.method==='GET'&&route==='/health')return json(res,200,{ok:true});
 if(req.method==='GET'&&assets[route]){const [file,type]=assets[route];res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});return res.end(fs.readFileSync(path.join(__dirname,'public',file)));}
 if(req.method==='GET'&&route==='/api/config')return json(res,200,{iceServers});
 if(req.method==='GET'&&route==='/api/qr'){
 if(!allowAttempt(ip,'qr',90))return json(res,429,{error:'Too many QR requests'});
 const invite=u.searchParams.get('invite')||'';const target=new URL(invite);if(!['http:','https:'].includes(target.protocol)||invite.length>300)return json(res,400,{error:'Invalid invite'});
 const qr=new QRCode(-1,1);qr.addData(invite);qr.make();const n=qr.getModuleCount();let d='';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))d+=`M${x+4} ${y+4}h1v1h-1z`;res.writeHead(200,{'Content-Type':'image/svg+xml','Cache-Control':'no-store'});return res.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+8} ${n+8}" shape-rendering="crispEdges"><path fill="white" d="M0 0h${n+8}v${n+8}H0z"/><path fill="#111827" d="${d}"/></svg>`);}
 if(req.method==='POST'&&(route==='/api/create'||route==='/api/join')){
 const now=Date.now();if(!allowAttempt(ip,'join',40))return json(res,429,{error:'Too many attempts. Try again in a minute.'});
 const b=await body(req);let r;if(route==='/api/create'){if(rooms.size>=MAX_ROOMS)return json(res,503,{error:'Server busy'});let c;do{c=code();}while(rooms.has(c));r={code:c,members:new Map()};rooms.set(c,r);}else{r=rooms.get(String(b.code||'').toUpperCase().replace(/[^A-Z0-9]/g,''));if(!r)return json(res,404,{error:'Room not found. Check the code.'});}
 if(r.members.size>=MAX_MEMBERS)return json(res,409,{error:'Room is full (6 devices).'});const p={id:randomUUID(),name:String(b.name||'Device').trim().slice(0,40)||'Device',token:randomBytes(24).toString('hex'),stream:null,last:now};r.members.set(p.id,p);return json(res,200,{code:r.code,id:p.id,token:p.token});}
 if(route==='/api/events'&&req.method==='GET'){
 if(!allowAttempt(ip,'events',180))return json(res,429,{error:'Too many connection attempts'});
 const r=rooms.get(u.searchParams.get('code'));const token=/^Bearer ([0-9a-f]{48})$/.exec(req.headers.authorization||'')?.[1];const p=u.searchParams.has('token')?undefined:auth(r,token);if(!p)return json(res,401,{error:'Invalid session'});if(p.stream)p.stream.end();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();p.stream=res;p.last=Date.now();push(p,'ready',{id:p.id});broadcast(r);res.on('close',()=>{if(p.stream===res){p.stream=null;p.last=Date.now();broadcast(r);}});return;}
 if(req.method==='POST'&&(route==='/api/signal'||route==='/api/leave')){
 if(!allowAttempt(ip,'signal',1800))return json(res,429,{error:'Too many requests'});
 const b=await body(req);const r=rooms.get(b.code);const p=auth(r,b.token);if(!p)return json(res,401,{error:'Invalid session'});p.last=Date.now();if(route==='/api/leave'){remove(r,p);return json(res,200,{ok:true});}
 const target=r.members.get(b.to);if(!target||target===p||!target.stream)return json(res,404,{error:'Device unavailable'});if(b.kind==='reset'){const now=Date.now();const key=[p.id,target.id].sort().join(':');r.resets??=new Map();if(now-(r.resets.get(key)||0)<1500)return json(res,429,{error:'Retry already requested'});r.resets.set(key,now);push(target,'signal',{from:p.id,kind:'reset'});push(p,'signal',{from:target.id,kind:'reset'});return json(res,200,{ok:true});}if(!['offer','answer','ice'].includes(b.kind)||!b.data||typeof b.data!=='object'||Array.isArray(b.data)||(b.kind==='ice'?typeof b.data.candidate!=='string':b.data.type!==b.kind||typeof b.data.sdp!=='string'))return json(res,400,{error:'Invalid signal'});const now=Date.now();if(!p.signalLimit||p.signalLimit.until<now)p.signalLimit={count:0,until:now+60000};if(++p.signalLimit.count>600)return json(res,429,{error:'Signaling rate limit reached'});push(target,'signal',{from:p.id,kind:b.kind,data:b.data});return json(res,200,{ok:true});}
 return json(res,404,{error:'Not found'});
 }catch(e){if(!res.headersSent)json(res,e.status===413?413:400,{error:e.status===413?'Request too large':'Invalid request'});else res.end();}
});
server.headersTimeout=15000;
server.requestTimeout=30000;
server.keepAliveTimeout=5000;
server.maxHeadersCount=64;
const timer=setInterval(()=>{let now=Date.now();for(const r of rooms.values())for(const p of r.members.values()){if(p.stream)writeStream(p,': heartbeat\n\n');else if(now-p.last>120000)remove(r,p);}for(const [ip,l] of limits)if(l.until<now)limits.delete(ip);},15000);timer.unref();
if(require.main===module)server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('DeviceBridge listening on port '+(process.env.PORT||3000)));
module.exports=server;
