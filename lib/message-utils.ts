/**
 * Message Utility Functions
 * 
 * Helper functions for message manipulation and deduplication
 */

import type { Message } from './pusher-types';

/**
 * Add a message to the list if it doesn't already exist
 * Prevents duplicate messages from being added
 * 
 * @param messages Current list of messages
 * @param newMessage New message to add
 * @returns New array with the message added (if not duplicate)
 */
export function addMessageIfNotExists(
  messages: Message[],
  newMessage: Message
): Message[] {
  // Check if message already exists
  const exists = messages.some((msg) => msg._id === newMessage._id);
  if (exists) {
    return messages;
  }
  // Add new message to the beginning (messages are sorted newest first)
  return [newMessage, ...messages];
}

