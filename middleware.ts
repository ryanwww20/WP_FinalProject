import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Middleware to protect routes
export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Add routes that should be protected here
export const config = {
  matcher: [
    // Example protected routes - uncomment and modify as needed
    // "/dashboard/:path*",
    // "/profile/:path*",
    // "/api/protected/:path*",
  ],
};

