import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import GroupMessage from '@/models/GroupMessage';
import { updateGroupSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// GET /api/groups/[id] - Get group details
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
      // User is not a member - return limited info for public groups
      if (group.visibility === 'public') {
        const publicInfo = {
          _id: group._id,
          name: group.name,
          description: group.description,
          coverImage: group.coverImage,
          visibility: group.visibility,
          memberCount: group.memberCount,
          createdAt: group.createdAt,
        };
        return NextResponse.json({ group: publicInfo, isMember: false }, { status: 200 });
      } else {
        return NextResponse.json(
          { error: 'Group not found or access denied' },
          { status: 404 }
        );
      }
    }

    // User is a member - return full info (except password)
    const groupResponse = group.toObject();
    delete groupResponse.password;

    return NextResponse.json({
      group: groupResponse,
      membership: {
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
      isMember: true,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id] - Update group (only owner/admin)
export async function PUT(
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
    const validationResult = updateGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
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

    // Check if user is owner or admin
    const group = await Group.findById(params.id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const membership = await GroupMember.findOne({
      groupId: params.id,
      userId: session.user.userId,
    });

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only group owners and admins can update group settings' },
        { status: 403 }
      );
    }

    // Only owner can change certain settings
    if (membership.role !== 'owner') {
      // Admins can't change ownerId, visibility, or password
      if (body.visibility !== undefined || body.password !== undefined) {
        return NextResponse.json(
          { error: 'Only group owner can change visibility and password' },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (validationResult.data.name !== undefined) updateData.name = validationResult.data.name;
    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description === '' ? undefined : validationResult.data.description;
    }
    if (validationResult.data.coverImage !== undefined) {
      updateData.coverImage = validationResult.data.coverImage === '' ? undefined : validationResult.data.coverImage;
    }
    if (validationResult.data.visibility !== undefined && membership.role === 'owner') {
      updateData.visibility = validationResult.data.visibility;
    }
    if (validationResult.data.maxMembers !== undefined) updateData.maxMembers = validationResult.data.maxMembers;
    if (validationResult.data.requireApproval !== undefined) updateData.requireApproval = validationResult.data.requireApproval;

    // Handle password update (only owner)
    if (validationResult.data.password !== undefined && membership.role === 'owner') {
      if (validationResult.data.password && validationResult.data.password.trim().length > 0) {
        updateData.password = await bcrypt.hash(validationResult.data.password, 10);
      } else {
        // Empty string means remove password
        updateData.password = undefined;
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    const groupResponse = updatedGroup!.toObject();
    delete groupResponse.password;

    return NextResponse.json({ group: groupResponse }, { status: 200 });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Delete group (only owner)
export async function DELETE(
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

    // Check if user is owner
    const group = await Group.findById(params.id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (group.ownerId !== session.user.userId) {
      return NextResponse.json(
        { error: 'Only group owner can delete the group' },
        { status: 403 }
      );
    }

    // Delete all related data
    await GroupMember.deleteMany({ groupId: params.id });
    await GroupMessage.deleteMany({ groupId: params.id });
    await Group.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Group deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

