/**
 * Pusher Constants
 * 
 * Centralized constants for Pusher channel names and event names.
 * This ensures consistency between server and client code.
 */

/**
 * Validates that a channel name is safe and valid for Pusher
 * Pusher channel names must be alphanumeric, hyphens, or underscores
 * @param channelName Channel name to validate
 * @returns true if valid, false otherwise
 */
export function isValidChannelName(channelName: string): boolean {
  // Pusher channel name restrictions: alphanumeric, hyphens, underscores
  // Max length is typically 200 characters
  if (!channelName || channelName.length === 0 || channelName.length > 200) {
    return false;
  }
  // Must match pattern: alphanumeric, hyphens, underscores
  return /^[a-zA-Z0-9_-]+$/.test(channelName);
}

/**
 * Get the channel name for a group
 * Validates the groupId and returns a safe channel name
 * @param groupId Group ID (must be a valid MongoDB ObjectId string)
 * @returns Channel name (e.g., 'group-507f1f77bcf86cd799439011')
 * @throws Error if groupId is invalid or would produce an invalid channel name
 */
export function getGroupChannel(groupId: string): string {
  if (!groupId || typeof groupId !== 'string' || groupId.trim().length === 0) {
    throw new Error('Invalid groupId: must be a non-empty string');
  }

  // Sanitize groupId - remove any potentially dangerous characters
  const sanitized = groupId.trim();
  
  // Validate that groupId contains only safe characters (alphanumeric)
  // MongoDB ObjectIds are 24 hex characters, but we'll be more permissive
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    throw new Error(`Invalid groupId format: contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.`);
  }

  const channelName = `group-${sanitized}`;
  
  // Validate the final channel name
  if (!isValidChannelName(channelName)) {
    throw new Error(`Generated invalid channel name: ${channelName}`);
  }

  return channelName;
}

/**
 * Pusher event names
 * Use these constants instead of hardcoded strings to prevent typos
 * and enable easier refactoring.
 */
export const PUSHER_EVENTS = {
  /** New message event - fired when a new message is sent to a group */
  NEW_MESSAGE: 'new-message',
  // Future events can be added here:
  // MEMBER_JOINED: 'member-joined',
  // MEMBER_LEFT: 'member-left',
  // MEMBER_ROLE_CHANGED: 'member-role-changed',
} as const;

/**
 * Type for Pusher event names
 */
export type PusherEventName = typeof PUSHER_EVENTS[keyof typeof PUSHER_EVENTS];

