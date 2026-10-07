function open(source){try{const u=new URL(source);if(u.protocol!=='https:'||!(u.hostname==='topschool.tw'||u.hostname.endsWith('.topschool.tw'))||!/^\/Activity\/School-(Albums|Album-Detail)$/.test(u.pathname))return;chrome.tabs.create({url:chrome.runtime.getURL('download.html')+'?source='+encodeURIComponent(u.href)});}catch{}}
chrome.action.onClicked.addListener(tab=>open(tab.url));
chrome.runtime.onMessage.addListener((m,s)=>{if(m.type==='open'&&s.tab)open(s.tab.url);});
