# [114-1] Web Programming Final

## (Group 40) 讀書有揪
組長: b12901015 陳拓之 
         r13922146 葉富銘
         b12901044 江宗倫

### Demo 影片連結
https://youtu.be/ahtnRhXSNiI

### 描述這個服務在做什麼

**讀書有揪** 是一個專為學生設計的學習群組管理平台，旨在幫助同學們更有效地組織學習活動、管理時間，並與學習夥伴保持聯繫。

#### 核心功能

1. **學習群組管理**
   - 建立公開或私密學習群組
   - 群組密碼保護機制
   - 成員管理與權限控制
   - 群組即時聊天功能
   - 群組成員排行榜（基於專注時數）

2. **位置共享與地圖整合**
   - 使用 Google Maps API 顯示群組成員位置
   - 即時位置更新與分享
   - 地圖標記顯示所有成員位置
   - 地址解析功能

3. **行事曆管理**
   - 個人行事曆視圖
   - 事件建立、編輯與刪除
   - Google Calendar 雙向同步
   - 課程與會議管理
   - 時間表視圖（Schedule View）

4. **待辦事項管理**
   - Todo List 功能
   - 任務建立、完成與刪除
   - 任務狀態追蹤

5. **專注力管理**
   - 內建 Pomodoro 番茄鐘計時器
   - 專注時數統計
   - 群組內專注狀態顯示
   - 個人專注時數記錄

6. **使用者個人檔案**
   - 個人資料管理
   - 課程管理功能
   - 學習統計資訊
   - 狀態設定（在線/離線/專注中）
   - 個人時間表管理

7. **即時通訊**
   - 群組即時聊天（使用 Pusher）
   - 訊息即時同步
   - 成員上線狀態顯示

8. **認證系統**
   - OAuth 2.0 認證（Google、GitHub）
   - NextAuth.js 會話管理
   - 使用者 ID 管理

### Deployed 連結
https://wp-final-project-yaha.vercel.app

### 使用/操作方式

#### 伺服器端

1. **環境設置**
   - 確保已安裝 Node.js (v18 或更高版本)
   - 確保已安裝 Yarn 套件管理器
   - 設置 MongoDB 資料庫（本地或 MongoDB Atlas）

2. **部署步驟**
   - 將專案部署到支援 Next.js 的平台（如 Vercel、Netlify）
   - 設置所有必要的環境變數
   - 確保 MongoDB 連線正常
   - 配置 OAuth 提供者的回調 URL

#### 使用者端

1. **註冊與登入**
   - 點擊「Sign In」按鈕
   - 選擇 OAuth 提供者（Google 或 GitHub）
   - 完成認證後自動建立帳號
   - 首次登入需設定使用者 ID

2. **建立/加入群組**
   - 前往「Groups」頁面
   - 點擊「Create Group」
   - 填寫群組資訊（名稱、描述、密碼等等）
   - 可透過群組列表頁面查看並加入群組

3. **使用行事曆**
   - 前往「Calendar」頁面
   - 點擊日期建立新事件
   - 可選擇連接 Google Calendar 進行同步
   - 管理課程與會議

4. **管理待辦事項**
   - 前往「Todo List」頁面
   - 新增、完成或刪除任務

5. **使用 Pomodoro 計時器**
   - 在 Dashboard 或群組頁面使用計時器
   - 開始專注時段
   - 查看專注時數統計

6. **群組功能**
   - 在群組中聊天
   - 更新位置（需允許瀏覽器位置權限）
   - 查看群組成員位置地圖
   - 查看群組排行榜

### 其他說明

- 本專案使用 TypeScript 開發，確保型別安全
- 支援深色/淺色主題切換
- 完全響應式設計，支援行動裝置
- 使用 MongoDB 作為資料庫，支援雲端與本地部署
- 整合多個第三方服務（Google Maps、Google Calendar、Pusher）

### 使用與參考之框架/模組/原始碼

