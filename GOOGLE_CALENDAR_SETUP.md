# Google Calendar API 設置指南

本指南將幫助您設置 Google Calendar API，以啟用行事曆同步功能。

## 前置需求

- 已設置 Google OAuth（用於用戶認證）
- 擁有 Google Cloud Console 帳號
- 已建立或選擇一個 Google Cloud 專案

## 設置步驟

### 1. 啟用 Google Calendar API

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您用於 OAuth 的專案（或建立新專案）
3. 在左側選單中，點擊「API 和服務」→「程式庫」
4. 搜尋「Google Calendar API」
5. 點擊「Google Calendar API」
6. 點擊「啟用」按鈕

### 2. 配置 OAuth 同意畫面

如果尚未配置 OAuth 同意畫面：

1. 前往「API 和服務」→「OAuth 同意畫面」
2. 選擇使用者類型（內部或外部）
3. 填寫應用程式資訊：
   - **應用程式名稱**：您的應用程式名稱
   - **使用者支援電子郵件**：您的電子郵件
   - **開發人員連絡資訊**：您的電子郵件
4. 點擊「儲存並繼續」
5. 在「範圍」頁面，點擊「儲存並繼續」（Calendar API 會自動添加所需範圍）
6. 在「測試使用者」頁面（如果選擇外部），添加測試使用者（開發階段）
7. 完成設置

### 3. 配置 OAuth 2.0 憑證

1. 前往「API 和服務」→「憑證」
2. 找到您現有的 OAuth 2.0 用戶端 ID（用於 NextAuth 的那個）
3. 點擊編輯（鉛筆圖示）
4. 在「已授權的重新導向 URI」區段，添加：
   ```
   http://localhost:3000/api/google-calendar/callback
   ```
   如果是生產環境，也添加：
   ```
   https://yourdomain.com/api/google-calendar/callback
   ```
5. 點擊「儲存」

### 4. 環境變數設置

確保您的 `.env.local` 檔案包含以下變數：

```env
# Google OAuth (必須已設置)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Calendar (可選，預設啟用)
GOOGLE_CALENDAR_ENABLED=true

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### 5. 安裝依賴

專案已包含 `googleapis` 套件。如果尚未安裝，執行：

```bash
npm install googleapis
```

## 使用方式

### 連接 Google Calendar

1. 登入應用程式
2. 前往行事曆頁面 (`/calendar`)
3. 點擊「Connect Google Calendar」按鈕
4. 授權應用程式存取您的 Google Calendar
5. 授權完成後，您將被導回行事曆頁面

### 同步事件

1. 連接 Google Calendar 後，點擊「Sync Now」按鈕進行手動同步
2. 建立、更新或刪除事件時，會自動同步到 Google Calendar（如果已連接）
3. 從 Google Calendar 同步的事件會自動顯示在本地行事曆中

### 斷開連接

1. 在行事曆頁面，點擊「Disconnect」按鈕
2. 確認斷開連接
3. 本地事件將保留，但不再與 Google Calendar 同步

## 功能說明

### 雙向同步

- **本地 → Google Calendar**：建立、更新或刪除本地事件時，會自動同步到 Google Calendar
- **Google Calendar → 本地**：使用「Sync Now」按鈕時，會從 Google Calendar 同步事件到本地

### 衝突解決

當本地和 Google Calendar 的事件發生衝突時：
- 系統會比較最後修改時間
- 較新的版本會優先保留
- 同步過程會記錄錯誤供用戶查看

### 同步狀態

每個事件都有同步狀態：
- `synced`：已成功同步
- `pending`：等待同步
- `failed`：同步失敗

## 疑難排解

### 錯誤：Google Calendar not connected

- 確保已點擊「Connect Google Calendar」並完成授權流程
- 檢查用戶資料庫中是否有 `googleCalendarEnabled: true`

### 錯誤：Failed to refresh access token

- 檢查 `googleCalendarRefreshToken` 是否正確儲存
- 確認 OAuth 憑證配置正確
- 用戶可能需要重新連接 Google Calendar

### 同步失敗

- 檢查網路連線
- 確認 Google Calendar API 已啟用
- 查看伺服器日誌以獲取詳細錯誤訊息

### 事件未同步

- 確認事件狀態為 `pending` 或 `failed`
- 手動點擊「Sync Now」按鈕
- 檢查事件是否有有效的 `startTime` 和 `endTime`

## API 端點

### 連接 Google Calendar
```
GET /api/google-calendar/connect
```
返回 Google OAuth 授權 URL

### 授權回調
```
GET /api/google-calendar/callback?code=...&state=...
```
處理 Google OAuth 回調

### 檢查連接狀態
```
GET /api/google-calendar/status
```
返回連接狀態

### 手動同步
```
POST /api/google-calendar/sync
```
執行雙向同步

### 取得日曆列表
```
GET /api/google-calendar/calendars
```
返回用戶的 Google 日曆列表

### 斷開連接
```
DELETE /api/google-calendar/disconnect
```
清除 Google Calendar 連接

## 安全注意事項

1. **Token 安全**：Refresh token 儲存在資料庫中，確保資料庫連線安全
2. **權限範圍**：僅請求必要權限（`calendar.events`）
3. **HTTPS**：生產環境必須使用 HTTPS
4. **錯誤處理**：同步失敗不會影響本地事件操作

## 限制

- Google Calendar API 有速率限制（每 100 秒 1000 次請求）
- 同步大量事件可能需要較長時間
- 首次同步會取得過去 30 天的事件

## 支援

如有問題，請檢查：
1. Google Cloud Console 中的 API 配額
2. 伺服器日誌中的錯誤訊息
3. 瀏覽器控制台中的錯誤

