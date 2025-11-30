import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET /api/groups/[id]/ranking - Get rankings for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    await connectDB();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid group ID' },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await Group.findById(params.id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is a member
    const membership = await GroupMember.findOne({
      groupId: params.id,
      userId: session.user.userId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to view rankings' },
        { status: 403 }
      );
    }

    // Get all members of the group
    const members = await GroupMember.find({ groupId: params.id }).lean();

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // For now, we'll use the totalStudyTime from GroupMember
    // In the future, we can calculate from actual study sessions
    // For MVP, we'll use the weekly stats based on the period
    const rankings = await Promise.all(
      members.map(async (member: any) => {
        let studyTime = 0;

        if (period === 'today') {
          // Get today's study time from weekly stats
          const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          studyTime = member.weeklyStats?.[dayNames[dayIndex]] || 0;
        } else if (period === 'week') {
          // Sum all days of the week
          studyTime = Object.values(member.weeklyStats || {}).reduce(
            (sum: number, val: any) => sum + (val || 0),
            0
          );
        } else {
          // For month, use totalStudyTime (will be updated when we integrate with pomodoro)
          studyTime = member.totalStudyTime || 0;
        }

        return {
          userId: member.userId,
          totalStudyTime: studyTime,
          pomodoroCount: member.pomodoroCount || 0,
        };
      })
    );

    // Sort by study time (descending)
    rankings.sort((a, b) => b.totalStudyTime - a.totalStudyTime);

    // Get user info for top members
    const topUserIds = rankings.slice(0, 10).map((r) => r.userId);
    const users = await User.find({ userId: { $in: topUserIds } })
      .select('userId name image')
      .lean();

    const userMap = new Map(users.map((u: any) => [u.userId, u]));

    // Enrich rankings with user info
    const enrichedRankings = rankings.map((ranking, index) => ({
      ...ranking,
      rank: index + 1,
      user: userMap.get(ranking.userId) || { name: 'Unknown', userId: ranking.userId },
    }));

    // Find current user's position
    const userRanking = enrichedRankings.findIndex(
      (r) => r.userId === session.user.userId
    );

    return NextResponse.json(
      {
        rankings: enrichedRankings,
        userRank: userRanking >= 0 ? userRanking + 1 : null,
        period,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

