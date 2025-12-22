# Quick Start Guide

Get your application running in 5 minutes!

> **Important:** This project uses **Yarn** exclusively. Please do not use npm.

## 🚀 Minimal Setup (Development)

### Step 1: Install Dependencies

```bash
cd WP_FinalProject
yarn install
```

### Step 2: Set Up Environment

Create a `.env.local` file:

```bash
cat > .env.local << 'EOF'
MONGODB_URI=mongodb://localhost:27017/wp_finalproject
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-change-in-production-use-openssl-rand-base64-32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
EOF
```

### Step 3: Start MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas**
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Get your connection string
- Replace `MONGODB_URI` in `.env.local`

### Step 4: Run the App

```bash
yarn dev
```

Visit: [http://localhost:3000](http://localhost:3000)

## 🔑 Enable OAuth (Optional)

### For Testing Without OAuth:
The app will work but sign-in won't function until you configure OAuth providers.

### To Enable Google OAuth:

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Create Project** → Enable "Google+ API"
3. **Credentials** → "Create OAuth Client ID"
4. **Add Redirect URI**: `http://localhost:3000/api/auth/callback/google`
5. **Copy** Client ID & Secret to `.env.local`

### To Enable GitHub OAuth:

1. **Go to**: [GitHub Settings](https://github.com/settings/developers)
2. **New OAuth App**
3. **Homepage**: `http://localhost:3000`
4. **Callback**: `http://localhost:3000/api/auth/callback/github`
5. **Copy** Client ID & Secret to `.env.local`

## ✅ Verification

- ✅ Homepage loads at `http://localhost:3000`
- ✅ "Sign In" button visible in navbar
- ✅ Sign-in page accessible at `/auth/signin`
- ✅ OAuth buttons appear (Google & GitHub)
- ✅ After OAuth setup, can sign in successfully
- ✅ User info appears on homepage after sign-in
- ✅ MongoDB stores user data

## 🎨 What You Get

- **Modern UI** with Tailwind CSS
- **Dark mode** support
- **Responsive** design
- **OAuth authentication** (Google & GitHub)
- **MongoDB** integration
- **Type-safe** with TypeScript

## 🔧 Troubleshooting

**MongoDB won't connect?**
```bash
# Check if MongoDB is running
brew services list  # macOS
sudo systemctl status mongodb  # Linux
```

**OAuth not working?**
- Check redirect URIs match exactly
- Verify credentials in `.env.local`
- Clear browser cache

**Port already in use?**
```bash
# Change port
yarn dev -p 3001
# Update NEXTAUTH_URL to http://localhost:3001
```

## 📚 Next Steps

See [README.md](./README.md) for full documentation.

---

Need help? Check the full README or create an issue!



