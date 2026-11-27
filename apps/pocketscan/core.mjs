export const MAX_PAGES=8,MAX_EDGE=1800,MAX_FILE=15*1024*1024;
export function cropRect(width,height,edges){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Error('Invalid image dimensions');
 const [left,top,right,bottom]=edges;
 if(!edges.every(x=>Number.isFinite(x)&&x>=0&&x<=90)||left+right>=95||top+bottom>=95)throw Error('Crop must retain at least 5% of each dimension');
 const x=Math.floor(width*left/100),y=Math.floor(height*top/100),endX=Math.ceil(width*(1-right/100)),endY=Math.ceil(height*(1-bottom/100));
 return {x,y,w:Math.max(1,endX-x),h:Math.max(1,endY-y)};
}
export function fitPage(width,height,size='a4'){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Invalid image size');
 if(!['a4','letter'].includes(size))throw Error('Unknown PDF page size');
 const [pw,ph]=size==='a4'?[595.28,841.89]:[612,792];
 const [pageWidth,pageHeight]=width>height?[ph,pw]:[pw,ph],margin=18,scale=Math.min((pageWidth-2*margin)/width,(pageHeight-2*margin)/height);
 return {pageWidth,pageHeight,w:width*scale,h:height*scale,x:(pageWidth-width*scale)/2,y:(pageHeight-height*scale)/2};
}
export function filterPixels(pixels,mode,threshold=160){
 if(!['color','gray','ink'].includes(mode)||!Number.isFinite(threshold)||threshold<0||threshold>255)throw Error('Invalid filter');
 if(mode==='color')return pixels;
 for(let i=0;i<pixels.length;i+=4){const gray=Math.round(.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2]),value=mode==='ink'?(gray>=threshold?255:0):gray;pixels[i]=pixels[i+1]=pixels[i+2]=value;}
 return pixels;
}
