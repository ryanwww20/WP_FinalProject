"use client";

import { useEffect } from "react";
import OverviewTab from "./OverviewTab";
// Placeholder components for other tabs (will be implemented in later phases)
// import ChatTab from "./ChatTab";
// import RankingTab from "./RankingTab";
// import MapTab from "./MapTab";
// import SettingsTab from "./SettingsTab";

interface Group {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  visibility: "public" | "private";
  memberCount: number;
  inviteCode: string;
}

interface Membership {
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface GroupTabsProps {
  activeTab: "overview" | "chat" | "ranking" | "map" | "settings";
  onTabChange: (tab: "overview" | "chat" | "ranking" | "map" | "settings") => void;
  groupId: string;
  group: Group;
  membership?: Membership;
  isMember: boolean;
}

export default function GroupTabs({
  activeTab,
  onTabChange,
  groupId,
  group,
  membership,
  isMember,
}: GroupTabsProps) {
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      onTabChange(event.detail);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, [onTabChange]);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: "📊" },
    { id: "chat" as const, label: "Chat", icon: "💬" },
    { id: "ranking" as const, label: "Ranking", icon: "🏆" },
    { id: "map" as const, label: "Map", icon: "📍" },
  ];

  // Only show Settings tab for owners/admins
  if (membership?.role === "owner" || membership?.role === "admin") {
    tabs.push({ id: "settings" as const, label: "Settings", icon: "⚙️" });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Tab Buttons */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <OverviewTab groupId={groupId} group={group} membership={membership} isMember={isMember} />
        )}
        {activeTab === "chat" && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Chat feature coming soon</p>
            <p className="text-sm">This will be implemented in Phase 4</p>
          </div>
        )}
        {activeTab === "ranking" && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Ranking feature coming soon</p>
            <p className="text-sm">This will be implemented in Phase 5</p>
          </div>
        )}
        {activeTab === "map" && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Map feature coming soon</p>
            <p className="text-sm">This will be implemented in Phase 6</p>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Settings feature coming soon</p>
            <p className="text-sm">This will be implemented in Phase 3 (Settings Tab)</p>
          </div>
        )}
      </div>
    </div>
  );
}

