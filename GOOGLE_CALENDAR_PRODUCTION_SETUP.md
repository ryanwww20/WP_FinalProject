# Google Calendar API 生產環境設置指南

本指南將幫助您將 Google Calendar API 整合發布到生產環境，讓所有用戶都可以使用。

## 前置準備

1. ✅ 已完成開發環境測試
2. ✅ Google Calendar API 已啟用
3. ✅ OAuth 2.0 憑證已配置
4. ✅ 應用程式基本功能正常運作

## 生產環境設置步驟

### 步驟 1：完成 OAuth 同意畫面配置

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 前往「API 和服務」→「OAuth 同意畫面」

#### 1.1 應用程式資訊（必須完整填寫）

- **應用程式名稱**：您的應用程式名稱（例如：WP Final Project）
- **使用者支援電子郵件**：選擇您的電子郵件
- **應用程式標誌**：上傳應用程式圖示（可選，但建議添加）
- **應用程式首頁連結**：您的網站首頁 URL（例如：`https://yourdomain.com`）
- **應用程式隱私權政策連結**：隱私權政策頁面 URL（**必須提供**）
- **應用程式服務條款連結**：服務條款頁面 URL（**必須提供**）
- **授權網域**：添加您的網域（例如：`yourdomain.com`）
- **開發人員連絡資訊**：您的電子郵件

#### 1.2 範圍（Scopes）

確保已添加以下範圍：
- `https://www.googleapis.com/auth/calendar.events` 或 `https://www.googleapis.com/auth/calendar`

點擊「儲存並繼續」

#### 1.3 測試使用者（開發階段）

在發布前，您可以添加測試使用者。發布後，所有用戶都可以使用。

點擊「儲存並繼續」

#### 1.4 摘要

檢查所有資訊是否正確，然後點擊「返回儀表板」

### 步驟 2：發布應用程式

1. 在「OAuth 同意畫面」頁面，找到「發布狀態」區段
2. 點擊「發布應用程式」按鈕
3. 確認對話框，點擊「確認」

**注意**：
- 發布後，應用程式將對所有 Google 用戶開放
- 如果您的應用程式需要敏感範圍（如 Calendar），可能需要額外的驗證流程
- 發布後可能需要幾天時間進行 Google 審核（如果使用敏感範圍）

### 步驟 3：配置生產環境的 Redirect URI

1. 前往「API 和服務」→「憑證」
2. 點擊您的 OAuth 2.0 用戶端 ID
3. 在「已授權的重新導向 URI」區段，確保包含：

**開發環境**：
```
http://localhost:3000/api/google-calendar/callback
```

**生產環境**：
```
https://yourdomain.com/api/google-calendar/callback
```

**注意**：將 `yourdomain.com` 替換為您的實際網域

4. 點擊「儲存」

### 步驟 4：設置生產環境變數

在您的生產環境（如 Vercel、Netlify 等）設置以下環境變數：

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret-key

# Google Calendar (可選)
GOOGLE_CALENDAR_ENABLED=true

# MongoDB
MONGODB_URI=your-production-mongodb-uri
```

**重要**：
- `NEXTAUTH_URL` 必須是完整的生產環境 URL（包含 `https://`）
- 確保使用強隨機字串作為 `NEXTAUTH_SECRET`
- 生產環境必須使用 HTTPS

### 步驟 5：驗證設置

1. **測試連接流程**：
   - 訪問生產環境的行事曆頁面
   - 點擊「Connect Google Calendar」
   - 確認可以成功授權

2. **測試同步功能**：
   - 建立一個測試事件
   - 確認事件同步到 Google Calendar
   - 測試雙向同步功能

3. **檢查錯誤日誌**：
   - 監控應用程式日誌
   - 確認沒有 OAuth 相關錯誤

## 敏感範圍驗證（如需要）

如果您的應用程式使用敏感範圍（如 `calendar`），Google 可能會要求額外驗證：

### 驗證要求

1. **隱私權政策**：必須提供可公開訪問的隱私權政策頁面
2. **服務條款**：必須提供服務條款頁面
3. **安全審核**：可能需要通過 Google 的安全審核
4. **應用程式說明**：詳細說明為什麼需要這些權限

### 提交驗證

1. 在「OAuth 同意畫面」頁面，點擊「提交驗證」
2. 填寫所有必需資訊
3. 等待 Google 審核（通常需要幾天到幾週）

## 常見問題

### Q: 發布後，測試使用者還需要嗎？

A: 不需要。發布後，所有 Google 用戶都可以使用您的應用程式。

### Q: 可以同時保留開發和生產環境嗎？

A: 可以。建議：
- 使用不同的 Google Cloud 專案
- 或使用同一個專案但不同的 OAuth 客戶端 ID

### Q: 如果驗證被拒絕怎麼辦？

A: 
- 檢查 Google 提供的拒絕原因
- 確保隱私權政策和服務條款完整
- 確保應用程式說明清楚說明權限用途
- 重新提交驗證

### Q: 生產環境可以使用測試模式嗎？

A: 不建議。測試模式只允許測試使用者訪問，不適合生產環境。

## 安全最佳實踐

1. **使用 HTTPS**：生產環境必須使用 HTTPS
2. **保護環境變數**：確保環境變數安全存儲，不要提交到版本控制
3. **限制範圍**：只請求必要的權限範圍
4. **監控使用**：定期檢查 API 使用情況和錯誤日誌
5. **Token 安全**：確保 refresh token 安全存儲在資料庫中

## 監控和維護

### API 配額監控

1. 前往「API 和服務」→「儀表板」
2. 查看 Google Calendar API 的使用情況
3. 設置配額警告（如需要）

### 錯誤監控

定期檢查：
- 應用程式錯誤日誌
- Google Cloud Console 中的 API 錯誤
- 用戶回報的問題

## 回滾計劃

如果發布後出現問題：

1. **暫時禁用功能**：
   - 在環境變數中設置 `GOOGLE_CALENDAR_ENABLED=false`
   - 或在 UI 中隱藏連接按鈕

2. **恢復測試模式**：
   - 在 OAuth 同意畫面中，將應用程式狀態改回「測試中」
   - 只有測試使用者可以訪問

## 完成檢查清單

- [ ] OAuth 同意畫面所有必填欄位已填寫
- [ ] 隱私權政策和服務條款已提供
- [ ] 生產環境 redirect URI 已添加
- [ ] 生產環境變數已設置
- [ ] 應用程式已發布
- [ ] 生產環境測試通過
- [ ] 錯誤監控已設置

完成以上步驟後，您的 Google Calendar 整合就可以在生產環境中使用了！









