import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroupMember from '@/models/GroupMember';
import Group from '@/models/Group';

/**
 * GET /api/groups/my-groups
 * Get all groups that the current user is a member of
 */
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

    // Find all group memberships for the user
    const memberships = await GroupMember.find({
      userId: session.user.userId,
    }).select('groupId role').lean();

    if (memberships.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // Get group details
    const groupIds = memberships.map((m: any) => m.groupId);
    const groups = await Group.find({
      _id: { $in: groupIds },
    }).select('_id name description coverImage').lean();

    // Create a map of groupId to role
    const roleMap = new Map(
      memberships.map((m: any) => [m.groupId.toString(), m.role])
    );

    // Combine group info with role
    const result = groups.map((group: any) => ({
      _id: group._id.toString(),
      name: group.name,
      description: group.description,
      coverImage: group.coverImage,
      role: roleMap.get(group._id.toString()),
    }));

    return NextResponse.json({ groups: result });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

