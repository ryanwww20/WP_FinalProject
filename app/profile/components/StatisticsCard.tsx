"use client";

import { useState, useEffect } from "react";

// New structure (post-refactoring)
interface StudyStats {
  totalStudyTime: number;      // seconds (all-time)
  pomodoroCount: number;        // count
  todayStats: {
    date: string;               // 'YYYY-MM-DD'
    seconds: number;            // today's study time in seconds
    pomodoros: number;
  };
  weeklyStats: {
    weekStart: string;          // 'YYYY-MM-DD'
    totalSeconds: number;       // this week's total in seconds
    daily: {
      monday: number;
      tuesday: number;
      wednesday: number;
      thursday: number;
      friday: number;
      saturday: number;
      sunday: number;
    };
  };
  monthlyStats: {
    month: number;
    year: number;
    seconds: number;
    pomodoros: number;
  };
}

interface StatisticsCardProps {
  targetUserId?: string; // If provided, viewing another user's stats
  readOnly?: boolean; // If true, viewing mode (currently not affecting display)
}

export default function StatisticsCard({ targetUserId, readOnly = false }: StatisticsCardProps) {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const targetDailyMinutes = 480; // 8 hours

  useEffect(() => {
    async function loadStats() {
      try {
        const apiUrl = targetUserId ? `/api/profile/${targetUserId}` : "/api/profile";
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.user?.studyStats) {
            setStats(data.user.studyStats);
          } else if (data.user?.stats) {
            // Fallback for user profile endpoint that returns stats differently
            const userStats = data.user.stats;
            setStats({
              totalStudyTime: userStats.totalStudyTime || 0,
              pomodoroCount: userStats.pomodoroCount || 0,
              todayStats: {
                date: new Date().toISOString().split('T')[0],
                seconds: userStats.todayStudyTime || 0,
                pomodoros: 0,
              },
              weeklyStats: {
                weekStart: new Date().toISOString().split('T')[0],
                totalSeconds: userStats.weekStudyTime || 0,
                daily: {
                  monday: 0,
                  tuesday: 0,
                  wednesday: 0,
                  thursday: 0,
                  friday: 0,
                  saturday: 0,
                  sunday: 0,
                },
              },
              monthlyStats: {
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                seconds: 0,
                pomodoros: 0,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [targetUserId]);

  // Convert seconds to minutes for display
  const todayMinutes = stats?.todayStats?.seconds 
    ? Math.floor(stats.todayStats.seconds / 60) 
    : 0;
  const thisWeekMinutes = stats?.weeklyStats?.totalSeconds 
    ? Math.floor(stats.weeklyStats.totalSeconds / 60) 
    : 0;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const todayProgress = (todayMinutes / targetDailyMinutes) * 100;

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-5">
          Study Statistics
        </h2>
        <div className="text-center py-8 text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-5">
        Study Statistics
      </h2>

      {/* Today's Study Time */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Today's Study Time
          </span>
          <span className="text-base font-semibold text-foreground">
            {formatTime(todayMinutes)}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(todayProgress, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Goal: {formatTime(targetDailyMinutes)}</span>
          <span>{Math.round(todayProgress)}%</span>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="mb-5">
        <div className="space-y-1.5">
          {[
            { day: "Mon", minutes: Math.floor((stats?.weeklyStats?.daily?.monday || 0) / 60) },
            { day: "Tue", minutes: Math.floor((stats?.weeklyStats?.daily?.tuesday || 0) / 60) },
            { day: "Wed", minutes: Math.floor((stats?.weeklyStats?.daily?.wednesday || 0) / 60) },
            { day: "Thu", minutes: Math.floor((stats?.weeklyStats?.daily?.thursday || 0) / 60) },
            { day: "Fri", minutes: Math.floor((stats?.weeklyStats?.daily?.friday || 0) / 60) },
            { day: "Sat", minutes: Math.floor((stats?.weeklyStats?.daily?.saturday || 0) / 60) },
            { day: "Sun", minutes: Math.floor((stats?.weeklyStats?.daily?.sunday || 0) / 60) },
          ].map((item, index) => {
            const maxMinutes = 480; // 8 hours max
            const height = (item.minutes / maxMinutes) * 100;
            return (
              <div key={index} className="flex items-end gap-2">
                <span className="text-xs text-muted-foreground w-9">
                  {item.day}
                </span>
                <div className="flex-1 bg-muted rounded-t relative h-12 border border-border border-b-0">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-secondary rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  ></div>
                  {item.minutes > 0 && (
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-foreground">
                      {Math.floor(item.minutes / 60) > 0 
                        ? `${Math.floor(item.minutes / 60)}h` 
                        : `${item.minutes}m`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-5 border-t border-border">
        <div className="text-center">
          <div className="text-xl font-semibold text-primary">
            {Math.floor(thisWeekMinutes / 60) > 0 
              ? `${Math.floor(thisWeekMinutes / 60)}h` 
              : `${thisWeekMinutes}m`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            This Week
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-secondary">
            {Math.floor(thisWeekMinutes / 60 / 7) > 0 
              ? `${Math.floor(thisWeekMinutes / 60 / 7)}h` 
              : `${Math.floor(thisWeekMinutes / 7)}m`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Daily Avg
          </div>
        </div>
      </div>
    </div>
  );
}
