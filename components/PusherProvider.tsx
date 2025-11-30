"use client";

import { createContext, useContext, ReactNode } from "react";
import PusherClient from "pusher-js";
import { usePusher } from "@/lib/hooks/usePusher";

interface PusherContextType {
  pusher: PusherClient | null;
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextType>({
  pusher: null,
  isConnected: false,
});

/**
 * PusherProvider - Provides Pusher client instance to all child components
 * 
 * This component initializes the Pusher client once at the app level
 * and makes it available via React Context to avoid creating multiple connections.
 */
export function PusherProvider({ children }: { children: ReactNode }) {
  const { pusher, isConnected } = usePusher();

  return (
    <PusherContext.Provider value={{ pusher, isConnected }}>
      {children}
    </PusherContext.Provider>
  );
}

/**
 * Hook to access Pusher client from context
 * 
 * @returns {PusherContextType} Object containing pusher client and connection state
 * 
 * @example
 * ```tsx
 * import { getGroupChannel, PUSHER_EVENTS } from '@/lib/pusher-constants';
 * 
 * const { pusher, isConnected } = usePusherContext();
 * 
 * useEffect(() => {
 *   if (!pusher || !isConnected) return;
 *   
 *   const channel = pusher.subscribe(getGroupChannel(groupId));
 *   channel.bind(PUSHER_EVENTS.NEW_MESSAGE, (data) => {
 *     console.log('New message:', data);
 *   });
 *   
 *   return () => {
 *     channel.unbind_all();
 *     channel.unsubscribe();
 *   };
 * }, [pusher, isConnected, groupId]);
 * ```
 */
export function usePusherContext() {
  const context = useContext(PusherContext);
  if (context === undefined) {
    throw new Error("usePusherContext must be used within a PusherProvider");
  }
  return context;
}

