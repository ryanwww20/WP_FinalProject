import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET /api/groups/[id]/focus-status - Get focus status of group members
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
        { error: 'You must be a member to view focus status' },
        { status: 403 }
      );
    }

    // Get all members of the group
    const members = await GroupMember.find({ groupId: params.id }).lean();
    const userIds = members.map(m => m.userId);

    console.log(`[Focus Status] Group ${params.id}: Found ${members.length} members`);
    console.log(`[Focus Status] User IDs:`, userIds);

    // Get users with active focus sessions
    const usersWithFocus = await User.find({
      userId: { $in: userIds },
      'focusSession.isActive': true,
    }).select('userId name image focusSession').lean();

    console.log(`[Focus Status] Users with active focus:`, usersWithFocus.length);
    console.log(`[Focus Status] Details:`, usersWithFocus.map(u => ({
      userId: u.userId,
      name: u.name,
      isActive: u.focusSession?.isActive,
      startedAt: u.focusSession?.startedAt
    })));

    // Format the response
    const focusingMembers = usersWithFocus.map(user => ({
      userId: user.userId,
      name: user.name,
      image: user.image,
      focusSession: {
        startedAt: user.focusSession?.startedAt,
        targetDuration: user.focusSession?.targetDuration,
        sessionType: user.focusSession?.sessionType,
        elapsedMinutes: user.focusSession?.startedAt
          ? Math.floor((Date.now() - new Date(user.focusSession.startedAt).getTime()) / 60000)
          : 0,
      },
    }));

    console.log(`[Focus Status] Returning ${focusingMembers.length} focusing members`);

    return NextResponse.json(
      {
        focusingMembers,
        count: focusingMembers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching focus status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

