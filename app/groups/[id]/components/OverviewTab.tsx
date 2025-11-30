"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface Group {
  _id: string;
  name: string;
  memberCount: number;
}

interface Membership {
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface OverviewTabProps {
  groupId: string;
  group: Group;
  membership?: Membership;
  isMember: boolean;
}

interface GroupMessage {
  _id: string;
  userId: string;
  content: string;
  messageType: "text" | "system";
  createdAt: string;
  user?: {
    name: string;
    image?: string;
  };
}

interface TopMember {
  userId: string;
  totalStudyTime: number;
  pomodoroCount: number;
  user?: {
    name: string;
    image?: string;
  };
}

export default function OverviewTab({
  groupId,
  group,
  membership,
  isMember,
}: OverviewTabProps) {
  const [todayStudyTime, setTodayStudyTime] = useState(0);
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [recentMessages, setRecentMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMember) {
      fetchOverviewData();
    }
  }, [groupId, isMember]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent messages
      const messagesResponse = await fetch(`/api/groups/${groupId}/messages?limit=5`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setRecentMessages(messagesData.messages || []);
      }

      // Fetch ranking data for today (to get top members and total study time)
      const rankingResponse = await fetch(`/api/groups/${groupId}/ranking?period=today`);
      if (rankingResponse.ok) {
        const rankingData = await rankingResponse.json();
        if (rankingData.rankings) {
          setTopMembers(rankingData.rankings.slice(0, 3));
          // Calculate total study time
          const total = rankingData.rankings.reduce(
            (sum: number, member: TopMember) => sum + (member.totalStudyTime || 0),
            0
          );
          setTodayStudyTime(total);
        }
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!isMember) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">Join this group to see overview</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Loading overview...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Study Time */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Today's Study Time</h3>
            <svg
              className="w-8 h-8 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold">{formatTime(todayStudyTime)}</p>
          <p className="text-sm opacity-90 mt-1">Total for all members</p>
        </div>

        {/* Member Count */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Members</h3>
            <svg
              className="w-8 h-8 opacity-80"
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
          </div>
          <p className="text-3xl font-bold">{group.memberCount}</p>
          <p className="text-sm opacity-90 mt-1">Active members</p>
        </div>
      </div>

      {/* Top 3 Members */}
      {topMembers.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top 3 Today 🏆
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMembers.map((member, index) => (
              <div
                key={member.userId}
                className={`bg-white dark:bg-gray-700 rounded-lg p-4 border-2 ${
                  index === 0
                    ? "border-yellow-400 dark:border-yellow-500"
                    : index === 1
                    ? "border-gray-300 dark:border-gray-600"
                    : index === 2
                    ? "border-orange-300 dark:border-orange-600"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    {member.user?.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name || "User"}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 font-semibold">
                          {member.user?.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    {index === 0 && (
                      <span className="absolute -top-1 -right-1 text-lg">🥇</span>
                    )}
                    {index === 1 && (
                      <span className="absolute -top-1 -right-1 text-lg">🥈</span>
                    )}
                    {index === 2 && (
                      <span className="absolute -top-1 -right-1 text-lg">🥉</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {member.user?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(member.totalStudyTime || 0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        {recentMessages.length > 0 ? (
          <div className="space-y-3">
            {recentMessages.map((message) => (
              <div
                key={message._id}
                className={`bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 ${
                  message.messageType === "system"
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.user?.image ? (
                    <img
                      src={message.user.image}
                      alt={message.user.name || "User"}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
                        {message.user?.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {message.user?.name || "Unknown"}
                      </span>
                      {message.messageType === "system" && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                          System
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(message.createdAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p>No recent activity</p>
          </div>
        )}
      </div>

      {/* Upcoming Events Placeholder */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Events
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <p className="text-sm">Events feature coming soon</p>
          <p className="text-xs mt-1">Will be integrated with calendar in Phase 7</p>
        </div>
      </div>
    </div>
  );
}

