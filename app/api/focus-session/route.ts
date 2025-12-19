import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { publishToChannel } from '@/lib/pusher';
import { getFocusUpdatesChannel, PUSHER_EVENTS } from '@/lib/pusher-constants';
import type { FocusSessionStartedEvent, FocusSessionCompletedEvent } from '@/lib/pusher-types';

export const dynamic = 'force-dynamic';

// Minimum session duration to count towards stats (in seconds)
const MIN_SESSION_DURATION = 10; // 10 seconds

/**
 * Helper function to get Monday of current week (ISO 8601)
 */
function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Get Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Helper function to get day name from date
 */
function getDayName(date: Date): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
  const days: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[] = 
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()] as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
}

/**
 * Helper function to update user stats (no longer updates GroupMember)
 */
async function updateStats(userId: string, sessionSeconds: number) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekStart = getMondayOfWeek(now);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const dayName = getDayName(now);
  
  const sessionMinutes = Math.floor(sessionSeconds / 60);

  // Update User stats (only in one place now!)
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error('User not found');
  }

  // Initialize studyStats if it doesn't exist
  if (!user.studyStats) {
    user.studyStats = {
      totalStudyTime: 0,
      todayStats: {
        date: today,
        seconds: 0,
      },
      weeklyStats: {
        weekStart,
        totalSeconds: 0,
        daily: {
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
        },
      },
      monthlyStats: {
        month: currentMonth,
        year: currentYear,
        seconds: 0,
      },
    };
  }

  // Check and reset TODAY if new day
  if (user.studyStats.todayStats.date !== today) {
    user.studyStats.todayStats = {
      date: today,
      seconds: 0,
    };
  }

  // Check and reset WEEK if new week
  if (user.studyStats.weeklyStats.weekStart !== weekStart) {
    user.studyStats.weeklyStats = {
      weekStart,
      totalSeconds: 0,
      daily: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      },
    };
  }

  // Check and reset MONTH if new month
  if (user.studyStats.monthlyStats.month !== currentMonth || user.studyStats.monthlyStats.year !== currentYear) {
    user.studyStats.monthlyStats = {
      month: currentMonth,
      year: currentYear,
      seconds: 0,
    };
  }

  // Add session time to all periods (in seconds)
  user.studyStats.totalStudyTime = (user.studyStats.totalStudyTime || 0) + sessionSeconds;
  user.studyStats.todayStats.seconds = (user.studyStats.todayStats.seconds || 0) + sessionSeconds;
  user.studyStats.weeklyStats.totalSeconds = (user.studyStats.weeklyStats.totalSeconds || 0) + sessionSeconds;
  user.studyStats.weeklyStats.daily[dayName] = (user.studyStats.weeklyStats.daily[dayName] || 0) + sessionSeconds;
  user.studyStats.monthlyStats.seconds = (user.studyStats.monthlyStats.seconds || 0) + sessionSeconds;

  await user.save();

  return 1; // Return 1 to indicate user stats updated
}

