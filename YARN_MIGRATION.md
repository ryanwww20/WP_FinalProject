# Yarn 遷移說明

## 為什麼要統一使用 Yarn？

本專案已統一使用 **Yarn** 作為套件管理器，以避免團隊成員使用不同套件管理器（npm, yarn, pnpm）造成的以下問題：

1. **依賴版本衝突** - 不同套件管理器的鎖定檔案格式不同
2. **部署錯誤** - CI/CD 環境可能因鎖定檔案不一致而失敗
3. **開發體驗不一致** - 團隊成員可能安裝不同版本的套件

## 已完成的變更

### 1. 移除 npm 鎖定檔案
- ❌ 刪除了 `package-lock.json`
- ✅ 只保留 `yarn.lock`

### 2. 新增配置檔案
- ✅ `.npmrc` - 防止意外使用 npm
- ✅ `.yarnrc` - Yarn 配置，使用精確版本
- ✅ 更新 `.gitignore` 排除 `package-lock.json`

### 3. 更新 package.json
```json
{
  "packageManager": "yarn@1.22.22",
  "engines": {
    "node": ">=18.0.0",
    "yarn": ">=1.22.0",
    "npm": "please-use-yarn"
  },
  "scripts": {
    "preinstall": "npx only-allow yarn",
    ...
  }
}
```

### 4. 更新文檔
- ✅ README.md - 更新安裝指令
- ✅ QUICKSTART.md - 更新快速開始指南
- ✅ setup-env.sh - 更新設定腳本

## 如何使用

### 首次設定

1. **安裝 Yarn**（如果還沒安裝）:
```bash
npm install -g yarn
```

2. **安裝專案依賴**:
```bash
yarn install
```

### 常用指令

```bash
# 安裝依賴
yarn install

# 新增套件
yarn add <package-name>

# 新增開發依賴
yarn add <package-name> --dev

# 移除套件
yarn remove <package-name>

# 執行開發伺服器
yarn dev

# 建置專案
yarn build

# 執行 linter
yarn lint
```

### 防止意外使用 npm

本專案已設定 `preinstall` hook，當有人嘗試使用 npm 時會自動阻止：

```bash
npm install
# ❌ 會顯示錯誤：Use "yarn install" instead of "npm install"
```

## 團隊成員須知

### ⚠️ 重要提醒

1. **永遠使用 Yarn**
   - ✅ `yarn install`
   - ❌ `npm install`

2. **Pull 代碼後**
   ```bash
   git pull
   yarn install  # 更新依賴
   ```

3. **新增套件時**
   ```bash
   yarn add <package-name>
   git add yarn.lock package.json
   git commit -m "Add <package-name>"
   ```

4. **遇到依賴問題時**
   ```bash
   # 清除快取並重新安裝
   rm -rf node_modules
   yarn cache clean
   yarn install
   ```

### CI/CD 設定

確保 CI/CD 配置使用 Yarn：

```yaml
# GitHub Actions 範例
- name: Install dependencies
  run: yarn install --frozen-lockfile

- name: Build
  run: yarn build
```

```yaml
# 使用 --frozen-lockfile 確保依賴版本完全一致
```

## 故障排除

### 問題 1: "command not found: yarn"

**解決方案:**
```bash
npm install -g yarn
```

### 問題 2: Yarn 版本太舊

**解決方案:**
```bash
npm install -g yarn@latest
```

### 問題 3: 權限問題

**解決方案 (macOS/Linux):**
```bash
sudo npm install -g yarn
```

**解決方案 (Windows):**
以系統管理員身分執行 PowerShell

### 問題 4: 套件安裝失敗

**解決方案:**
```bash
# 清除快取
yarn cache clean

# 刪除 node_modules 和 yarn.lock
rm -rf node_modules yarn.lock

# 重新安裝
yarn install
```

## 參考資源

- [Yarn 官方文檔](https://classic.yarnpkg.com/en/docs)
- [Yarn vs npm 比較](https://classic.yarnpkg.com/en/docs/migrating-from-npm)

---

如有任何問題，請聯繫專案維護者。

