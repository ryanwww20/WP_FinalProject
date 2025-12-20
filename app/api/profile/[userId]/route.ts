import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import GroupMember from '@/models/GroupMember';

// GET /api/profile/[userId] - Get another user's profile (read-only)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const targetUserId = params.userId;

    await connectDB();

    // Get the target user's profile
    const targetUser = await User.findOne({ userId: targetUserId });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if they are in the same group
    const currentUserGroups = await GroupMember.find({ userId: session.user.userId })
      .distinct('groupId');
    
    const targetUserGroups = await GroupMember.find({ userId: targetUserId })
      .distinct('groupId');

    // Find common groups
    const commonGroups = currentUserGroups.filter(groupId => 
      targetUserGroups.some(tg => tg.toString() === groupId.toString())
    );

    if (commonGroups.length === 0) {
      return NextResponse.json(
        { error: 'You can only view profiles of users in your groups' },
        { status: 403 }
      );
    }

    // Return public profile information
    const userObj = targetUser.toObject() as any;
    const profileData = {
      userId: userObj.userId,
      name: userObj.name,
      image: userObj.image,
      status: userObj.status?.current || 'offline', // Extract the 'current' field from status object
      createdAt: userObj.createdAt,
      courses: userObj.courses || [],
      stats: {
        totalStudyTime: userObj.totalStudyTime || 0,
        pomodoroCount: userObj.pomodoroCount || 0,
        currentStreak: userObj.currentStreak || 0,
        longestStreak: userObj.longestStreak || 0,
        todayStudyTime: userObj.dailyStats?.today?.seconds || 0,
        weekStudyTime: userObj.dailyStats?.thisWeek?.seconds || 0,
      },
    };

    return NextResponse.json({ user: profileData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

