import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import { syncEventToGoogle, deleteEventFromGoogle } from '@/lib/google-calendar';

// PUT /api/calendar/[id] - Update an event
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
    const { title, startTime, endTime, notification, location, description } = body;

    await connectDB();

    const event = await Event.findOneAndUpdate(
      { _id: params.id, userId: session.user.userId },
      {
        ...(title && { title }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(notification !== undefined && { notification }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        syncStatus: 'pending', // Mark for sync
      },
      { new: true }
    );

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Sync to Google Calendar if connected
    try {
      const user = await User.findOne({ userId: session.user.userId });
      if (user?.googleCalendarEnabled) {
        await syncEventToGoogle(event, session.user.userId);
      }
    } catch (error) {
      // Don't fail the request if Google Calendar sync fails
      console.error('Error syncing event to Google Calendar:', error);
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/[id] - Delete an event
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

    const event = await Event.findOne({
      _id: params.id,
      userId: session.user.userId,
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Delete from Google Calendar if connected
    try {
      const user = await User.findOne({ userId: session.user.userId });
      if (user?.googleCalendarEnabled && event.googleCalendarId) {
        await deleteEventFromGoogle(event.googleCalendarId, session.user.userId);
      }
    } catch (error) {
      // Don't fail the request if Google Calendar sync fails
      console.error('Error deleting event from Google Calendar:', error);
    }

    // Delete from local database
    await Event.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Event deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

