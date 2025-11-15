"use client";

import { Session } from "next-auth";
import { useState } from "react";
import { useStatus } from "./StatusContext";

interface ProfileHeaderProps {
  session: Session;
}

const statusConfig = {
  studying: { color: "bg-green-500" },
  busy: { color: "bg-orange-500" },
  offline: { color: "bg-gray-500" },
};

export default function ProfileHeader({ session }: ProfileHeaderProps) {
  const { currentStatus } = useStatus();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session.user?.name || "");

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const formatJoinDate = () => {
    // Use a default date or get from session if available
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
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-50 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-50 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 pt-20 sm:pt-0 pb-2">
              {/* Username and Status */}
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b-2 border-indigo-600 dark:border-indigo-500 focus:outline-none focus:border-indigo-700 dark:focus:border-indigo-600 text-gray-800 dark:text-gray-700"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-700">
                    {session.user?.name || "User"}
                  </h1>
                )}

                {/* Status Dot */}
                <div
                  className={`w-3 h-3 rounded-full ${statusInfo.color}`}
                  title={
                    currentStatus === "studying"
                      ? "學習中"
                      : currentStatus === "busy"
                      ? "忙碌"
                      : "離線"
                  }
                ></div>
              </div>

              {/* User ID and Join Date */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium">
                    {session.user?.userId || "N/A"}
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-500">•</span>
                <span>{formatJoinDate()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-20 sm:pt-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
