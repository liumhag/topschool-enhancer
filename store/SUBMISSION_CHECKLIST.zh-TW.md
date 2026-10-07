# Chrome Web Store 送審清單

## 帳號

- [ ] 使用長期維護的 Google 帳號註冊 Chrome Web Store 開發者。
- [ ] 開啟兩步驟驗證。
- [ ] 完成一次性註冊費付款。
- [ ] 填寫發布者名稱及公開聯絡信箱。

## 公開頁面

- [ ] 將 `privacy-policy.html` 部署為公開 HTTPS 網頁。
- [ ] 建立支援頁面或 issue 回報網址。
- [ ] 將實際網址填回 Store Listing 與 Privacy 表單。

## Store Listing

- [ ] 名稱與完整說明使用 `STORE_LISTING.zh-TW.md`。
- [ ] 語言選擇繁體中文。
- [ ] 類別選擇 Productivity。
- [ ] 上傳 `icons/icon128.png`。
- [ ] 上傳 `store/assets/screenshot-1280x800.png`。
- [ ] 上傳 `store/assets/small-promo-440x280.png`。
- [ ] 初次發布選擇 Unlisted；確認穩定後可改 Public。
- [ ] 地區先選 Taiwan，或依實際支援範圍調整。

## Privacy

- [ ] 依 `PRIVACY_FORM.zh-TW.md` 填寫單一用途。
- [ ] 填寫 storage、TopSchool 網域及圖片 CDN 的權限理由。
- [ ] Remote code 選擇 No。
- [ ] 如實聲明在本機處理網站內容與照片。
- [ ] 勾選 Limited Use 合規聲明。
- [ ] 填入公開隱私權政策網址。

## 審查

- [ ] 使用 `REVIEW_NOTES.zh-TW.md` 填寫測試步驟。
- [ ] 再次確認公開頁面不需要登入；若情況改變，補充合法測試帳號。
- [ ] 上傳前確認 ZIP 根目錄直接包含 `manifest.json`。
- [ ] 上傳後處理 Dashboard 自動檢查結果，再送審。
