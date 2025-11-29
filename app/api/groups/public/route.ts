import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';

// GET /api/groups/public - Get all groups (for browsing)
// Returns all groups but marks which are public (no password) vs private (has password)
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

    // Get all groups
    const allGroups = await Group.find({})
      .select('name description coverImage password memberCount createdAt inviteCode')
      .sort({ createdAt: -1 })
      .lean();

    // Check user's memberships
    const userMemberships = await GroupMember.find({ userId: session.user.userId })
      .select('groupId role')
      .lean();

    const membershipMap = new Map(
      userMemberships.map((m: any) => [m.groupId.toString(), m.role])
    );

    // Enrich groups with public/private status and user's role
    const enrichedGroups = allGroups.map((group: any) => {
      const isPublic = !group.password || group.password.trim().length === 0;
      const userRole = membershipMap.get(group._id.toString());

      return {
        _id: group._id.toString(),
        name: group.name,
        description: group.description,
        coverImage: group.coverImage,
        memberCount: group.memberCount,
        inviteCode: group.inviteCode,
        createdAt: group.createdAt,
        isPublic, // true if no password, false if has password
        hasPassword: !isPublic,
        role: userRole || undefined,
      };
    });

    return NextResponse.json({ groups: enrichedGroups }, { status: 200 });
  } catch (error) {
    console.error('Error fetching public groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

