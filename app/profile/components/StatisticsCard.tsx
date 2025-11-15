"use client";

import { useState, useEffect } from "react";

interface StudyStats {
  today: number;
  thisWeek: number;
  weekly: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
}

export default function StatisticsCard() {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const targetDailyMinutes = 480; // 8 hours

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.user?.studyStats) {
            setStats(data.user.studyStats);
          }
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const todayMinutes = stats?.today || 0;
  const thisWeekMinutes = stats?.thisWeek || 0;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小時 ${mins}分鐘` : `${mins}分鐘`;
  };

  const todayProgress = (todayMinutes / targetDailyMinutes) * 100;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-300 p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-700 mb-5">
          學習統計
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          載入中...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-300 p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-700 mb-5">
        學習統計
      </h2>

      {/* Today's Study Time */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-600">
            今日學習時數
          </span>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-700">
            {formatTime(todayMinutes)}
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(todayProgress, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
          <span>目標: {formatTime(targetDailyMinutes)}</span>
          <span>{Math.round(todayProgress)}%</span>
        </div>
      </div>

      {/* This Week's Study Time */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-600">
            本週學習時數
          </span>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-700">
            {formatTime(thisWeekMinutes)}
          </span>
        </div>
        {/* Weekly Chart */}
        <div className="space-y-1.5">
          {[
            { day: "一", minutes: stats?.weekly?.monday || 0 },
            { day: "二", minutes: stats?.weekly?.tuesday || 0 },
            { day: "三", minutes: stats?.weekly?.wednesday || 0 },
            { day: "四", minutes: stats?.weekly?.thursday || 0 },
            { day: "五", minutes: stats?.weekly?.friday || 0 },
            { day: "六", minutes: stats?.weekly?.saturday || 0 },
            { day: "日", minutes: stats?.weekly?.sunday || 0 },
          ].map((item, index) => {
            const maxMinutes = 480; // 8 hours max
            const height = (item.minutes / maxMinutes) * 100;
            return (
              <div key={index} className="flex items-end gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-600 w-5">
                  {item.day}
                </span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-200 rounded-t relative h-12 border border-gray-200 dark:border-gray-300 border-b-0">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  ></div>
                  {item.minutes > 0 && (
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700 dark:text-gray-700">
                      {Math.floor(item.minutes / 60)}h
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-200 dark:border-gray-300">
        <div className="text-center">
          <div className="text-xl font-semibold text-indigo-600 dark:text-indigo-500">
            {Math.floor(thisWeekMinutes / 60)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-600 mt-1">
            本週總時數
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-purple-600 dark:text-purple-500">
            {Math.floor(thisWeekMinutes / 60 / 5)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-600 mt-1">
            平均每日
          </div>
        </div>
      </div>
    </div>
  );
}