/**
 * GET /api/focus-session
 * Get current focus session status
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    await connectDB();

    const user = await User.findOne({ userId: session.user.userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const focusSession = user.focusSession || {
      isActive: false,
    };

    return NextResponse.json({
      isActive: focusSession.isActive,
      session: focusSession.isActive
        ? {
            startedAt: focusSession.startedAt,
            targetDuration: focusSession.targetDuration,
            elapsedMinutes: focusSession.startedAt
              ? Math.floor((Date.now() - new Date(focusSession.startedAt).getTime()) / 60000)
              : 0,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching focus session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/focus-session
 * Start a new focus session
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Focus Session POST] Request received');
    const authResult = await requireAuth(request, { requireUserId: true });
    if (authResult instanceof NextResponse) {
      console.log('[Focus Session POST] Auth failed');
      return authResult;
    }
    const session = authResult;
    console.log('[Focus Session POST] Authenticated user:', session.user.userId);

    const body = await request.json();
    const { targetDuration } = body;
    console.log('[Focus Session POST] Request body:', { targetDuration });

    // Validate input
    if (targetDuration && (typeof targetDuration !== 'number' || targetDuration < 1)) {
      return NextResponse.json(
        { error: 'Target duration must be a positive number' },
        { status: 400 }
      );
    }

    console.log('[Focus Session POST] Connecting to DB...');
    await connectDB();
    console.log('[Focus Session POST] DB connected');

    console.log('[Focus Session POST] Finding user:', session.user.userId);
    const user = await User.findOne({ userId: session.user.userId });
    if (!user) {
      console.log('[Focus Session POST] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('[Focus Session POST] User found:', user.userId);

    // Check if already in a focus session
    if (user.focusSession?.isActive) {
      console.log('[Focus Session POST] User already has active session');
      return NextResponse.json(
        { error: 'A focus session is already active. Please stop the current session first.' },
        { status: 409 }
      );
    }

    // Start new focus session
    const now = new Date();
    console.log('[Focus Session POST] Creating focus session...');
    user.focusSession = {
      isActive: true,
      startedAt: now,
      targetDuration: targetDuration || 25,
    };

    // Update user status to "studying"
    if (!user.status) {
      user.status = { current: 'studying', lastUpdated: now };
    } else {
      user.status.current = 'studying';
      user.status.lastUpdated = now;
    }

    console.log('[Focus Session POST] Saving user to DB...', {
      userId: user.userId,
      focusSession: user.focusSession,
    });
    await user.save();
    console.log('[Focus Session POST] User saved successfully!');

    console.log(`[Focus Session] User ${session.user.userId} started focus session:`, {
      isActive: user.focusSession.isActive,
      startedAt: user.focusSession.startedAt,
      targetDuration: user.focusSession.targetDuration,
    });

    // Emit Pusher event for real-time updates
    const startedEvent: FocusSessionStartedEvent = {
      userId: session.user.userId!,
      startedAt: user.focusSession.startedAt!.toISOString(),
      targetDuration: user.focusSession.targetDuration,
      timestamp: Date.now(),
    };
    
    await publishToChannel(
      getFocusUpdatesChannel(),
      PUSHER_EVENTS.FOCUS_SESSION_STARTED,
      startedEvent
    );
    
    console.log('[Focus Session POST] Pusher event emitted');
    console.log('[Focus Session POST] Returning success response');
    return NextResponse.json({
      success: true,
      session: {
        isActive: true,
        startedAt: user.focusSession.startedAt,
        targetDuration: user.focusSession.targetDuration,
      },
      message: 'Focus session started successfully',
    });
  } catch (error) {
    console.error('[Focus Session POST] ERROR:', error);
    console.error('[Focus Session POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * PUT /api/focus-session
 * Stop or update current focus session
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    const body = await request.json();
    const { action } = body;

    if (!action || !['stop', 'pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be one of: stop, pause, resume' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ userId: session.user.userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.focusSession?.isActive) {
      return NextResponse.json(
        { error: 'No active focus session found' },
        { status: 404 }
      );
    }

    if (action === 'stop') {
      // Calculate elapsed time in seconds
      const startedAt = new Date(user.focusSession.startedAt!);
      const now = new Date();
      const elapsedMs = now.getTime() - startedAt.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      
      // Date variables for Pusher event fallback values
      const today = now.toISOString().split('T')[0];
      const weekStart = getMondayOfWeek(now);
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Only count sessions longer than minimum duration (configurable at top of file)
      if (elapsedSeconds >= MIN_SESSION_DURATION) {
        // Update user stats (no longer updates multiple GroupMember records)
        await updateStats(
          session.user.userId!, // Guaranteed non-null by requireAuth
          elapsedSeconds
        );

        // Clear focus session
        user.focusSession = {
          isActive: false,
        };

        // Update user status back to offline (or keep it based on your preference)
        if (user.status) {
          user.status.current = 'offline';
          user.status.lastUpdated = now;
        }

        await user.save();

        console.log(`[Focus Session] User ${session.user.userId} stopped focus session:`, {
          studyTime: elapsedMinutes,
          studyTimeSeconds: elapsedSeconds,
          isActive: user.focusSession.isActive,
        });

        // Emit Pusher event for real-time updates
        const completedEvent: FocusSessionCompletedEvent = {
          userId: session.user.userId!,
          studyTime: elapsedMinutes,
          studyTimeSeconds: elapsedSeconds,
          stats: {
            totalStudyTime: user.studyStats?.totalStudyTime || 0,
            todayStats: user.studyStats?.todayStats || { date: today, seconds: 0 },
            weeklyStats: {
              weekStart: user.studyStats?.weeklyStats?.weekStart || weekStart,
              totalSeconds: user.studyStats?.weeklyStats?.totalSeconds || 0,
            },
            monthlyStats: user.studyStats?.monthlyStats || {
              month: currentMonth,
              year: currentYear,
              seconds: 0,
            },
          },
          timestamp: Date.now(),
        };
        
        await publishToChannel(
          getFocusUpdatesChannel(),
          PUSHER_EVENTS.FOCUS_SESSION_COMPLETED,
          completedEvent
        );
        
        console.log('[Focus Session] Pusher event emitted for session completion');

        return NextResponse.json({
          success: true,
          studyTime: elapsedMinutes,
          studyTimeSeconds: elapsedSeconds,
          message: `Focus session completed! You studied for ${elapsedMinutes} minutes.`,
        });
      } else {
        // Session too short, just clear it
        user.focusSession = {
          isActive: false,
        };
        
        if (user.status) {
          user.status.current = 'offline';
          user.status.lastUpdated = now;
        }

        await user.save();

        return NextResponse.json({
          success: true,
          studyTime: 0,
          studyTimeSeconds: 0,
          message: `Focus session was too short (< ${MIN_SESSION_DURATION} seconds). No stats updated.`,
        });
      }
    } else if (action === 'pause' || action === 'resume') {
      // For MVP, we'll implement simple pause/resume
      // In the future, this could track pause duration
      return NextResponse.json({
        success: true,
        message: `Session ${action}d. (Full pause/resume functionality coming soon)`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating focus session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

