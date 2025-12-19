import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * Helper function to get Monday of current week (ISO 8601)
 */
function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Get Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

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

    // Get all members of the group (only need userIds)
    const members = await GroupMember.find({ groupId: params.id })
      .select('userId')
      .lean();
    
    const memberUserIds = members.map(m => m.userId);

    // Fetch users with their stats
    const users = await User.find({ userId: { $in: memberUserIds } })
      .select('userId name image studyStats')
      .lean();

    // Calculate date/time references
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentWeekStart = getMondayOfWeek(now);
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Build rankings from user stats
    const rankings = users.map((user: any) => {
      let studyTimeSeconds = 0;

      if (!user.studyStats) {
        return {
          userId: user.userId,
          totalStudyTime: 0,
          user: { userId: user.userId, name: user.name, image: user.image },
        };
      }

      if (period === 'today') {
        // Today's stats
        if (user.studyStats.todayStats?.date === today) {
          studyTimeSeconds = user.studyStats.todayStats.seconds || 0;
        }
      } else if (period === 'week') {
        // This week's stats
        if (user.studyStats.weeklyStats?.weekStart === currentWeekStart) {
          studyTimeSeconds = user.studyStats.weeklyStats.totalSeconds || 0;
        }
      } else if (period === 'month') {
        // This month's stats
        if (
          user.studyStats.monthlyStats?.month === currentMonth &&
          user.studyStats.monthlyStats?.year === currentYear
        ) {
          studyTimeSeconds = user.studyStats.monthlyStats.seconds || 0;
        }
      } else {
        // All-time stats
        studyTimeSeconds = user.studyStats.totalStudyTime || 0;
      }

      return {
        userId: user.userId,
        totalStudyTime: studyTimeSeconds,
        user: { userId: user.userId, name: user.name, image: user.image },
      };
    });

    // Sort by study time in seconds (descending)
    rankings.sort((a, b) => b.totalStudyTime - a.totalStudyTime);

    // Add rank
    const enrichedRankings = rankings.map((ranking, index) => ({
      ...ranking,
      rank: index + 1,
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