- **Next.js 14** - React 全端框架（App Router）
- **React 18** - UI 函式庫
- **TypeScript** - 型別安全的 JavaScript
- **Tailwind CSS** - CSS 框架
- **MongoDB + Mongoose** - 資料庫與 ODM
- **NextAuth.js** - OAuth 認證
- **Google APIs** (googleapis, @react-google-maps/api) - Google Calendar 與 Maps 整合
- **Pusher** - 即時通訊服務
- **其他工具**：date-fns（日期處理）、zod（資料驗證）、bcryptjs（密碼雜湊）、next-themes（主題切換）

### 使用之第三方套件、框架、程式碼

#### 主要套件
- **next** (^14.2.33), **react** (^18.3.1), **react-dom** (^18.3.1) - 核心框架
- **next-auth** (^4.24.7) - 認證
- **mongoose** (^8.5.1) - 資料庫 ODM
- **tailwindcss** (^3.4.1), **next-themes** (^0.4.6) - 樣式與主題
- **googleapis** (^169.0.0), **@react-google-maps/api** (^2.20.7) - Google 服務整合
- **pusher** (^5.2.0), **pusher-js** (^8.4.0) - 即時通訊
- **date-fns** (^4.1.0), **zod** (^3.23.8), **bcryptjs** (^2.4.3), **dotenv** (^17.2.3) - 工具函式庫
- **typescript** (^5), **eslint** (^8.57.0) - 開發工具

#### 第三方服務
- **Google OAuth 2.0** - 使用者認證
- **GitHub OAuth** - 使用者認證
- **Google Maps Platform** (Maps JavaScript API, Geocoding API) - 地圖服務
- **Google Calendar API** - 行事曆同步
- **Pusher** - 即時通訊服務
- **MongoDB Atlas**（可選） - 雲端資料庫

### 專題製作心得

本專題從零開始建立一個完整的全端 Web 應用程式，過程中學習並應用了許多現代 Web 開發技術。透過實作，我們深入理解了 Next.js 的 App Router 架構、Server Components 與 Client Components 的差異，以及如何在 Next.js 中整合各種第三方服務。

在開發過程中，我們遇到了許多挑戰，包括：
- OAuth 認證流程的實作與除錯
- 即時通訊功能的整合（Pusher）
- Google Maps 與 Google Calendar API 的整合
- 資料庫設計與查詢優化
- 響應式設計的實作

這些挑戰讓我們更深入地理解了現代 Web 開發的複雜性，也提升了我們解決問題的能力。透過團隊合作，我們成功地將各個功能模組整合成一個完整的應用程式。

---

## 期末專題報告

### localhost 安裝與測試之詳細步驟

#### 前置需求

在開始之前，請確保您的系統已安裝以下軟體：

1. **Node.js** (v18 或更高版本)
   - 下載：https://nodejs.org/
   - 驗證安裝：`node --version`（應顯示 v18 或更高）

2. **Yarn** 套件管理器
   - 安裝：`npm install -g yarn`
   - 驗證安裝：`yarn --version`

3. **MongoDB**
   - **選項 A：本地 MongoDB**
     - macOS: `brew install mongodb-community`
     - Linux: `sudo apt-get install mongodb`
     - Windows: 從 https://www.mongodb.com/try/download/community 下載
   - **選項 B：MongoDB Atlas**（雲端，推薦）
     - 註冊：https://www.mongodb.com/cloud/atlas
     - 建立免費叢集

4. **Git**（用於克隆專案）
   - 下載：https://git-scm.com/

#### 步驟 1：克隆專案

```bash
# 克隆專案（請替換為實際的 repository URL）
git clone <repository-url>
cd WP_FinalProject
```

#### 步驟 2：安裝依賴套件

**重要：本專案使用 Yarn 作為套件管理器**

```bash
# 安裝所有依賴套件
yarn install
```

**注意**：如果專案中存在 `package-lock.json`，請忽略它。本專案使用 `yarn.lock` 來管理依賴版本。

#### 步驟 3：設置 MongoDB

##### 選項 A：使用本地 MongoDB

1. **啟動 MongoDB 服務**

   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongodb
   
   # Windows
   # 使用 MongoDB 安裝目錄中的 mongod.exe
   ```

2. **驗證 MongoDB 運行中**

   ```bash
   # macOS/Linux
   brew services list  # macOS
   sudo systemctl status mongodb  # Linux
   ```

3. **連接字串**
   - 本地 MongoDB 連接字串：`mongodb://localhost:27017/wp_finalproject`

