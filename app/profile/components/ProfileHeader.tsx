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
      alert("名稱不能為空");
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
        alert(`更新名稱失敗: ${error.error}`);
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
          alert(`更新狀態失敗: ${error.error}`);
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
      alert("更新失敗，請稍後再試");
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
    <div className="bg-white dark:bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-300 overflow-hidden">
      {/* Pink Banner */}
      <div className="bg-pink-500 h-32"></div>

      <div className="px-6 pb-6 -mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-1">
            {/* Avatar */}
            <div className="relative">
              {((readOnly && profile?.image) || session?.user?.image || initialSession.user?.image) ? (
                <img
                  src={(readOnly && profile?.image) || session?.user?.image || initialSession.user?.image || ""}
                  alt={(readOnly && profile?.name) || session?.user?.name || initialSession.user?.name || "User"}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-50 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-50 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
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
                    className="text-2xl font-bold bg-transparent border-b-2 border-indigo-600 dark:border-indigo-500 focus:outline-none focus:border-indigo-700 dark:focus:border-indigo-600 text-gray-800 dark:text-gray-700"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-700">
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
                    className="text-sm font-medium px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="studying">學習中</option>
                    <option value="busy">忙碌</option>
                    <option value="offline">離線</option>
                  </select>
                ) : (
                  <div
                    className={`w-3 h-3 rounded-full ${statusConfig[(readOnly ? selectedStatus : currentStatus) || 'offline'].color}`}
                    title={
                      (readOnly ? selectedStatus : currentStatus) === "studying"
                        ? "學習中"
                        : (readOnly ? selectedStatus : currentStatus) === "busy"
                        ? "忙碌"
                        : "離線"
                    }
                  ></div>
                )}
              </div>

              {/* User ID and Join Date */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium">
                    {targetUserId || session?.user?.userId || initialSession.user?.userId || "N/A"}
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-500">•</span>
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
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? "儲存中..." : "儲存"}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-700 bg-gray-200 dark:bg-gray-300 hover:bg-gray-300 dark:hover:bg-gray-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  取消
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
