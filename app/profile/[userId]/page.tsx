"use client";

import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import ProfileHeader from "../components/ProfileHeader";
import ScheduleView from "../components/ScheduleView";
import StatisticsCard from "../components/StatisticsCard";
import { StatusProvider } from "../components/StatusContext";
import { useEffect } from "react";

interface PageProps {
  params: {
    userId: string;
  };
}

export default function UserProfilePage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Redirect to userId page if user needs to set userId
    if (session?.needsUserId) {
      router.push("/auth/set-userid?callbackUrl=/profile");
      return;
    }

    // If viewing own profile, redirect to /profile
    if (session?.user?.userId === params.userId) {
      router.push("/profile");
    }
  }, [session, status, params.userId, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <StatusProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back button */}
          <div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-700 hover:text-gray-900 dark:hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Group
            </button>
          </div>

          {/* Profile Header - Read Only */}
          <ProfileHeader session={session} targetUserId={params.userId} readOnly />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Schedule (Read Only) */}
            <div className="lg:col-span-3">
              <ScheduleView targetUserId={params.userId} readOnly />
            </div>

            {/* Right Column - Statistics (Read Only) */}
            <div className="lg:col-span-1">
              <StatisticsCard targetUserId={params.userId} readOnly />
            </div>
          </div>
        </div>
      </div>
    </StatusProvider>
  );
}