##### 選項 B：使用 MongoDB Atlas（推薦）

1. **建立帳號與叢集**
   - 前往 https://www.mongodb.com/cloud/atlas
   - 註冊免費帳號
   - 建立新的免費叢集（選擇最接近您的地區）

2. **設置資料庫使用者**
   - 在 Atlas 控制台中，前往「Database Access」
   - 點擊「Add New Database User」
   - 設定使用者名稱與密碼（請記住這些資訊）
   - 選擇「Read and write to any database」權限

3. **設置網路存取**
   - 前往「Network Access」
   - 點擊「Add IP Address」
   - 選擇「Allow Access from Anywhere」（開發階段）或添加您的 IP 位址

4. **取得連接字串**
   - 前往「Database」→「Connect」
   - 選擇「Connect your application」
   - 複製連接字串，格式如下：
     ```
     mongodb+srv://<username>:<password>@cluster.mongodb.net/wp_finalproject?retryWrites=true&w=majority
     ```
   - 將 `<username>` 和 `<password>` 替換為您建立的資料庫使用者資訊

#### 步驟 4：設置環境變數

1. **建立 `.env.local` 檔案**

   在專案根目錄建立 `.env.local` 檔案：

   ```bash
   touch .env.local
   ```

2. **填入環境變數**

   編輯 `.env.local` 檔案，填入以下內容：

   ```env
   # MongoDB 連接字串
   # 本地 MongoDB：
   MONGODB_URI=mongodb://localhost:27017/wp_finalproject
   # 或 MongoDB Atlas（替換 <username> 和 <password>）：
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/wp_finalproject?retryWrites=true&w=majority

   # NextAuth 設定
   NEXTAUTH_URL=http://localhost:3000
   
   # 產生 NextAuth Secret（執行下方指令）
   # openssl rand -base64 32
   NEXTAUTH_SECRET=your-secret-key-here

   # Google OAuth（必須設置，用於登入）
   # 取得方式見下方「OAuth 設置」章節
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # GitHub OAuth（必須設置，用於登入）
   # 取得方式見下方「OAuth 設置」章節
   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret

   # Pusher（必須設置，用於即時通訊）
   # 取得方式：https://dashboard.pusher.com/
   NEXT_PUBLIC_PUSHER_APP_ID=your_pusher_app_id
   NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
   NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
   PUSHER_SECRET=your_pusher_secret

   # Google Maps API（必須設置，用於地圖功能）
   # 取得方式見下方「Google Maps API 設置」章節
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Google Calendar API（可選，用於行事曆同步）
   # 使用與 Google OAuth 相同的 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET
   GOOGLE_CALENDAR_ENABLED=true
   ```

3. **產生 NextAuth Secret**

   ```bash
   openssl rand -base64 32
   ```

   將輸出結果複製到 `.env.local` 中的 `NEXTAUTH_SECRET`。

#### 步驟 5：設置 OAuth 提供者

##### Google OAuth 設置

1. **前往 Google Cloud Console**
   - 網址：https://console.cloud.google.com/

2. **建立或選擇專案**
   - 點擊頂部專案選擇器
   - 建立新專案或選擇現有專案

3. **啟用 Google+ API**
   - 前往「API 和服務」→「程式庫」
   - 搜尋「Google+ API」
   - 點擊「啟用」

4. **建立 OAuth 2.0 憑證**
   - 前往「API 和服務」→「憑證」
   - 點擊「+ 建立憑證」→「OAuth 2.0 用戶端 ID」
   - 應用程式類型選擇「網頁應用程式」
   - 名稱：輸入應用程式名稱（例如：讀書有揪）
   - 已授權的重新導向 URI：
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - 點擊「建立」
   - 複製「用戶端 ID」和「用戶端密鑰」

5. **填入 `.env.local`**
   - 將用戶端 ID 填入 `GOOGLE_CLIENT_ID`
   - 將用戶端密鑰填入 `GOOGLE_CLIENT_SECRET`

##### GitHub OAuth 設置

1. **前往 GitHub Developer Settings**
   - 網址：https://github.com/settings/developers

2. **建立新的 OAuth App**
   - 點擊「OAuth Apps」→「New OAuth App」

