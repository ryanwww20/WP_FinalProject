# Google Maps API 設定指南

本指南將幫助您設定 Google Maps API，以便在群組的 Map 功能中使用地圖服務。

## 📋 前置要求

- Google 帳號
- Google Cloud Platform (GCP) 帳號（免費註冊）

## 🚀 設定步驟

### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊頁面頂部的專案選擇器
3. 點擊「新建專案」
4. 輸入專案名稱（例如：`WP_FinalProject`）
5. 點擊「建立」

### 2. 啟用必要的 Google Maps API

為了完整使用地圖功能（包括位置標記和地址解析），您需要啟用以下 API：

#### Maps JavaScript API（必需）
1. 在 Google Cloud Console 中，點擊左側選單的「API 和服務」→「程式庫」
2. 在搜尋框中輸入「Maps JavaScript API」
3. 點擊「Maps JavaScript API」
4. 點擊「啟用」按鈕

#### Geocoding API（可選，用於地址解析）
1. 在「API 和服務」→「程式庫」中搜尋「Geocoding API」
2. 點擊「Geocoding API」
3. 點擊「啟用」按鈕

**注意**：Geocoding API 用於將經緯度座標轉換為地址。如果不啟用此 API，位置標記功能仍可使用，但不會顯示地址資訊。

### 3. 建立 API 金鑰

1. 在 Google Cloud Console 中，點擊「API 和服務」→「憑證」
2. 點擊頁面頂部的「+ 建立憑證」→「API 金鑰」
3. 系統會產生一個新的 API 金鑰
4. **重要**：點擊「限制金鑰」以設定 API 金鑰的限制（推薦）

### 4. 設定 API 金鑰限制（推薦）

為了安全起見，建議為 API 金鑰設定限制：

#### 應用程式限制
- 選擇「HTTP 引薦來源網址（網站）」
- 新增以下網址：
  - `http://localhost:3000/*`（開發環境）
  - `https://yourdomain.com/*`（生產環境，替換為您的實際網域）

#### API 限制
- 選擇「限制金鑰」
- 在「限制這些 API」中，選擇以下 API：
  - **Maps JavaScript API**（必需）
  - **Geocoding API**（如果啟用了地址解析功能）
- 點擊「儲存」

### 5. 設定環境變數

1. 在專案根目錄下找到 `.env.local` 檔案（如果不存在，請建立）
2. 新增以下環境變數：

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**注意**：
- 將 `your_api_key_here` 替換為您在第 3 步建立的 API 金鑰
- `NEXT_PUBLIC_` 前綴是必需的，這樣 Next.js 才能在客戶端存取這個環境變數

### 6. 重新啟動開發伺服器

設定完環境變數後，需要重新啟動開發伺服器：

```bash
# 停止目前執行的伺服器（Ctrl+C）
# 然後重新啟動
npm run dev
```

## 🔍 驗證設定

1. 啟動開發伺服器：`npm run dev`
2. 登入您的帳號
3. 進入任意群組頁面
4. 點擊「Map」標籤頁
5. 如果看到地圖正常顯示，說明設定成功！

## 💰 費用說明

Google Maps Platform 提供**每月 $200 的免費額度**，這對於大多數開發和小型應用來說已經足夠：

- **Maps JavaScript API**：每月前 28,000 次地圖載入免費
  - 超出免費額度後，每 1,000 次地圖載入收費 $7

- **Geocoding API**（可選）：每月前 40,000 次請求免費
  - 超出免費額度後，每 1,000 次請求收費 $5

**注意**：位置標記功能使用瀏覽器的 Geolocation API 獲取使用者位置，不需要額外的 Google API。Geocoding API 僅用於將座標轉換為地址，是可選的。

**注意**：請確保在 Google Cloud Console 中設定預算警示，以避免意外費用。

## 🛡️ 安全最佳實踐

1. **始終限制 API 金鑰**：只允許來自您網站的請求
2. **使用環境變數**：不要將 API 金鑰提交到版本控制系統
3. **定期輪換金鑰**：定期更換 API 金鑰以提高安全性
4. **監控使用情況**：定期檢查 API 使用情況，防止濫用

## 🐛 常見問題

### 問題：地圖不顯示，顯示「Google Maps API Key 未設定」

**解決方案**：
- 檢查 `.env.local` 檔案中是否設定了 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- 確保環境變數名稱正確（注意 `NEXT_PUBLIC_` 前綴）
- 重新啟動開發伺服器

### 問題：地圖顯示但出現「This page can't load Google Maps correctly」錯誤

**解決方案**：
- 檢查 API 金鑰是否正確
- 確認已啟用「Maps JavaScript API」
- 檢查 API 金鑰的限制設定是否過於嚴格

### 問題：在本地開發正常，但部署後地圖不顯示

**解決方案**：
- 確認在生產環境的部署平台（如 Vercel、Netlify）中設定了環境變數
- 檢查 API 金鑰的 HTTP 引薦來源限制是否包含生產網域
- 確保生產環境的環境變數名稱包含 `NEXT_PUBLIC_` 前綴

## 📚 相關資源

- [Google Maps Platform 文件](https://developers.google.com/maps/documentation)
- [Maps JavaScript API 文件](https://developers.google.com/maps/documentation/javascript)
- [Google Cloud Console](https://console.cloud.google.com/)
- [定價資訊](https://developers.google.com/maps/billing-and-pricing/pricing)

## 🎯 位置標記功能

本專案已實作位置標記功能，讓群組成員可以：

1. **更新位置**：點擊「更新位置」按鈕，系統會使用瀏覽器的 Geolocation API 獲取您當前位置
2. **顯示成員位置**：地圖上會顯示所有已更新位置的群組成員
3. **查看詳細資訊**：點擊地圖上的標記可查看成員名稱、角色和地址

### 需要的 API

- **Maps JavaScript API**（必需）：用於顯示地圖
- **Geocoding API**（可選）：用於將座標轉換為地址

### 瀏覽器權限

位置標記功能需要使用者允許瀏覽器存取位置資訊。當使用者點擊「更新位置」按鈕時，瀏覽器會提示使用者授權。

### 其他功能

設定完成後，您還可以：
- 在地圖上新增自訂標記（書店、咖啡廳等）
- 實作位置搜尋功能
- 新增路線規劃功能
- 整合 Places API 以搜尋附近的地點

---

**需要幫助？** 如果遇到問題，請查看 [Google Maps Platform 支援頁面](https://developers.google.com/maps/support) 或聯絡專案維護者。
