export function plan(names, options = {}) {
  if (!Array.isArray(names) || !names.length || names.length > 5000) throw Error('Enter 1–5000 filenames.');
  const {find='', replace='', prefix='', suffix='', numbered=false, start=1, insensitive=true}=options;
  if (!Number.isSafeInteger(start)||start<0||start>999999) throw Error('Invalid starting number.');
  const key=s=>insensitive?s.normalize('NFC').toLowerCase():s.normalize('NFC');
  const valid=s=>typeof s==='string'&&s.length>0&&s.length<=255&&!/[<>:"/\\|?*\u0000-\u001f]/.test(s)&&!/[. ]$/.test(s)&&!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s);
  const rows=names.map((original,i)=>{
    if(!valid(original)) return {original,target:'',error:'Invalid source filename'};
    const dot=original.lastIndexOf('.');
    const ext=dot>0?original.slice(dot):'';
    let stem=dot>0?original.slice(0,dot):original;
    if(find) stem=stem.split(find).join(replace);
    const target=prefix+stem+suffix+(numbered?'_'+String(start+i).padStart(3,'0'):'')+ext;
    return {original,target,error:valid(target)?'':'Invalid target filename'};
  });
  const counts=new Map(), sources=new Map();
  for(const row of rows){if(row.target)counts.set(key(row.target),(counts.get(key(row.target))||0)+1);if(typeof row.original==='string')sources.set(key(row.original),(sources.get(key(row.original))||0)+1);}
  const occupied=new Set(rows.filter(r=>typeof r.original==='string').map(r=>key(r.original)));
  for(const row of rows) if(!row.error){
    if(sources.get(key(row.original))>1)row.error='Duplicate source';
    else if(counts.get(key(row.target))>1)row.error='Target collision';
    else if(key(row.target)!==key(row.original)&&occupied.has(key(row.target)))row.error='Target already exists in input';
  }
  return rows;
}
export function exportPlan(rows){
  if(rows.some(r=>r.error))throw Error('Resolve all errors before export.');
  return JSON.stringify(rows.map(({original,target})=>({original,target})),null,2);
}
