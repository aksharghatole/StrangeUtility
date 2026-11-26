export const MAX_BYTES=40*1024*1024;
export function readWav(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<44||buffer.byteLength>MAX_BYTES)throw Error('Expected a WAV file between 44 bytes and 40 MiB');
 const v=new DataView(buffer),tag=i=>String.fromCharCode(...new Uint8Array(buffer,i,4));
 if(tag(0)!=='RIFF'||tag(8)!=='WAVE'||v.getUint32(4,true)+8!==buffer.byteLength)throw Error('Invalid RIFF/WAVE file');
 let fmt=null,data=null;
 for(let p=12;p+8<=buffer.byteLength;){
  const name=tag(p),n=v.getUint32(p+4,true),start=p+8,end=start+n;
  if(end+(n%2)>buffer.byteLength)throw Error('Truncated WAV chunk');
  if(name==='fmt '){if(fmt||n<16)throw Error('Invalid format chunk');fmt={format:v.getUint16(start,true),channels:v.getUint16(start+2,true),rate:v.getUint32(start+4,true),byteRate:v.getUint32(start+8,true),align:v.getUint16(start+12,true),bits:v.getUint16(start+14,true)}}
  if(name==='data'){if(data)throw Error('Multiple data chunks unsupported');data={start,n}}
  p=end+(n%2);
 }
 if(!fmt||!data||fmt.format!==1||fmt.bits!==16||![1,2].includes(fmt.channels)||fmt.rate<8000||fmt.rate>96000||fmt.align!==2*fmt.channels||fmt.byteRate!==fmt.rate*fmt.align||data.n%fmt.align||!data.n)throw Error('Only mono/stereo 16-bit PCM WAV at 8–96 kHz is supported');
 const frames=data.n/fmt.align;if(frames/fmt.rate>300)throw Error('Audio must be at most five minutes');
 const samples=new Int16Array(frames*fmt.channels);
 for(let i=0;i<samples.length;i++)samples[i]=v.getInt16(data.start+i*2,true);
 return {rate:fmt.rate,channels:fmt.channels,frames,samples};
}
export function encodeWav(audio){
 const {rate,channels,samples,frames}=audio;
 if(![1,2].includes(channels)||!Number.isInteger(rate)||rate<8000||rate>96000||!(samples instanceof Int16Array)||!frames||samples.length!==frames*channels||samples.byteLength+44>MAX_BYTES)throw Error('Invalid output audio');
 const result=new ArrayBuffer(44+samples.byteLength),v=new DataView(result);
 const tag=(p,s)=>{for(let i=0;i<s.length;i++)v.setUint8(p+i,s.charCodeAt(i))};
 tag(0,'RIFF');v.setUint32(4,result.byteLength-8,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,rate,true);v.setUint32(28,rate*channels*2,true);v.setUint16(32,channels*2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,samples.byteLength,true);
 for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,samples[i],true);return result;
}
export function silenceBounds(audio,db=-40,padding=.05){
 if(!Number.isFinite(db)||db< -90||db>0||!Number.isFinite(padding)||padding<0||padding>2)throw Error('Invalid silence settings');
 const threshold=32768*10**(db/20),{channels,frames,samples,rate}=audio;
 const loud=i=>{for(let c=0;c<channels;c++)if(Math.abs(samples[i*channels+c])>=threshold)return true;return false};
 let start=0,end=frames;while(start<end&&!loud(start))start++;if(start===end)return null;while(end>start&&!loud(end-1))end--;
 const pad=Math.round(padding*rate);return {start:Math.max(0,start-pad),end:Math.min(frames,end+pad)};
}
export function processAudio(audio,{start=0,end=audio.frames,fadeIn=0,fadeOut=0,peakDb=null}={}){
 const {rate,channels,samples,frames}=audio;
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>frames||start>=end)throw Error('Select a nonempty valid time range');
 const length=end-start;
 if(![fadeIn,fadeOut].every(n=>Number.isFinite(n)&&n>=0&&n<=length/rate))throw Error('Each fade must fit inside the selection');
 if(peakDb!==null&&(!Number.isFinite(peakDb)||peakDb>0||peakDb< -30))throw Error('Peak target must be -30 to 0 dBFS');
 const fi=Math.round(fadeIn*rate),fo=Math.round(fadeOut*rate);
 const factor=i=>(fi?Math.min(1,i/Math.max(1,fi-1)):1)*(fo?Math.min(1,(length-1-i)/Math.max(1,fo-1)):1);
 let peak=0;for(let i=0;i<length;i++){const f=factor(i);for(let c=0;c<channels;c++)peak=Math.max(peak,Math.abs(samples[(start+i)*channels+c]*f))}
 const gain=peakDb===null||!peak?1:32767*10**(peakDb/20)/peak;
 const output=new Int16Array(length*channels);
 for(let i=0;i<length;i++){const f=factor(i)*gain;for(let c=0;c<channels;c++)output[i*channels+c]=Math.max(-32768,Math.min(32767,Math.round(samples[(start+i)*channels+c]*f)))}
 return {rate,channels,frames:length,samples:output};
}
export function waveform(audio,bins=500){
 if(!Number.isInteger(bins)||bins<1||bins>2000)throw Error('Invalid waveform resolution');
 const result=[];for(let b=0;b<bins;b++){let lo=0,hi=0;const start=Math.floor(b*audio.frames/bins),end=Math.min(audio.frames,Math.max(start+1,Math.floor((b+1)*audio.frames/bins)));for(let i=start;i<end;i++)for(let c=0;c<audio.channels;c++){const x=audio.samples[i*audio.channels+c]/32768;lo=Math.min(lo,x);hi=Math.max(hi,x)}result.push([lo,hi])}return result;
}
export function sampleAudio(){const rate=16000,frames=rate*4,samples=new Int16Array(frames);for(let i=rate/2;i<frames-rate/2;i++)samples[i]=Math.round(10000*Math.sin(2*Math.PI*440*i/rate));return{rate,frames,channels:1,samples}}
