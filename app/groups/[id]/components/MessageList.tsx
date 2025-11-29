"use client";

import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

interface Message {
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
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Reverse messages to show oldest first (API returns newest first)
  const sortedMessages = [...messages].reverse();

  if (sortedMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            No messages yet
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Be the first to send a message!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-1"
      style={{ maxHeight: "calc(100vh - 300px)" }}
    >
      {sortedMessages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          isOwnMessage={message.userId === currentUserId}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

