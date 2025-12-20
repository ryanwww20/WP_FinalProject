"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePusherContext } from "@/components/PusherProvider";
import { getFocusUpdatesChannel, PUSHER_EVENTS } from "@/lib/pusher-constants";
import type { FocusSessionStartedEvent, FocusSessionCompletedEvent } from "@/lib/pusher-types";

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
  totalStudyTime: number; // in seconds
  pomodoroCount: number;
  user?: {
    name: string;
    image?: string;
  };
}

interface MemberWithStats {
  userId: string;
  totalStudyTime: number; // in seconds
  pomodoroCount: number;
  user?: {
    name: string;
    image?: string;
  };
}

interface FocusingMember {
  userId: string;
  name: string;
  image?: string;
  focusSession: {
    startedAt?: string;
    targetDuration?: number;
    sessionType?: string;
    elapsedMinutes: number;
  };
}

export default function OverviewTab({
  groupId,
  group,
  membership,
  isMember,
}: OverviewTabProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [allMembers, setAllMembers] = useState<MemberWithStats[]>([]);
  const [recentMessages, setRecentMessages] = useState<GroupMessage[]>([]);
  const [focusingMembers, setFocusingMembers] = useState<FocusingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { pusher, isConnected } = usePusherContext();

  // Update current time every second for live elapsed time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (isMember) {
      fetchOverviewData();
      
      // Fallback polling - slower now since Pusher handles real-time updates
      // Poll focus status every 30 seconds (was 5s)
      const focusInterval = setInterval(() => {
        fetch(`/api/groups/${groupId}/focus-status`)
          .then(res => res.json())
          .then(data => {
            if (data.focusingMembers) {
              setFocusingMembers(data.focusingMembers);
            }
          })
          .catch(err => console.error('Error polling focus status:', err));
      }, 30000); // 30 seconds - fallback only

      // Poll rankings every 60 seconds (was 10s) - fallback for data consistency
      const rankingInterval = setInterval(() => {
        console.log('[OverviewTab] Fallback polling sync');
        fetch(`/api/groups/${groupId}/ranking?period=today`)
          .then(res => res.json())
          .then(data => {
            if (data.rankings) {
              setAllMembers(data.rankings);
              setTopMembers(data.rankings.slice(0, 3));
            }
          })
          .catch(err => console.error('Error polling rankings:', err));
      }, 60000); // 1 minute - fallback only

      return () => {
        clearInterval(focusInterval);
        clearInterval(rankingInterval);
      };
    }
  }, [groupId, isMember]);
  
  // Pusher real-time updates
  useEffect(() => {
    if (!pusher || !isConnected || !isMember) return;
    
    console.log('[OverviewTab] Subscribing to Pusher focus updates');
    const channelName = getFocusUpdatesChannel();
    const channel = pusher.subscribe(channelName);
    
    // Helper to refresh rankings
    const refreshRankings = () => {
      fetch(`/api/groups/${groupId}/ranking?period=today`)
        .then(res => res.json())
        .then(data => {
          if (data.rankings) {
            setAllMembers(data.rankings);
            setTopMembers(data.rankings.slice(0, 3));
          }
        })
        .catch(err => console.error('Error refreshing rankings:', err));
    };
    
    // Helper to refresh focus status
    const refreshFocusStatus = () => {
      fetch(`/api/groups/${groupId}/focus-status`)
        .then(res => res.json())
        .then(data => {
          if (data.focusingMembers) {
            setFocusingMembers(data.focusingMembers);
          }
        })
        .catch(err => console.error('Error refreshing focus status:', err));
    };
    
    // Listen for focus session started
    channel.bind(PUSHER_EVENTS.FOCUS_SESSION_STARTED, (data: FocusSessionStartedEvent) => {
      console.log('[OverviewTab] 📡 Pusher: Focus session started', data.userId);
      refreshFocusStatus(); // Update who's currently studying
    });
    
    // Listen for focus session completed
    channel.bind(PUSHER_EVENTS.FOCUS_SESSION_COMPLETED, (data: FocusSessionCompletedEvent) => {
      console.log('[OverviewTab] 📡 Pusher: Focus session completed', data.userId, data.studyTime, 'minutes');
      // Check if this user is in our group
      const isInGroup = allMembers.some(m => m.userId === data.userId);
      if (isInGroup) {
        console.log('[OverviewTab] User is in group, refreshing stats immediately');
        refreshRankings(); // Update rankings with new stats
      }
      refreshFocusStatus(); // Update focus status
    });
    
    return () => {
      console.log('[OverviewTab] Unsubscribing from Pusher');
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [pusher, isConnected, isMember, groupId, allMembers]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent messages, rankings, and focus status in parallel
      const [messagesResponse, rankingResponse, focusResponse] = await Promise.all([
        fetch(`/api/groups/${groupId}/messages?limit=5`),
        fetch(`/api/groups/${groupId}/ranking?period=today`),
        fetch(`/api/groups/${groupId}/focus-status`),
      ]);

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setRecentMessages(messagesData.messages || []);
      }

      if (rankingResponse.ok) {
        const rankingData = await rankingResponse.json();
        if (rankingData.rankings) {
          setAllMembers(rankingData.rankings);
          setTopMembers(rankingData.rankings.slice(0, 3));
        }
      }

      if (focusResponse.ok) {
        const focusData = await focusResponse.json();
        console.log('Initial focus status:', focusData); // Debug log
        setFocusingMembers(focusData.focusingMembers || []);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimeHMS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUserCardClick = (userId: string) => {
    // If clicking own card, navigate to /profile directly
    if (session?.user?.userId === userId) {
      router.push('/profile');
    } else {
      // Otherwise, navigate to the other user's profile
      router.push(`/profile/${userId}`);
    }
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
      {/* Top 3 Members */}
      {topMembers.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top 3 Today 🏆
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMembers.map((member, index) => {
              const isFocusing = focusingMembers.some(fm => fm.userId === member.userId);
              
              return (
                <div
                  key={member.userId}
                  onClick={() => handleUserCardClick(member.userId)}
                  className={`bg-white dark:bg-gray-700 rounded-lg p-4 border-2 cursor-pointer hover:shadow-lg transition-shadow ${
                    index === 0
                      ? "border-yellow-400 dark:border-yellow-500 hover:border-yellow-500"
                      : index === 1
                      ? "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                      : index === 2
                      ? "border-orange-300 dark:border-orange-600 hover:border-orange-400"
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {member.user?.name || "Unknown"}
                        </p>
                        {isFocusing && (
                          <span className="text-sm">🔥</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(member.totalStudyTime || 0)}
                      </p>
                      {isFocusing && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                          Studying now
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Member Status Section - Shows all members with their today's focus time */}
      {allMembers.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>Currently Studying</span>
            <span className="text-orange-500 font-bold">{focusingMembers.length} {focusingMembers.length === 1 ? 'person' : 'people'}</span>
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {allMembers.map((member) => {
              // Check if member is currently studying
              const focusingData = focusingMembers.find(fm => fm.userId === member.userId);
              const isStudying = !!focusingData;
              
              // Calculate display time
              let displayTime = '';
              if (isStudying && focusingData?.focusSession.startedAt) {
                // Current session elapsed time
                const elapsedMs = currentTime - new Date(focusingData.focusSession.startedAt).getTime();
                const currentSessionSeconds = Math.floor(elapsedMs / 1000);
                
                // Previous accumulated time (today's total before this session)
                const previousAccumulatedSeconds = member.totalStudyTime || 0;
                
                // Show accumulated + current session (counts up from previous total)
                const totalSeconds = previousAccumulatedSeconds + currentSessionSeconds;
                displayTime = formatTimeHMS(totalSeconds);
              } else {
                // Show today's total focus time (already in seconds)
                displayTime = formatTimeHMS(member.totalStudyTime || 0);
              }

              return (
                <div
                  key={member.userId}
                  onClick={() => handleUserCardClick(member.userId)}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-3 flex flex-col items-center text-center transition-all border cursor-pointer hover:shadow-md ${
                    isStudying 
                      ? 'border-orange-500 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                  }`}
                >
                  {/* Avatar or Icon */}
                  <div className="relative mb-2">
                    {member.user?.image ? (
                      <div className={`relative ${isStudying ? 'ring-2 ring-orange-500' : ''} rounded-full`}>
                        <img
                          src={member.user.image}
                          alt={member.user.name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {isStudying && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                        isStudying 
                          ? 'bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-800' 
                          : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
                      }`}>
                        {member.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p className={`text-xs font-medium mb-1 truncate w-full ${
                    isStudying ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {member.user?.name || 'Unknown'}
                  </p>

                  {/* Time Display */}
                  <p className={`text-sm font-bold font-mono ${
                    isStudying ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {displayTime}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        {recentMessages.filter(msg => msg.messageType === 'system').length > 0 ? (
          <div className="space-y-3">
            {recentMessages.filter(msg => msg.messageType === 'system').map((message) => (
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

    </div>
  );
}

