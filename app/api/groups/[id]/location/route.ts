import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroupMember from '@/models/GroupMember';
import mongoose from 'mongoose';
import { publishToChannel } from '@/lib/pusher';
import { getGroupChannel, PUSHER_EVENTS } from '@/lib/pusher-constants';
import type { LocationUpdatedEvent } from '@/lib/pusher-types';

// PUT /api/groups/[id]/location - 更新當前使用者在群組中的位置
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

    await connectDB();

    // 驗證 ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid group ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { lat, lng, address } = body;

    // 驗證輸入
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates. lat and lng must be numbers.' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates. lat must be between -90 and 90, lng must be between -180 and 180.' },
        { status: 400 }
      );
    }

    // 檢查使用者是否為群組成員
    const membership = await GroupMember.findOne({
      groupId: params.id,
      userId: session.user.userId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // 更新位置
    membership.location = {
      lat,
      lng,
      address: address || undefined,
      updatedAt: new Date(),
    };

    await membership.save();

    // 獲取使用者資訊
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ userId: session.user.userId })
      .select('name image')
      .lean();

    // 發送 Pusher 事件通知群組其他成員
    try {
      const channel = getGroupChannel(params.id);
      const locationEvent: LocationUpdatedEvent = {
        userId: session.user.userId,
        userName: user?.name || 'Unknown',
        userImage: user?.image || undefined,
        groupId: params.id,
        location: {
          lat: membership.location.lat,
          lng: membership.location.lng,
          address: membership.location.address || undefined,
          updatedAt: membership.location.updatedAt.toISOString(),
        },
      };

      await publishToChannel(channel, PUSHER_EVENTS.LOCATION_UPDATED, locationEvent);
    } catch (error) {
      // 記錄錯誤但不影響位置更新
      console.error('❌ [API] Error publishing location update to Pusher:', error);
    }

    return NextResponse.json({
      success: true,
      location: membership.location,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/groups/[id]/location - 獲取群組所有成員的位置
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

    // 驗證 ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid group ID' },
        { status: 400 }
      );
    }

    // 檢查使用者是否為群組成員
    const membership = await GroupMember.findOne({
      groupId: params.id,
      userId: session.user.userId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // 獲取所有有位置的成員
    const membersWithLocation = await GroupMember.find({
      groupId: params.id,
      'location.lat': { $exists: true },
      'location.lng': { $exists: true },
    })
      .select('userId role location')
      .lean();

    // 獲取使用者資訊
    const userIds = membersWithLocation.map((m: any) => m.userId);
    const User = (await import('@/models/User')).default;
    const users = await User.find({ userId: { $in: userIds } })
      .select('userId name image')
      .lean();

    const userMap = new Map(users.map((u: any) => [u.userId, u]));

    // 格式化返回數據
    const locations = membersWithLocation
      .filter((member: any) => member.location && member.location.lat && member.location.lng)
      .map((member: any) => {
        const user = userMap.get(member.userId);
        return {
          userId: member.userId,
          userName: user?.name || 'Unknown',
          userImage: user?.image || undefined,
          role: member.role,
          lat: member.location.lat,
          lng: member.location.lng,
          address: member.location.address || '',
          updatedAt: member.location.updatedAt,
        };
      });

    return NextResponse.json({ locations }, { status: 200 });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/location - 刪除當前使用者的位置
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

    // 驗證 ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid group ID' },
        { status: 400 }
      );
    }

    // 檢查使用者是否為群組成員
    const membership = await GroupMember.findOne({
      groupId: params.id,
      userId: session.user.userId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // 刪除位置
    membership.location = undefined;
    await membership.save();

    return NextResponse.json({
      success: true,
      message: 'Location removed successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

