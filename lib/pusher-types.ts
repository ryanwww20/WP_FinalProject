/**
 * Pusher Type Definitions
 * 
 * TypeScript interfaces for Pusher event payloads.
 * These ensure type safety between server and client.
 */

/**
 * User information included in messages
 */
export interface MessageUser {
  name: string;
  image?: string;
  userId: string;
}

/**
 * Message structure used throughout the application
 */
export interface Message {
  _id: string;
  userId: string;
  content: string;
  messageType: 'text' | 'system';
  createdAt: string;
  user?: MessageUser;
}

/**
 * Event payload for 'new-message' event
 * This is what gets published to Pusher and received by clients
 */
export interface NewMessageEvent extends Message {
  // Inherits all Message properties
  // The server publishes this exact shape
}

/**
 * Union type for all Pusher event payloads
 * Add new event types here as they're implemented
 */
export type PusherEventPayload = NewMessageEvent;
// Future events:
// | MemberJoinedEvent
// | MemberLeftEvent
// | MemberRoleChangedEvent

/**
 * Type-safe event handler function
 */
export type PusherEventHandler<T extends PusherEventPayload> = (data: T) => void;

