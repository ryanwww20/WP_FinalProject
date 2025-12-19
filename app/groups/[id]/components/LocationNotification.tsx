"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { LocationUpdatedEvent } from "@/lib/pusher-types";

interface LocationNotificationProps {
  notification: LocationUpdatedEvent;
  onClose: () => void;
  groupId: string;
}

export default function LocationNotification({
  notification,
  onClose,
  groupId,
}: LocationNotificationProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 自動隱藏通知（5秒後）
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待動畫完成後移除
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    // 跳轉到地圖頁面並關閉通知
    onClose();
    // 使用 setTimeout 確保通知關閉動畫完成後再跳轉
    setTimeout(() => {
      router.push(`/groups/${groupId}?tab=map`);
    }, 100);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          {/* 使用者頭像 */}
          {notification.userImage ? (
            <img
              src={notification.userImage}
              alt={notification.userName}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {notification.userName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* 通知內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {notification.userName}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {notification.userName} 更新了他的位置，快來看看吧！
            </p>
            {notification.location.address && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                📍 {notification.location.address}
              </p>
            )}
          </div>

          {/* 地圖圖標 */}
          <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

