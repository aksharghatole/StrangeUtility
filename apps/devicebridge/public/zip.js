'use strict';
// Dependency-free ZIP32 writer (stored entries, UTF-8 names, CRC32). No network.
(function(root){
 const CAP=240*1024*1024, COUNT=2000, enc=new TextEncoder();
 const table=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);return c>>>0;});
 function safeName(name){return String(name||'file').replace(/\\/g,'/').split('/').filter(p=>p&&p!=='.'&&p!=='..').map(p=>p.replace(/[\u0000-\u001f\u007f:]/g,'_').slice(0,200)).join('/')||'file';}
 async function crc(blob){let c=0xffffffff;for(let i=0;i<blob.size;i+=1048576){const b=new Uint8Array(await blob.slice(i,i+1048576).arrayBuffer());for(const n of b)c=table[(c^n)&255]^(c>>>8);}return (c^0xffffffff)>>>0;}
 function header(n){const bytes=new Uint8Array(n),d=new DataView(bytes.buffer);return {bytes,u16:(p,v)=>d.setUint16(p,v,true),u32:(p,v)=>d.setUint32(p,v,true)};}
 async function makeZip(entries,onProgress=()=>{}){
  if(!Array.isArray(entries)||!entries.length||entries.length>COUNT)throw Error('Select 1–2,000 files.');
  if(entries.some(e=>!(e.blob instanceof Blob)))throw Error('Invalid archive input.');
  if(entries.reduce((n,e)=>n+e.blob.size,0)>CAP)throw Error('ZIP batch limit is 240 MiB.');
  const local=[],central=[],used=new Set();let offset=0,centralSize=0;
  for(let i=0;i<entries.length;i++){
   const {blob}=entries[i],base=safeName(entries[i].name);let name=base,k=2;
   while(used.has(name))name=base+' ('+k+++')';
   used.add(name);const nb=enc.encode(name);if(nb.length>4096)throw Error('File path too long.');
   const sum=await crc(blob),size=blob.size,l=header(30),c=header(46);
   l.u32(0,0x04034b50);l.u16(4,20);l.u16(6,0x800);l.u16(12,33);l.u32(14,sum);l.u32(18,size);l.u32(22,size);l.u16(26,nb.length);
   c.u32(0,0x02014b50);c.u16(4,20);c.u16(6,20);c.u16(8,0x800);c.u16(14,33);c.u32(16,sum);c.u32(20,size);c.u32(24,size);c.u16(28,nb.length);c.u32(42,offset);
   local.push(l.bytes,nb,blob);central.push(c.bytes,nb);offset+=30+nb.length+size;centralSize+=46+nb.length;
   if(offset+centralSize+22>CAP+8*1024*1024)throw Error('Archive too large.');
   onProgress(i+1,entries.length);
  }
  const end=header(22);end.u32(0,0x06054b50);end.u16(8,entries.length);end.u16(10,entries.length);end.u32(12,centralSize);end.u32(16,offset);
  return new Blob([...local,...central,end.bytes],{type:'application/zip'});
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={makeZip,safeName};else root.DeviceBridgeZip={makeZip};
})(globalThis);
