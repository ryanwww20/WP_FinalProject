"use client";

import { useStatus } from "./StatusContext";

export default function StatusSelector() {
  const { currentStatus, setCurrentStatus } = useStatus();

  const statusOptions = [
    { type: "studying" as const, label: "Studying", color: "bg-green-500" },
    { type: "busy" as const, label: "Busy", color: "bg-orange-500" },
    { type: "offline" as const, label: "Offline", color: "bg-gray-500" },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Status
      </h3>
      <div className="space-y-2">
        {statusOptions.map((status) => (
          <button
            key={status.type}
            onClick={() => setCurrentStatus(status.type)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
              currentStatus === status.type
                ? "bg-muted"
                : "hover:bg-muted/50"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${status.color} ${
                currentStatus === status.type ? "ring-2 ring-offset-2 ring-primary/30" : ""
              }`}
            ></div>
            <span className="text-sm text-foreground">
              {status.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

