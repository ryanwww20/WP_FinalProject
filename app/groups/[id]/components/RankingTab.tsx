"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePusherContext } from "@/components/PusherProvider";
import { getFocusUpdatesChannel, PUSHER_EVENTS } from "@/lib/pusher-constants";
import type { FocusSessionCompletedEvent } from "@/lib/pusher-types";

interface RankingMember {
  userId: string;
  totalStudyTime: number; // in seconds (convert to minutes during rendering)
  rank: number;
  user: {
    name: string;
    image?: string;
    userId: string;
  };
}

interface RankingTabProps {
  groupId: string;
  isMember: boolean;
}

type RankingPeriod = "today" | "week" | "month" | "all-time";

export default function RankingTab({ groupId, isMember }: RankingTabProps) {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<RankingPeriod>("week");
  const [rankings, setRankings] = useState<RankingMember[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { pusher, isConnected } = usePusherContext();

  useEffect(() => {
    if (isMember) {
      fetchRankings();
      
      // Fallback polling - slower now since Pusher handles real-time updates
      // Auto-refresh rankings every 60 seconds (was 10s)
      const refreshInterval = setInterval(() => {
        console.log('[RankingTab] Fallback polling sync');
        fetchRankings();
      }, 60000); // 1 minute - fallback only
      
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [groupId, period, isMember]);
  
  // Pusher real-time updates
  useEffect(() => {
    if (!pusher || !isConnected || !isMember) return;
    
    console.log('[RankingTab] Subscribing to Pusher focus updates');
    const channelName = getFocusUpdatesChannel();
    const channel = pusher.subscribe(channelName);
    
    // Listen for focus session completed
    channel.bind(PUSHER_EVENTS.FOCUS_SESSION_COMPLETED, (data: FocusSessionCompletedEvent) => {
      console.log('[RankingTab] 📡 Pusher: Focus session completed', data.userId, data.studyTime, 'minutes');
      // Check if this user is in the current rankings
      const isInRankings = rankings.some(r => r.userId === data.userId);
      if (isInRankings) {
        console.log('[RankingTab] User is in rankings, refreshing immediately');
        fetchRankings();
      }
    });
    
    return () => {
      console.log('[RankingTab] Unsubscribing from Pusher');
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [pusher, isConnected, isMember, rankings]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/ranking?period=${period}`);
      
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || []);
        setUserRank(data.userRank);
      }
    } catch (error) {
      console.error("Error fetching rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      case "all-time": return "All Time";
    }
  };

  if (!isMember) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">Join this group to see rankings</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading rankings...</p>
      </div>
    );
  }

  const top3 = rankings.slice(0, 3);
  const restOfRankings = rankings.slice(3);
  const userInTop3 = userRank && userRank <= 3;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🏆 Rankings - {getPeriodLabel()}
          </h2>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["today", "week", "month", "all-time"] as RankingPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {p === "today" && "Today"}
              {p === "week" && "This Week"}
              {p === "month" && "This Month"}
              {p === "all-time" && "All Time"}
            </button>
          ))}
        </div>
      </div>

      {rankings.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No study time recorded for this period yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Start studying to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top 3 🎉
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 2nd Place */}
                {top3[1] && (
                  <div className="order-2 md:order-1">
                    <PodiumCard
                      member={top3[1]}
                      rank={2}
                      formatTime={formatTime}
                      isCurrentUser={top3[1].userId === session?.user?.userId}
                    />
                  </div>
                )}
                
                {/* 1st Place */}
                {top3[0] && (
                  <div className="order-1 md:order-2">
                    <PodiumCard
                      member={top3[0]}
                      rank={1}
                      formatTime={formatTime}
                      isCurrentUser={top3[0].userId === session?.user?.userId}
                    />
                  </div>
                )}
                
                {/* 3rd Place */}
                {top3[2] && (
                  <div className="order-3">
                    <PodiumCard
                      member={top3[2]}
                      rank={3}
                      formatTime={formatTime}
                      isCurrentUser={top3[2].userId === session?.user?.userId}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rest of Rankings */}
          {restOfRankings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                All Rankings
              </h3>
              <div className="space-y-2">
                {restOfRankings.map((member) => {
                  const isCurrentUser = member.userId === session?.user?.userId;
                  const maxTime = rankings[0]?.totalStudyTime || 1;
                  const percentage = (member.totalStudyTime / maxTime) * 100;

                  return (
                    <div
                      key={member.userId}
                      className={`bg-white dark:bg-gray-700 rounded-lg p-4 border-2 transition-all ${
                        isCurrentUser
                          ? "border-blue-500 dark:border-blue-400 shadow-md"
                          : "border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            isCurrentUser
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {member.rank}
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {member.user.image ? (
                            <img
                              src={member.user.image}
                              alt={member.user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {member.user.name[0]?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Name and Stats */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {member.user.name}
                            </p>
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                You
                              </span>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isCurrentUser
                                  ? "bg-blue-600"
                                  : "bg-gradient-to-r from-purple-500 to-blue-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">
                              {formatTime(member.totalStudyTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Rank Summary (if not in visible list) */}
          {!userInTop3 && userRank && userRank > 10 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Rank</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    #{userRank}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Keep going!</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatTime(rankings.find(r => r.userId === session?.user?.userId)?.totalStudyTime || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Podium Card Component
function PodiumCard({
  member,
  rank,
  formatTime,
  isCurrentUser,
}: {
  member: RankingMember;
  rank: number;
  formatTime: (minutes: number) => string;
  isCurrentUser: boolean;
}) {
  const getBorderColor = () => {
    if (isCurrentUser) return "border-blue-500 dark:border-blue-400";
    if (rank === 1) return "border-yellow-400 dark:border-yellow-500";
    if (rank === 2) return "border-gray-400 dark:border-gray-500";
    return "border-orange-400 dark:border-orange-500";
  };

  const getBgGradient = () => {
    if (rank === 1) return "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20";
    if (rank === 2) return "from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20";
    return "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20";
  };

  const getMedal = () => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    return "🥉";
  };

  return (
    <div
      className={`relative bg-gradient-to-br ${getBgGradient()} rounded-lg p-6 border-3 ${getBorderColor()} ${
        rank === 1 ? "md:scale-105 shadow-xl" : "shadow-lg"
      } transition-all hover:shadow-xl`}
    >
      {/* Medal */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="text-4xl">{getMedal()}</span>
      </div>

      {isCurrentUser && (
        <div className="absolute top-2 right-2">
          <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full">
            You
          </span>
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center mt-4 mb-4">
        {member.user.image ? (
          <img
            src={member.user.image}
            alt={member.user.name}
            className={`rounded-full object-cover border-4 border-white dark:border-gray-800 ${
              rank === 1 ? "w-24 h-24" : "w-20 h-20"
            }`}
          />
        ) : (
          <div
            className={`rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-white dark:border-gray-800 ${
              rank === 1 ? "w-24 h-24" : "w-20 h-20"
            }`}
          >
            <span className={`text-white font-bold ${rank === 1 ? "text-3xl" : "text-2xl"}`}>
              {member.user.name[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className={`text-center font-bold text-gray-900 dark:text-white mb-2 ${rank === 1 ? "text-xl" : "text-lg"}`}>
        {member.user.name}
      </h3>

      {/* Study Time */}
      <div className="text-center">
        <p className={`font-bold ${rank === 1 ? "text-3xl" : "text-2xl"} text-gray-900 dark:text-white`}>
          {formatTime(member.totalStudyTime)}
        </p>
      </div>

      {/* Rank Badge */}
      <div className="flex justify-center mt-4">
        <span
          className={`px-4 py-1 rounded-full font-semibold ${
            rank === 1
              ? "bg-yellow-500 text-yellow-900"
              : rank === 2
              ? "bg-gray-400 text-gray-900"
              : "bg-orange-500 text-orange-900"
          }`}
        >
          #{rank}
        </span>
      </div>
    </div>
  );
}

