"use client";

import { useState } from "react";
import { useStatus } from "./StatusContext";

type StatusType = "studying" | "rest" | "break" | "offline";

interface Status {
  type: StatusType;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

const statuses: Status[] = [
  {
    type: "studying",
    label: "學習中",
    color: "text-teal-700 dark:text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-100",
    icon: "📚",
  },
  {
    type: "rest",
    label: "休息中",
    color: "text-indigo-700 dark:text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-100",
    icon: "😴",
  },
  {
    type: "break",
    label: "暫停",
    color: "text-amber-700 dark:text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-100",
    icon: "⏸️",
  },
  {
    type: "offline",
    label: "離線",
    color: "text-gray-600 dark:text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-100",
    icon: "💤",
  },
];

const getBorderColor = (statusType: StatusType, isActive: boolean) => {
  if (!isActive) {
    return "border-gray-200 dark:border-gray-300";
  }
  switch (statusType) {
    case "studying":
      return "border-teal-500 dark:border-teal-400";
    case "rest":
      return "border-indigo-500 dark:border-indigo-400";
    case "break":
      return "border-amber-500 dark:border-amber-400";
    case "offline":
      return "border-gray-400 dark:border-gray-500";
    default:
      return "border-gray-200 dark:border-gray-300";
  }
};

export default function StatusCard() {
  const { currentStatus, setCurrentStatus } = useStatus();
  const [startTime] = useState(new Date());

  const currentStatusData = statuses.find((s) => s.type === currentStatus)!;

  const getDuration = () => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小時 ${mins}分鐘` : `${mins}分鐘`;
  };

  return (
    <div className="bg-white dark:bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-300 p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-700 mb-4">
        當前狀態
      </h2>

      {/* Current Status Display */}
      <div
        className={`${currentStatusData.bgColor} rounded-lg p-4 mb-5 border border-gray-200 dark:border-gray-300 transition-all duration-300`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentStatusData.icon}</span>
            <div>
              <div
                className={`text-base font-semibold ${currentStatusData.color}`}
              >
                {currentStatusData.label}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-600 mt-0.5">
                已持續: {getDuration()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Buttons */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-600 mb-3">
          切換狀態：
        </p>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((status) => (
            <button
              key={status.type}
              onClick={() => setCurrentStatus(status.type)}
              className={`p-2.5 rounded-lg border transition-all duration-200 ${
                currentStatus === status.type
                  ? `${status.bgColor} ${getBorderColor(status.type, true)}`
                  : `${getBorderColor(status.type, false)} hover:border-gray-300 dark:hover:border-gray-400 bg-white dark:bg-gray-50`
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">{status.icon}</span>
                <span
                  className={`text-xs font-medium ${
                    currentStatus === status.type
                      ? status.color
                      : "text-gray-600 dark:text-gray-600"
                  }`}
                >
                  {status.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Status History (Today) */}
      <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-300">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-600 mb-3">
          今日狀態記錄
        </h3>
        <div className="space-y-2">
          {[
            { time: "09:00", status: "studying", label: "學習中" },
            { time: "12:00", status: "break", label: "暫停" },
            { time: "13:00", status: "rest", label: "休息中" },
            { time: "14:00", status: "studying", label: "學習中" },
          ].map((record, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-600"
            >
              <span className="font-mono">{record.time}</span>
              <span className="flex items-center gap-1">
                <span>
                  {statuses.find((s) => s.type === record.status)?.icon}
                </span>
                <span>{record.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
