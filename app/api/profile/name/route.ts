import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { validateName } from "@/lib/validators";
import { requireAuth } from "@/lib/middleware/auth";

/**
 * PUT /api/profile/name
 * Update user's name
 * Body: { name: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const body = await request.json();
    const { name } = body;

    // Validate name
    const validation = validateName(name);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      { userId: session.user.userId },
      {
        $set: {
          name: name.trim(),
        },
      },
      { new: true }
    ).select("name");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      name: user.name,
    });
  } catch (error) {
    console.error("Error updating user name:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

