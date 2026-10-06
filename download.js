const $=id=>document.getElementById(id);
let controller,albums=[],running=false,history={};
const source=TS.allowed(new URL(location.href).searchParams.get('source')).href;
const siteKey=new URL(source).hostname;

function status(message){$('status').textContent=message;}
function albumKey(album){return `${siteKey}:${album.id}`;}
function storageGet(keys){return new Promise(resolve=>chrome.storage.local.get(keys,resolve));}
function storageSet(values){return new Promise(resolve=>chrome.storage.local.set(values,resolve));}
function storageRemove(keys){return new Promise(resolve=>chrome.storage.local.remove(keys,resolve));}
function lock(value){
 running=value;
 for(const id of ['scan','all','none','start','clear-history'])$(id).disabled=value;
 $('cancel').disabled=!value;
 for(const input of document.querySelectorAll('input'))input.disabled=value;
}
async function loadSettings(){
 const saved=await storageGet(['downloadDirectory','skipDownloaded','downloadedAlbums']);
 $('directory').value=saved.downloadDirectory??'TopSchool Albums';
 $('skip-downloaded').checked=saved.skipDownloaded!==false;
 history=saved.downloadedAlbums??{};
}
async function saveSettings(){
 const directory=TS.path($('directory').value);
 $('directory').value=directory;
 await storageSet({downloadDirectory:directory,skipDownloaded:$('skip-downloaded').checked});
 return directory;
}
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
$('directory').onchange=saveSettings;
$('skip-downloaded').onchange=async()=>{await saveSettings();render();};
$('clear-history').onclick=async()=>{
 await storageRemove('downloadedAlbums');history={};render();
 status('已清除這個外掛的相簿下載紀錄；已存在的 ZIP 不會刪除。');
};

async function save(blob,filename,signal){
 const url=URL.createObjectURL(blob);
 try{
  const id=await chrome.downloads.download({url,filename,conflictAction:'uniquify',saveAs:false});
  await new Promise((resolve,reject)=>{
   let timer;
   const done=()=>{clearInterval(timer);chrome.downloads.onChanged.removeListener(change);signal.removeEventListener('abort',abort);};
   const abort=()=>{chrome.downloads.cancel(id);done();reject(Error('已停止'));};
   const check=async()=>{
    try{
     const [item]=await chrome.downloads.search({id});
     if(item?.state==='complete'){done();resolve(item);}
     else if(item?.state==='interrupted'){done();reject(Error(item.error||'下載中斷'));}
    }catch(error){done();reject(error);}
   };
   const change=delta=>{if(delta.id===id)check();};
   chrome.downloads.onChanged.addListener(change);signal.addEventListener('abort',abort,{once:true});timer=setInterval(check,1000);
   if(signal.aborted)abort();else check();
  });
 }finally{URL.revokeObjectURL(url);}
}

$('start').onclick=async()=>{
 const selected=[...document.querySelectorAll('#list input:checked')].map(input=>albums[Number(input.value)]);
 if(!selected.length){status('請至少選擇一本相簿。');return;}
 lock(true);controller=new AbortController();const signal=controller.signal;$('log').textContent='';
 try{
  const directory=await saveSettings();
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
   const zipName=TS.name(album.name)+'.zip';
   const relativeName=directory?`${directory}/${zipName}`:zipName;
   await save(makeZip(entries),relativeName,signal);
   history[albumKey(album)]={albumId:album.id,name:album.name,photoCount:photos.length,completedAt:new Date().toISOString(),filename:relativeName};
   await storageSet({downloadedAlbums:history});
   render();
   $('log').textContent+=`✓ ${album.name}：${photos.length} 張 → ${relativeName}\n`;
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
 }else status('按「掃描完整相簿列表」取得所有頁面，可選一本、多本或全部。');
})();
