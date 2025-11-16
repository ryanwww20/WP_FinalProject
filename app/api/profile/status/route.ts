import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/middleware/auth";

/**
 * PUT /api/profile/status
 * Update user's current status
 * Body: { status: 'studying' | 'busy' | 'offline' }
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const body = await request.json();
    const { status } = body;

    if (!status || !["studying", "busy", "offline"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'studying', 'busy', or 'offline'" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      { userId: session.user.userId },
      {
        $set: {
          "status.current": status,
          "status.lastUpdated": new Date(),
        },
      },
      { new: true }
    ).select("status");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: user.status,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

