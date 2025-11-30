import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import GroupMessage from '@/models/GroupMessage';
import mongoose from 'mongoose';

// POST /api/groups/[id]/leave - Leave a group
export async function POST(
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
        { error: 'You are not a member of this group' },
        { status: 400 }
      );
    }

    // Owner cannot leave (must delete group or transfer ownership first)
    if (membership.role === 'owner') {
      return NextResponse.json(
        { error: 'Group owner cannot leave. Please delete the group or transfer ownership first.' },
        { status: 400 }
      );
    }

    // Remove membership
    await GroupMember.deleteOne({
      groupId: params.id,
      userId: session.user.userId,
    });

    // Update member count
    await Group.updateOne(
      { _id: params.id },
      { $inc: { memberCount: -1 } }
    );

    // Create system message
    try {
      await GroupMessage.create({
        groupId: group._id,
        userId: session.user.userId,
        content: `${session.user.name || session.user.userId} left the group`,
        messageType: 'system',
      });
    } catch (error) {
      // Don't fail if message creation fails
      console.error('Error creating system message:', error);
    }

    return NextResponse.json({ message: 'Successfully left the group' }, { status: 200 });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

