const $=id=>document.getElementById(id);
let controller,albums=[],running=false,history={},directoryHandle;
const source=TS.allowed(new URL(location.href).searchParams.get('source')).href;
const siteKey=new URL(source).hostname;

function status(message){$('status').textContent=message;}
function albumKey(album){return `${siteKey}:${album.id}`;}
function storageGet(keys){return new Promise(resolve=>chrome.storage.local.get(keys,resolve));}
function storageSet(values){return new Promise(resolve=>chrome.storage.local.set(values,resolve));}
function storageRemove(keys){return new Promise(resolve=>chrome.storage.local.remove(keys,resolve));}
function lock(value){
 running=value;
 for(const id of ['scan','all','none','start','clear-history','choose-directory'])$(id).disabled=value;
 $('cancel').disabled=!value;
 for(const input of document.querySelectorAll('input'))input.disabled=value;
}

function openDirectoryDb(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('topschool-album-enhancer',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('settings');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
async function directoryDb(mode,action){
 const db=await openDirectoryDb();
 try{
  return await new Promise((resolve,reject)=>{
   const transaction=db.transaction('settings',mode);
   const request=action(transaction.objectStore('settings'));
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error);
  });
 }finally{db.close();}
}
async function loadDirectory(){
 try{directoryHandle=await directoryDb('readonly',store=>store.get('directory'));}catch{}
 updateDirectoryName();
}
function updateDirectoryName(){
 $('directory-name').textContent=directoryHandle?.name||'尚未選擇';
 $('directory-name').title=directoryHandle?.name||'';
}
async function chooseDirectory(){
 if(!window.showDirectoryPicker)throw Error('這個 Chrome 版本不支援選擇任意資料夾，請先更新 Chrome。');
 directoryHandle=await window.showDirectoryPicker({id:'topschool-albums',mode:'readwrite'});
 await directoryDb('readwrite',store=>store.put(directoryHandle,'directory'));
 updateDirectoryName();
 return directoryHandle;
}
async function ensureDirectory(){
 if(!directoryHandle)return chooseDirectory();
 const options={mode:'readwrite'};
 if(await directoryHandle.queryPermission(options)==='granted')return directoryHandle;
 if(await directoryHandle.requestPermission(options)==='granted')return directoryHandle;
 throw Error('未取得資料夾寫入權限，請重新選擇下載資料夾。');
}

async function loadSettings(){
 const saved=await storageGet(['skipDownloaded','downloadedAlbums']);
 $('skip-downloaded').checked=saved.skipDownloaded!==false;
 history=saved.downloadedAlbums??{};
 await loadDirectory();
}
async function saveSettings(){await storageSet({skipDownloaded:$('skip-downloaded').checked});}
function formatDate(iso){try{return new Intl.DateTimeFormat('zh-TW',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso));}catch{return iso;}}
function render(){
 $('list').replaceChildren();
 const skip=$('skip-downloaded').checked;
 albums.forEach((album,index)=>{
  const label=document.createElement('label');
  const box=document.createElement('input');
  const title=document.createElement('span');
  const record=history[albumKey(album)];
  box.type='checkbox';box.value=index;box.checked=!(skip&&record);
  title.className='album-name';title.textContent=album.name;
  label.append(box,title);
  if(record){
   const badge=document.createElement('span');
   badge.className='downloaded';
   badge.textContent=`已下載 · ${record.photoCount??'?'} 張 · ${formatDate(record.completedAt)}`;
   badge.title=record.filename??'';
   label.append(badge);
  }
  $('list').append(label);
 });
 $('start').disabled=running||!albums.length;
}
async function scan(){
 lock(true);controller=new AbortController();
 try{
  albums=[];const seen=new Set();let last=1;
  for(let page=1;page<=last;page++){
   status(`掃描相簿列表 ${page} / ${last}`);
   const url=TS.page(source,page),doc=await TS.doc(url,controller.signal);
   if(!doc.querySelector('#freebrick2'))throw Error('找不到相簿列表');
   last=Math.max(last,TS.max(doc,url));if(last>2000)throw Error('分頁數異常');
   for(const album of TS.albums(doc))if(!seen.has(album.id)){seen.add(album.id);albums.push(album);}
  }
  render();
  const downloaded=albums.filter(album=>history[albumKey(album)]).length;
  status(`找到 ${albums.length} 本相簿，其中 ${downloaded} 本已有下載紀錄`);
 }catch(error){albums=[];status('掃描停止：'+error.message+'；請重新掃描。');render();}
 finally{lock(false);$('start').disabled=!albums.length;}
}

