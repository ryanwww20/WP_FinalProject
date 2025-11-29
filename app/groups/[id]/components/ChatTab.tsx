"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

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

interface ChatTabProps {
  groupId: string;
  isMember: boolean;
}

export default function ChatTab({ groupId, isMember }: ChatTabProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = session?.user?.userId;

  // Fetch messages
  const fetchMessages = async () => {
    if (!isMember) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/messages?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setError(null);
      } else {
        throw new Error("Failed to fetch messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isMember) {
      fetchMessages();
    }
  }, [groupId, isMember]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (isMember) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [groupId, isMember]);

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!isMember || sending) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          messageType: "text",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new message optimistically
        if (data.message) {
          setMessages((prev) => [data.message, ...prev]);
        }
        // Refresh messages to get the latest state
        await fetchMessages();
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!isMember) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">Join this group to participate in chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Messages List */}
      <MessageList messages={messages} currentUserId={currentUserId} />

      {/* Message Input */}
      <MessageInput onSend={handleSendMessage} disabled={sending} />
    </div>
  );
}

