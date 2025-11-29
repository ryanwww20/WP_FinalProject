import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import GroupDetailClient from "./GroupDetailClient";

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  // Redirect to userId page if user needs to set userId
  if (session?.needsUserId) {
    redirect(`/auth/set-userid?callbackUrl=/groups/${params.id}`);
  }

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/groups/${params.id}`);
  }

  return <GroupDetailClient groupId={params.id} />;
}

