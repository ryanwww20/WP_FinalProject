"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Group {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  visibility?: 'public' | 'private';
  memberCount: number;
  hasPassword?: boolean; // true if group has password (private), false if no password (public)
}

interface Membership {
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface GroupHeaderProps {
  group: Group;
  membership?: Membership;
  isMember: boolean;
  onUpdate: () => void;
}

export default function GroupHeader({
  group,
  membership,
  isMember,
  onUpdate,
}: GroupHeaderProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGroup = async () => {
    setIsJoining(true);
    try {
      // Public groups can be joined without password
      const response = await fetch(`/api/groups/${group._id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        // Successfully joined, refresh the page
        onUpdate();
        window.location.reload(); // Reload to update membership status
      } else {
        alert(data.error || "Failed to join group");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) {
      return;
    }

    setIsLeaving(true);
    try {
      const response = await fetch(`/api/groups/${group._id}/leave`, {
        method: "POST",
      });

      if (response.ok) {
        router.push("/groups");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to leave group");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-6">
      {/* Cover Image */}
      {group.coverImage ? (
        <div
          className="h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${group.coverImage})` }}
        />
      ) : (
        <div className="h-48 bg-gradient-to-r from-primary via-secondary to-primary" />
      )}

      {/* Header Content */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Group Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h1 className="text-3xl font-bold text-foreground">
                {group.name}
              </h1>
              {membership?.role && (
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    membership.role === "owner"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      : membership.role === "admin"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {membership.role}
                </span>
              )}
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  !group.hasPassword
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {!group.hasPassword ? "Public" : "Private"}
              </span>
            </div>

            {group.description && (
              <p className="text-muted-foreground mb-4">
                {group.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{group.memberCount} {group.memberCount !== 1 ? "members" : "member"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!isMember ? (
              // Not a member - show join button for public groups, password prompt for private
              !group.hasPassword ? (
                <button
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isJoining ? (
                    "Joining..."
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Join Group
                    </>
                  )}
                </button>
              ) : (
                // Private group - show message that password is required
                <div className="px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Password required to join
                </div>
              )
            ) : (
              // Is a member - show member actions
              <>
                {/* Leave Group (not owner) */}
                {membership?.role !== "owner" && (
                  <button
                    onClick={handleLeaveGroup}
                    disabled={isLeaving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLeaving ? (
                      "Leaving..."
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Leave
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

