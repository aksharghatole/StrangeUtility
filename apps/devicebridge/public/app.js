'use strict';
const $=id=>document.getElementById(id),MAX=256*1024*1024,DISK_MAX=1024*1024*1024,WINDOW=1024*1024,CHUNK=32768;
let session,events,config,peers=new Map(),names=new Map(),queued=[],activities=new Set(),timer,busy=false;
const el=(tag,cls,text)=>{let n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const btn=(text,fn,cls='secondary')=>{let b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
const fmt=n=>n>=1048576?`${(n/1048576).toFixed(1)} MiB`:n>=1024?`${(n/1024).toFixed(1)} KiB`:`${n} B`;
function notice(t){$('notice').textContent=t;$('notice').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('notice').hidden=true,5000);}
async function api(route,data){let r=await fetch('/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),j=await r.json();if(!r.ok)throw Error(j.error);return j;}
async function copy(t){try{await navigator.clipboard.writeText(t);notice('Copied');}catch{let a=el('textarea');a.value=t;document.body.append(a);a.select();let ok=document.execCommand('copy');a.remove();if(ok)notice('Copied');else prompt('Copy this text:',t);}}
let defaultName=/Android|iPhone|iPad/i.test(navigator.userAgent)?'My phone':'My computer';$('name').value=localStorage.getItem('bridge-name')||defaultName;$('roomInput').value=(new URL(location.href).searchParams.get('join')||'').slice(0,14);
const pref=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v);}catch{return null;}};
const theme=()=>{const light=pref('bridge-theme')==='light';document.documentElement.dataset.theme=light?'light':'dark';$('theme').textContent=light?'Dark mode':'Light mode';};
$('theme').onclick=()=>{pref('bridge-theme',document.documentElement.dataset.theme==='light'?'dark':'light');theme();};theme();
let log=[];try{const saved=JSON.parse(pref('bridge-history')||'[]');if(Array.isArray(saved))log=saved.slice(0,100);}catch{}
function renderHistory(){const list=$('savedHistory');list.replaceChildren();$('historyEnabled').checked=pref('bridge-history-enabled')==='yes';for(const entry of log){const row=el('div','history-row');row.append(el('strong','',String(entry.name)),el('small','',String(entry.direction)+' · '+fmt(Number(entry.size)||0)+' · '+new Date(entry.when).toLocaleString()));list.append(row);}if(!log.length)list.append(el('p','empty','No saved file history.'));}
function recordFile(name,size,direction){if(pref('bridge-history-enabled')!=='yes')return;log.unshift({name,size,direction,when:Date.now()});log=log.slice(0,100);pref('bridge-history',JSON.stringify(log));renderHistory();}
$('historyEnabled').onchange=()=>{pref('bridge-history-enabled',$('historyEnabled').checked?'yes':'no');if(!$('historyEnabled').checked){log=[];pref('bridge-history','[]');}renderHistory();};
$('clearHistory').onclick=()=>{log=[];pref('bridge-history','[]');renderHistory();};renderHistory();
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installApp').hidden=false;});
window.addEventListener('appinstalled',()=>{installPrompt=null;$('installApp').hidden=true;notice('DeviceBridge installed');});
$('installApp').onclick=async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;$('installApp').hidden=true;try{await prompt.prompt();}catch(e){notice(e.message);}};
$('installHelp').onclick=()=>notice('To install, use your browser menu: Add to Home Screen or Install app, if available.');
function networkState(){$('offlineBanner').hidden=navigator.onLine;}
window.addEventListener('online',networkState);window.addEventListener('offline',networkState);networkState();
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
let zipBusy=false;
function updateBatch(){const n=Array.from(activities).filter(a=>a.fileBlob).length;$('downloadZip').disabled=zipBusy||n<1;$('downloadZip').textContent='Download ZIP'+(n?' ('+n+')':'');}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function makeArchive(entries,onProgress){if(!window.DeviceBridgeZip)throw Error('ZIP tools unavailable. Reload the page.');return DeviceBridgeZip.makeZip(entries,onProgress);}
$('downloadZip').onclick=async()=>{if(zipBusy)return;const entries=Array.from(activities).filter(a=>a.fileBlob).map(a=>({name:a.fileName,blob:a.fileBlob}));if(!entries.length)return;zipBusy=true;updateBatch();try{const archive=await makeArchive(entries,(n,total)=>{$('downloadZip').textContent='Packing '+n+'/'+total;});downloadBlob(archive,'DeviceBridge-received.zip');notice('ZIP ready');}catch(e){notice(e.message);}finally{zipBusy=false;updateBatch();}};
$('folder').onchange=async e=>{const files=Array.from(e.target.files);e.target.value='';if(!files.length||zipBusy)return;const activeSession=session;zipBusy=true;$('folder').disabled=true;updateBatch();try{const archive=await makeArchive(files.map(f=>({name:f.webkitRelativePath||f.name,blob:f})),(n,total)=>{$('folderStatus').textContent='Packing folder '+n+'/'+total;});if(session!==activeSession)return;const root=(files[0].webkitRelativePath||'folder').split('/')[0];addFiles([new File([archive],root+'.zip',{type:'application/zip'})]);notice('Folder packed. Select Send selected files.');}catch(e){notice(e.message);}finally{zipBusy=false;$('folder').disabled=false;$('folderStatus').textContent='';updateBatch();}};
// Room-only shared notes: Lamport revision + author tie-break; no persistent storage.
let note={clock:0,author:'',text:''},noteTimer,notifyEnabled=false,signalOnline=false;
const retryTimers=new Map(),retryCounts=new Map();
const checkpoints=new Map();
let strictPairing=false;
let screen=null,screenPicking=false;
let view='all',unread=0;
const ROOM_MEMORY_LIMIT=512*1024*1024;
let watch=null,watchFile=null,watchUrl=null,watchLoading=false,watchGeneration=0;
function usable(p){return !!p&&!p.closed&&p.dc?.readyState==='open'&&(!strictPairing||p.verified===true);}
function connectedPeers(){return Array.from(peers.values()).filter(usable);}
function broadcastNote(){clearTimeout(noteTimer);if(!note.clock)return;for(const p of connectedPeers())try{send(p,{type:'note',...note});}catch{}}
$('sharedNote').oninput=()=>{if(!session)return;note={clock:note.clock+1,author:session.id,text:$('sharedNote').value.slice(0,4000)};$('noteStatus').textContent='Sharing with connected room members…';clearTimeout(noteTimer);noteTimer=setTimeout(()=>{broadcastNote();$('noteStatus').textContent='Shared note · latest edit wins';},180);};
function receiveNote(m){if(!Number.isSafeInteger(m.clock)||m.clock<1||m.clock>1e9||typeof m.author!=='string'||m.author.length>60||typeof m.text!=='string'||m.text.length>4000)return;if(m.clock<note.clock||(m.clock===note.clock&&m.author<=note.author))return;clearTimeout(noteTimer);note={clock:m.clock,author:m.author,text:m.text};$('sharedNote').value=note.text;$('noteStatus').textContent='Updated from the room';}
$('copyNote').onclick=()=>copy($('sharedNote').value);
$('pasteClipboard').onclick=async()=>{try{if(!navigator.clipboard?.readText)throw Error('Clipboard access unavailable');const text=await navigator.clipboard.readText();$('message').value=text.slice(0,12000);updateButtons();notice(text.length>12000?'Pasted first 12,000 characters':'Clipboard pasted. Tap Send text to share.');}catch{notice('Clipboard permission unavailable. Paste manually into the text box.');$('message').focus();}};
$('enableNotifications').onclick=async()=>{if(notifyEnabled){notifyEnabled=false;$('enableNotifications').textContent='Enable notifications';return;}try{if(!('Notification' in window))throw Error();const permission=await Notification.requestPermission();if(permission!=='granted')throw Error();notifyEnabled=true;$('enableNotifications').textContent='Disable notifications';notice('Notifications enabled for this session');}catch{notice('Browser notifications unavailable or not permitted.');}};
async function transferAlert(){if(!notifyEnabled||!document.hidden)return;try{const reg=await navigator.serviceWorker?.getRegistration();if(reg)await reg.showNotification('DeviceBridge',{body:'New incoming activity. Open the app to review.',tag:'devicebridge-activity'});else new Notification('DeviceBridge',{body:'New incoming activity.'});}catch{}}
function resetRoomTools(){if(watch)stopWatch(watch,'Room left',false);clearWatchFile();if(screen)stopScreen(screen,'Room left',false);for(const id of checkpoints.keys())discardCheckpoint(id,'Room left');clearTimeout(noteTimer);note={clock:0,author:'',text:''};$('sharedNote').value='';$('noteStatus').textContent='Room-only · edits are shared with all connected devices';for(const t of retryTimers.values())clearTimeout(t);retryTimers.clear();retryCounts.clear();signalOnline=false;$('diagnosticResult').textContent='';notifyEnabled=false;$('enableNotifications').textContent='Enable notifications';}
$('diagnostics').onclick=async()=>{const p=chosen();let lines=['Internet: '+(navigator.onLine?'online':'offline'),'Signaling: '+(signalOnline?'connected':'not connected')];if(p){lines.push('Peer: '+p.pc.connectionState,'Data channel: '+(p.dc?.readyState||'unavailable'));try{const stats=await p.pc.getStats();let pair;for(const s of stats.values())if(s.type==='transport'&&s.selectedCandidatePairId)pair=stats.get(s.selectedCandidatePairId);if(pair){const local=stats.get(pair.localCandidateId);if(local?.candidateType)lines.push('Path: '+local.candidateType);if(Number.isFinite(pair.currentRoundTripTime))lines.push('Round trip: '+Math.round(pair.currentRoundTripTime*1000)+' ms');}}catch{}}$('diagnosticResult').textContent=lines.join(' · ');};
function scheduleRetry(p){if(!session||p.closed||!signalOnline||session.id>=p.id||retryTimers.has(p.id)||(retryCounts.get(p.id)||0)>=3)return;const n=retryCounts.get(p.id)||0;retryTimers.set(p.id,setTimeout(()=>{retryTimers.delete(p.id);if(!session||peers.get(p.id)!==p||!signalOnline||p.dc?.readyState==='open')return;retryCounts.set(p.id,n+1);signal(p,'reset',null).catch(()=>scheduleRetry(p));},2000*(n+1)));}
function clearRetry(id){clearTimeout(retryTimers.get(id));retryTimers.delete(id);}
$('reconnect').onclick=async()=>{if(!session||!signalOnline){notice('Signaling is reconnecting. If the room expired, leave and join again.');return;}const candidates=Array.from(peers.values()).filter(p=>p.dc?.readyState!=='open');if(!candidates.length){notice('All visible peer connections are ready, or no peers have joined.');return;}for(const p of candidates){clearRetry(p.id);retryCounts.set(p.id,0);try{await signal(p,'reset',null);}catch(e){notice(e.message);}}};
// Compare the actual WebRTC certificate fingerprints over an independent trusted channel.
async function pairingCode(p){
 const fingerprints=sdp=>[...new Set(Array.from((sdp||'').matchAll(/^a=fingerprint:sha-256 ([0-9a-f:]+)\s*$/gim),m=>m[1].replace(/:/g,'').toLowerCase()).filter(x=>/^[0-9a-f]{64}$/.test(x)))].sort();
 const local=fingerprints(p.pc.localDescription?.sdp),remote=fingerprints(p.pc.remoteDescription?.sdp);
 if(local.length!==1||remote.length!==1||!crypto.subtle)throw Error('Verification unavailable');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(['DeviceBridge verification v1',...local.concat(remote).sort()].join(':')));
 return Array.from(new Uint8Array(bytes).slice(0,8),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase().match(/.{4}/g).join('-');
}
async function prepareVerification(p){try{const code=await pairingCode(p);if(p.closed||peers.get(p.id)!==p)return;p.verifyCode=code;renderDevices();}catch{p.verifyCode='Unavailable';renderDevices();}}
function verifyPeer(p){if(!p||p.closed||p.dc?.readyState!=='open'||!p.verifyCode||p.verifyCode==='Unavailable')return;if(!confirm('Compare this code on the other device in person or over a trusted channel: '+p.verifyCode+'\nOnly confirm if both codes match exactly.'))return;p.verified=true;renderDevices();if(note.clock)try{send(p,{type:'note',...note});}catch{}}
// Separate, consent-based, video-only WebRTC session. No screen capture before a user click.
function screenUI(){
 const active=!!screen,canCapture=typeof navigator.mediaDevices?.getDisplayMedia==='function';
 $('startScreen').disabled=active||screenPicking||!canCapture||!usable(chosen());
 $('startScreen').textContent=screenPicking?'Choose a screen…':'Share screen';
 $('stopScreen').hidden=!active;
 if(!active){$('screenConsent').hidden=true;$('screenVideo').hidden=true;$('screenVideo').srcObject=null;$('screenStatus').textContent=canCapture?'Choose a recipient, then share a screen or window.':'Screen capture is unsupported here; you can still receive a screen.';}
}
function screenMessage(s,kind,data){send(s.peer,{type:'screen',id:s.id,kind,data});}
function stopScreen(s,reason='Screen sharing ended',notifyPeer=true){
 if(!s||screen!==s)return;screen=null;clearTimeout(s.timer);
 if(notifyPeer&&usable(s.peer))try{screenMessage(s,'stop');}catch{}
 if(s.pc){s.pc.onicecandidate=null;s.pc.ontrack=null;s.pc.onconnectionstatechange=null;s.pc.close();}
 for(const track of s.stream?.getTracks()||[])track.stop();
 screenUI();$('screenStatus').textContent=reason;
}
function screenTimeout(s,ms=45000){clearTimeout(s.timer);s.timer=setTimeout(()=>stopScreen(s,'Screen request timed out'),ms);}
function screenPC(s){
 const pc=new RTCPeerConnection(config);s.pc=pc;s.ice=[];s.chain=Promise.resolve();
 pc.onicecandidate=e=>{if(screen===s&&e.candidate)try{screenMessage(s,'ice',e.candidate.toJSON());}catch{stopScreen(s,'Screen connection lost',false);}};
 pc.onconnectionstatechange=()=>{if(screen!==s)return;if(pc.connectionState==='connected'){clearTimeout(s.timer);$('screenStatus').textContent=s.role==='sender'?'Sharing live · stop at any time':'Viewing live screen';}else if(['failed','closed'].includes(pc.connectionState))stopScreen(s,'Screen connection ended');};
 pc.ontrack=e=>{if(screen!==s||s.role!=='viewer'||e.track.kind!=='video'){e.track.stop();return;}const video=$('screenVideo');video.srcObject=new MediaStream([e.track]);video.hidden=false;video.play().catch(()=>{});};
 return pc;
}
$('startScreen').onclick=async()=>{
 const peer=chosen(),room=session;
 if(screen||screenPicking||!usable(peer)||!navigator.mediaDevices?.getDisplayMedia)return;
 screenPicking=true;screenUI();let stream;
 try{
  stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
  if(session!==room||!usable(peer)||screen||!stream.getVideoTracks().length){stream.getTracks().forEach(t=>t.stop());return;}
  // Explicitly strip audio even if a browser supplies it.
  stream.getAudioTracks().forEach(t=>{t.stop();stream.removeTrack(t);});
  const s={id:uid(),role:'sender',peer,stream,stage:'waiting'};screen=s;
  stream.getVideoTracks()[0].addEventListener('ended',()=>stopScreen(s,'Screen capture stopped'),{once:true});
  screenMessage(s,'request');screenTimeout(s);$('screenStatus').textContent='Waiting for recipient approval…';
 }catch(e){if(screen&&screen.stream===stream)stopScreen(screen,'Screen sharing could not start');else stream?.getTracks().forEach(t=>t.stop());notice(e.name==='NotAllowedError'?'Screen sharing cancelled or denied':e.message);}
 finally{screenPicking=false;screenUI();}
};
$('stopScreen').onclick=()=>{if(screen)stopScreen(screen);};
$('acceptScreen').onclick=()=>{const s=screen;if(!s||s.role!=='viewer'||s.stage!=='request')return;try{s.stage='accepted';screenPC(s);$('screenConsent').hidden=true;$('screenStatus').textContent='Connecting to shared screen…';screenMessage(s,'accept');screenTimeout(s);}catch(e){stopScreen(s,'Unable to connect screen: '+e.message);}};
$('declineScreen').onclick=()=>{if(screen)stopScreen(screen,'Screen request declined');};
function receiveScreen(p,m){
 if(typeof m.id!=='string'||!/^[0-9a-f]{24}$/.test(m.id))return;
 if(m.kind==='request'){
  if(screen||screenPicking){try{send(p,{type:'screen',id:m.id,kind:'stop'});}catch{}return;}
  const s={id:m.id,role:'viewer',peer:p,stage:'request'};screen=s;screenUI();$('screenConsent').hidden=false;if(view!=='all')selectView('screenPanel');$('screenStatus').textContent=(names.get(p.id)||'Device')+' wants to share their screen.';screenTimeout(s);transferAlert();return;
 }
 const s=screen;if(!s||s.peer!==p||s.id!==m.id)return;
 if(m.kind==='stop'){stopScreen(s,'Screen sharing ended by peer',false);return;}
 if(m.kind==='accept'&&s.role==='sender'&&s.stage==='waiting'){
  s.stage='negotiating';try{const pc=screenPC(s);for(const track of s.stream.getVideoTracks())pc.addTrack(track,s.stream);s.chain=s.chain.then(async()=>{await pc.setLocalDescription(await pc.createOffer());if(screen===s)screenMessage(s,'offer',pc.localDescription.toJSON());}).catch(()=>stopScreen(s,'Screen negotiation failed'));$('screenStatus').textContent='Connecting to viewer…';screenTimeout(s);}catch{stopScreen(s,'Screen negotiation failed');}return;
 }
 if(!s.pc||!['offer','answer','ice'].includes(m.kind))return;
 s.chain=s.chain.then(async()=>{
  if(screen!==s)return;const pc=s.pc;
  if(m.kind==='ice'){if(pc.remoteDescription)await pc.addIceCandidate(m.data);else if(s.ice.length<128)s.ice.push(m.data);return;}
  if(m.kind==='offer'&&(s.role!=='viewer'||s.stage!=='accepted'))return;
  if(m.kind==='answer'&&(s.role!=='sender'||s.stage!=='negotiating'))return;
  if(m.data?.type!==m.kind||typeof m.data.sdp!=='string'||m.data.sdp.length>100000)return;
  // Never accept an audio or application data section on this video-only connection.
  const media=Array.from(m.data.sdp.matchAll(/^m=([^ ]+) /gm),x=>x[1]);
  if(media.length!==1||media[0]!=='video')throw Error('Unexpected media');
  await pc.setRemoteDescription(m.data);for(const ice of s.ice.splice(0))await pc.addIceCandidate(ice);
  if(m.kind==='offer'){s.stage='negotiating';await pc.setLocalDescription(await pc.createAnswer());if(screen===s)screenMessage(s,'answer',pc.localDescription.toJSON());}else s.stage='connected';
 }).catch(()=>stopScreen(s,'Screen negotiation failed'));
}
// Watch together using independently selected, byte-identical local media.
const watchPlayer=$('watchPlayer'),WATCH_MAX=64*1024*1024;
function watchUI(){
 $('startWatch').disabled=!!watch||watchLoading||!watchFile||!usable(chosen());
 $('stopWatch').hidden=!watch;$('watchFile').disabled=watchLoading||!!(watch&&(watch.role==='host'||watch.stage==='ready'));
 $('watchConsent').hidden=watch?.stage!=='request';
 $('watchUnlock').hidden=watch?.role!=='viewer'||watch.stage!=='ready';
 watchPlayer.controls=!watch||watch.role==='host';
}
function watchSend(w,kind,extra={}){send(w.peer,{type:'watch',id:w.id,kind,...extra});}
function stopWatch(w,reason='Watch session ended',notifyPeer=true){
 if(watch!==w)return;watch=null;clearTimeout(w.timer);clearInterval(w.interval);watchPlayer.pause();watchPlayer.playbackRate=1;
 if(notifyPeer&&usable(w.peer))try{watchSend(w,'stop');}catch{}
 watchUI();$('watchStatus').textContent=reason;
}
function clearWatchFile(){watchGeneration++;watchLoading=false;watchFile=null;watchPlayer.pause();watchPlayer.removeAttribute('src');watchPlayer.load();if(watchUrl)URL.revokeObjectURL(watchUrl);watchUrl=null;$('watchFile').value='';$('watchName').textContent='No media selected';watchUI();}
function watchTimeout(w){clearTimeout(w.timer);w.timer=setTimeout(()=>stopWatch(w,'Watch invitation expired'),120000);}
async function watchDigest(file){if(!crypto.subtle)throw Error('Media comparison requires a secure context');const bytes=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
$('watchFile').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 if(file.size>WATCH_MAX||!(/\.(mp4|webm|mp3|ogg|wav|m4a|aac|flac|ogv)$/i.test(file.name))){notice('Choose a supported audio or video file up to 64 MiB');e.target.value='';return;}
 const gen=++watchGeneration;watchLoading=true;watchUI();$('watchName').textContent='Checking local media…';
 try{
  const digest=await watchDigest(file);if(gen!==watchGeneration)return;
  if(watch?.role==='viewer'&&digest!==watch.digest){$('watchStatus').textContent='Different file. Select the exact same media as the host.';return;}
  if(watchUrl)URL.revokeObjectURL(watchUrl);watchUrl=URL.createObjectURL(file);watchFile={digest,name:file.name,size:file.size};
  watchPlayer.src=watchUrl;watchPlayer.load();$('watchName').textContent=file.name;
  if(watch?.role==='viewer'&&watch.stage==='accepted')viewerReady(watch);
 }catch(e){notice(e.message);}finally{if(gen===watchGeneration){watchLoading=false;watchUI();$('watchName').textContent=watchFile?.name||'No matching media selected';}}
};
function viewerReady(w){if(watch!==w||w.role!=='viewer'||w.stage!=='accepted'||watchFile?.digest!==w.digest)return;w.stage='ready';clearTimeout(w.timer);watchUI();$('watchStatus').textContent='Matching media ready. Enable playback if your browser blocks autoplay.';try{watchSend(w,'ready');}catch{stopWatch(w,'Connection lost',false);}}
function hostState(w){if(watch!==w||w.role!=='host'||w.stage!=='ready'||!Number.isFinite(watchPlayer.currentTime))return;try{watchSend(w,'state',{position:watchPlayer.currentTime,playing:!watchPlayer.paused&&!watchPlayer.ended,rate:watchPlayer.playbackRate});}catch{stopWatch(w,'Connection lost',false);}}
function applyWatchState(w){
 if(watch!==w||!w.state||watchPlayer.readyState<1)return;
 const {position,playing,rate}=w.state;const target=Math.max(0,Math.min(Number.isFinite(watchPlayer.duration)?watchPlayer.duration:position,position));
 if(Math.abs(watchPlayer.currentTime-target)>.65)watchPlayer.currentTime=target;
 watchPlayer.playbackRate=rate;
 if(playing)watchPlayer.play().catch(()=>{$('watchStatus').textContent='Playback blocked. Tap Enable playback.';});else watchPlayer.pause();
}
for(const event of ['play','pause','seeked','ratechange','ended'])watchPlayer.addEventListener(event,()=>{if(watch?.role==='host')hostState(watch);});
watchPlayer.addEventListener('loadedmetadata',()=>{if(watch?.role==='viewer')applyWatchState(watch);});
watchPlayer.addEventListener('error',()=>{$('watchStatus').textContent='This browser could not decode the selected media.';if(watch)stopWatch(watch,'Media decoding failed');});
$('watchUnlock').onclick=()=>{if(watch?.role==='viewer'&&watch.stage==='ready'){const w=watch;watchPlayer.play().then(()=>{if(watch===w&&!w.state?.playing)watchPlayer.pause();}).catch(()=>notice('Playback unavailable'));}};
$('startWatch').onclick=()=>{
 const peer=chosen();if(watch||!watchFile||!usable(peer))return;
 const w={id:uid(),role:'host',peer,stage:'waiting',digest:watchFile.digest};watch=w;watchPlayer.pause();
 try{watchSend(w,'request',{digest:w.digest,name:watchFile.name.slice(0,255),size:watchFile.size});watchTimeout(w);watchUI();$('watchStatus').textContent='Waiting for recipient to accept and select the matching file…';}catch{stopWatch(w,'Could not send invitation',false);}
};
$('acceptWatch').onclick=()=>{const w=watch;if(!w||w.role!=='viewer'||w.stage!=='request')return;w.stage='accepted';watchTimeout(w);watchUI();$('watchStatus').textContent='Select your own copy of the exact same media file.';viewerReady(w);};
$('declineWatch').onclick=()=>{if(watch)stopWatch(watch,'Watch invitation declined');};
$('stopWatch').onclick=()=>{if(watch)stopWatch(watch);};
function receiveWatch(p,m){
 if(typeof m.id!=='string'||!/^[0-9a-f]{24}$/.test(m.id))return;
 if(m.kind==='request'){
  if(watch||typeof m.digest!=='string'||!/^[a-f0-9]{64}$/.test(m.digest)||typeof m.name!=='string'||!Number.isSafeInteger(m.size)||m.size<0||m.size>WATCH_MAX){try{send(p,{type:'watch',id:m.id,kind:'stop'});}catch{}return;}
  const w={id:m.id,role:'viewer',peer:p,stage:'request',digest:m.digest};watch=w;watchPlayer.pause();watchUI();watchTimeout(w);if(view!=='all')selectView('watchPanel');$('watchStatus').textContent=(names.get(p.id)||'Device')+' invites you to watch '+m.name.slice(0,255)+'. Choose Accept to proceed.';transferAlert();return;
 }
 const w=watch;if(!w||w.peer!==p||w.id!==m.id)return;
 if(m.kind==='stop'){stopWatch(w,'Watch session ended by peer',false);return;}
 if(m.kind==='ready'&&w.role==='host'&&w.stage==='waiting'){clearTimeout(w.timer);w.stage='ready';watchUI();$('watchStatus').textContent='Both devices ready · host controls playback';w.interval=setInterval(()=>hostState(w),1000);hostState(w);return;}
 if(m.kind==='state'&&w.role==='viewer'&&w.stage==='ready'&&typeof m.playing==='boolean'&&Number.isFinite(m.position)&&m.position>=0&&Number.isFinite(m.rate)&&m.rate>=.25&&m.rate<=4){w.state={position:m.position,playing:m.playing,rate:m.rate};applyWatchState(w);}
}
const viewIds=['pairPanel','sendPanel','notesPanel','screenPanel','watchPanel','activityPanel'];
function renderView(){
 for(const id of viewIds)$(id).hidden=view!=='all'&&view!==id;
 $('workspace').dataset.view=view;
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
 if(view==='all'||view==='activityPanel')unread=0;
 $('activityBadge').hidden=unread===0;$('activityBadge').textContent=unread>99?'99+':String(unread);
 $('incomingBanner').hidden=unread===0;
}
function selectView(next,focus=false){if(next!=='all'&&!viewIds.includes(next))return;view=next;renderView();if(focus&&next!=='all'){$(next).focus({preventScroll:true});$(next).scrollIntoView({block:'nearest'});}}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>selectView(b.dataset.view,true);
$('incomingBanner').onclick=()=>selectView('activityPanel',true);
function incomingActivity(){if(view==='all'||view==='activityPanel')return;unread++;renderView();}
function retainedBytes(){let total=0;for(const a of activities)total+=a.fileBlob?.size||0;return total;}
function memoryUI(){const n=retainedBytes();$('memoryStatus').textContent=fmt(n)+' retained in this browser · '+fmt(ROOM_MEMORY_LIMIT)+' limit';$('memoryStatus').classList.toggle('near-limit',n>=ROOM_MEMORY_LIMIT*.75);}
function filterActivity(){const q=$('activitySearch').value.trim().toLocaleLowerCase();let count=0;for(const a of activities){const show=!a.done||!q||a.row.textContent.toLocaleLowerCase().includes(q);a.row.hidden=!show;if(show)count++;}$('activityFilterStatus').textContent=q&&count===0?'No matching finished activity.':'';}
$('activitySearch').oninput=filterActivity;
$('clearQueue').onclick=()=>{queued=[];renderQueue();};
const creds=()=>({code:session.code,token:session.token});
function invite(){let u=new URL(location.pathname,location.origin);u.searchParams.set('join',session.code);return u.href;}
async function join(create){if(busy||session)return;if(!navigator.onLine){notice('Connect to the internet to create or join a room.');return;}busy=true;$('create').disabled=true;strictPairing=$('strictPairing').checked;try{if(!window.RTCPeerConnection)throw Error('WebRTC not supported');let name=$('name').value.trim()||defaultName;localStorage.setItem('bridge-name',name);config=await fetch('/api/config').then(r=>r.json());session=await api(create?'create':'join',{name,code:$('roomInput').value});$('welcome').hidden=true;$('workspace').hidden=false;selectView('all');$('roomCode').textContent=session.code.slice(0,5)+'-'+session.code.slice(5);$('qr').src='/api/qr?invite='+encodeURIComponent(invite());events=new EventSource('/api/events?'+new URLSearchParams(creds()));events.addEventListener('peers',e=>updatePeers(JSON.parse(e.data)));events.addEventListener('signal',e=>handleSignal(JSON.parse(e.data)));events.addEventListener('ready',()=>{signalOnline=true;renderDevices();for(const p of peers.values())if(p.dc?.readyState!=='open')scheduleRetry(p);});events.onerror=()=>{signalOnline=false;$('status').textContent='Signaling interrupted · retrying';};}catch(e){notice(e.message);}finally{busy=false;$('create').disabled=false;}}
$('create').onclick=()=>join(true);$('joinForm').onsubmit=e=>{e.preventDefault();join(false);};$('copyInvite').onclick=()=>copy(invite());
$('leave').onclick=()=>{if(!session)return;api('leave',creds()).catch(()=>{});events.close();for(let p of peers.values())closePeer(p);peers.clear();names.clear();session=null;resetRoomTools();for(let a of activities)dispose(a);activities.clear();updateBatch();$('activity').replaceChildren(el('p','empty','No transfers yet.'));queued=[];$('message').value='';$('activitySearch').value='';unread=0;selectView('all');memoryUI();renderQueue();$('workspace').hidden=true;$('welcome').hidden=false;$('roomInput').value='';history.replaceState(null,'',location.pathname);};
window.addEventListener('pagehide',()=>{if(screen)stopScreen(screen,'Page closed');if(session)navigator.sendBeacon('/api/leave',new Blob([JSON.stringify(creds())],{type:'application/json'}));});
function signal(p,kind,data){return session?api('signal',{...creds(),to:p.id,kind,data}):Promise.resolve();}
function ensure(id){if(peers.has(id))return peers.get(id);let pc=new RTCPeerConnection(config),p={id,pc,dc:null,ice:[],chain:Promise.resolve(),sending:null,receiving:null,closed:false};peers.set(id,p);pc.onicecandidate=e=>{if(e.candidate)signal(p,'ice',e.candidate.toJSON()).catch(()=>{});};pc.onconnectionstatechange=()=>{renderDevices();if(['failed','closed'].includes(pc.connectionState)){fail(p,'Connection lost');scheduleRetry(p);}};pc.ondatachannel=e=>attach(p,e.channel);return p;}
function attach(p,dc){p.dc=dc;dc.binaryType='arraybuffer';dc.onopen=()=>{clearRetry(p.id);retryCounts.delete(p.id);renderDevices();prepareVerification(p);if(usable(p)&&note.clock)try{send(p,{type:'note',...note});}catch{}};dc.onclose=()=>{fail(p,'Connection closed');renderDevices();scheduleRetry(p);};dc.onerror=()=>{fail(p,'Channel error');scheduleRetry(p);};dc.onmessage=e=>{if(!usable(p)||peers.get(p.id)!==p)return;try{receive(p,e.data);}catch(err){fail(p,err.message);}};}
function closePeer(p){p.closed=true;clearRetry(p.id);fail(p,'Device disconnected');p.dc?.close();p.pc.close();}
function updatePeers(list){if(!session)return;names=new Map(list.map(x=>[x.id,x.name]));for(let [id,p] of peers)if(!names.has(id)){closePeer(p);peers.delete(id);}for(let {id} of list){if(id===session.id||peers.has(id))continue;startPeer(id);}renderDevices();}
function startPeer(id){let p=ensure(id);if(session.id<id)p.chain=p.chain.then(async()=>{if(p.closed)return;attach(p,p.pc.createDataChannel('bridge',{ordered:true}));await p.pc.setLocalDescription(await p.pc.createOffer());await signal(p,'offer',p.pc.localDescription.toJSON());}).catch(e=>{notice('Pairing failed: '+e.message);scheduleRetry(p);});return p;}
function handleSignal(m){if(!session||!names.has(m.from)||m.from===session.id)return;if(m.kind==='reset'){let old=peers.get(m.from);if(old){closePeer(old);peers.delete(m.from);}startPeer(m.from);renderDevices();return;}let p=ensure(m.from);p.chain=p.chain.then(async()=>{if(p.closed)return;if(m.kind==='ice'){if(p.pc.remoteDescription)await p.pc.addIceCandidate(m.data);else p.ice.push(m.data);return;}await p.pc.setRemoteDescription(m.data);for(let c of p.ice.splice(0))await p.pc.addIceCandidate(c);if(m.kind==='offer'){await p.pc.setLocalDescription(await p.pc.createAnswer());await signal(p,'answer',p.pc.localDescription.toJSON());}}).catch(e=>notice('Connection issue: '+e.message));}
function renderDevices(){if(!session)return;let old=$('recipient').value,active=[];$('devices').replaceChildren();for(let [id,name] of names){let self=id===session.id,p=peers.get(id),open=p?.dc?.readyState==='open',ready=usable(p),row=el('div','device'),info=el('div');row.append(el('span','device-icon',self?'◎':'↔'));info.append(el('strong','',name+(self?' (you)':'')),el('small',self||open?'online':'',self?'This device':open?(p.verified?'Verified connection':strictPairing?'Verification required':'Connected · unverified'):p?.pc.connectionState==='failed'?'Connection failed':'Connecting…'));if(!self&&open){info.append(el('small','pair-code',p.verifyCode||'Preparing comparison code…'));if(p.verifyCode&&p.verifyCode!=='Unavailable'&&!p.verified)info.append(btn('Verify code',()=>verifyPeer(p),'ghost'));if(p.verified)info.append(el('small','online','Verified for this connection'));}row.append(info);$('devices').append(row);if(!self&&ready)active.push([id,name]);}$('count').textContent=names.size;$('status').textContent=!signalOnline?'Signaling reconnecting · direct channels may still work':active.length?`${active.length} device(s) ready to share`:'Room open · waiting for a direct connection';let s=$('recipient');s.replaceChildren();if(!active.length)s.append(new Option('No connected devices',''));else for(let [id,name] of active)s.append(new Option(name,id));if(active.some(([id])=>id===old))s.value=old;updateButtons();}
const chosen=()=>peers.get($('recipient').value);
function updateButtons(){screenUI();watchUI();let p=chosen(),ready=usable(p);$('sendFiles').disabled=!ready||!queued.length||!!p.sending;$('sendText').disabled=!ready||!$('message').value.trim();}
$('recipient').onchange=updateButtons;$('message').oninput=updateButtons;
function addFiles(files){for(let f of files){if(f.size>DISK_MAX){notice(f.name+' exceeds 1 GiB');continue;}queued.push(f);if(f.size>MAX)notice('Large file: recipient must support direct saving to disk.');}renderQueue();}
function renderQueue(){$('queueCount').textContent=queued.length?queued.length+' selected · '+fmt(queued.reduce((n,f)=>n+f.size,0)):'No files selected';$('clearQueue').disabled=!queued.length;$('queue').replaceChildren();queued.forEach((f,i)=>{let row=el('div','queued');row.append(el('span','',f.name+' · '+fmt(f.size)),btn('Remove',()=>{queued.splice(i,1);renderQueue();},'ghost'));$('queue').append(row);});updateButtons();}
$('camera').onchange=e=>{addFiles(e.target.files);e.target.value='';};
$('files').onchange=e=>{addFiles(e.target.files);e.target.value='';};for(let ev of ['dragenter','dragover','dragleave','drop'])$('drop').addEventListener(ev,e=>{e.preventDefault();$('drop').classList.toggle('drag',ev==='dragenter'||ev==='dragover');if(ev==='drop')addFiles(e.dataTransfer.files);});
function activity(title,subtitle){$('activity').querySelector('.empty')?.remove();let row=el('div','item'),info=el('div'),status=el('small','',subtitle),actions=el('div','actions');info.append(el('strong','',title),status);row.append(info,actions);$('activity').prepend(row);let a={row,info,status,actions,done:false};activities.add(a);filterActivity();return a;}
function progress(a,n,total){if(!a.bar){a.bar=el('progress');a.bar.setAttribute('aria-label','File transfer progress');a.info.append(a.bar);}a.bar.max=Math.max(1,total);a.bar.value=total===0?1:n;}
function transferStats(a,n,total,verb){progress(a,n,total);const now=performance.now();if(!a.started)a.started=now;if(a.lastStats&&now-a.lastStats<250&&n<total)return;a.lastStats=now;const seconds=Math.max((now-a.started)/1000,.1),rate=n/seconds;const eta=rate>0?Math.ceil((total-n)/rate):0;const etaText=eta>60?Math.ceil(eta/60)+' min':eta+' s';a.status.textContent=verb+' · '+fmt(n)+' / '+fmt(total)+(n>0?' · '+fmt(rate)+'/s · '+etaText+' left':'');}
const previewTypes={'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp','gif':'image/gif','avif':'image/avif','mp4':'video/mp4','webm':'video/webm','mp3':'audio/mpeg','ogg':'audio/ogg','wav':'audio/wav'};
function addPreview(a,name,blob){const mime=previewTypes[name.toLowerCase().split('.').pop()];if(typeof mime!=='string')return;const toggle=btn('Preview',()=>{if(a.preview){a.preview.remove();a.preview=null;URL.revokeObjectURL(a.previewUrl);a.previewUrl=null;toggle.textContent='Preview';return;}a.previewUrl=URL.createObjectURL(blob.slice(0,blob.size,mime));const media=el(mime.startsWith('image/')?'img':mime.startsWith('video/')?'video':'audio','media-preview');if(media.tagName==='IMG')media.alt='Received image preview';else{media.controls=true;media.preload='metadata';}media.src=a.previewUrl;a.preview=media;a.info.append(media);toggle.textContent='Hide preview';});a.actions.append(toggle);}
function finish(a,status){a.status.textContent=status;a.done=true;a.actions.replaceChildren();filterActivity();}
function dispose(a){if(a.url)URL.revokeObjectURL(a.url);if(a.previewUrl)URL.revokeObjectURL(a.previewUrl);if(a.preview?.pause)a.preview.pause();a.fileBlob=null;a.preview=null;a.url=null;a.previewUrl=null;a.row.remove();}
$('clear').onclick=()=>{for(let a of activities)if(a.done){dispose(a);activities.delete(a);}if(!activities.size)$('activity').replaceChildren(el('p','empty','No transfers yet.'));updateBatch();memoryUI();filterActivity();};
function send(p,m){if(!usable(p))throw Error('Device not connected');p.dc.send(JSON.stringify(m));}
$('sendText').onclick=()=>{let p=chosen(),text=$('message').value;if(!usable(p)||!text.trim())return;try{send(p,{type:'text',text});let a=activity('Text sent','To '+names.get(p.id));a.info.append(el('p','',text));a.done=true;$('message').value='';updateButtons();}catch(e){notice(e.message);}};
const uid=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,'0')).join('');
$('sendFiles').onclick=()=>{let p=chosen();if(!usable(p)||p.sending||!queued.length)return;let fs=queued.splice(0);renderQueue();nextFile(p,fs);};
// Incremental CRC32 detects accidental corruption without allocating a full-file copy.
const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?(c>>>1)^0xedb88320:c>>>1;return c>>>0;});
function crcChunk(c,buffer){for(const byte of new Uint8Array(buffer))c=(c>>>8)^crcTable[(c^byte)&255];return c>>>0;}
const crcHex=c=>((c^0xffffffff)>>>0).toString(16).padStart(8,'0');
function retryFiles(t){if(t.a.retried)return;t.a.retried=true;queued.push(t.f,...t.fs);renderQueue();notice('Files returned to send queue. Choose a connected device to send again.');}
function failedSend(t,reason){finish(t.a,reason);t.a.actions.append(btn('Return to queue',()=>{retryFiles(t);t.a.actions.replaceChildren();}));}
function discardCheckpoint(id,reason){const r=checkpoints.get(id);if(!r)return;clearTimeout(r.timer);checkpoints.delete(id);r.chunks=[];finish(r.a,reason);}
function keepCheckpoint(p,r){if(!r.canRecover||!r.accepted||r.writer||r.bytes===0||!r.integrity)return false;clearTimeout(r.timer);for(const id of checkpoints.keys())discardCheckpoint(id,'Previous checkpoint discarded');p.receiving=null;checkpoints.set(p.id,r);r.accepted=false;r.paused=false;r.a.done=false;r.a.status.textContent='Interrupted · '+fmt(r.bytes)+' retained for 5 minutes';r.a.actions.replaceChildren(btn('Discard partial file',()=>discardCheckpoint(p.id,'Partial file discarded')));r.timer=setTimeout(()=>discardCheckpoint(p.id,'Recovery window expired'),300000);return true;}
function recoverSend(p,t,reason){clearTimeout(t.timer);p.sending=null;failedSend(t,reason);if(!t.canRecover||!t.integrity||t.disk||!t.sent)return;const room=session,expires=Date.now()+300000;t.a.actions.prepend(btn('Resume interrupted',()=>{const q=peers.get(p.id);if(session!==room||Date.now()>expires){notice('Recovery window expired. Return file to queue instead.');return;}if(!usable(q)||q.sending){notice('Wait for the same device to reconnect and finish active sends.');return;}if(t.a.retried)return;t.a.done=false;t.a.actions.replaceChildren(btn('Cancel',()=>cancel(q,t)));t.a.status.textContent='Requesting recovery…';t.phase='offer';t.paused=false;t.sent=0;t.written=0;t.crc=0xffffffff;q.sending=t;try{send(q,{type:'offer',id:t.id,name:t.f.name,size:t.f.size,integrity:'crc32',pause:true,disk:false,recover:true,retry:true});t.timer=setTimeout(()=>cancel(q,t,'Recovery request timed out'),60000);}catch(e){recoverSend(q,t,e.message);}updateButtons();}));}
function diskAvailable(){return typeof window.showSaveFilePicker==='function'&&window.isSecureContext;}
function abortReceive(p,r,reason,notifyPeer=true){if(p.receiving!==r)return;clearTimeout(r.timer);p.receiving=null;r.aborted=true;if(r.writer)r.writer.abort().catch(()=>{});r.chunks=[];if(notifyPeer)try{send(p,{type:'cancel',id:r.id});}catch{}finish(r.a,reason);}
function beginReceive(p,r){if(p.receiving!==r)return;if(!r.writer&&retainedBytes()+r.size>ROOM_MEMORY_LIMIT){notice('Browser memory budget reached. Download and clear finished files, or choose Save to disk.');return;}clearTimeout(r.timer);r.accepted=true;r.a.actions.replaceChildren(btn('Cancel',()=>abortReceive(p,r,'Cancelled')));r.a.started=performance.now();r.a.status.textContent=r.bytes?'Resuming · '+fmt(r.bytes)+' retained':'Receiving…';progress(r.a,r.bytes,r.size);try{send(p,{type:'accept',id:r.id,...(r.integrity?{integrity:'crc32'}:{}),pause:r.canPause,recover:r.canRecover&&!r.writer,...(r.writer?{disk:true}:{}),...(r.bytes?{offset:r.bytes,prefix:crcHex(r.crc)}:{})});armReceive(p,r);}catch(e){abortReceive(p,r,e.message,false);}}
async function chooseDisk(p,r){if(p.receiving!==r||r.picking)return;r.picking=true;try{const handle=await window.showSaveFilePicker({suggestedName:r.name.replace(/[\\/]/g,'_')||'received-file'});if(p.receiving!==r)return;const writer=await handle.createWritable();if(p.receiving!==r){await writer.abort();return;}r.writer=writer;r.written=0;r.writeChain=Promise.resolve();beginReceive(p,r);}catch(e){if(p.receiving===r){r.picking=false;notice(e.name==='AbortError'?'Save cancelled. Choose a receive option.':'Cannot save to disk: '+e.message);}}}
function armReceive(p,r,ms=120000){clearTimeout(r.timer);r.timer=setTimeout(()=>{if(p.receiving!==r)return;abortReceive(p,r,'Transfer timed out');},ms);}
function togglePause(p,t){if(p.sending!==t||t.phase!=='stream')return;try{send(p,{type:t.paused?'resume':'pause',id:t.id});t.paused=!t.paused;t.pauseButton.textContent=t.paused?'Resume':'Pause';if(t.paused){t.pauseAt=performance.now();t.a.status.textContent='Paused';}else{t.a.started+=performance.now()-t.pauseAt;t.a.status.textContent='Resuming…';}}catch(e){cancel(p,t,e.message);}}
function nextFile(p,fs){if(!fs.length||p.closed){p.sending=null;updateButtons();return;}let f=fs.shift(),a=activity(f.name,'Waiting for '+names.get(p.id)+' · '+fmt(f.size)),t={id:uid(),f,fs,a,phase:'offer',crc:0xffffffff,paused:false};p.sending=t;a.actions.append(btn('Cancel',()=>cancel(p,t)));try{send(p,{type:'offer',id:t.id,name:f.name,size:f.size,integrity:'crc32',pause:true,disk:true,recover:true});t.timer=setTimeout(()=>cancel(p,t,'Request timed out'),60000);}catch(e){failedSend(t,e.message);p.sending=null;}updateButtons();}
function cancel(p,t,reason='Cancelled'){if(p.sending!==t)return;clearTimeout(t.timer);try{send(p,{type:'cancel',id:t.id});}catch{}failedSend(t,reason);p.sending=null;updateButtons();}
function fail(p,reason){if(watch?.peer===p)stopWatch(watch,'Watch stopped: '+reason,false);if(screen?.peer===p)stopScreen(screen,'Screen stopped: '+reason,false);if(p.sending)recoverSend(p,p.sending,reason);if(p.receiving&&!keepCheckpoint(p,p.receiving))abortReceive(p,p.receiving,reason,false);updateButtons();}
async function stream(p,t){
 clearTimeout(t.timer);t.phase='stream';t.a.started=performance.now();t.a.status.textContent='Sending…';
 if(t.canPause){t.pauseButton=btn('Pause',()=>togglePause(p,t));t.a.actions.append(t.pauseButton);}
 async function ready(){const start=performance.now();while(t.paused||p.dc.bufferedAmount>1048576||(t.disk&&t.sent-t.written>=WINDOW)){if(p.sending!==t||p.dc.readyState!=='open')return false;if(t.paused?performance.now()-t.pauseAt>600000:performance.now()-start>600000)throw Error('Transfer stalled');await new Promise(r=>setTimeout(r,40));}return p.sending===t&&p.dc.readyState==='open';}
 try{
  for(let offset=0;offset<t.offset;offset+=CHUNK){const chunk=await t.f.slice(offset,Math.min(offset+CHUNK,t.offset)).arrayBuffer();if(p.sending!==t)return;t.crc=crcChunk(t.crc,chunk);}if(t.offset&&crcHex(t.crc)!==t.prefix)throw Error('Partial file checksum mismatch. Return to queue to start over.');
  for(let offset=t.offset||0;offset<t.f.size;offset+=CHUNK){if(!await ready())return;const chunk=await t.f.slice(offset,offset+CHUNK).arrayBuffer();if(!await ready())return;if(t.integrity)t.crc=crcChunk(t.crc,chunk);p.dc.send(chunk);t.sent=offset+chunk.byteLength;transferStats(t.a,Math.min(offset+CHUNK,t.f.size),t.f.size,'Sending (queued)');}
  if(!await ready())return;
  if(t.disk){const started=performance.now();while(t.written<t.f.size){if(p.sending!==t||p.dc.readyState!=='open')return;if(performance.now()-started>120000)throw Error('Disk write stalled');await new Promise(r=>setTimeout(r,40));}}
  send(p,{type:'end',id:t.id,...(t.integrity?{crc:crcHex(t.crc)}:{})});t.phase='ack';t.pauseButton?.remove();t.a.status.textContent='Verifying receipt…';t.timer=setTimeout(()=>cancel(p,t,'Receipt not confirmed'),60000);
 }catch(e){cancel(p,t,e.message);}
}
function receive(p,data){if(typeof data!=='string'){let r=p.receiving;if(!r?.accepted)return;if(!(data instanceof ArrayBuffer)||r.bytes+data.byteLength>r.size){abortReceive(p,r,'Invalid size');return;}if(r.writer&&r.bytes-r.written+data.byteLength>WINDOW+CHUNK){abortReceive(p,r,'Disk flow-control limit exceeded');return;}r.bytes+=data.byteLength;if(r.integrity)r.crc=crcChunk(r.crc,data);armReceive(p,r,r.paused?610000:120000);if(r.writer){r.writeChain=r.writeChain.then(async()=>{if(r.aborted)return;await r.writer.write(data);if(r.aborted||p.receiving!==r)return;r.written+=data.byteLength;send(p,{type:'written',id:r.id,bytes:r.written});transferStats(r.a,r.written,r.size,'Saving to disk');}).catch(e=>abortReceive(p,r,'Disk write failed: '+e.message));}else{r.chunks.push(data);transferStats(r.a,r.bytes,r.size,'Receiving');}return;}
if(data.length>150000)return;let m;try{m=JSON.parse(data);}catch{return;}if(!m||typeof m!=='object'||Array.isArray(m))return;let name=names.get(p.id)||'Device';if(m.type==='watch'){receiveWatch(p,m);return;}if(m.type==='screen'){receiveScreen(p,m);return;}if(m.type==='note'){receiveNote(m);return;}if(m.type==='text'&&typeof m.text==='string'&&m.text.length<=12000){incomingActivity();transferAlert();let a=activity('Text received','From '+name);a.info.append(el('p','',m.text));a.actions.append(btn('Copy',()=>copy(m.text)));a.done=true;return;}
if(m.type==='offer'){if(typeof m.id!=='string'||!/^[0-9a-f]{24}$/.test(m.id)||typeof m.name!=='string'||!Number.isInteger(m.size)||m.size<0||m.size>DISK_MAX||(m.size>MAX&&(!diskAvailable()||m.disk!==true||m.integrity!=='crc32'))||Array.from(peers.values()).some(q=>q.receiving)){send(p,{type:'reject',id:m.id});return;}incomingActivity();transferAlert();const saved=checkpoints.get(p.id);if(saved&&m.retry===true&&m.recover===true&&m.integrity==='crc32'&&saved.id===m.id&&saved.name===m.name.slice(0,255)&&saved.size===m.size){clearTimeout(saved.timer);checkpoints.delete(p.id);p.receiving=saved;saved.a.status.textContent='Resume from '+fmt(saved.bytes)+'?';saved.a.actions.replaceChildren(btn('Resume receiving',()=>beginReceive(p,saved),'primary'),btn('Decline',()=>{try{send(p,{type:'reject',id:m.id});}catch{}abortReceive(p,saved,'Recovery declined',false);}));saved.timer=setTimeout(()=>{try{send(p,{type:'reject',id:m.id});}catch{}abortReceive(p,saved,'Recovery request expired',false);},60000);return;}if(checkpoints.size){send(p,{type:'reject',id:m.id});notice('Discard the retained partial file before receiving another file.');return;}let a=activity(m.name.slice(0,255),`From ${name} · ${fmt(m.size)} · Accept to receive`),r={id:m.id,name:m.name.slice(0,255),size:m.size,bytes:0,chunks:[],a,accepted:false,integrity:m.integrity==='crc32',canPause:m.pause===true,canRecover:m.recover===true,crc:0xffffffff,paused:false};p.receiving=r;let decline=()=>{if(p.receiving!==r)return;clearTimeout(r.timer);try{send(p,{type:'reject',id:r.id});}catch{}abortReceive(p,r,'Declined',false);};r.timer=setTimeout(decline,60000);if(r.size<=MAX)a.actions.append(btn('Accept',()=>{if(!r.picking)beginReceive(p,r);},'primary'));if(m.disk===true&&r.integrity&&diskAvailable())a.actions.append(btn('Save to disk',()=>chooseDisk(p,r),'primary'));a.actions.append(btn('Decline',decline));return;}
let t=p.sending,r=p.receiving;if(m.type==='accept'&&t?.id===m.id&&t.phase==='offer'){t.integrity=m.integrity==='crc32';t.canPause=m.pause===true;t.disk=m.disk===true;t.canRecover=m.recover===true&&!t.disk;t.offset=m.offset??0;t.prefix=m.prefix;t.crc=0xffffffff;if(!Number.isSafeInteger(t.offset)||t.offset<0||t.offset>t.f.size||(t.offset&&(!t.canRecover||!t.integrity||typeof t.prefix!=='string'||!/^[0-9a-f]{8}$/.test(t.prefix)))){cancel(p,t,'Invalid recovery offset');return;}t.sent=t.offset;t.written=0;if(t.f.size>MAX&&!t.disk){cancel(p,t,'Recipient must save large files directly to disk');return;}stream(p,t);return;}if(m.type==='written'&&t?.id===m.id&&t.disk&&Number.isSafeInteger(m.bytes)&&m.bytes>=t.written&&m.bytes<=t.sent){t.written=m.bytes;return;}if(m.type==='reject'&&t?.id===m.id){clearTimeout(t.timer);failedSend(t,'Declined or recipient busy');p.sending=null;updateButtons();return;}
if((m.type==='pause'||m.type==='resume')&&r?.id===m.id&&r.accepted&&r.canPause){r.paused=m.type==='pause';r.a.status.textContent=r.paused?'Paused by sender':'Receiving…';armReceive(p,r,r.paused?610000:120000);return;}
if(m.type==='end'&&r?.id===m.id&&r.accepted){clearTimeout(r.timer);if(r.bytes!==r.size){abortReceive(p,r,'Incomplete file');return;}if(r.integrity&&m.crc!==crcHex(r.crc)){abortReceive(p,r,'Integrity check failed');return;}if(r.writer){r.writeChain.then(async()=>{if(r.aborted||p.receiving!==r)return;if(r.written!==r.size){abortReceive(p,r,'Incomplete disk write');return;}await r.writer.close();if(r.aborted||p.receiving!==r)return;finish(r.a,'Saved to disk · '+fmt(r.size)+' · CRC32 verified');progress(r.a,r.size,r.size);recordFile(r.name,r.size,'Received');p.receiving=null;send(p,{type:'ack',id:m.id});}).catch(e=>abortReceive(p,r,'Unable to finalize file: '+e.message));return;}const fileBlob=new Blob(r.chunks,{type:'application/octet-stream'});r.a.url=URL.createObjectURL(fileBlob);r.a.fileBlob=fileBlob;r.a.fileName=r.name;updateBatch();memoryUI();finish(r.a,'Received · '+fmt(r.size)+(r.integrity?' · CRC32 verified':''));progress(r.a,r.size,r.size);r.a.actions.append(btn('Download',()=>{let a=el('a');a.href=r.a.url;a.download=r.name.replace(/[\\/]/g,'_');document.body.append(a);a.click();a.remove();},'primary'));addPreview(r.a,r.name,fileBlob);recordFile(r.name,r.size,'Received');r.chunks=[];p.receiving=null;send(p,{type:'ack',id:m.id});return;}
if(m.type==='ack'&&t?.id===m.id&&t.phase==='ack'){clearTimeout(t.timer);finish(t.a,'Delivered');progress(t.a,t.f.size,t.f.size);recordFile(t.f.name,t.f.size,'Sent');nextFile(p,t.fs);return;}
if(m.type==='cancel'){if(r?.id===m.id){abortReceive(p,r,'Cancelled by sender',false);}if(t?.id===m.id){clearTimeout(t.timer);failedSend(t,'Cancelled by recipient');p.sending=null;updateButtons();}}
}
