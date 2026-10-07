globalThis.TS = (() => {
 const origin='https://winnerpreschool.topschool.tw';
 function allowed(value,image=false){const u=new URL(value,origin);if(u.protocol!=='https:'||u.username||u.password|| (image?u.hostname!=='isai-prod-v2.s3.hicloud.net.tw':u.origin!==origin||!/^\/Activity\/School-(Albums|Album-Detail)$/.test(u.pathname)))throw Error('不允許的網址');return u;}
 function page(value,n){const u=allowed(value);for(const k of [...u.searchParams.keys()])if(k.toLowerCase()==='pageindex')u.searchParams.delete(k);u.searchParams.set('PageIndex',n);return u.href;}
 function index(value){const u=allowed(value);return Number([...u.searchParams].find(([k])=>k.toLowerCase()==='pageindex')?.[1]||1);}
 function max(doc,value){const u=allowed(value);return Math.max(index(value),1,...[...doc.querySelectorAll('.pagination a[href]')].map(a=>{try{const v=allowed(new URL(a.getAttribute('href'),u));return v.pathname===u.pathname&&v.searchParams.get('albumId')===u.searchParams.get('albumId')?index(v):1;}catch{return 1;}}));}
 function albums(doc){return [...doc.querySelectorAll('#freebrick2 .brick2')].map(c=>{const a=c.querySelector('a[href*="albumId"]');if(!a)return null;const u=allowed(a.getAttribute('href'));return {id:u.searchParams.get('albumId'),url:page(u,1),name:c.querySelector('.info')?.textContent.trim()||'未命名相簿'};}).filter(Boolean);}
 function photos(doc){return [...doc.querySelectorAll('#freebrick4 a.photo-gallery[href]')].map(a=>({url:allowed(a.getAttribute('href'),true).href,name:a.getAttribute('title')||'照片'}));}
 const reserved=/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
 function fullDate(match,prefix,year,month,day,roc=false){
  const y=Number(year)+(roc?1911:0),m=Number(month),d=Number(day),date=new Date(Date.UTC(y,m-1,d)),rocYear=y-1911;
  return rocYear>0&&date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?`${prefix}${String(rocYear).padStart(3,'0')}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}`:match;
 }
 function yearMonth(match,prefix,year,month,roc=false){const y=Number(year)+(roc?1911:0),m=Number(month),rocYear=y-1911;return rocYear>0&&m>=1&&m<=12?`${prefix}${String(rocYear).padStart(3,'0')}${String(m).padStart(2,'0')}`:match;}
 function dates(value){
  return value
   .replace(/(^|[^\d])(\d{4})[.\/年\s-]+(\d{1,2})[.\/月\s-]+(\d{1,2})日?(?=$|[^\d])/g,(...args)=>fullDate(args[0],args[1],args[2],args[3],args[4]))
   .replace(/(^|[^\d])(\d{3})[.\/年\s-]+(\d{1,2})[.\/月\s-]+(\d{1,2})日?(?=$|[^\d])/g,(...args)=>fullDate(args[0],args[1],args[2],args[3],args[4],true))
   .replace(/(^|[^\d])(\d{3})\.(\d{2})(\d{2})(?=$|[^\d])/g,(...args)=>fullDate(args[0],args[1],args[2],args[3],args[4],true))
   .replace(/(^|[^\d])(\d{4})(\d{2})(\d{2})(?=$|[^\d])/g,(...args)=>fullDate(args[0],args[1],args[2],args[3],args[4]))
   .replace(/(^|[^\d])(\d{4})[.\/年\s-]+(\d{1,2})月?(?=$|[^\d])/g,(...args)=>yearMonth(args[0],args[1],args[2],args[3]))
   .replace(/(^|[^\d])(\d{3})[.\/年\s-]+(\d{1,2})月?(?=$|[^\d])/g,(...args)=>yearMonth(args[0],args[1],args[2],args[3],true))
   .replace(/(^|[^\d])(\d{4})(\d{2})(?=$|[^\d])/g,(...args)=>yearMonth(args[0],args[1],args[2],args[3]))
   .replace(/(\d)\.(?=\d)/g,'$1');
 }
 function name(value){
  let result=dates(String(value??'').normalize('NFKC')).replace(/[~～]/g,'').replace(/、/g,'-');
  result=result.replace(/[<>]/g,char=>char==='<'?'(' : ')').replace(/[:/\\|]/g,'-').replace(/["?*]/g,'').replace(/[\x00-\x1f\x7f]/g,'');
  result=result.replace(/\s*-\s*/g,'-').replace(/-{2,}/g,'-').trim().replace(/[-. ]+$/g,'').slice(0,120);
  if(reserved.test(result))result='＿'+result;
  return result||'未命名';
 }
 function key(value){return name(String(value??'').replace(/\.zip$/i,'')).normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');}
 function path(value){return String(value??'').split(/[\\/]+/).map(x=>x.trim()).filter(x=>x&&x!=='.'&&x!=='..').map(name).join('/').slice(0,100).replace(/\/+$/,'');}
 async function zipCount(blob){
  const start=Math.max(0,blob.size-66000),bytes=new Uint8Array(await blob.slice(start).arrayBuffer()),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  for(let i=bytes.length-22;i>=0;i--)if(view.getUint32(i,true)===0x06054b50)return view.getUint16(i+10,true);
  throw Error('無法讀取 ZIP 檔案數');
 }
 async function get(value,signal,image=false){const u=allowed(value,image);for(let i=0;i<3;i++){try{const r=await fetch(u,{credentials:image?'omit':'include',signal,redirect:'error'});if(!r.ok)throw Error('HTTP '+r.status);return r;}catch(e){if(signal?.aborted||i===2)throw e;}}}
 async function doc(value,signal){return new DOMParser().parseFromString(await(await get(value,signal)).text(),'text/html');}
 return {origin,allowed,page,index,max,albums,photos,name,key,path,zipCount,get,doc};
})();
