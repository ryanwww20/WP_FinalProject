import { google } from 'googleapis';
import connectDB from './mongodb';
import User from '@/models/User';
import Event, { IEvent } from '@/models/Event';
import type { calendar_v3 } from 'googleapis';

const OAuth2Client = google.auth.OAuth2;

/**
 * Get Google Calendar OAuth2 client for a user
 */
export async function getGoogleCalendarClient(userId: string) {
  await connectDB();
  
  const user = await User.findOne({ userId });
  if (!user || !user.googleCalendarEnabled || !user.googleCalendarRefreshToken) {
    throw new Error('Google Calendar not connected for this user');
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/google-calendar/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: user.googleCalendarRefreshToken,
  });

  // Refresh access token if needed
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (credentials.access_token) {
      oauth2Client.setCredentials(credentials);
      
      // Update access token in database
      if (credentials.access_token !== user.googleCalendarAccessToken) {
        await User.findOneAndUpdate(
          { userId },
          { googleCalendarAccessToken: credentials.access_token }
        );
      }
    }
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh Google Calendar access token');
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Convert local event to Google Calendar event format
 */
function localEventToGoogleEvent(event: IEvent): calendar_v3.Schema$Event {
  return {
    summary: event.title,
    description: event.description || '',
    location: event.location && event.location !== 'No Location' ? event.location : undefined,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: event.notification && event.notification !== 'No Notification'
        ? [{ method: 'popup', minutes: parseNotificationMinutes(event.notification) }]
        : [],
    },
  };
}

/**
 * Convert Google Calendar event to local event format
 */
function googleEventToLocalEvent(
  googleEvent: calendar_v3.Schema$Event,
  userId: string
): Partial<IEvent> {
  const startTime = googleEvent.start?.dateTime 
    ? new Date(googleEvent.start.dateTime)
    : googleEvent.start?.date 
    ? new Date(googleEvent.start.date)
    : new Date();
  
  const endTime = googleEvent.end?.dateTime
    ? new Date(googleEvent.end.dateTime)
    : googleEvent.end?.date
    ? new Date(googleEvent.end.date)
    : new Date(startTime.getTime() + 3600000); // Default 1 hour

  return {
    userId,
    title: googleEvent.summary || 'Untitled Event',
    startTime,
    endTime,
    description: googleEvent.description || '',
    location: googleEvent.location || 'No Location',
    googleCalendarId: googleEvent.id || undefined,
    syncStatus: 'synced',
    lastSyncedAt: new Date(),
  };
}

/**
 * Parse notification string to minutes
 */
function parseNotificationMinutes(notification: string): number {
  const match = notification.match(/(\d+)\s*(minute|min|m)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 5; // Default 5 minutes
}

/**
 * Sync local event to Google Calendar
 */
export async function syncEventToGoogle(event: IEvent, userId: string): Promise<string> {
  const calendar = await getGoogleCalendarClient(userId);
  const googleEvent = localEventToGoogleEvent(event);

  try {
    if (event.googleCalendarId) {
      // Update existing event
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: event.googleCalendarId,
        requestBody: googleEvent,
      });
      
      await Event.findByIdAndUpdate(event._id, {
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
        googleCalendarId: response.data.id,
      });
      
      return response.data.id || event.googleCalendarId;
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
      });
      
      await Event.findByIdAndUpdate(event._id, {
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
        googleCalendarId: response.data.id,
      });
      
      return response.data.id || '';
    }
  } catch (error: any) {
    console.error('Error syncing event to Google Calendar:', error);
    await Event.findByIdAndUpdate(event._id, {
      syncStatus: 'failed',
    });
    throw error;
  }
}

/**
 * Sync Google Calendar event to local database
 */
export async function syncEventFromGoogle(
  googleEvent: calendar_v3.Schema$Event,
  userId: string
): Promise<IEvent> {
  await connectDB();
  
  const eventData = googleEventToLocalEvent(googleEvent, userId);
  
  // Check if event already exists
  if (googleEvent.id) {
    const existingEvent = await Event.findOne({
      googleCalendarId: googleEvent.id,
      userId,
    });

    if (existingEvent) {
      // Update existing event
      const updatedEvent = await Event.findByIdAndUpdate(
        existingEvent._id,
        {
          ...eventData,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
        },
        { new: true }
      );
      return updatedEvent!;
    }
  }

  // Create new event
  const newEvent = await Event.create({
    ...eventData,
    syncStatus: 'synced',
    lastSyncedAt: new Date(),
  });
  
  return newEvent;
}

/**
 * Delete event from Google Calendar
 */
export async function deleteEventFromGoogle(
  googleCalendarId: string,
  userId: string
): Promise<void> {
  const calendar = await getGoogleCalendarClient(userId);
  
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleCalendarId,
    });
  } catch (error: any) {
    if (error.code === 404) {
      // Event already deleted, ignore
      return;
    }
    throw error;
  }
}

