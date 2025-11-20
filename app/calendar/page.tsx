import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);

  // Redirect to userId page if user needs to set userId
  if (session?.needsUserId) {
    redirect("/auth/set-userid?callbackUrl=/calendar");
  }

  if (!session) {
    redirect("/auth/signin?callbackUrl=/calendar");
  }

  return <CalendarClient />;
}

