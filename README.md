# TopSchool Album Enhancer v20261007.0.2.10

維妮爾國際幼兒園 TopSchool 相簿用 Chrome 外掛。Windows / Mac 桌面 Chrome 適用，不需上架、不需 npm 安裝。

## 功能
- 相簿列表與相簿照片頁隱藏原網站分頁，固定從第一頁開始；接近底部時自動接續下一頁。
- 保留卡片文字與縮圖，改為網格排列以避免原網站 freewall 絕對定位重疊。
- 點照片使用簡單的大圖對話框；本版未提供大圖左右切換。
- 右下角按鈕開啟独立下載分頁；外層可掃描所有列表頁，勾選一本、多本或全部。
- 內層下載掃描整本相簿，不受目前瀏覽頁數限制。
- 原圖取自照片連結；每本相簿一個「相簿名稱.zip」。ZIP 內照片附流水號，避免同名覆蓋。
- 可用系統資料夾選擇器指定任意下載資料夾，例如 `D:\TopSchool`，不受 Chrome 預設下載位置限制。
- 顯示 Chrome 提供的資料夾名稱及目前授權狀態；不要求使用者手動輸入路徑。
- 下載器右上角顯示對外版本號，方便確認目前載入版本。
- 相簿名稱與照片名稱會使用易讀規則清理：刪除 `~`、將 `、` 改成 `-`，其他 Windows 不合法分隔符改成 `-` 或移除，並處理 Windows 保留名稱。
- 日期統一使用民國年並補零，例如 `2026.8.8` → `1150808`，`2026 07` → `11507`，`115.3.17` 或 `115.0317` → `1150317`。只有年月時保留民國年月，例如 `2025.12` → `11412`，不虛構日期。
- 以目前資料夾內實際存在的 ZIP 判斷是否已下載；索引檔 `topschool-album-downloads.json` 保存相簿 ID、ZIP 檔名、照片數量與時間。
- 外掛更新、重裝或本機紀錄清除後，重新選擇原資料夾仍可由索引及 ZIP 恢復已下載狀態。
- 一般「掃描網頁相簿列表」只掃描網站外層列表，並以保存的相簿 ID 紀錄快速標示已下載狀態，不要求資料夾權限或逐本計算照片。
- 「完整掃描比對」才會核對 JSON、本機 ZIP、ZIP 檔案數與網站實際照片數，適合在手動移動或刪除 ZIP 後使用。
- 判斷已下載時會讀取 ZIP 內檔案數，並掃描網站相簿的實際照片數；只有兩者一致才標示「已下載」，不一致會顯示「不完整」並保持勾選。
- 逐本處理、失敗重試三次、停止按鈕、明確錯誤，不將不完整相簿標示為完成。

## 先安裝試用
1. 解壓下載的專案 ZIP，放到固定資料夾，例如 Windows 的 Documents 或 Mac 的 ~/Projects。
2. Chrome 開啟 `chrome://extensions`。
3. 開啟「開發人員模式」，按「載入未封裝項目」。
4. 選擇包含 manifest.json 的 topschool-album-enhancer 資料夾。
5. 打開幼兒園相簿列表，重新整理。往下捲，確認下一頁接續出現。
6. 進入一本相簿，確認照片接續、點照片可放大。
7. 按右下角「下載這本相簿」，在新分頁按「選擇資料夾」，並依 Chrome 提示授權存取。
8. 檢查所選資料夾內的 ZIP 能解壓、張數正確，照片解析度與網站點開的大圖相同。
9. 返回列表按「掃描網頁相簿列表」，確認已下載狀態可由紀錄快速恢復；需要核對實際檔案時再按「完整掃描比對」。

公司管理的 Chrome 可能禁止開發人員模式；遇到此限制請在個人電腦測試。
Chrome 工具列圖示也可開啟下載器，但需要目前分頁位於支援的相簿路徑。
更新程式後到擴充功能頁按重新載入，再重新整理相簿頁。

## 權限與資料
僅 storage、幼兒園網域、圖片網域 isai-prod-v2.s3.hicloud.net.tw。
不讀其他網站、不收集紀錄、不上傳照片、不依賴外部 JavaScript。
原圖在外掛分頁 fetch，ZIP 在本機記憶體生成。ZIP 使用內建小型 STORE 寫入器；JPEG 本來已壓縮，不重複壓縮。
本版每本相簿限制 512 MiB 原圖總量；實際記憶體占用會高於此數字。
本版沒有跨重開瀏覽器的續傳、全部相簿單一 ZIP。
下載前必須透過 Chrome 的系統視窗選擇資料夾；可選 D 槽等磁碟中的資料夾。基於瀏覽器安全限制，首次選擇、瀏覽器重啟或權限失效後，Chrome 可能再次要求確認。部分系統不允許直接選擇磁碟根目錄，建議先建立例如 `D:\TopSchool` 再選取。
已下載狀態以目前選定資料夾內的 ZIP 為準；ZIP 被刪除或移出後，重新掃描便不再標示已下載。
索引檔 `topschool-album-downloads.json` 不包含照片或帳號資料。舊版沒有索引的 ZIP 會以安全化後的相簿名稱推測；若網站有同名相簿，為避免誤判，必須在新版重新下載一次建立相簿 ID 紀錄。
外掛頁面會顯示目前選定的資料夾名稱與授權狀態。
同名 ZIP 會自動加上 `(1)`、`(2)` 等編號；不會覆寫既有檔案。
分類篩選會保留；「全部」指目前分類所有頁。若從非第一頁網址進入，外掛會保留分類與相簿參數並自動回到第一頁，再依序載入全部內容。
掃描失败請重新掃描，勿將部分列表視為完整結果。

## GitHub Private Repo：下一步
目前交付的是可安裝原始碼；尚未建立或推送 GitHub repository。

最容易的方法是安裝官方 GitHub Desktop，在 GitHub 帳號登入後：
1. File → New repository，名稱 topschool-album-enhancer，放在固定專案路徑。
2. 把本包資料夾內的程式檔复制到新 repository，確認根目錄直接有 manifest.json。
3. Commit to main，訊息 `Update TopSchool Album Enhancer v20261007.0.2.10`。
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
0.2：依驗收結果修正，增加安全檔名、自訂下載子目錄與記住下載狀態。
0.3：大型相簿低記憶體串流 ZIP、續傳與可選日期筛選。

參考：
- https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world
- https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- https://docs.github.com/en/desktop/overview/creating-your-first-repository-using-github-desktop
