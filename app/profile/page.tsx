import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileHeader from "./components/ProfileHeader";
import ScheduleView from "./components/ScheduleView";
import StatisticsCard from "./components/StatisticsCard";
import FavoritePlaces from "./components/FavoritePlaces";
import { StatusProvider } from "./components/StatusContext";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  // Redirect to userId page if user needs to set userId
  if (session?.needsUserId) {
    redirect("/auth/set-userid?callbackUrl=/profile");
  }

  return (
    <StatusProvider>
      <div className="min-h-[calc(100vh-4rem)] bg-muted/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Profile Header */}
          <ProfileHeader session={session} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Schedule */}
            <div className="lg:col-span-3 space-y-6">
              <ScheduleView />
              <FavoritePlaces />
            </div>

            {/* Right Column - Statistics */}
            <div className="lg:col-span-1">
              <StatisticsCard />
            </div>
          </div>
        </div>
      </div>
    </StatusProvider>
  );
}
