import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string | null;
      userId: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    needsUserId?: boolean;
    provider?: string; // Store provider to uniquely identify users with same email
  }

  interface JWT {
    userId?: string | null;
    email?: string | null;
    provider?: string; // Store provider to uniquely identify users with same email
  }
}



