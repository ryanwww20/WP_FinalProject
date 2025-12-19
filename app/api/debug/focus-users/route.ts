import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/debug/focus-users - Get ALL users with their focus session status (for debugging)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get ALL users with their focus session data
    const allUsers = await User.find({})
      .select('userId name email focusSession')
      .lean();

    // Get only users with active focus sessions
    const activeUsers = await User.find({
      'focusSession.isActive': true,
    })
      .select('userId name email focusSession')
      .lean();

    return NextResponse.json({
      totalUsers: allUsers.length,
      usersWithActiveFocus: activeUsers.length,
      allUsers: allUsers.map(u => ({
        userId: u.userId,
        name: u.name,
        focusSession: u.focusSession || null,
      })),
      activeUsers: activeUsers.map(u => ({
        userId: u.userId,
        name: u.name,
        focusSession: u.focusSession,
      })),
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

