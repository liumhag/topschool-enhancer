# TopSchool Album Enhancer v0.1.0

維妮爾國際幼兒園 TopSchool 相簿用 Chrome 外掛。Windows / Mac 桌面 Chrome 適用，不需上架、不需 npm 安裝。

## 功能
- 相簿列表與相簿照片頁隱藏分頁，接近底部時自動接續下一頁。
- 保留卡片文字與縮圖，改為網格排列以避免原網站 freewall 絕對定位重疊。
- 點照片使用簡單的大圖對話框；本版未提供大圖左右切換。
- 右下角按鈕開啟独立下載分頁；外層可掃描所有列表頁，勾選一本、多本或全部。
- 內層下載掃描整本相簿，不受目前瀏覽頁數限制。
- 原圖取自照片連結；每本相簿一個「相簿名稱.zip」。ZIP 內照片附流水號，避免同名覆蓋。
- 逐本處理、失敗重試三次、停止按鈕、明確錯誤，不將不完整相簿標示為完成。

## 先安裝試用
1. 解壓下載的專案 ZIP，放到固定資料夾，例如 Windows 的 Documents 或 Mac 的 ~/Projects。
2. Chrome 開啟 `chrome://extensions`。
3. 開啟「開發人員模式」，按「載入未封裝項目」。
4. 選擇包含 manifest.json 的 topschool-album-enhancer 資料夾。
5. 打開幼兒園相簿列表，重新整理。往下捲，確認下一頁接續出現。
6. 進入一本相簿，確認照片接續、點照片可放大。
7. 按右下角「下載這本相簿」，在新分頁按下載。保持這個分頁開啟。
8. 檢查 Downloads 的 ZIP 能解壓、張數正確，照片解析度與網站點開的大圖相同。
9. 返回列表測試掃描全部、取消全選、只勾兩本下載。

公司管理的 Chrome 可能禁止開發人員模式；遇到此限制請在個人電腦測試。
Chrome 工具列圖示也可開啟下載器，但需要目前分頁位於支援的相簿路徑。
更新程式後到擴充功能頁按重新載入，再重新整理相簿頁。

## 權限與資料
僅 downloads、幼兒園網域、圖片網域 isai-prod-v2.s3.hicloud.net.tw。
不讀其他網站、不收集紀錄、不上傳照片、不依賴外部 JavaScript。
原圖在外掛分頁 fetch，ZIP 在本機記憶體生成。ZIP 使用內建小型 STORE 寫入器；JPEG 本來已壓縮，不重複壓縮。
本版每本相簿限制 512 MiB 原圖總量；實際記憶體占用會高於此數字。
本版沒有跨重開瀏覽器的續傳、已下載判斷、全部相簿單一 ZIP。
同名下載由 Chrome 加上編號；不會覆寫既有檔案。
分類篩選會保留；「全部」指目前分類所有頁。從非第一頁開始瀏覽會接續後面頁面；下載仍從第一頁扫描。
掃描失败請重新掃描，勿將部分列表視為完整結果。

## GitHub Private Repo：下一步
目前交付的是可安裝原始碼；尚未建立或推送 GitHub repository。

最容易的方法是安裝官方 GitHub Desktop，在 GitHub 帳號登入後：
1. File → New repository，名稱 topschool-album-enhancer，放在固定專案路徑。
2. 把本包資料夾內的程式檔复制到新 repository，確認根目錄直接有 manifest.json。
3. Commit to main，訊息 `Add TopSchool Album Enhancer v0.1.0`。
4. Publish repository；取消「Keep this code private」會公開，所以務必保持勾選。
5. Windows Chrome 載入這個 repository 資料夾作為外掛。
6. 家中 Mac 用 GitHub Desktop → Clone repository，選這個 private repo；Chrome 載入 Mac clone 的資料夾。

每次開發前 Fetch / Pull；改完測試、Commit / Push。換另一台電腦先 Pull。
不要同時在兩台修改同一份檔案而未同步。不要加入下載照片、ZIP 或帳密。

## 用 Codex 接續
在 Mac 安裝官方 Codex 後，開啟 clone 的專案資料夾。可直接說：

> 請先讀 AGENTS.md、README.md、CHANGELOG.md，檢查目前版本，協助我驗證 TopSchool 相簿外掛，依錯誤修正並更新版本。

日後在聊天中提供 private repo 連結及可用的 GitHub 存取方式即可接續；沒有連接權限時仍需要提供最新檔案。

## 開發與驗收
`node --check` 可檢查各 JS 語法；`python3 tests/verify.py` 驗證 ZIP 的 UTF-8 檔名與 CRC，以及 URL 頁碼與網域限制。
實際 DOM 已檢視：列表 #freebrick2 .brick2、照片 #freebrick4 .photo-gallery、.pagination、h2。
已觀察列表 13 頁、教師節相簿 9 頁；數量會隨網站更新。
仍需使用者端驗證：Chrome 安裝、真實跨域原圖 fetch、ZIP 下載完成、長相簿連續瀏覽與分類。

## 後續版本規劃
0.1：本版功能與實際安裝驗收。
0.2：依驗收結果修正，增加記住下載狀態、大圖左右切換。
0.3：大型相簿低記憶體串流 ZIP、續傳與可選日期筛選。

參考：
- https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world
- https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- https://docs.github.com/en/desktop/overview/creating-your-first-repository-using-github-desktop
