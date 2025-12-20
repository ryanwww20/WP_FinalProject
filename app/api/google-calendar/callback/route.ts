import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { google } from 'googleapis';

const OAuth2Client = google.auth.OAuth2;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/calendar?error=missing_params', request.url)
      );
    }

    const session = await getServerSession(authOptions);
    
    // Verify state matches current user
    if (!session?.user?.userId || session.user.userId !== state) {
      return NextResponse.redirect(
        new URL('/calendar?error=unauthorized', request.url)
      );
    }

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/google-calendar/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/calendar?error=no_tokens', request.url)
      );
    }

    await connectDB();

    // Save tokens to user
    await User.findOneAndUpdate(
      { userId: session.user.userId },
      {
        googleCalendarAccessToken: tokens.access_token,
        googleCalendarRefreshToken: tokens.refresh_token,
        googleCalendarEnabled: true,
      }
    );

    return NextResponse.redirect(
      new URL('/calendar?connected=true', request.url)
    );
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      new URL('/calendar?error=callback_failed', request.url)
    );
  }
}

