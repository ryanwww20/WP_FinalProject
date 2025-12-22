import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Clear Google Calendar tokens and disable sync
    await User.findOneAndUpdate(
      { userId: session.user.userId },
      {
        $unset: {
          googleCalendarAccessToken: '',
          googleCalendarRefreshToken: '',
          googleCalendarSyncToken: '',
        },
        googleCalendarEnabled: false,
      }
    );

    return NextResponse.json(
      { message: 'Google Calendar disconnected successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

