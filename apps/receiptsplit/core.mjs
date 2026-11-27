// All arithmetic uses integer minor units and largest-remainder allocation.
export function money(text) {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(String(text))) throw Error('Use a nonnegative amount with up to two decimals.');
  const [a,b='']=String(text).split('.');
  return Number(a)*100+Number(b.padEnd(2,'0'));
}
export function allocate(amount, weights) {
  if (!Number.isSafeInteger(amount)||amount<0||!weights.length||weights.some(w=>!Number.isSafeInteger(w)||w<0)) throw Error('Invalid allocation.');
  const total=weights.reduce((s,w)=>s+BigInt(w),0n);
  if(!total){if(amount)throw Error('Cannot distribute a charge without a positive share.');return weights.map(()=>0);}
  const parts=weights.map((w,i)=>{const n=BigInt(amount)*BigInt(w);return {i,value:Number(n/total),rem:n%total};});
  let left=amount-parts.reduce((s,p)=>s+p.value,0);
  const order=[...parts].sort((a,b)=>a.rem===b.rem?a.i-b.i:a.rem>b.rem?-1:1);
  for(let i=0;i<left;i++)order[i].value++;
  return parts.map(p=>p.value);
}
export function split(names, items, extras=0) {
  if(!Array.isArray(names)||names.length<2||names.length>30||names.some(n=>typeof n!=='string'||!n.trim()||n.length>80)||new Set(names).size!==names.length)throw Error('Enter 2–30 unique names.');
  if(!Array.isArray(items)||!items.length||items.length>200||!Number.isSafeInteger(extras)||extras<0||extras>999999999)throw Error('Enter 1–200 items and a valid extra charge.');
  const base=names.map(()=>0);
  const rows=items.map(item=>{
    if(typeof item.label!=='string'||!item.label.trim()||item.label.length>120||!Number.isSafeInteger(item.amount)||item.amount<0||item.amount>999999999||!Array.isArray(item.people)||!item.people.length||new Set(item.people).size!==item.people.length||item.people.some(n=>!names.includes(n)))throw Error('Invalid item or participant.');
    const shares=allocate(item.amount,names.map(n=>Number(item.people.includes(n))));
    shares.forEach((v,i)=>base[i]+=v);
    return {label:item.label,amount:item.amount,shares};
  });
  const surcharge=allocate(extras,base);
  return {names,rows,subtotal:base.reduce((a,b)=>a+b,0),extras,total:base.reduce((a,b)=>a+b,extras),people:names.map((name,i)=>({name,items:base[i],extras:surcharge[i],total:base[i]+surcharge[i]}))};
}
