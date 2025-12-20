"use client";

import { Session } from "next-auth";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useStatus } from "./StatusContext";

interface ProfileHeaderProps {
  session: Session;
  targetUserId?: string; // If provided, viewing another user's profile
  readOnly?: boolean; // If true, disable editing
}

interface UserProfile {
  userId?: string;
  name: string;
  image?: string;
  createdAt: string;
}

const statusConfig = {
  studying: { color: "bg-green-500" },
  busy: { color: "bg-orange-500" },
  offline: { color: "bg-gray-500" },
};

export default function ProfileHeader({ session: initialSession, targetUserId, readOnly = false }: ProfileHeaderProps) {
  const { data: session, update: updateSession } = useSession();
  const { currentStatus, setCurrentStatus } = useStatus();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || initialSession.user?.name || "");
  const [selectedStatus, setSelectedStatus] = useState<"studying" | "busy" | "offline">(currentStatus);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load profile data from API
  useEffect(() => {
    async function loadProfile() {
      try {
        const apiUrl = targetUserId ? `/api/profile/${targetUserId}` : "/api/profile";
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const userName = data.user.name || session?.user?.name || initialSession.user?.name || "";
            setName(userName);
            setProfile({
              userId: data.user.userId,
              name: data.user.name,
              image: data.user.image,
              createdAt: data.user.createdAt,
            });
            if (targetUserId) {
              // For other users, set their status or default to 'offline'
              setSelectedStatus(data.user.status || 'offline');
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    }
    loadProfile();
  }, [session?.user?.name, initialSession.user?.name, targetUserId]);

  // Update selectedStatus when currentStatus changes
  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const handleSave = async () => {
    if (name.trim() === "") {
      alert("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      // Update name
      const nameResponse = await fetch("/api/profile/name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!nameResponse.ok) {
        const error = await nameResponse.json();
        alert(`Failed to update name: ${error.error}`);
        setIsSaving(false);
        return;
      }

      const nameData = await nameResponse.json();
      setName(nameData.name);
      setProfile((prev) => (prev ? { ...prev, name: nameData.name } : null));

      // Update status if changed
      if (selectedStatus !== currentStatus) {
        const statusResponse = await fetch("/api/profile/status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: selectedStatus }),
        });

        if (!statusResponse.ok) {
          const error = await statusResponse.json();
          alert(`Failed to update status: ${error.error}`);
        } else {
          setCurrentStatus(selectedStatus);
        }
      }

      // Update NextAuth session to reflect the new name
      // This will update Navbar and Homepage immediately
      await updateSession();

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Update failed, please try again later");
    } finally {
      setIsSaving(false);
    }
  };

  const formatJoinDate = () => {
    if (!profile?.createdAt) {
      const date = new Date();
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return `Joined ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }

    const date = new Date(profile.createdAt);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `Joined ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const statusInfo = statusConfig[currentStatus];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-r from-primary via-secondary to-primary h-32"></div>

      <div className="px-6 pb-6 -mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-1">
            {/* Avatar */}
            <div className="relative">
              {((readOnly && profile?.image) || session?.user?.image || initialSession.user?.image) ? (
                <img
                  src={(readOnly && profile?.image) || session?.user?.image || initialSession.user?.image || ""}
                  alt={(readOnly && profile?.name) || session?.user?.name || initialSession.user?.name || "User"}
                  className="w-32 h-32 rounded-full border-4 border-card shadow-xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-card shadow-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary-foreground">
                    {((readOnly && profile?.name) || session?.user?.name || initialSession.user?.name || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 pt-20 sm:pt-0 pb-2">
              {/* Username and Status */}
              <div className="flex items-center gap-3 mb-2">
                {isEditing && !readOnly ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none focus:border-primary/80 text-foreground"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-foreground">
                    {name || session?.user?.name || initialSession.user?.name || "User"}
                  </h1>
                )}

                {/* Status Dot */}
                {isEditing && !readOnly ? (
                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(
                        e.target.value as "studying" | "busy" | "offline"
                      )
                    }
                    className="text-sm font-medium px-3 py-1 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="studying">Studying</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                ) : (
                  <div
                    className={`w-3 h-3 rounded-full ${statusConfig[(readOnly ? selectedStatus : currentStatus) || 'offline'].color}`}
                    title={
                      (readOnly ? selectedStatus : currentStatus) === "studying"
                        ? "Studying"
                        : (readOnly ? selectedStatus : currentStatus) === "busy"
                        ? "Busy"
                        : "Offline"
                    }
                  ></div>
                )}
              </div>

              {/* User ID and Join Date */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium">
                    {targetUserId || session?.user?.userId || initialSession.user?.userId || "N/A"}
                  </span>
                </div>
                <span>•</span>
                <span>{formatJoinDate()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!readOnly && (
            <div className="flex items-center gap-2 pt-20 sm:pt-0">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                >
                  Edit Profile
                </button>
              )}
              {isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setName(profile?.name || session?.user?.name || initialSession.user?.name || "");
                    setSelectedStatus(currentStatus);
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
