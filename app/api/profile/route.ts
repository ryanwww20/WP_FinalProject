import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/profile
 * Get current user's profile data
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
        studyStats: userObj.studyStats || {
          today: 0,
          thisWeek: 0,
          weekly: {
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0,
            sunday: 0,
          },
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

