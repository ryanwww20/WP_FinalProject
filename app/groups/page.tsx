import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import GroupsClient from "./GroupsClient";

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);

  // Redirect to userId page if user needs to set userId
  if (session?.needsUserId) {
    redirect("/auth/set-userid?callbackUrl=/groups");
  }

  if (!session) {
    redirect("/auth/signin?callbackUrl=/groups");
  }

  return <GroupsClient />;
}

