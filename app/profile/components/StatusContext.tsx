"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type StatusType = "studying" | "busy" | "offline";

interface StatusContextType {
  currentStatus: StatusType;
  setCurrentStatus: (status: StatusType) => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [currentStatus, setCurrentStatus] = useState<StatusType>("studying");

  return (
    <StatusContext.Provider value={{ currentStatus, setCurrentStatus }}>
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