3. **填寫應用程式資訊**
   - **Application name**：讀書有揪（或您喜歡的名稱）
   - **Homepage URL**：`http://localhost:3000`
   - **Authorization callback URL**：`http://localhost:3000/api/auth/callback/github`

4. **註冊應用程式**
   - 點擊「Register application」

5. **取得憑證**
   - 複製「Client ID」
   - 點擊「Generate a new client secret」
   - 複製產生的 Client secret（只會顯示一次，請妥善保存）

6. **填入 `.env.local`**
   - 將 Client ID 填入 `GITHUB_ID`
   - 將 Client secret 填入 `GITHUB_SECRET`

#### 步驟 6：設置 Google Maps API

1. **前往 Google Cloud Console**
   - 使用與 Google OAuth 相同的專案

2. **啟用 Maps JavaScript API**
   - 前往「API 和服務」→「程式庫」
   - 搜尋「Maps JavaScript API」
   - 點擊「啟用」

3. **啟用 Geocoding API**（可選，用於地址解析）
   - 在「程式庫」中搜尋「Geocoding API」
   - 點擊「啟用」

4. **建立 API 金鑰**
   - 前往「API 和服務」→「憑證」
   - 點擊「+ 建立憑證」→「API 金鑰」
   - 複製產生的 API 金鑰

5. **（推薦）限制 API 金鑰**
   - 點擊剛建立的 API 金鑰進行編輯
   - **應用程式限制**：選擇「HTTP 引薦來源網址（網站）」
     - 新增：`http://localhost:3000/*`
   - **API 限制**：選擇「限制金鑰」
     - 選擇「Maps JavaScript API」和「Geocoding API」
   - 點擊「儲存」

