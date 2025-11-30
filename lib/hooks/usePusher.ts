"use client";

import { useEffect, useState, useRef } from "react";
import PusherClient from "pusher-js";

// Singleton Pusher client instance
let pusherClientInstance: PusherClient | null = null;

/**
 * Get or create Pusher client instance (singleton pattern)
 * This ensures we only have one Pusher connection per app
 */
function getPusherClient(): PusherClient | null {
  // Return existing instance if already created
  if (pusherClientInstance) {
    return pusherClientInstance;
  }

  // Get environment variables (must have NEXT_PUBLIC_ prefix for client-side)
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  // Validate required environment variables
  if (!key || !cluster) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        "⚠️  Pusher client credentials not configured. Real-time features will be disabled.\n" +
        "Please set the following environment variables in .env.local:\n" +
        "  - NEXT_PUBLIC_PUSHER_KEY\n" +
        "  - NEXT_PUBLIC_PUSHER_CLUSTER\n" +
        "\n" +
        "After adding them, restart your dev server with: npm run dev"
      );
    }
    return null;
  }

  try {
    // Create Pusher client instance
    pusherClientInstance = new PusherClient(key, {
      cluster,
      forceTLS: true,
      enabledTransports: ["ws", "wss"],
    });

    return pusherClientInstance;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("❌ Error initializing Pusher client:", error);
    }
    return null;
  }
}

/**
 * Hook to get Pusher client instance
 * Returns the singleton Pusher client, or null if not configured
 */
export function usePusher() {
  const [pusher, setPusher] = useState<PusherClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;
    initializedRef.current = true;

    const client = getPusherClient();
    if (!client) {
      setPusher(null);
      return;
    }

    setPusher(client);

    // Simplified connection state monitoring
    // Use state_change event which covers all state transitions (connected, disconnected, etc.)
    const updateConnectionState = () => {
      setIsConnected(client.connection.state === "connected");
    };

    // Bind to connection state changes (covers all transitions)
    client.connection.bind("state_change", (states: { previous: string; current: string }) => {
      updateConnectionState();
    });

    // Bind to connection errors (only log in development)
    client.connection.bind("error", (err: any) => {
      if (process.env.NODE_ENV === 'development') {
        // Log all errors in development for debugging
        if (err?.type === 'PusherError' && err?.data?.code !== null && err?.data?.code !== undefined) {
          console.warn("⚠️  Pusher connection warning:", err);
        } else {
          console.error("❌ Pusher connection error:", err);
        }
      }
    });

    // Set initial connection state
    updateConnectionState();

    // Cleanup on unmount
    return () => {
      // Note: We don't disconnect here because it's a singleton
      // The connection will persist across component unmounts
    };
  }, []);

  return { pusher, isConnected };
}

/**
 * Cleanup function to disconnect Pusher client
 * Call this when you want to completely disconnect (e.g., on app shutdown)
 */
export function disconnectPusher() {
  if (pusherClientInstance) {
    pusherClientInstance.disconnect();
    pusherClientInstance = null;
  }
}
