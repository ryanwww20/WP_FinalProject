import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/middleware/auth";

/**
 * GET /api/profile/favorites
 * Get user's favorite places
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    await connectDB();

    const user = await User.findOne({ userId: session.user.userId }).select("favoritePlaces");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      favorites: user.favoritePlaces || [],
    });
  } catch (error) {
    console.error("Error fetching favorite places:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/favorites
 * Add a place to favorites
 * Body: {
 *   placeId: string;
 *   name: string;
 *   address: string;
 *   lat: number;
 *   lng: number;
 *   types?: string[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const body = await request.json();
    const { placeId, name, address, lat, lng, types } = body;

    // Validation
    if (!placeId || !name || !address || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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

    // Check if already favorited
    const existingFavorites = user.favoritePlaces || [];
    const alreadyFavorited = existingFavorites.some(
      (fav: any) => fav.placeId === placeId
    );

    if (alreadyFavorited) {
      return NextResponse.json(
        { error: "Place already in favorites" },
        { status: 400 }
      );
    }

    // Add to favorites
    const newFavorite = {
      placeId,
      name,
      address,
      lat,
      lng,
      types: types || [],
      addedAt: new Date(),
    };

    const updatedUser = await User.findOneAndUpdate(
      { userId: session.user.userId },
      {
        $push: {
          favoritePlaces: newFavorite,
        },
      },
      { new: true }
    ).select("favoritePlaces");

    return NextResponse.json({
      success: true,
      favorites: updatedUser?.favoritePlaces || [],
    });
  } catch (error) {
    console.error("Error adding favorite place:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/favorites
 * Remove a place from favorites
 * Body: { placeId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const body = await request.json();
    const { placeId } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: "Missing placeId" },
        { status: 400 }
      );
    }

    await connectDB();

    const updatedUser = await User.findOneAndUpdate(
      { userId: session.user.userId },
      {
        $pull: {
          favoritePlaces: { placeId },
        },
      },
      { new: true }
    ).select("favoritePlaces");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      favorites: updatedUser.favoritePlaces || [],
    });
  } catch (error) {
    console.error("Error removing favorite place:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



