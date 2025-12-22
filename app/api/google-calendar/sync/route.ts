import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncBidirectional } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await syncBidirectional(session.user.userId);

    return NextResponse.json({
      success: true,
      ...result,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error syncing Google Calendar:', error);
    
    if (error.message?.includes('not connected')) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect first.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

