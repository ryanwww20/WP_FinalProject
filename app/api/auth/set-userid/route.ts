import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { validateUserId } from '@/lib/validators';
import { requireAuth } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  try {
    // This route doesn't require userId (user might be setting it for the first time)
    const authResult = await requireAuth(req, { requireUserId: false });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const { userId } = await req.json();

    // Validate userId
    const validation = validateUserId(userId);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if userId is already taken
    const existingUserWithUserId = await User.findOne({ 
      userId: userId.trim().toLowerCase() 
    });

    if (existingUserWithUserId) {
      return NextResponse.json(
        { error: 'This userId is already taken. Please choose another one.' },
        { status: 409 }
      );
    }

    // Check if user already has a userId (immutable)
    // First check by userId if session has it
    let user = null;
    
    if (session.user.userId) {
      user = await User.findOne({ userId: session.user.userId });
      if (user) {
        return NextResponse.json(
          { error: 'UserId cannot be modified once set' },
          { status: 403 }
        );
      }
    }
    
    // Find user by email + provider (unique combination)
    // This ensures we match the correct user if same email exists with different provider
    if (!user && session.user.email && session.provider) {
      user = await User.findOne({ 
        email: session.user.email.toLowerCase(),
        provider: session.provider 
      });
    }

    if (!user) {
      // Create new user with userId
      // Use provider from session (google/github) or default to 'oauth'
      const provider = session.provider || 'oauth';
      
      try {
        user = await User.create({
          userId: userId.trim().toLowerCase(),
          name: session.user.name || 'User',
          email: session.user.email?.toLowerCase(),
          image: session.user.image,
          provider: provider,
        });
      } catch (createError: any) {
        // Handle duplicate key error - user might have been created between lookup and create
        if (createError.code === 11000) {
          // Check if it's a duplicate email+provider (compound index)
          if (createError.keyPattern?.email && createError.keyPattern?.provider) {
            // User already exists with this email+provider - fetch and update
            user = await User.findOne({ 
              email: session.user.email?.toLowerCase(),
              provider: provider 
            });
            
            if (!user) {
              return NextResponse.json(
                { error: 'User already exists but could not be retrieved' },
                { status: 409 }
              );
            }
            
            // If user already has userId, return error
            if (user.userId) {
              return NextResponse.json(
                { error: 'UserId cannot be modified once set' },
                { status: 403 }
              );
            }
            
            // Set userId for existing user
            user.userId = userId.trim().toLowerCase();
            await user.save();
          } else if (createError.keyPattern?.email) {
            // Old unique index on email only - this shouldn't happen with new schema
            return NextResponse.json(
              { error: 'An account with this email already exists. Please use a different email or contact support.' },
              { status: 409 }
            );
          } else if (createError.keyPattern?.userId) {
            // Duplicate userId
            return NextResponse.json(
              { error: 'This userId is already taken. Please choose another one.' },
              { status: 409 }
            );
          } else {
            throw createError; // Re-throw if it's an unexpected error
          }
        } else {
          throw createError; // Re-throw if it's not a duplicate key error
        }
      }
    } else {
      // Check if userId is already set (immutable)
      if (user.userId) {
        return NextResponse.json(
          { error: 'UserId cannot be modified once set' },
          { status: 403 }
        );
      }

      // Set userId for existing user
      user.userId = userId.trim().toLowerCase();
      await user.save();
    }

    return NextResponse.json(
      { message: 'UserId set successfully', userId: user.userId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting userId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

