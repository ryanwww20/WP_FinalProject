import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';

// GET /api/groups/search - Search for a group by invite code
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get('inviteCode');

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const group = await Group.findOne({ 
      inviteCode: inviteCode.toUpperCase().trim() 
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Return limited info (no password)
    const groupResponse = group.toObject();
    delete groupResponse.password;

    return NextResponse.json({ group: groupResponse }, { status: 200 });
  } catch (error) {
    console.error('Error searching for group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

