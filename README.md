ㄑ# WP Final Project

A modern full-stack web application built with **Next.js 14**, **Tailwind CSS**, **MongoDB**, and **OAuth 2.0** authentication.

## 🚀 Features

- ⚡ **Next.js 14** with App Router and Server Components
- 🎨 **Tailwind CSS** for modern, responsive UI
- 🍃 **MongoDB** with Mongoose for database management
- 🔐 **OAuth Authentication** via NextAuth.js (Google & GitHub)
- 📱 Responsive design with dark mode support
- 🛡️ Type-safe with TypeScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Google OAuth credentials** (optional, for Google sign-in)
- **GitHub OAuth credentials** (optional, for GitHub sign-in)

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Set Up MongoDB

#### Option A: Local MongoDB

Install MongoDB locally and start the service:

```bash
# macOS (with Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get install mongodb
sudo systemctl start mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Whitelist your IP address

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/wp_finalproject
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/wp_finalproject?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (optional)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Pusher (for real-time features)
# Get credentials from: https://dashboard.pusher.com/apps/<your-app-id>/keys
NEXT_PUBLIC_PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
PUSHER_SECRET=your_secret
```

### 4. Generate NextAuth Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the `NEXTAUTH_SECRET` value in `.env.local`.

## 🔑 OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to `.env.local`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to `.env.local`

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
WP_FinalProject/
├── app/                      # Next.js App Router
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts  # NextAuth API route
│   ├── auth/
│   │   └── signin/
│   │       └── page.tsx      # Sign-in page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── Navbar.tsx
│   └── Providers.tsx
├── lib/                      # Utility functions
│   ├── auth.ts               # NextAuth configuration
│   └── mongodb.ts            # MongoDB connection
├── models/                   # Mongoose models
│   └── User.ts
├── types/                    # TypeScript type definitions
│   └── next-auth.d.ts
├── .env.example              # Example environment variables
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## 🎨 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 Authentication Flow

1. User clicks "Sign In" button
2. User is redirected to the sign-in page
3. User selects OAuth provider (Google or GitHub)
4. User authenticates with the provider
5. Provider redirects back with authorization
6. NextAuth creates a session and stores user in MongoDB
7. User is redirected to the home page

## 📦 Key Dependencies

- **next**: ^14.2.5 - React framework
-298**react**: ^18.3.1 - UI library
- **next-auth**: ^4.24.7 - Authentication
- **mongoose**: ^8.5.1 - MongoDB ODM
- **tailwindcss**: ^3.4.1 - CSS framework
- **typescript**: ^5 - Type safety

## 🌐 Database Schema

### User Model

```typescript
{
  name: String (required)
  email: String (required, unique)
  image: String (optional)
  provider: String (default: 'credentials')
  createdAt: Date
  updatedAt: Date
}
```

## 🚨 Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `brew services list` (macOS) or `sudo systemctl status mongodb` (Linux)
- Check your connection string in `.env.local`
- For Atlas, verify IP whitelist and credentials

### OAuth Not Working

- Verify redirect URIs match exactly
- Check that OAuth credentials are correct in `.env.local`
- Ensure `NEXTAUTH_URL` matches your domain
- Clear browser cache and cookies

### Build Errors

- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Ensure all environment variables are set

## 📝 Next Steps

- Add more OAuth providers (Twitter, Facebook, etc.)
- Implement user profile pages
- Add protected routes and middleware
- Create API endpoints for your application
- Add database models for your specific use case
- Implement role-based access control

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👤 Author

Created as part of Web Programming Final Project

---

**Happy Coding!** 🎉


