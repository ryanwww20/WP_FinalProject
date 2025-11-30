import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET /api/groups/[id]/members - Get all members of a group
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
        { error: 'You must be a member to view members' },
        { status: 403 }
      );
    }

    // Get all members
    const members = await GroupMember.find({ groupId: params.id })
      .sort({ role: 1, joinedAt: 1 }) // Sort by role (owner, admin, member), then join date
      .lean();

    // Get user info for all members
    const userIds = members.map((m: any) => m.userId);
    const users = await User.find({ userId: { $in: userIds } })
      .select('userId name image email')
      .lean();

    const userMap = new Map(users.map((u: any) => [u.userId, u]));

    // Enrich members with user info
    const enrichedMembers = members.map((member: any) => ({
      _id: member._id.toString(),
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      lastActiveAt: member.lastActiveAt,
      totalStudyTime: member.totalStudyTime || 0,
      pomodoroCount: member.pomodoroCount || 0,
      user: userMap.get(member.userId) || {
        name: 'Unknown',
        userId: member.userId,
      },
    }));

    return NextResponse.json({ members: enrichedMembers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

