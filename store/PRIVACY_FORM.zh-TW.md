# Chrome Web Store Privacy 表單填寫稿

## Single purpose

協助使用者連續瀏覽其有權存取的 TopSchool 相簿，並將選取的相簿照片整理為 ZIP，儲存至使用者授權的本機資料夾。

## Permission justification

### storage

保存使用者的下載選項、已下載相簿紀錄及本機資料夾控制代碼，讓使用者重新開啟擴充功能後可以恢復設定與下載狀態。

### https://*.topschool.tw/*

讀取 TopSchool 網站的相簿列表與相簿照片頁，以提供連續瀏覽、相簿選取、下載及下載紀錄比對。擴充功能的內容腳本只套用於 `/Activity/School-Albums` 與 `/Activity/School-Album-Detail` 路徑。

### https://isai-prod-v2.s3.hicloud.net.tw/*

下載 TopSchool 相簿頁面直接提供的原始照片，並在使用者裝置上建立 ZIP。照片不會傳送至開發者或其他第三方。

## Remote code

No, I am not using remote code.

## Data usage disclosure

擴充功能會在本機處理網站內容，包括相簿名稱、相簿識別碼、照片網址與照片檔案。資料僅用於使用者要求的相簿瀏覽、下載與本機紀錄，不會傳送給開發者或第三方，不用於廣告、信用評估或與擴充功能單一用途無關的用途。

## Limited Use certification

確認遵守 Chrome Web Store User Data Policy，包括 Limited Use 規定。

## Privacy policy URL

發布前請填入 `PRIVACY_POLICY.zh-TW.md` 部署後的公開 HTTPS 網址。