6. **填入 `.env.local`**
   - 將 API 金鑰填入 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**詳細設置指南**：請參考 [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

#### 步驟 7：設置 Google Calendar API（可選）

1. **啟用 Google Calendar API**
   - 在 Google Cloud Console 中，前往「API 和服務」→「程式庫」
   - 搜尋「Google Calendar API」
   - 點擊「啟用」

2. **配置 OAuth 同意畫面**（如果尚未配置）
   - 前往「API 和服務」→「OAuth 同意畫面」
   - 選擇使用者類型（內部或外部）
   - 填寫應用程式資訊
   - 完成設置

3. **更新 OAuth 2.0 憑證**
   - 前往「API 和服務」→「憑證」
   - 編輯您的 OAuth 2.0 用戶端 ID
   - 在「已授權的重新導向 URI」中新增：
     ```
     http://localhost:3000/api/google-calendar/callback
     ```
   - 點擊「儲存」

4. **環境變數**
   - 使用與 Google OAuth 相同的 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`
   - 在 `.env.local` 中設定 `GOOGLE_CALENDAR_ENABLED=true`

**詳細設置指南**：請參考 [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md)

#### 步驟 8：設置 Pusher（即時通訊）

1. **建立 Pusher 帳號**
   - 前往：https://dashboard.pusher.com/
   - 註冊免費帳號

2. **建立新的 Channels app**
   - 登入後，點擊「Create app」
   - 填寫應用程式資訊：
     - **App name**：讀書有揪
     - **Cluster**：選擇最接近您的地區（例如：ap1）
     - **Front-end tech**：React
     - **Back-end tech**：Node.js
   - 點擊「Create app」

3. **取得憑證**
   - 在 App 頁面中，前往「App Keys」標籤
   - 複製以下資訊：
     - **App ID**
     - **Key**
     - **Secret**
     - **Cluster**

4. **填入 `.env.local`**
   ```env
   NEXT_PUBLIC_PUSHER_APP_ID=<App ID>
   NEXT_PUBLIC_PUSHER_KEY=<Key>
   NEXT_PUBLIC_PUSHER_CLUSTER=<Cluster>
   PUSHER_SECRET=<Secret>
   ```

#### 步驟 9：資料庫初始化（可選）

如果需要初始化資料庫結構或執行遷移：

```bash
# 執行資料庫遷移腳本（如果需要）
yarn migrate-db
```

**注意**：首次運行時，MongoDB 會自動建立必要的集合（collections），通常不需要手動執行遷移。

#### 步驟 10：啟動開發伺服器

```bash
# 啟動開發伺服器
yarn dev
```

伺服器將在 `http://localhost:3000` 啟動。

#### 步驟 11：驗證安裝

1. **開啟瀏覽器**
   - 前往：http://localhost:3000

2. **測試登入功能**
   - 點擊「Sign In」按鈕
   - 選擇 Google 或 GitHub 登入
   - 完成 OAuth 認證
   - 首次登入需設定使用者 ID

3. **測試主要功能**
   - **Dashboard**：確認 Dashboard 正常顯示
   - **Groups**：建立或加入群組
   - **Calendar**：建立事件，測試 Google Calendar 同步（如已設置）
   - **Todo List**：新增待辦事項
   - **Profile**：查看個人檔案
   - **Map**：在群組中測試地圖功能（需允許位置權限）

#### 測試帳號與憑證

**注意**：本專案使用 OAuth 認證，不需要預設測試帳號。請使用您的 Google 或 GitHub 帳號進行測試。

**測試步驟**：

1. **基本功能測試**
   - 登入/登出功能
   - 使用者 ID 設定
   - Dashboard 顯示

2. **群組功能測試**
   - 建立公開群組
   - 建立私密群組（需密碼）
   - 加入群組
   - 群組聊天
   - 位置更新與地圖顯示
   - 群組排行榜

3. **行事曆功能測試**
   - 建立事件
   - 編輯事件
   - 刪除事件
   - Google Calendar 同步（如已設置）

4. **待辦事項測試**
   - 新增任務
   - 標記完成
   - 刪除任務

5. **Pomodoro 計時器測試**
   - 啟動計時器
   - 完成專注時段
   - 查看統計

6. **個人檔案測試**
   - 更新個人資訊
   - 管理課程
   - 查看統計

#### 常見問題排除

##### 問題 1：MongoDB 連接失敗

**解決方案**：
- 確認 MongoDB 服務正在運行
- 檢查 `.env.local` 中的 `MONGODB_URI` 是否正確
- 如果使用 Atlas，確認 IP 位址已加入白名單
- 檢查網路連線

##### 問題 2：OAuth 登入失敗

**解決方案**：
- 確認 `.env.local` 中的 OAuth 憑證正確
- 檢查回調 URL 是否與 OAuth 應用程式設定一致
- 確認 `NEXTAUTH_URL` 設定正確
- 清除瀏覽器快取與 Cookie

##### 問題 3：地圖不顯示

**解決方案**：
- 確認 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 已設置
- 檢查 Google Maps API 是否已啟用
- 確認 API 金鑰限制設定正確
- 重新啟動開發伺服器

##### 問題 4：即時通訊不工作

**解決方案**：
- 確認 Pusher 憑證已正確設置
- 檢查 Pusher Cluster 設定是否正確
- 查看瀏覽器控制台是否有錯誤訊息

##### 問題 5：Google Calendar 同步失敗

**解決方案**：
- 確認 Google Calendar API 已啟用
- 檢查 OAuth 同意畫面是否已配置
- 確認回調 URL 已添加到 OAuth 憑證
- 嘗試重新連接 Google Calendar

##### 問題 6：編譯錯誤

**解決方案**：
```bash
# 清除快取並重新安裝
rm -rf node_modules .next
yarn install
yarn dev
```

##### 問題 7：環境變數未生效

**解決方案**：
- 確認檔案名稱為 `.env.local`（不是 `.env`）
- 確認環境變數名稱正確（注意大小寫）
- 重新啟動開發伺服器
- 對於 `NEXT_PUBLIC_` 開頭的變數，確認有正確前綴

#### 生產環境部署注意事項

如果要在生產環境部署：

1. **更新環境變數**
   - 將 `NEXTAUTH_URL` 更新為生產網址
   - 更新 OAuth 回調 URL 為生產網址
   - 使用更安全的 `NEXTAUTH_SECRET`

2. **MongoDB Atlas**
   - 確認生產環境 IP 已加入白名單
   - 使用更安全的資料庫使用者密碼

3. **API 金鑰限制**
   - 更新 Google Maps API 金鑰限制為生產網域
   - 更新 OAuth 應用程式回調 URL

4. **Pusher**
   - 確認 Pusher 設定支援生產網域

---

### 每位組員之負責項目

#### r13922146 葉富銘
- **OAuth 認證系統**：實作 Google 與 GitHub OAuth 整合
- **使用者個人檔案**：個人資料管理、課程管理、狀態設定、統計資訊
- **群組功能**（不含地圖相關）：
  - 群組建立、加入、離開
  - 群組成員管理
  - 群組設定
  - 群組排行榜
- **Pomodoro 計時器整合**：計時器功能與群組專注狀態整合

#### b12901044 江宗倫
- **行事曆功能**：行事曆視圖、事件管理、時間表視圖
- **待辦事項管理**：Todo List 功能實作
- **Google Maps 整合**：地圖顯示、位置標記、地址解析

#### b12901015 陳拓之
- **整體 UI 設計**：應用程式整體視覺設計與使用者體驗
- **首頁（Homepage）**：首頁設計與實作
- **Pomodoro 計時器**：計時器 UI 與功能實作

**注意**：本專題無外部協助者，所有功能均由組員自行開發。

---

### 專題延伸說明

本專題為全新開發，並非之前作品或專題的延伸。所有功能與程式碼均為本學期從零開始開發。

---

## 技術架構說明

### 專案結構

```
WP_FinalProject/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 認證相關 API
│   │   ├── calendar/             # 行事曆 API
│   │   ├── groups/               # 群組 API
│   │   ├── profile/              # 個人檔案 API
│   │   ├── todos/                # 待辦事項 API
│   │   ├── google-calendar/      # Google Calendar API
│   │   └── focus-session/        # 專注時段 API
│   ├── auth/                     # 認證頁面
│   ├── calendar/                 # 行事曆頁面
│   ├── groups/                   # 群組頁面
│   ├── profile/                  # 個人檔案頁面
│   ├── todo-list/                # 待辦事項頁面
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首頁
│   └── globals.css               # 全域樣式
├── components/                   # React 元件
│   ├── Navbar.tsx                # 導航列
│   ├── Dashboard.tsx             # Dashboard 元件
│   ├── PomodoroTimer.tsx         # Pomodoro 計時器
│   └── ...
├── lib/                          # 工具函式庫
│   ├── auth.ts                   # NextAuth 配置
│   ├── mongodb.ts                # MongoDB 連接
│   ├── google-calendar.ts        # Google Calendar 整合
│   ├── pusher.ts                 # Pusher 配置
│   └── ...
├── models/                       # Mongoose 模型
│   ├── User.ts                   # 使用者模型
│   ├── Group.ts                  # 群組模型
│   ├── Event.ts                  # 事件模型
│   ├── Todo.ts                   # 待辦事項模型
│   └── ...
├── scripts/                      # 腳本
│   ├── migrate-db.ts             # 資料庫遷移
│   ├── inspect-db.ts             # 資料庫檢查
│   └── cleanup-db.ts             # 資料庫清理
├── types/                        # TypeScript 型別定義
├── middleware.ts                 # Next.js 中介軟體
├── package.json                  # 專案依賴
├── yarn.lock                     # Yarn 鎖定檔案
├── tsconfig.json                 # TypeScript 配置
├── tailwind.config.ts            # Tailwind CSS 配置
└── next.config.mjs               # Next.js 配置
```

### 資料庫模型

- **User**：使用者資訊、OAuth 資料、Google Calendar 連線狀態
- **Group**：群組資訊、設定、成員列表
- **GroupMember**：群組成員關係、角色、位置資訊
- **GroupMessage**：群組聊天訊息
- **Event**：行事曆事件、同步狀態
- **Todo**：待辦事項

### API 端點

- `/api/auth/*`：NextAuth 認證端點
- `/api/groups`：群組 CRUD 操作
- `/api/groups/[id]/messages`：群組訊息
- `/api/groups/[id]/location`：位置更新
- `/api/calendar`：行事曆事件管理
- `/api/google-calendar/*`：Google Calendar 同步
- `/api/todos`：待辦事項管理
- `/api/profile/*`：個人檔案管理

---

## 授權

本專題為課程作業專案。

---

**最後更新**：2025年12月
