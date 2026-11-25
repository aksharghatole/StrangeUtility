const {test}=require('node:test');const assert=require('node:assert/strict');const server=require('./server.cjs');
test('HTTP room lifecycle, authenticated signaling and QR generation',async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const root='http://127.0.0.1:'+server.address().port;const controllers=[];const post=async(p,b)=>{const r=await fetch(root+'/api/'+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return {status:r.status,...await r.json()};};async function stream(p){const c=new AbortController();controllers.push(c);const r=await fetch(root+'/api/events?'+new URLSearchParams({code:p.code,token:p.token}),{signal:c.signal});assert.equal(r.status,200);return r.body.getReader();}async function wait(reader,needle){let data='';while(!data.includes(needle)){const {value,done}=await reader.read();assert.equal(done,false);data+=Buffer.from(value).toString();}return data;}try{const health=await fetch(root+'/health');assert.equal(health.status,200);assert.deepEqual(await health.json(),{ok:true});const html=await fetch(root);assert.equal(html.headers.get('x-frame-options'),'DENY');assert.match(html.headers.get('content-security-policy'),/form-action 'self'/);assert.match(await html.text(),/DeviceBridge/);assert.equal((await fetch(root+'/api/create',{method:'POST',body:'{}'})).status,400);assert.equal((await post('create',null)).status,400);const a=await post('create',{name:'Laptop'});assert.equal(a.status,200);assert.match(a.code,/^[A-Z2-9]{10}$/);const ar=await stream(a);await wait(ar,'Laptop');const b=await post('join',{code:a.code,name:'Phone'});assert.equal(b.status,200);const br=await stream(b);await wait(br,'Phone');await wait(ar,'Phone');assert.equal((await post('signal',{code:a.code,token:'wrong',to:b.id,kind:'offer',data:{}})).status,401);assert.equal((await post('signal',{code:a.code,token:a.token,to:b.id,kind:'offer',data:{}})).status,400);assert.equal((await post('signal',{code:a.code,token:a.token,to:b.id,kind:'offer',data:{type:'offer',sdp:'test'}})).status,200);assert.match(await wait(br,'event: signal'),/test/);const qr=await fetch(root+'/api/qr?invite='+encodeURIComponent(root+'/?join='+a.code));assert.equal(qr.status,200);assert.match(await qr.text(),/<svg/);assert.equal((await post('leave',b)).status,200);assert.equal((await post('leave',a)).status,200);assert.equal((await post('join',{code:a.code,name:'Other'})).status,404);}finally{for(const c of controllers)c.abort();server.closeAllConnections();await new Promise(r=>server.close(r));}});

test('ZIP writer: stored entries, checksums, safe paths and duplicate names',async()=>{
 const {makeZip,safeName}=require('./public/zip.js');
 assert.equal(safeName('../evil/../../x.txt'),'evil/x.txt');
 const data=await makeZip([{name:'../x.txt',blob:new Blob(['123456789'])},{name:'x.txt',blob:new Blob([])}]);
 const bytes=Buffer.from(await data.arrayBuffer());
 assert.equal(bytes.readUInt32LE(0),0x04034b50);
 assert.equal(bytes.readUInt32LE(14),0xcbf43926);
 assert.equal(bytes.readUInt32LE(18),9);
 assert.equal(bytes.subarray(30,35).toString(),'x.txt');
 assert.ok(bytes.includes(Buffer.from('x.txt (2)')));
 assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50);
 assert.equal(bytes.readUInt16LE(bytes.length-12),2);
 await assert.rejects(makeZip([]),/Select/);
});
