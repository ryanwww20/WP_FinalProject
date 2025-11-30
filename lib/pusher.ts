import Pusher from 'pusher';
import { getGroupChannel } from './pusher-constants';
import type { PusherEventPayload } from './pusher-types';

// Re-export for backward compatibility
export { getGroupChannel };

// Initialize Pusher server instance (singleton pattern)
let pusherInstance: Pusher | null = null;

/**
 * Get or create Pusher server instance
 * This is a singleton to avoid creating multiple instances
 */
export function getPusherServer(): Pusher | null {
  // Return existing instance if already created
  if (pusherInstance) {
    return pusherInstance;
  }

  // Get environment variables
  // Support both NEXT_PUBLIC_ and non-prefixed versions for flexibility
  const appId = process.env.NEXT_PUBLIC_PUSHER_APP_ID || process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER;

  // Validate required environment variables
  if (!appId || !key || !secret || !cluster) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️  [Server] Pusher credentials not configured. Real-time features will be disabled.\n' +
        'Please set the following environment variables in .env.local:\n' +
        '  - NEXT_PUBLIC_PUSHER_APP_ID (or PUSHER_APP_ID)\n' +
        '  - NEXT_PUBLIC_PUSHER_KEY (or PUSHER_KEY)\n' +
        '  - PUSHER_SECRET (REQUIRED - no NEXT_PUBLIC_ prefix!)\n' +
        '  - NEXT_PUBLIC_PUSHER_CLUSTER (or PUSHER_CLUSTER)\n' +
        '\n' +
        'After adding them, restart your dev server: npm run dev'
      );
    }
    return null;
  }

  try {
    // Create Pusher instance
    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true, // Always use TLS for security
    });

    return pusherInstance;
  } catch (error) {
    console.error('❌ Error initializing Pusher:', error);
    return null;
  }
}

/**
 * Publish an event to a Pusher channel
 * @param channel Channel name (e.g., 'group-123')
 * @param event Event name (e.g., 'new-message')
 * @param data Event data payload (type-safe)
 * @returns Promise<boolean> - true if published successfully, false otherwise
 */
export async function publishToChannel<T extends PusherEventPayload = PusherEventPayload>(
  channel: string,
  event: string,
  data: T
): Promise<boolean> {
  const pusher = getPusherServer();
  
  if (!pusher) {
    // Pusher not configured, fail silently (don't break the app)
    return false;
  }

  try {
    await pusher.trigger(channel, event, data);
    return true;
  } catch (error) {
    // Log error but don't throw (don't break message creation if Pusher fails)
    console.error(`❌ Error publishing to Pusher channel ${channel}:`, error);
    return false;
  }
}

