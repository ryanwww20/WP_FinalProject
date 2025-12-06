# Vercel 部署配置指南

本指南說明如何配置 OAuth 和 Google Maps API 以便在 Vercel 上部署。

## 📋 部署前準備

### 1. 獲取 Vercel 部署 URL

部署到 Vercel 後，您會得到一個 URL，格式通常是：
- `https://your-project-name.vercel.app`
- 或您的自定義域名：`https://yourdomain.com`

**記下這個 URL，後續配置會用到！**

## 🔑 Google OAuth 配置

### 步驟 1：前往 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 前往「API 和服務」→「憑證」
4. 找到或建立您的 OAuth 2.0 客戶端 ID

### 步驟 2：添加授權的重定向 URI

在「已授權的重定向 URI」中，添加以下 URL：

**開發環境（本地）：**
```
http://localhost:3000/api/auth/callback/google
```

**生產環境（Vercel）：**
```
https://your-project-name.vercel.app/api/auth/callback/google
```

**如果有自定義域名：**
```
https://yourdomain.com/api/auth/callback/google
```

### 步驟 3：更新 Vercel 環境變數

在 Vercel 專案設置中，添加以下環境變數：
- `GOOGLE_CLIENT_ID` = 您的 Google Client ID
- `GOOGLE_CLIENT_SECRET` = 您的 Google Client Secret

---

## 🐙 GitHub OAuth 配置

### 步驟 1：前往 GitHub Developer Settings

1. 前往 [GitHub Developer Settings](https://github.com/settings/developers)
2. 選擇您的 OAuth App（或建立新的）

### 步驟 2：更新 OAuth App 設置

更新以下欄位：

**Homepage URL：**
- 開發環境：`http://localhost:3000`
- 生產環境：`https://your-project-name.vercel.app`
- 或自定義域名：`https://yourdomain.com`

**Authorization callback URL：**
- 開發環境：`http://localhost:3000/api/auth/callback/github`
- 生產環境：`https://your-project-name.vercel.app/api/auth/callback/github`
- 或自定義域名：`https://yourdomain.com/api/auth/callback/github`

### 步驟 3：更新 Vercel 環境變數

在 Vercel 專案設置中，添加以下環境變數：
- `GITHUB_ID` = 您的 GitHub Client ID
- `GITHUB_SECRET` = 您的 GitHub Client Secret

---

## 🗺️ Google Maps API 配置

### 步驟 1：前往 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 前往「API 和服務」→「憑證」
4. 找到您的 Google Maps API 金鑰

### 步驟 2：設置 API 金鑰限制

點擊您的 API 金鑰進行編輯，在「應用程式限制」中：

1. 選擇「HTTP 引薦來源網址（網站）」
2. 添加以下網址：

**開發環境：**
```
http://localhost:3000/*
```

**生產環境（Vercel）：**
```
https://your-project-name.vercel.app/*
https://*.vercel.app/*
```

**如果有自定義域名：**
```
https://yourdomain.com/*
https://www.yourdomain.com/*
```

**注意：** 使用 `/*` 允許所有路徑，或使用具體路徑如 `/groups/*` 來限制。

### 步驟 3：更新 Vercel 環境變數

在 Vercel 專案設置中，添加：
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = 您的 Google Maps API 金鑰

---

## ⚙️ Vercel 環境變數完整清單

在 Vercel 專案設置 → Settings → Environment Variables 中添加：

### 必需變數

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 可選變數（如果使用 Pusher）

```env
NEXT_PUBLIC_PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
PUSHER_SECRET=your_secret
```

---

## 🔄 部署流程

1. **推送代碼到 Git 倉庫**（GitHub、GitLab 等）
2. **在 Vercel 中導入專案**
3. **設置環境變數**（如上所示）
4. **配置 OAuth 回調 URL**（如上所示）
5. **配置 Google Maps API 限制**（如上所示）
6. **部署！**

---

## ✅ 驗證清單

部署後，請確認：

- [ ] Google OAuth 登入功能正常
- [ ] GitHub OAuth 登入功能正常
- [ ] Google Maps 在群組頁面正常顯示
- [ ] 所有環境變數都已正確設置
- [ ] 回調 URL 與 Vercel 部署 URL 匹配

---

## 🐛 常見問題

### 問題：OAuth 登入後出現 "redirect_uri_mismatch" 錯誤

**解決方案：**
- 確認回調 URL 與 Vercel 部署 URL 完全匹配（包括 `https://`）
- 檢查是否有尾隨斜線（不應該有）
- 確認在 Google/GitHub 設置中添加了正確的 URL

### 問題：Google Maps 不顯示

**解決方案：**
- 確認 API 金鑰的 HTTP 引薦來源限制包含 Vercel 域名
- 檢查瀏覽器控制台是否有錯誤訊息
- 確認 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 環境變數已設置

### 問題：部署後環境變數不生效

**解決方案：**
- 在 Vercel 設置中重新保存環境變數
- 觸發新的部署（環境變數更改後需要重新部署）
- 確認環境變數名稱正確（注意大小寫）

---

## 📝 快速參考

### Google OAuth 回調 URL
```
https://your-project-name.vercel.app/api/auth/callback/google
```

### GitHub OAuth 回調 URL
```
https://your-project-name.vercel.app/api/auth/callback/github
```

### Google Maps HTTP 引薦來源
```
https://your-project-name.vercel.app/*
https://*.vercel.app/*
```

---

**提示：** 如果使用自定義域名，請將所有 `your-project-name.vercel.app` 替換為您的自定義域名。



