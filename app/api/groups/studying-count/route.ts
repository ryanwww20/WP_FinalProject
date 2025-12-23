import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroupMember from '@/models/GroupMember';
import User from '@/models/User';

/**
 * GET /api/groups/studying-count
 * Get total count of users currently studying across all groups
 */
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

    // Get all unique user IDs from all groups
    const allMembers = await GroupMember.find({})
      .select('userId')
      .lean();

    // Get unique user IDs
    const userIds = Array.from(new Set(allMembers.map((m: any) => m.userId)));

    if (userIds.length === 0) {
      return NextResponse.json({ 
        studyingCount: 0,
        totalMembers: 0
      }, { status: 200 });
    }

    // Find all users who are currently studying
    // A user is considered "studying" if:
    // 1. status.current === 'studying', OR
    // 2. focusSession.isActive === true
    const studyingUsers = await User.find({
      userId: { $in: userIds },
      $or: [
        { 'status.current': 'studying' },
        { 'focusSession.isActive': true }
      ]
    }).select('userId').lean();

    return NextResponse.json({ 
      studyingCount: studyingUsers.length,
      totalMembers: userIds.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching studying count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

