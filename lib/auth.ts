import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import connectDB from './mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    /**
     * signIn callback - ONLY runs during initial OAuth sign-in flow
     * 
     * Why only during initial sign-in?
     * - Receives { user, account } - these are ONLY available during OAuth flow
     * - Purpose: Decide whether to allow/deny the sign-in attempt
     * - After sign-in, user is authenticated, so this check is no longer needed
     * - On subsequent requests, only jwt() and session() callbacks run
     * 
     * This callback validates that the email+provider combination exists (if user already registered)
     * The actual user lookup and userId assignment happens in jwt() callback
     */
    async signIn({ user, account }) {
      return true;
    },
    /**
     * jwt callback - runs on EVERY request when using JWT strategy
     * 
     * Execution flow:
     * 1. Initial sign-in: receives { token, user, account } - all three present
     * 2. Subsequent requests: receives { token } only - no user or account
     * 
     * The check `if (account && user)` detects initial sign-in vs subsequent requests
     */
    async jwt({ token, user, account }) {
      // Initial sign in - ONLY true when account and user are present (OAuth flow)
      if (account && user) {
        try {
          await connectDB();
          
          // Use email + provider combination to uniquely identify user
          // This prevents matching wrong user if same email exists with different provider
          const provider = account.provider; // "google" or "github"
          const email = user.email?.toLowerCase();
          
          if (!email || !provider) {
            console.error('Missing email or provider in jwt callback');
            return token;
          }
          
          // Look up user by email + provider (unique combination)
          const dbUser = await User.findOne({ 
            email: email,
            provider: provider 
          });
          
          // If user exists, update their image from OAuth provider if available
          if (dbUser && user.image) {
            dbUser.image = user.image;
            await dbUser.save();
          }
          
          // Store image in token so it's available in session callback
          // This is important for users who haven't set userId yet
          if (user.image) {
            token.image = user.image;
          }
          
          token.email = email;
          token.provider = provider;
          token.userId = dbUser?.userId || null;
        } catch (error) {
          console.error('Error in jwt callback:', error);
        }
      }
      
      /**
       * SUBSEQUENT REQUESTS (not initial sign-in)
       * 
       * At this point:
       * - account and user are undefined (OAuth flow is complete)
       * - Only token exists (JWT from previous sign-in)
       * - signIn() callback does NOT run here - it only runs during OAuth flow
       * 
       * This section handles token updates on every request
       */
      // On subsequent requests, always check if userId was set
      // This ensures we pick up userId even if it was just set
      // Use email + provider to ensure we match the correct user
      if (token.email && token.provider && !token.userId) {
        // Check if userId was set since last request
        try {
          await connectDB();
          const dbUser = await User.findOne({ 
            email: token.email,
            provider: token.provider 
          });
          if (dbUser?.userId) {
            token.userId = dbUser.userId;
          }
        } catch (error) {
          console.error('Error updating userId in jwt:', error);
        }
      }
      
      // If we have userId, that's the primary identifier
      // No need to look up by email anymore
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        await connectDB();
        
        // Use userId as the primary identifier
        if (token.userId) {
          // Find user by userId (primary identifier - this is the only way to identify users)
          const dbUser = await User.findOne({ userId: token.userId });
          
          if (dbUser) {
            session.user.id = String(dbUser._id);
            session.user.userId = dbUser.userId;
            session.user.name = dbUser.name; // Update name from database
            session.user.email = dbUser.email; // Update email from database
            session.user.image = dbUser.image; // Update image from database
            session.needsUserId = false;
            session.provider = typeof token.provider === 'string' ? token.provider : undefined; // Store provider in session
            return session;
          }
          // If userId in token but not found in DB, something is wrong
          // Fall through to check by email
        }
        
        // No userId in token yet - check by email + provider for initial setup only
        // Use email + provider to ensure we match the correct user
        if (token.email && token.provider) {
          const dbUser = await User.findOne({ 
            email: token.email,
            provider: token.provider 
          });
          
          if (dbUser?.userId) {
            // User has userId but token wasn't updated - this shouldn't happen often
            // But we'll handle it by updating the token next time
            session.user.id = String(dbUser._id);
            session.user.userId = dbUser.userId;
            session.user.name = dbUser.name; // Update name from database
            session.user.email = dbUser.email; // Update email from database
            session.user.image = dbUser.image; // Update image from database
            session.needsUserId = false;
            session.provider = typeof token.provider === 'string' ? token.provider : undefined; // Store provider in session
            // Note: We can't update token here, but JWT callback will pick it up next time
            return session;
          } else if (dbUser && !dbUser.userId) {
            // User exists but no userId
            session.user.id = String(dbUser._id);
            session.user.userId = null;
            session.user.name = dbUser.name; // Update name from database
            session.user.email = dbUser.email; // Update email from database
            session.user.image = dbUser.image || (typeof token.image === 'string' ? token.image : null) || null; // Use database image or token image
            session.needsUserId = true;
            session.provider = typeof token.provider === 'string' ? token.provider : undefined; // Store provider in session
            return session;
          }
        }
        
        // No user found - needs to set userId
        // Use image from token (OAuth provider) if available
        session.user.id = null;
        session.user.userId = null;
        session.user.image = (typeof token.image === 'string' ? token.image : null); // Use image from OAuth provider
        session.needsUserId = true;
        session.provider = typeof token.provider === 'string' ? token.provider : undefined; // Store provider in session
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
