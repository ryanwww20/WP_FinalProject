"use client";

import { useStatus } from "./StatusContext";

export default function StatusSelector() {
  const { currentStatus, setCurrentStatus } = useStatus();

  const statusOptions = [
    { type: "studying" as const, label: "學習中", color: "bg-green-500" },
    { type: "busy" as const, label: "忙碌", color: "bg-orange-500" },
    { type: "offline" as const, label: "離線", color: "bg-gray-500" },
  ];

  return (
    <div className="bg-white dark:bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-300 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-700 mb-3">
        狀態
      </h3>
      <div className="space-y-2">
        {statusOptions.map((status) => (
          <button
            key={status.type}
            onClick={() => setCurrentStatus(status.type)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
              currentStatus === status.type
                ? "bg-gray-100 dark:bg-gray-200"
                : "hover:bg-gray-50 dark:hover:bg-gray-100"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${status.color} ${
                currentStatus === status.type ? "ring-2 ring-offset-2 ring-gray-400" : ""
              }`}
            ></div>
            <span className="text-sm text-gray-700 dark:text-gray-700">
              {status.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

