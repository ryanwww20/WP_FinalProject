import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import GroupMessage from '@/models/GroupMessage';
import { joinGroupSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// POST /api/groups/[id]/join - Join a group
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
    
    // Validate input
    const validationResult = joinGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { inviteCode, password } = validationResult.data;

    await connectDB();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid group ID' },
        { status: 400 }
      );
    }

    // Find group by ID or invite code
    let group = await Group.findById(params.id);
    
    // If not found by ID, try invite code
    if (!group) {
      group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }
    } else {
      // If found by ID, verify invite code matches
      if (group.inviteCode !== inviteCode.toUpperCase()) {
        return NextResponse.json(
          { error: 'Invalid invite code' },
          { status: 400 }
        );
      }
    }

    // Check if user is already a member
    const existingMember = await GroupMember.findOne({
      groupId: group._id,
      userId: session.user.userId,
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Check if group has password
    if (group.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required to join this group' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, group.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Check member limit
    if (group.maxMembers && group.memberCount >= group.maxMembers) {
      return NextResponse.json(
        { error: 'Group has reached maximum member limit' },
        { status: 400 }
      );
    }

    // Check if approval is required
    if (group.requireApproval) {
      // For now, we'll auto-approve. In the future, we can add a pending status
      // TODO: Implement approval workflow
    }

    // Add user as member
    const membership = await GroupMember.create({
      groupId: group._id,
      userId: session.user.userId,
      role: 'member',
    });

    // Update member count
    await Group.updateOne(
      { _id: group._id },
      { $inc: { memberCount: 1 } }
    );

    // Create system message
    try {
      await GroupMessage.create({
        groupId: group._id,
        userId: session.user.userId,
        content: `${session.user.name || session.user.userId} joined the group`,
        messageType: 'system',
      });
    } catch (error) {
      // Don't fail if message creation fails
      console.error('Error creating system message:', error);
    }

    const groupResponse = group.toObject();
    delete groupResponse.password;

    return NextResponse.json({
      group: groupResponse,
      membership: {
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error joining group:', error);
    
    // Handle duplicate membership (shouldn't happen due to our check, but just in case)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