$('scan').onclick=scan;
$('all').onclick=()=>document.querySelectorAll('#list input').forEach(input=>input.checked=true);
$('none').onclick=()=>document.querySelectorAll('#list input').forEach(input=>input.checked=false);
$('cancel').onclick=()=>controller?.abort();
$('choose-directory').onclick=async()=>{
 try{await chooseDirectory();status(`下載位置已設為「${directoryHandle.name}」`);}catch(error){if(error.name!=='AbortError')status(error.message);}
};
$('skip-downloaded').onchange=async()=>{await saveSettings();render();};
$('clear-history').onclick=async()=>{
 await storageRemove('downloadedAlbums');history={};render();
 status('已清除這個外掛的相簿下載紀錄；已存在的 ZIP 不會刪除。');
};

async function uniqueFileHandle(directory,filename){
 const dot=filename.lastIndexOf('.');
 const base=dot>0?filename.slice(0,dot):filename;
 const extension=dot>0?filename.slice(dot):'';
 for(let number=0;number<10000;number++){
  const candidate=number?`${base} (${number})${extension}`:filename;
  try{await directory.getFileHandle(candidate);}
  catch(error){if(error.name==='NotFoundError')return {handle:await directory.getFileHandle(candidate,{create:true}),filename:candidate};throw error;}
 }
 throw Error('同名檔案過多，無法建立新的 ZIP。');
}
async function save(blob,filename,signal){
 const target=await uniqueFileHandle(directoryHandle,filename);
 const writable=await target.handle.createWritable();
 try{
  if(signal.aborted)throw Error('已停止');
  await writable.write(blob);
  if(signal.aborted)throw Error('已停止');
  await writable.close();
  return target.filename;
 }catch(error){try{await writable.abort();}catch{}throw error;}
}

$('start').onclick=async()=>{
 const selected=[...document.querySelectorAll('#list input:checked')].map(input=>albums[Number(input.value)]);
 if(!selected.length){status('請至少選擇一本相簿。');return;}
 try{await ensureDirectory();}catch(error){if(error.name!=='AbortError')status(error.message);return;}
 lock(true);controller=new AbortController();const signal=controller.signal;$('log').textContent='';
 try{
  for(const album of selected){
   if(signal.aborted)throw Error('已停止');
   const photos=[],seen=new Set();let last=1;
   for(let page=1;page<=last;page++){
    status(`${album.name} · 掃描照片頁 ${page} / ${last}`);
    const url=TS.page(album.url,page),doc=await TS.doc(url,signal);
    if(!doc.querySelector('#freebrick4'))throw Error('找不到照片內容');
    last=Math.max(last,TS.max(doc,url));if(last>2000)throw Error('分頁數異常');
    for(const photo of TS.photos(doc))if(!seen.has(photo.url)){seen.add(photo.url);photos.push(photo);}
   }
   if(!photos.length)throw Error('相簿沒有照片');
   const entries=[];let size=0;
   for(let index=0;index<photos.length;index++){
    status(`${album.name} · 原圖 ${index+1} / ${photos.length}`);
    const photo=photos[index],response=await TS.get(photo.url,signal,true);
    if(!response.headers.get('content-type')?.startsWith('image/'))throw Error('原圖回應不是圖片');
    const data=new Uint8Array(await response.arrayBuffer());size+=data.length;
    if(size>512*1024*1024)throw Error('單本相簿超過 512 MiB，已停止以避免記憶體不足');
    const extension=new URL(photo.url).pathname.match(/\.(jpe?g|png|webp|gif)$/i)?.[0]||'.jpg';
    entries.push({name:String(index+1).padStart(4,'0')+'_'+TS.name(photo.name)+extension,data});
   }
   status(`${album.name} · 建立 ZIP…`);
   const savedName=await save(makeZip(entries),TS.name(album.name)+'.zip',signal);
   const displayPath=`${directoryHandle.name}/${savedName}`;
   history[albumKey(album)]={albumId:album.id,name:album.name,photoCount:photos.length,completedAt:new Date().toISOString(),filename:displayPath};
   await storageSet({downloadedAlbums:history});
   render();
   $('log').textContent+=`✓ ${album.name}：${photos.length} 張 → ${displayPath}\n`;
  }
  status('選取相簿下載完成');
 }catch(error){status('下載停止：'+error.message+'；已完成的 ZIP 與紀錄會保留，可重新選取其餘相簿。');}
 finally{lock(false);}
};

(async()=>{
 await loadSettings();
 if(new URL(source).pathname.endsWith('School-Album-Detail')){
  $('scan').hidden=true;
  try{
   const doc=await TS.doc(TS.page(source,1));
   const url=new URL(source);
   albums=[{id:url.searchParams.get('albumId'),url:TS.page(source,1),name:doc.querySelector('h2')?.textContent.replace(/^相簿名稱\s*[:：]\s*/,'').trim()||'相簿'}];
   render();
   status(history[albumKey(albums[0])]?'目前相簿已有下載紀錄，仍可勾選後重新下載。':'目前相簿已就緒，下載會掃描全部照片頁。');
  }catch(error){status(error.message);}
 }else status('請先選擇下載資料夾，再掃描完整相簿列表。');
})();
