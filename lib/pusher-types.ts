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
 * Focus session statistics
 */
export interface FocusSessionStats {
  totalStudyTime: number;      // Total seconds (all-time)
  todayStats: {
    date: string;               // 'YYYY-MM-DD'
    seconds: number;
  };
  weeklyStats: {
    weekStart: string;          // 'YYYY-MM-DD'
    totalSeconds: number;
  };
  monthlyStats: {
    month: number;              // 1-12
    year: number;
    seconds: number;
  };
}

/**
 * Event payload for 'focus-session-started' event
 */
export interface FocusSessionStartedEvent {
  userId: string;
  startedAt: string;            // ISO timestamp
  targetDuration?: number;      // Minutes
  timestamp: number;            // Unix timestamp
}

/**
 * Event payload for 'focus-session-completed' event
 */
export interface FocusSessionCompletedEvent {
  userId: string;
  studyTime: number;            // Minutes
  studyTimeSeconds: number;     // Seconds
  stats: FocusSessionStats;     // Updated stats after session
  timestamp: number;            // Unix timestamp
}

/**
 * Event payload for 'focus-session-stats-updated' event
 * (For any other stats updates)
 */
export interface FocusSessionStatsUpdatedEvent {
  userId: string;
  stats: FocusSessionStats;
  timestamp: number;
}

/**
 * Union type for all Pusher event payloads
 * Add new event types here as they're implemented
 */
export type PusherEventPayload = 
  | NewMessageEvent
  | FocusSessionStartedEvent
  | FocusSessionCompletedEvent
  | FocusSessionStatsUpdatedEvent;
// Future events:
// | MemberJoinedEvent
// | MemberLeftEvent
// | MemberRoleChangedEvent

/**
 * Type-safe event handler function
 */
export type PusherEventHandler<T extends PusherEventPayload> = (data: T) => void;

