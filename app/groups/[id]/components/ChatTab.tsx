"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePusherChannel } from "@/lib/hooks/usePusherChannel";
import type { Message } from "@/lib/pusher-types";
import { addMessageIfNotExists } from "@/lib/message-utils";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface ChatTabProps {
  groupId: string;
  isMember: boolean;
}

export default function ChatTab({ groupId, isMember }: ChatTabProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fetchedMessages, setFetchedMessages] = useState<Message[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const currentUserId = session?.user?.userId;

  // Fetch messages
  const fetchMessages = async () => {
    if (!isMember) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/messages?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setFetchedMessages(data.messages || []);
        setApiError(null);
      } else {
        throw new Error("Failed to fetch messages");
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching messages:", err);
      }
      setApiError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch - load message history
  useEffect(() => {
    if (isMember) {
      fetchMessages();
    }
  }, [groupId, isMember]);

  // Use Pusher channel hook for real-time updates
  const { messages: pusherMessages, error: pusherError } = usePusherChannel({
    groupId,
    isMember,
    initialMessages: fetchedMessages,
  });

  // Combine all errors
  const error = apiError || pusherError || sendError;

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!isMember || sending) return;

    setSending(true);
    setSendError(null);

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
        // Add the new message optimistically for instant feedback
        // Pusher will deliver the message via real-time event
        // If Pusher fails, the optimistic update still shows the message
        if (data.message) {
          setFetchedMessages((prev) => addMessageIfNotExists(prev, data.message));
        }
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error sending message:", err);
      }
      setSendError(err.message || "Failed to send message");
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
      <MessageList messages={pusherMessages} currentUserId={currentUserId || undefined} />

      {/* Message Input */}
      <MessageInput onSend={handleSendMessage} disabled={sending} />
    </div>
  );
}
