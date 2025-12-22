import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardWithBackground from "@/components/DashboardWithBackground";
import HomeClient from "./HomeClient";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect to userId page if user needs to set userId
  if (session?.needsUserId) {
    redirect("/auth/set-userid?callbackUrl=/");
  }

  if (session) {
    return <DashboardWithBackground />;
  }

  return <HomeClient />;
}

