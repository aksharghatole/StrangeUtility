// Integer millimetres; conservative kerf per piece, including final cut.
export function planCuts(stock,kerf,requests){
 if(!Number.isSafeInteger(stock)||stock<1||stock>1000000||!Number.isSafeInteger(kerf)||kerf<0||kerf>=stock)throw Error('Invalid stock length or kerf');
 const pieces=[];for(const {length,count} of requests){if(!Number.isSafeInteger(length)||length<1||length+kerf>stock||!Number.isSafeInteger(count)||count<1||pieces.length+count>2000)throw Error('Invalid piece or more than 2,000 pieces');for(let i=0;i<count;i++)pieces.push(length)}
 if(!pieces.length)throw Error('Add at least one piece');pieces.sort((a,b)=>b-a);const bars=[];
 for(const length of pieces){const need=length+kerf;let best=null;for(const bar of bars)if(bar.remaining>=need&&(!best||bar.remaining<best.remaining))best=bar;if(!best){best={remaining:stock,pieces:[]};bars.push(best)}best.pieces.push(length);best.remaining-=need}
 const material=pieces.reduce((a,b)=>a+b,0),loss=pieces.length*kerf,total=bars.length*stock;return {bars,material,loss,total,waste:total-material-loss};
}
