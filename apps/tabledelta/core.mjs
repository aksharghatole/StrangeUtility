export const LIMITS={chars:3*1024*1024,rows:10000,cols:80};
export function parse(text,delimiter=','){
 if(![',',';','\t'].includes(delimiter))throw Error('Unsupported delimiter');
 if(typeof text!=='string'||text.length>LIMITS.chars)throw Error('File exceeds 3 MiB character limit');
 text=text.replace(/^\uFEFF/,'');
 const records=[];let row=[],field='',state=0,started=false;
 function cell(){row.push(field);field='';state=0;if(row.length>LIMITS.cols)throw Error('Too many columns (max 80)');}
 function record(){cell();records.push(row);row=[];started=false;if(records.length>LIMITS.rows+1)throw Error('Too many data rows (max 10,000)');}
 for(let i=0;i<text.length;i++){
  const ch=text[i];started=true;
  if(state===1){if(ch==='"'){if(text[i+1]==='"'){field+='"';i++;}else state=2;}else field+=ch;continue;}
  if(ch===delimiter){cell();continue;}
  if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;record();continue;}
  if(state===2)throw Error('Unexpected character after closing quote at record '+(records.length+1));
  if(ch==='"'){if(field)throw Error('Unexpected quote at record '+(records.length+1));state=1;}else field+=ch;
 }
 if(state===1)throw Error('Unclosed quote at record '+(records.length+1));
 if(started||row.length||field)record();
 if(!records.length)throw Error('Missing header row');
 const headers=records.shift();
 if(headers.some(x=>!x.trim())||new Set(headers).size!==headers.length)throw Error('Headers must be nonblank and unique');
 for(let i=0;i<records.length;i++)if(records[i].length!==headers.length)throw Error('Record '+(i+2)+' has '+records[i].length+' fields; expected '+headers.length);
 return {headers,rows:records};
}
export function reconcile(before,after,keys,{trim=false,ignoreCase=false}={}){
 if(!keys.length||new Set(keys).size!==keys.length||keys.some(k=>!before.headers.includes(k)||!after.headers.includes(k)))throw Error('Select at least one common key column');
 const normalize=v=>{if(trim)v=v.trim();return ignoreCase?v.toLowerCase():v};
 const fields=before.headers.filter(h=>after.headers.includes(h)&&!keys.includes(h));
 const schema={added:after.headers.filter(h=>!before.headers.includes(h)),removed:before.headers.filter(h=>!after.headers.includes(h))};
 const conflicts=[],blocked=new Set();
 function index(table,side){
  const columns=keys.map(k=>table.headers.indexOf(k)),map=new Map();
  table.rows.forEach((row,i)=>{
   const tuple=columns.map(c=>normalize(row[c])),key=JSON.stringify(tuple);
   if(tuple.some(v=>v.trim()==='')){conflicts.push({side,key:tuple,rows:[i+2],reason:'Blank key'});return;}
   if(!map.has(key))map.set(key,[]);
   map.get(key).push({row,record:i+2});
  });
  for(const [key,items] of map)if(items.length>1){blocked.add(key);conflicts.push({side,key:JSON.parse(key),rows:items.map(x=>x.record),reason:'Duplicate key'});}
  return map;
 }
 const a=index(before,'Before'),b=index(after,'After'),changes=[],counts={added:0,removed:0,changed:0,unchanged:0,excludedKeys:blocked.size};
 const columns=fields.map(name=>({name,a:before.headers.indexOf(name),b:after.headers.indexOf(name)}));
 for(const key of new Set([...a.keys(),...b.keys()])){
  if(blocked.has(key))continue;
  const old=a.get(key)?.[0]?.row??null,newer=b.get(key)?.[0]?.row??null;
  const cells=old&&newer?columns.filter(c=>old[c.a]!==newer[c.b]).map(c=>({column:c.name,before:old[c.a],after:newer[c.b]})):[];
  const status=!old?'added':!newer?'removed':cells.length?'changed':'unchanged';counts[status]++;
  if(status!=='unchanged')changes.push({status,key:JSON.parse(key),before:old,after:newer,cells});
 }
 return {keys,headers:{before:before.headers,after:after.headers},schema,counts,conflicts,changes,options:{trim,ignoreCase}};
}
// Spreadsheet-targeted CSV is deliberately transformed; JSON preserves exact values.
export function csvCell(value){let s=String(value??'');if(/^[\s\uFEFF]*[=+\-@\uFF1D\uFF0B\uFF0D\uFF20]|^[\t\r\n]/u.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function exportCSV(report){
 const rows=[['Status','Key (JSON)','Column','Before','After']];
 for(const change of report.changes){
  const k=JSON.stringify(change.key);
  if(change.status==='changed'){for(const c of change.cells)rows.push([change.status,k,c.column,c.before,c.after]);}
  else{const source=change.status==='added'?report.headers.after:report.headers.before;
   for(let i=0;i<source.length;i++)rows.push([change.status,k,source[i],change.before?.[i]??'',change.after?.[i]??'']);}
 }
 for(const c of report.conflicts)rows.push(['conflict',JSON.stringify(c.key),c.side,c.reason,'Records '+c.rows.join(', ')]);
 for(const column of report.schema.added)rows.push(['column added','',column,'','']);
 for(const column of report.schema.removed)rows.push(['column removed','',column,'','']);
 return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
