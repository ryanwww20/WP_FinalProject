#!/bin/bash

# Setup script for creating .env.local file

echo "🚀 Setting up environment variables..."
echo ""

# Create .env.local file
cat > .env.local << 'EOF'
# MongoDB
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/wp_finalproject

# For MongoDB Atlas (uncomment and replace with your connection string):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/wp_finalproject?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000

# Generate a secure secret with: openssl rand -base64 32
# IMPORTANT: Change this in production!
NEXTAUTH_SECRET=dGhpcy1pcy1hLWRldmVsb3BtZW50LXNlY3JldC1jaGFuZ2UtaW4tcHJvZHVjdGlvbg==

# Google OAuth
# Get credentials from: https://console.cloud.google.com/
# Redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# GitHub OAuth
# Get credentials from: https://github.com/settings/developers
# Callback URL: http://localhost:3000/api/auth/callback/github
GITHUB_ID=your-github-client-id-here
GITHUB_SECRET=your-github-client-secret-here
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local and update the OAuth credentials"
echo "2. For a more secure NEXTAUTH_SECRET, run: openssl rand -base64 32"
echo "3. Make sure MongoDB is running"
echo "4. Run: npm install"
echo "5. Run: npm run dev"
echo ""
echo "📚 For OAuth setup instructions, see README.md"


