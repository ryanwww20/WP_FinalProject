"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

function SetUserIdContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    
    // Redirect if already has userId
    if (status === "authenticated" && session?.user?.userId) {
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.push(callbackUrl);
    }
  }, [status, session, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/set-userid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to set userId");
        setIsLoading(false);
        return;
      }

      // Success - refresh session to get updated userId
      // This will trigger JWT callback which will find userId by email and update token
      await update();
      
      // Small delay to ensure DB write is committed and session is refreshed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Force a full page reload to ensure server-side session is refreshed
      // The JWT callback will check by email, find userId, and update token
      // Then session callback will use userId to find user
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      window.location.href = callbackUrl;
    } catch (error) {
      console.error("Error setting userId:", error);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Choose Your User ID
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              This will be your unique identifier and cannot be changed later
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                User ID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setError("");
                }}
                placeholder="e.g., johndoe123"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_-]{3,30}"
                disabled={isLoading}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                3-30 characters, letters, numbers, underscores, or hyphens only
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || userId.trim().length < 3}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting User ID...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SetUserId() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetUserIdContent />
    </Suspense>
  );
}
