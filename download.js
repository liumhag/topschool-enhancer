const $=id=>document.getElementById(id);
const INDEX_FILE='topschool-album-downloads.json';
let controller,albums=[],running=false,history={},directoryHandle,directoryPermission='unknown',directoryFiles=new Map();
const source=TS.allowed(new URL(location.href).searchParams.get('source')).href;
const siteKey=new URL(source).hostname;

function status(message){$('status').textContent=message;}
function albumKey(album){return `${siteKey}:${album.id}`;}
function storageGet(keys){return new Promise(resolve=>chrome.storage.local.get(keys,resolve));}
function storageSet(values){return new Promise(resolve=>chrome.storage.local.set(values,resolve));}
function storageRemove(keys){return new Promise(resolve=>chrome.storage.local.remove(keys,resolve));}
function lock(value){
 running=value;
 for(const id of ['scan','all','none','start','refresh-directory','choose-directory'])$(id).disabled=value;
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
 try{return await new Promise((resolve,reject)=>{const request=action(db.transaction('settings',mode).objectStore('settings'));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
 finally{db.close();}
}
async function loadDirectory(){
 try{directoryHandle=await directoryDb('readonly',store=>store.get('directory'));}catch{}
 if(directoryHandle)try{directoryPermission=await directoryHandle.queryPermission({mode:'readwrite'});}catch{directoryPermission='denied';}
 updateDirectoryDisplay();
}
function updateDirectoryDisplay(){
 const labels={granted:'已授權',prompt:'需要確認',denied:'未授權',unknown:'狀態未知'};
 $('directory-name').textContent=directoryHandle?`${directoryHandle.name}（${labels[directoryPermission]}）`:'尚未選擇';
 $('choose-directory').textContent=!directoryHandle?'選擇資料夾':directoryPermission==='granted'?'更換資料夾':directoryPermission==='prompt'?'確認資料夾權限':'重新選擇資料夾';
}
async function chooseDirectory(){
 if(!window.showDirectoryPicker)throw Error('這個 Chrome 版本不支援選擇任意資料夾，請先更新 Chrome。');
 directoryHandle=await window.showDirectoryPicker({id:'topschool-albums',mode:'readwrite'});
 directoryPermission='granted';history={};directoryFiles=new Map();
 await directoryDb('readwrite',store=>store.put(directoryHandle,'directory'));
 await syncDirectory();
 updateDirectoryDisplay();
 return directoryHandle;
}
async function ensureDirectory(){
 if(!directoryHandle)return chooseDirectory();
 const options={mode:'readwrite'};
 if(await directoryHandle.queryPermission(options)==='granted'){directoryPermission='granted';updateDirectoryDisplay();return directoryHandle;}
 if(await directoryHandle.requestPermission(options)==='granted'){directoryPermission='granted';updateDirectoryDisplay();return directoryHandle;}
 directoryPermission='denied';updateDirectoryDisplay();
 throw Error('未取得資料夾寫入權限，請重新選擇下載資料夾。');
}
async function authorizeOrChooseDirectory(){
 if(!directoryHandle)return chooseDirectory();
 if(directoryPermission==='granted')return chooseDirectory();
 if(directoryPermission==='denied')return chooseDirectory();
 const permission=await directoryHandle.requestPermission({mode:'readwrite'});
 directoryPermission=permission;updateDirectoryDisplay();
 if(permission!=='granted')throw Error('未取得資料夾寫入權限。');
 await syncDirectory();
 return directoryHandle;
}
async function readIndex(){
 try{
  const handle=await directoryHandle.getFileHandle(INDEX_FILE);
  const data=JSON.parse(await(await handle.getFile()).text());
  return data&&typeof data==='object'?data:{};
 }catch(error){if(error.name==='NotFoundError'||error instanceof SyntaxError)return {};throw error;}
}
async function writeIndex(){
 const handle=await directoryHandle.getFileHandle(INDEX_FILE,{create:true});
 const writable=await handle.createWritable();
 try{await writable.write(JSON.stringify({formatVersion:2,folderName:directoryHandle.name,albums:history},null,2));await writable.close();}
 catch(error){try{await writable.abort();}catch{}throw error;}
}
async function syncDirectory(){
 directoryFiles=new Map();
 for await(const [name,handle] of directoryHandle.entries()){
  if(handle.kind!=='file'||!name.toLowerCase().endsWith('.zip'))continue;
  const file=await handle.getFile();
  directoryFiles.set(name,{lastModified:file.lastModified});
 }
 const index=await readIndex();
 history={};
 for(const [key,record] of Object.entries(index.albums||{})){
  if(record&&directoryFiles.has(record.filename))history[key]={...record,verified:record.verified===true};
 }
 inferExistingAlbums();
 await storageSet({downloadedAlbums:history});
 updateDirectoryDisplay();render();
}
function inferExistingAlbums(){
 const counts=new Map();
 for(const album of albums){const key=TS.key(album.name);counts.set(key,(counts.get(key)||0)+1);}
 for(const album of albums){
  const key=albumKey(album);if(history[key])continue;
  const nameKey=TS.key(album.name);if(counts.get(nameKey)!==1)continue;
  const match=[...directoryFiles.keys()].find(name=>TS.key(name.replace(/ \(\d+\)(?=\.zip$)/i,''))===nameKey);
  if(match){const file=directoryFiles.get(match);history[key]={albumId:album.id,name:album.name,photoCount:null,completedAt:new Date(file.lastModified).toISOString(),filename:match,inferred:true,verified:false};}
 }
}
async function zipEntryCount(filename){
 const handle=await directoryHandle.getFileHandle(filename),file=await handle.getFile();
 try{return await TS.zipCount(file);}catch{throw Error(`無法讀取 ZIP 檔案數：${filename}`);}
}
async function remotePhotoCount(album,signal){
 const seen=new Set();let last=1;
 for(let page=1;page<=last;page++){
  status(`${album.name} · 比對照片頁 ${page} / ${last}`);
  const url=TS.page(album.url,page),doc=await TS.doc(url,signal);
  if(!doc.querySelector('#freebrick4'))throw Error('找不到照片內容');
  last=Math.max(last,TS.max(doc,url));if(last>2000)throw Error('分頁數異常');
  for(const photo of TS.photos(doc,url))seen.add(photo.url);
 }
 return seen.size;
}
async function verifyExistingAlbums(signal){
 for(const album of albums){
  const record=history[albumKey(album)];if(!record)continue;
  let localCount=null;
  try{localCount=await zipEntryCount(record.filename);}catch{}
  const remoteCount=await remotePhotoCount(album,signal);
  Object.assign(record,{localCount,photoCount:remoteCount,verified:localCount===remoteCount});
 }
}

async function loadSettings(){
 const saved=await storageGet(['skipDownloaded','downloadedAlbums']);
 $('skip-downloaded').checked=saved.skipDownloaded!==false;
 history=saved.downloadedAlbums&&typeof saved.downloadedAlbums==='object'?saved.downloadedAlbums:{};
 await storageRemove('directoryLabel');
 await loadDirectory();
}
async function saveSettings(){await storageSet({skipDownloaded:$('skip-downloaded').checked});}
function formatDate(iso){try{return new Intl.DateTimeFormat('zh-TW',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso));}catch{return iso;}}
function render(){
 $('list').replaceChildren();
 const skip=$('skip-downloaded').checked;
 albums.forEach((album,index)=>{
  const label=document.createElement('label'),box=document.createElement('input'),title=document.createElement('span');
  const record=history[albumKey(album)];
  box.type='checkbox';box.value=index;box.checked=!(skip&&record?.verified);
  title.className='album-name';title.textContent=album.name;label.append(box,title);
  if(record){
   const badge=document.createElement('span');badge.className=record.verified?'downloaded':'incomplete';
   badge.textContent=record.verified?`已下載 · ${record.photoCount} 張 · ${formatDate(record.completedAt)}`:`不完整 · ZIP ${record.localCount??'?'} / 相簿 ${record.photoCount??'?'} 張`;
   badge.title=record.filename??'';label.append(badge);
  }
  $('list').append(label);
 });
 $('start').disabled=running||!albums.length;
}
async function scanAlbumList(signal){
 albums=[];const seen=new Set();let last=1;
  for(let page=1;page<=last;page++){
   status(`掃描網頁相簿列表 ${page} / ${last}`);
   const url=TS.page(source,page),doc=await TS.doc(url,signal);
   if(!doc.querySelector('#freebrick2'))throw Error('找不到相簿列表');
   last=Math.max(last,TS.max(doc,url));if(last>2000)throw Error('分頁數異常');
   for(const album of TS.albums(doc,url))if(!seen.has(album.id)){seen.add(album.id);albums.push(album);}
  }
}
async function scan(){
 lock(true);controller=new AbortController();
 try{
  await scanAlbumList(controller.signal);render();
  const downloaded=albums.filter(album=>history[albumKey(album)]?.verified).length;
  status(`找到 ${albums.length} 本相簿；依下載紀錄標示 ${downloaded} 本已下載。需要核對 ZIP 與照片張數時，請按「完整掃描比對」。`);
 }catch(error){albums=[];status('掃描停止：'+error.message+'；請重新掃描。');render();}
 finally{lock(false);$('start').disabled=!albums.length;}
}

$('scan').onclick=scan;
$('all').onclick=()=>document.querySelectorAll('#list input').forEach(input=>input.checked=true);
$('none').onclick=()=>document.querySelectorAll('#list input').forEach(input=>input.checked=false);
$('cancel').onclick=()=>controller?.abort();
$('choose-directory').onclick=async()=>{try{await authorizeOrChooseDirectory();status(`下載位置已設為「${directoryHandle.name}」`);}catch(error){if(error.name!=='AbortError')status(error.message);}};
$('refresh-directory').onclick=async()=>{
 controller=new AbortController();lock(true);
 try{
  await ensureDirectory();
  if(!albums.length&&new URL(source).pathname.endsWith('School-Albums'))await scanAlbumList(controller.signal);
  await syncDirectory();await verifyExistingAlbums(controller.signal);await writeIndex();await storageSet({downloadedAlbums:history});render();
  const downloaded=albums.filter(album=>history[albumKey(album)]?.verified).length;
  status(`完整比對完成：${albums.length} 本相簿中有 ${downloaded} 本 ZIP 與網站照片張數一致。`);
 }
 catch(error){if(error.name!=='AbortError')status(error.message);}
 finally{lock(false);}
};
$('skip-downloaded').onchange=async()=>{await saveSettings();render();};

async function uniqueFileHandle(directory,filename){
 const dot=filename.lastIndexOf('.'),base=dot>0?filename.slice(0,dot):filename,extension=dot>0?filename.slice(dot):'';
 for(let number=0;number<10000;number++){
  const candidate=number?`${base} (${number})${extension}`:filename;
  try{await directory.getFileHandle(candidate);}
  catch(error){if(error.name==='NotFoundError')return {handle:await directory.getFileHandle(candidate,{create:true}),filename:candidate};throw error;}
 }
 throw Error('同名檔案過多，無法建立新的 ZIP。');
}
async function save(blob,filename,signal){
 const target=await uniqueFileHandle(directoryHandle,filename),writable=await target.handle.createWritable();
 try{if(signal.aborted)throw Error('已停止');await writable.write(blob);if(signal.aborted)throw Error('已停止');await writable.close();return target.filename;}
 catch(error){try{await writable.abort();}catch{}throw error;}
}

$('start').onclick=async()=>{
 const selected=[...document.querySelectorAll('#list input:checked')].map(input=>albums[Number(input.value)]);
 if(!selected.length){status('請至少選擇一本相簿。');return;}
 try{await ensureDirectory();await syncDirectory();}catch(error){if(error.name!=='AbortError')status(error.message);return;}
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
    for(const photo of TS.photos(doc,url))if(!seen.has(photo.url)){seen.add(photo.url);photos.push(photo);}
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
   history[albumKey(album)]={albumId:album.id,name:album.name,photoCount:photos.length,localCount:photos.length,completedAt:new Date().toISOString(),filename:savedName,verified:true};
   directoryFiles.set(savedName,{lastModified:Date.now()});
   await writeIndex();await storageSet({downloadedAlbums:history});render();
   $('log').textContent+=`✓ ${album.name}：${photos.length} 張 → ${directoryHandle.name}/${savedName}\n`;
  }
  status('選取相簿下載完成');
 }catch(error){status('下載停止：'+error.message+'；已完成的 ZIP 會保留，可重新掃描資料夾。');}
 finally{lock(false);}
};

(async()=>{
 const manifest=chrome.runtime.getManifest();$('version').textContent=`v${manifest.version_name||manifest.version}`;
 await loadSettings();
 if(new URL(source).pathname.endsWith('School-Album-Detail')){
  $('scan').hidden=true;
  try{
   const doc=await TS.doc(TS.page(source,1)),url=new URL(source);
   albums=[{id:url.searchParams.get('albumId'),url:TS.page(source,1),name:doc.querySelector('h2')?.textContent.replace(/^相簿名稱\s*[:：]\s*/,'').trim()||'相簿'}];
   render();status(history[albumKey(albums[0])]?.verified?'目前下載紀錄顯示此相簿已完成；需要核對實際 ZIP 時，請按「完整掃描比對」。':'目前相簿已就緒，請確認下載資料夾。');
  }catch(error){status(error.message);}
 }else status('請按「掃描網頁相簿列表」；此快速掃描會直接使用已保存的下載紀錄。');
})();
