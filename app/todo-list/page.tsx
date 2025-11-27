import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TodoListClient from "./TodoListClient";

export default async function TodoListPage() {
  const session = await getServerSession(authOptions);

  // Redirect to userId page if user needs to set userId
  if (session?.needsUserId) {
    redirect("/auth/set-userid?callbackUrl=/todo-list");
  }

  if (!session) {
    redirect("/auth/signin?callbackUrl=/todo-list");
  }

  return <TodoListClient />;
}

