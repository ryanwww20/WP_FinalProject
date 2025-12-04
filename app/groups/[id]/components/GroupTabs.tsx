"use client";

import { useEffect } from "react";
import OverviewTab from "./OverviewTab";
import SettingsTab from "./SettingsTab";
import ChatTab from "./ChatTab";
import MapTab from "./MapTab";
import { useLoadScript } from "@react-google-maps/api";
// Placeholder components for other tabs (will be implemented in later phases)
// import RankingTab from "./RankingTab";

interface Group {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  memberCount: number;
  inviteCode: string;
  hasPassword?: boolean; // true if group has password (private), false if no password (public)
  requireApproval: boolean; // whether group requires approval for new members
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
  onGroupUpdate?: () => void;
}

export default function GroupTabs({
  activeTab,
  onTabChange,
  groupId,
  group,
  membership,
  isMember,
  onGroupUpdate,
}: GroupTabsProps) {
  // 在 GroupTabs 層級預載入 Google Maps 腳本，避免切換標籤時重複載入
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded: isMapScriptLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
    id: "google-map-script",
  });

  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      onTabChange(event.detail);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, [onTabChange]);

  const tabs: Array<{ id: "overview" | "chat" | "ranking" | "map" | "settings"; label: string; icon: string }> = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "ranking", label: "Ranking", icon: "🏆" },
    { id: "map", label: "Map", icon: "📍" },
  ];

  // Only show Settings tab for owners/admins
  if (membership?.role === "owner" || membership?.role === "admin") {
    tabs.push({ id: "settings", label: "Settings", icon: "⚙️" });
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
          <ChatTab groupId={groupId} isMember={isMember} />
        )}
        {activeTab === "ranking" && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Ranking feature coming soon</p>
            <p className="text-sm">This will be implemented in Phase 5</p>
          </div>
        )}
        {/* Map Tab - 始終渲染但隱藏，避免重複載入腳本 */}
        <div style={{ display: activeTab === "map" ? "block" : "none" }}>
          <MapTab groupId={groupId} isScriptLoaded={isMapScriptLoaded} />
        </div>
        {activeTab === "settings" && (
          <SettingsTab
            groupId={groupId}
            group={group}
            membership={membership}
            onUpdate={onGroupUpdate || (() => window.location.reload())}
          />
        )}
      </div>
    </div>
  );
}

