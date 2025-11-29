"use client";

import { format } from "date-fns";

interface MessageItemProps {
  message: {
    _id: string;
    userId: string;
    content: string;
    messageType: "text" | "system";
    createdAt: string;
    user?: {
      name: string;
      image?: string;
      userId: string;
    };
  };
  isOwnMessage: boolean;
}

export default function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  const isSystem = message.messageType === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 max-w-md">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            {message.content}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 text-center mt-1">
            {format(new Date(message.createdAt), "MMM d, HH:mm")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 mb-4 ${
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.user?.image ? (
          <img
            src={message.user.image}
            alt={message.user.name || "User"}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
              {message.user?.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex flex-col max-w-[70%] ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        {/* User Name and Timestamp */}
        <div
          className={`flex items-center gap-2 mb-1 ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message.user?.name || "Unknown"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}

