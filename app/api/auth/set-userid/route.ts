import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await req.json();

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // Validate userId format (alphanumeric, underscore, hyphen, 3-30 chars)
    const userIdRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!userIdRegex.test(userId.trim())) {
      return NextResponse.json(
        { error: 'UserId must be 3-30 characters and contain only letters, numbers, underscores, or hyphens' },
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

