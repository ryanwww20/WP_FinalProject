import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import GroupMessage from '@/models/GroupMessage';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET /api/groups/[id]/messages - Get messages for a group
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

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
      // If group is public, allow viewing but with limited access
      if (group.visibility === 'public') {
        // For public groups, we might allow limited message viewing
        // For now, require membership
        return NextResponse.json(
          { error: 'You must be a member to view messages' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: 'Group not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Fetch messages with user info
    const messages = await GroupMessage.find({ groupId: params.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get user info for each message
    const userIds = [...new Set(messages.map((msg: any) => msg.userId))];
    const users = await User.find({ userId: { $in: userIds } })
      .select('userId name image')
      .lean();

    const userMap = new Map(users.map((u: any) => [u.userId, u]));

    // Enrich messages with user info
    const enrichedMessages = messages.map((msg: any) => ({
      ...msg,
      _id: msg._id.toString(),
      user: userMap.get(msg.userId) || { name: 'Unknown', userId: msg.userId },
    }));

    return NextResponse.json({ messages: enrichedMessages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/messages - Send a message to a group
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

    const body = await request.json();
    const { content, messageType = 'text' } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message cannot exceed 2000 characters' },
        { status: 400 }
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
        { error: 'You must be a member to send messages' },
        { status: 403 }
      );
    }

    // Create message
    const message = await GroupMessage.create({
      groupId: params.id,
      userId: session.user.userId,
      content: content.trim(),
      messageType: messageType === 'system' ? 'system' : 'text',
    });

    // Get user info
    const user = await User.findOne({ userId: session.user.userId })
      .select('userId name image')
      .lean();

    const messageResponse = {
      ...message.toObject(),
      _id: message._id.toString(),
      user: user || { name: session.user.name || 'Unknown', userId: session.user.userId },
    };

    return NextResponse.json({ message: messageResponse }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

