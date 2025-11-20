import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

// GET /api/calendar - Get events for a date range
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const events = await Event.find({
      userId: session.user.userId,
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ startTime: 1 });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/calendar - Create a new event
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
    const { title, startTime, endTime, notification, location, description } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.create({
      userId: session.user.userId,
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notification: notification || 'No Notification',
      location: location || 'No Location',
      description: description || '',
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

