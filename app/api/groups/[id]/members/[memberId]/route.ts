import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import GroupMessage from '@/models/GroupMessage';
import User from '@/models/User';
import { updateMemberRoleSchema } from '@/lib/validators';
import mongoose from 'mongoose';

// PUT /api/groups/[id]/members/[memberId] - Update member role or remove member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const { role } = body;

    // Validate input
    const validationResult = updateMemberRoleSchema.safeParse({ role });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(params.id) || !mongoose.Types.ObjectId.isValid(params.memberId)) {
      return NextResponse.json(
        { error: 'Invalid group ID or member ID' },
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

    // Check if requester is owner or admin
    const requesterMembership = await GroupMember.findOne({
      groupId: params.id,
      userId: session.user.userId,
    });

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only group owners and admins can manage members' },
        { status: 403 }
      );
    }

    // Find the member to update
    const targetMember = await GroupMember.findById(params.memberId);
    if (!targetMember || targetMember.groupId.toString() !== params.id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Only owner can change owner role or assign admin role
    if (requesterMembership.role !== 'owner') {
      if (targetMember.role === 'owner' || validationResult.data.role === 'owner' || validationResult.data.role === 'admin') {
        return NextResponse.json(
          { error: 'Only group owner can manage owner and admin roles' },
          { status: 403 }
        );
      }
    }

    // Owner cannot change their own role
    if (targetMember.userId === session.user.userId && validationResult.data.role !== 'owner') {
      return NextResponse.json(
        { error: 'Owner cannot change their own role' },
        { status: 400 }
      );
    }

    // Update member role
    targetMember.role = validationResult.data.role;
    await targetMember.save();

    // Create system message
    try {
      const requesterUser = await User.findOne({ userId: session.user.userId }).select('name').lean();
      const targetUser = await User.findOne({ userId: targetMember.userId }).select('name').lean();
      
      await GroupMessage.create({
        groupId: params.id,
        userId: session.user.userId,
        content: `${requesterUser?.name || session.user.userId} changed ${targetUser?.name || targetMember.userId}'s role to ${validationResult.data.role}`,
        messageType: 'system',
      });
    } catch (error) {
      console.error('Error creating system message:', error);
    }

    return NextResponse.json(
      { message: 'Member role updated successfully', member: targetMember },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/members/[memberId] - Remove a member from the group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(params.id) || !mongoose.Types.ObjectId.isValid(params.memberId)) {
      return NextResponse.json(
        { error: 'Invalid group ID or member ID' },
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

    // Check if requester is owner or admin
    const requesterMembership = await GroupMember.findOne({
      groupId: params.id,
      userId: session.user.userId,
    });

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only group owners and admins can remove members' },
        { status: 403 }
      );
    }

    // Find the member to remove
    const targetMember = await GroupMember.findById(params.memberId);
    if (!targetMember || targetMember.groupId.toString() !== params.id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove group owner. Transfer ownership first or delete the group.' },
        { status: 400 }
      );
    }

    // Only owner can remove admins
    if (targetMember.role === 'admin' && requesterMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only group owner can remove admins' },
        { status: 403 }
      );
    }

    // Remove member
    await GroupMember.deleteOne({ _id: params.memberId });

    // Update member count
    await Group.updateOne(
      { _id: params.id },
      { $inc: { memberCount: -1 } }
    );

    // Create system message
    try {
      const requesterUser = await User.findOne({ userId: session.user.userId }).select('name').lean();
      const targetUser = await User.findOne({ userId: targetMember.userId }).select('name').lean();
      
      await GroupMessage.create({
        groupId: params.id,
        userId: session.user.userId,
        content: `${targetUser?.name || targetMember.userId} was removed from the group by ${requesterUser?.name || session.user.userId}`,
        messageType: 'system',
      });
    } catch (error) {
      console.error('Error creating system message:', error);
    }

    return NextResponse.json(
      { message: 'Member removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

