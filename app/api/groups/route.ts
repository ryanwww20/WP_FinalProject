import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import { createGroupSchema } from '@/lib/validators';
import { generateInviteCode } from '@/lib/group-utils';
import bcrypt from 'bcryptjs';

// GET /api/groups - Get all groups the user is a member of
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find all groups where user is a member
    const memberships = await GroupMember.find({ userId: session.user.userId })
      .populate('groupId', 'name description coverImage visibility memberCount createdAt')
      .sort({ joinedAt: -1 });

    // Also find groups owned by user (in case they're not in members list yet)
    const ownedGroups = await Group.find({ ownerId: session.user.userId })
      .select('name description coverImage visibility memberCount createdAt')
      .sort({ createdAt: -1 });

    // Combine and deduplicate
    const groupMap = new Map();
    
    ownedGroups.forEach((group: any) => {
      groupMap.set(group._id.toString(), {
        ...group.toObject(),
        role: 'owner',
      });
    });

    memberships.forEach((membership: any) => {
      if (membership.groupId) {
        groupMap.set(membership.groupId._id.toString(), {
          ...membership.groupId.toObject(),
          role: membership.role,
        });
      }
    });

    const groups = Array.from(groupMap.values());

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
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
    const validationResult = createGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, description, coverImage, visibility, password, maxMembers, requireApproval } = validationResult.data;

    await connectDB();

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = await Group.findOne({ inviteCode });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await Group.findOne({ inviteCode });
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password && password.trim().length > 0) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create group
    const group = await Group.create({
      name,
      description: description || undefined,
      coverImage: coverImage || undefined,
      ownerId: session.user.userId,
      visibility: visibility || 'private',
      password: hashedPassword,
      maxMembers: maxMembers || undefined,
      requireApproval: requireApproval || false,
      inviteCode,
      memberCount: 0,
    });

    // Add owner as a member with 'owner' role
    await GroupMember.create({
      groupId: group._id,
      userId: session.user.userId,
      role: 'owner',
    });

    // Update member count
    await Group.updateOne(
      { _id: group._id },
      { $inc: { memberCount: 1 } }
    );

    // Return group without password
    const groupResponse = group.toObject();
    delete groupResponse.password;

    return NextResponse.json({ group: groupResponse }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    
    // Handle duplicate invite code (shouldn't happen, but just in case)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Group creation failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