/**
 * Handle sync conflict by comparing last modified times
 */
export function handleSyncConflict(
  localEvent: IEvent,
  googleEvent: calendar_v3.Schema$Event
): 'local' | 'google' {
  const localModified = localEvent.updatedAt.getTime();
  const googleModified = googleEvent.updated 
    ? new Date(googleEvent.updated).getTime()
    : googleEvent.created
    ? new Date(googleEvent.created).getTime()
    : 0;

  // Use the newer version
  return googleModified > localModified ? 'google' : 'local';
}

/**
 * Perform bidirectional sync
 */
export async function syncBidirectional(userId: string): Promise<{
  syncedToGoogle: number;
  syncedFromGoogle: number;
  errors: string[];
}> {
  await connectDB();
  const calendar = await getGoogleCalendarClient(userId);
  const user = await User.findOne({ userId });
  
  if (!user) {
    throw new Error('User not found');
  }

  const errors: string[] = [];
  let syncedToGoogle = 0;
  let syncedFromGoogle = 0;

  try {
    // Step 1: Sync local pending events to Google Calendar
    const pendingEvents = await Event.find({
      userId,
      $or: [
        { syncStatus: 'pending' },
        { syncStatus: 'failed' },
        { googleCalendarId: { $exists: false } },
      ],
    });

    for (const event of pendingEvents) {
      try {
        await syncEventToGoogle(event, userId);
        syncedToGoogle++;
      } catch (error: any) {
        errors.push(`Failed to sync event "${event.title}": ${error.message}`);
      }
    }

    // Step 2: Sync from Google Calendar using syncToken
    const syncToken = user.googleCalendarSyncToken;
    let pageToken: string | undefined;
    let newSyncToken: string | undefined;

    do {
      const params: calendar_v3.Params$Resource$Events$List = {
        calendarId: 'primary',
        maxResults: 250,
        singleEvents: true,
      };

      if (syncToken) {
        // 使用 syncToken 時不能使用 orderBy 參數
        params.syncToken = syncToken;
      } else {
        // 首次同步 - 獲取過去 30 天的事件，可以使用 orderBy
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        params.timeMin = thirtyDaysAgo.toISOString();
        params.orderBy = 'updated';
      }

      if (pageToken) {
        params.pageToken = pageToken;
      }

      let response;
      try {
        response = await calendar.events.list(params);
      } catch (error: any) {
        // 如果 syncToken 失效（410 錯誤），清除 syncToken 並重新同步
        if (error.code === 410 || error.message?.includes('Sync token')) {
          console.log('Sync token expired, clearing and re-syncing from beginning');
          await User.findOneAndUpdate(
            { userId },
            { $unset: { googleCalendarSyncToken: '' } }
          );
          
          // 重新開始同步（不使用 syncToken）
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          params.syncToken = undefined;
          params.timeMin = thirtyDaysAgo.toISOString();
          params.orderBy = 'updated';
          
          response = await calendar.events.list(params);
        } else {
          throw error;
        }
      }
      
      const events = response.data.items || [];
      newSyncToken = response.data.nextSyncToken || undefined;

      for (const googleEvent of events) {
        try {
          if (googleEvent.status === 'cancelled') {
            // Handle deleted events
            if (googleEvent.id) {
              const localEvent = await Event.findOne({
                googleCalendarId: googleEvent.id,
                userId,
              });
              if (localEvent) {
                await Event.findByIdAndDelete(localEvent._id);
              }
            }
          } else {
            // Sync event
            if (googleEvent.id) {
              const localEvent = await Event.findOne({
                googleCalendarId: googleEvent.id,
                userId,
              });

              if (localEvent) {
                // Check for conflicts
                const conflictResolution = handleSyncConflict(localEvent, googleEvent);
                if (conflictResolution === 'google') {
                  await syncEventFromGoogle(googleEvent, userId);
                  syncedFromGoogle++;
                }
              } else {
                await syncEventFromGoogle(googleEvent, userId);
                syncedFromGoogle++;
              }
            }
          }
        } catch (error: any) {
          errors.push(`Failed to sync Google event "${googleEvent.summary}": ${error.message}`);
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    // Update sync token
    if (newSyncToken) {
      await User.findOneAndUpdate(
        { userId },
        { googleCalendarSyncToken: newSyncToken }
      );
    }

    return {
      syncedToGoogle,
      syncedFromGoogle,
      errors,
    };
  } catch (error: any) {
    console.error('Error during bidirectional sync:', error);
    throw error;
  }
}

/**
 * Get list of user's Google Calendars
 */
export async function getUserCalendars(userId: string): Promise<calendar_v3.Schema$CalendarListEntry[]> {
  const calendar = await getGoogleCalendarClient(userId);
  
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

