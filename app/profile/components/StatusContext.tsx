"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type StatusType = "studying" | "busy" | "offline";

interface StatusContextType {
  currentStatus: StatusType;
  setCurrentStatus: (status: StatusType) => void;
  isLoading: boolean;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [currentStatus, setCurrentStatus] = useState<StatusType>("offline");
  const [isLoading, setIsLoading] = useState(true);

  // Load initial status from API
  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.user?.status?.current) {
            setCurrentStatus(data.user.status.current);
          }
        }
      } catch (error) {
        console.error("Error loading status:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStatus();
  }, []);

  // Update status in database when it changes
  const updateStatus = async (status: StatusType) => {
    setCurrentStatus(status);
    try {
      const response = await fetch("/api/profile/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error("Error updating status:", error);
        // Revert on error
        const profileResponse = await fetch("/api/profile");
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          if (data.user?.status?.current) {
            setCurrentStatus(data.user.status.current);
          }
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <StatusContext.Provider
      value={{ currentStatus, setCurrentStatus: updateStatus, isLoading }}
    >
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error("useStatus must be used within a StatusProvider");
  }
  return context;
}
