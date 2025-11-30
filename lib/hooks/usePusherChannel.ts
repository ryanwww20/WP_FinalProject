"use client";

import { useState, useEffect, useRef } from "react";
import { usePusherContext } from "@/components/PusherProvider";
import type { Channel } from "pusher-js";
import { getGroupChannel, PUSHER_EVENTS } from "@/lib/pusher-constants";
import type { Message, NewMessageEvent } from "@/lib/pusher-types";
import { addMessageIfNotExists } from "@/lib/message-utils";

interface UsePusherChannelOptions {
  /** Group ID to subscribe to */
  groupId: string;
  /** Whether the user is a member (only subscribe if true) */
  isMember: boolean;
  /** Initial messages to populate */
  initialMessages?: Message[];
  /** Callback when a new message is received */
  onNewMessage?: (message: Message) => void;
}

interface UsePusherChannelReturn {
  /** Current messages from the channel */
  messages: Message[];
  /** Error state, if any */
  error: string | null;
  /** Whether the channel is currently subscribed */
  isSubscribed: boolean;
}

/**
 * Hook to manage Pusher channel subscription for group messages
 * 
 * Handles:
 * - Channel subscription/unsubscription
 * - Event binding/unbinding
 * - Message state management
 * - Error handling
 * - Duplicate prevention
 * 
 * @example
 * ```tsx
 * const { messages, error, isSubscribed } = usePusherChannel({
 *   groupId: "123",
 *   isMember: true,
 *   initialMessages: fetchedMessages,
 * });
 * ```
 */
export function usePusherChannel({
  groupId,
  isMember,
  initialMessages = [],
  onNewMessage,
}: UsePusherChannelOptions): UsePusherChannelReturn {
  const { pusher, isConnected } = usePusherContext();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const subscribedChannelRef = useRef<string | null>(null);

  // Update messages when initialMessages change
  // This handles both initial load and optimistic updates
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages((prev) => {
        // If this is the initial load (prev is empty), use initialMessages directly
        if (prev.length === 0) {
          return initialMessages;
        }
        // For updates, merge initialMessages with any new Pusher messages
        // Use initialMessages as the base and add any messages from prev that aren't in initialMessages
        const messageMap = new Map(initialMessages.map((msg) => [msg._id, msg]));
        prev.forEach((msg) => {
          if (!messageMap.has(msg._id)) {
            messageMap.set(msg._id, msg);
          }
        });
        // Convert back to array and sort by createdAt descending (newest first)
        return Array.from(messageMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
  }, [initialMessages]);

  // Subscribe to Pusher channel for real-time updates
  useEffect(() => {
    if (!isMember) {
      // Clean up if we were subscribed
      if (channelRef.current && subscribedChannelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
        channelRef.current = null;
        subscribedChannelRef.current = null;
      }
      setError(null);
      return;
    }

    if (!pusher || !isConnected) {
      return;
    }

    const channelName = getGroupChannel(groupId);

    // If we're already subscribed to this channel, reuse the existing subscription
    if (subscribedChannelRef.current === channelName && channelRef.current?.subscribed) {
      return;
    }

    try {
      // Define message handler with proper typing
      const handleNewMessage = (newMessage: NewMessageEvent) => {
        // Transform the message to ensure it matches our Message interface
        const transformedMessage: Message = {
          _id: newMessage._id,
          userId: newMessage.userId,
          content: newMessage.content,
          messageType: newMessage.messageType,
          createdAt: newMessage.createdAt,
          user: newMessage.user
            ? {
                name: newMessage.user.name,
                image: newMessage.user.image,
                userId: newMessage.user.userId,
              }
            : undefined,
        };

        // Add message using deduplication helper
        setMessages((prev) => addMessageIfNotExists(prev, transformedMessage));

        // Call optional callback
        if (onNewMessage) {
          onNewMessage(transformedMessage);
        }
      };

      // Clean up previous subscription if switching channels
      if (channelRef.current && subscribedChannelRef.current !== channelName) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Subscribe to channel
      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;
      subscribedChannelRef.current = channelName;

      // Bind message handler
      let handlerBound = false;
      const bindMessageHandler = () => {
        if (handlerBound) return;
        channel.bind(PUSHER_EVENTS.NEW_MESSAGE, handleNewMessage);
        handlerBound = true;
      };

      // Bind immediately if already subscribed, otherwise wait for subscription
      if (channel.subscribed) {
        bindMessageHandler();
      }

      // Monitor subscription state changes
      channel.bind("pusher:subscription_succeeded", () => {
        if (!handlerBound) {
          bindMessageHandler();
        }
      });

      // Handle subscription errors
      channel.bind("pusher:subscription_error", (error: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.error("Pusher subscription error:", error);
        }
        setError("Failed to connect to real-time updates. Please refresh the page.");
      });

      // Cleanup on unmount or when dependencies change
      return () => {
        // Don't unsubscribe when component unmounts (e.g., switching tabs)
        // Keep the subscription alive so we don't lose events
        // Only cleanup if we're actually changing to a different channel
        if (subscribedChannelRef.current && subscribedChannelRef.current !== channelName) {
          const oldChannel = channelRef.current;
          if (oldChannel) {
            try {
              oldChannel.unbind_all();
              oldChannel.unsubscribe();
            } catch (err) {
              // Ignore cleanup errors
            }
          }
        }
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error subscribing to Pusher channel:", error);
      }
      setError("Failed to connect to real-time updates.");
    }
    // Only depend on groupId and isMember - don't re-run when pusher/isConnected changes
    // This prevents unnecessary unsubscribe/resubscribe cycles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, isMember]);

  const isSubscribed =
    subscribedChannelRef.current === getGroupChannel(groupId) &&
    channelRef.current?.subscribed === true;

  return {
    messages,
    error,
    isSubscribed,
  };
}

