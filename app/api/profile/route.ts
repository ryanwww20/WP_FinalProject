import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/middleware/auth";

export const dynamic = 'force-dynamic';

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
 * GET /api/profile
 * Get current user's profile data
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Convert to plain object to ensure all fields are included
    const userObj = user.toObject();

    // Ensure studyStats has the new structure (post-refactoring)
    const studyStats = userObj.studyStats || {
      totalStudyTime: 0,
      pomodoroCount: 0,
      todayStats: {
        date: new Date().toISOString().split('T')[0],
        seconds: 0,
        pomodoros: 0,
      },
      weeklyStats: {
        weekStart: getMondayOfWeek(new Date()),
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
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        seconds: 0,
        pomodoros: 0,
      },
    };

    return NextResponse.json({
      user: {
        userId: userObj.userId,
        name: userObj.name,
        email: userObj.email,
        image: userObj.image,
        status: userObj.status || {
          current: "offline",
          lastUpdated: new Date(),
        },
        schedule: userObj.schedule || { courses: [] },
        studyStats,
        focusSession: userObj.focusSession || {
          isActive: false,
          sessionType: "pomodoro",
        },
        createdAt: userObj.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
