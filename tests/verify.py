"""No network or children's photos: meaningful ZIP compatibility and URL checks."""
import json, pathlib, subprocess, tempfile, zipfile
root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
assert manifest['version'] == '0.2.8'
assert manifest['version_name'] == '20261007.0.2.8'
assert manifest['permissions'] == ['storage']
download_html = (root / 'download.html').read_text(encoding='utf-8')
download_js = (root / 'download.js').read_text(encoding='utf-8')
content_js = (root / 'content.js').read_text(encoding='utf-8')
content_css = (root / 'content.css').read_text(encoding='utf-8')
assert all(f'id="{item}"' in download_html for item in ('choose-directory', 'directory-name', 'refresh-directory', 'version'))
assert 'id="path-label"' not in download_html
assert '設定下載至本機資料夾' in download_html
assert 'Chrome 只提供資料夾名稱' not in download_html
assert "const INDEX_FILE='topschool-album-downloads.json'" in download_js
assert 'location.replace(TS.page(source,1))' in content_js
assert "document.querySelectorAll('.pagination').forEach(x=>x.remove())" in content_js
assert '.pagination{display:none!important}' in content_css
with tempfile.TemporaryDirectory() as temp:
    target = pathlib.Path(temp) / 'test.zip'
    script = '''
const fs=require('node:fs');require('./core.js');require('./zip.js');
const assert=require('node:assert/strict');
const u=TS.page('https://winnerpreschool.topschool.tw/Activity/School-Album-Detail?albumId=1&pageIndex=8&CategoryId=9',2);
assert.equal(TS.index(u),2);assert.equal(new URL(u).searchParams.get('CategoryId'),'9');
assert.equal([...new URL(u).searchParams].filter(([k])=>k.toLowerCase()==='pageindex').length,1);
assert.throws(()=>TS.allowed('https://evil.example/Activity/School-Albums'));
assert.throws(()=>TS.allowed('https://winnerpreschool.topschool.tw/Home/Main'));
assert.throws(()=>TS.allowed('https://evil.example/a.jpg',true));
assert.equal(TS.name('a/b:*'),'a-b');
assert.equal(TS.name('豐收啦~'),'豐收啦');
assert.equal(TS.name('2026.8.8活動'),'1150808活動');
assert.equal(TS.name('2026.08.08活動'),'1150808活動');
assert.equal(TS.name('20260808活動'),'1150808活動');
assert.equal(TS.name('115.3.17世界水資源日'),'1150317世界水資源日');
assert.equal(TS.name('115.0317世界水資源日'),'1150317世界水資源日');
assert.equal(TS.name('舊鞋旅行2025.12'),'舊鞋旅行11412');
assert.equal(TS.name('2026 07維妮爾國際幼兒園 看見孩子的舞台'),'11507維妮爾國際幼兒園 看見孩子的舞台');
assert.equal(TS.name('2026 7 8夏日活動'),'1150708夏日活動');
assert.equal(TS.name('12、1月學習區'),'12-1月學習區');
assert.equal(TS.name('CON'),'＿CON');
assert.equal(TS.name('相簿. '),'相簿');
assert.equal(TS.path('../TopSchool/2026:秋季'),'TopSchool/2026-秋季');
assert.equal(TS.key('12、1月學習區.zip'),TS.key('12-1月學習區.zip'));
assert.equal(TS.key('活動2026.8.8.zip'),TS.key('活動1150808.zip'));
assert.equal(TS.key('115.0317世界水資源日'),TS.key('1150317世界水資源日.zip'));
const zip=makeZip([{name:'照片_001.jpg',data:new Uint8Array([0,1,2,255])},{name:'empty.txt',data:new Uint8Array()}]);
Promise.all([TS.zipCount(zip),zip.arrayBuffer()]).then(([count,b])=>{assert.equal(count,2);fs.writeFileSync(process.argv[1],Buffer.from(b));});
'''
    subprocess.run(['node', '-e', script, str(target)], cwd=root, check=True)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert archive.read('照片_001.jpg') == bytes([0, 1, 2, 255])
        assert archive.read('empty.txt') == b''
for path in root.glob('*.js'):
    subprocess.run(['node', '--check', str(path)], check=True)
print('PASS: JavaScript syntax, safe filenames and paths, URL constraints, UTF-8 ZIP filenames and CRC')
