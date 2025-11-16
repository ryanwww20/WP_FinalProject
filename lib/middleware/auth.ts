import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

/**
 * Authentication options for middleware
 */
export interface AuthOptions {
  /**
   * If true, requires userId to be set (for routes that need a registered user)
   * If false, requires email + provider (for routes like set-userid where userId is being set)
   * Note: email alone is not unique - email + provider combination is unique
   */
  requireUserId?: boolean;
}

/**
 * Get the current session and validate authentication
 * @param options - Authentication options
 * @returns Session if authenticated, null otherwise
 */
export async function getAuthenticatedSession(
  options: AuthOptions = { requireUserId: true }
): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  // If userId is required, check if it exists
  if (options.requireUserId) {
    if (!session.user?.userId) {
      return null;
    }
  } else {
    // For routes that don't need userId (like set-userid), require email + provider
    // This is because email alone is not unique - email + provider combination is unique
    if (!session.user?.email || !session.provider) {
      return null;
    }
  }

  return session;
}

/**
 * Middleware function to require authentication
 * Returns the session if authenticated, or an error response if not
 * 
 * @param request - Next.js request object
 * @param options - Authentication options
 * @returns Session if authenticated, or NextResponse with error if not
 */
export async function requireAuth(
  request: NextRequest,
  options: AuthOptions = { requireUserId: true }
): Promise<Session | NextResponse> {
  const session = await getAuthenticatedSession(options);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return session;
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * 
 * @param handler - The route handler function
 * @param options - Authentication options
 * @returns Wrapped handler with authentication check
 * 
 * @example
 * ```typescript
 * export const GET = withAuth(async (request, session) => {
 *   // session is guaranteed to be valid here
 *   return NextResponse.json({ userId: session.user.userId });
 * });
 * ```
 */
export function withAuth(
  handler: (
    request: NextRequest,
    session: Session
  ) => Promise<NextResponse>,
  options: AuthOptions = { requireUserId: true }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireAuth(request, options);

    // If authResult is a NextResponse, it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // authResult is a Session, call the handler
    return handler(request, authResult);
  };
}

