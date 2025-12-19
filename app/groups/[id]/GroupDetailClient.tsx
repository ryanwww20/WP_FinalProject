"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GroupHeader from "./components/GroupHeader";
import GroupTabs from "./components/GroupTabs";
import PasswordPromptModal from "../components/PasswordPromptModal";
import LocationNotification from "./components/LocationNotification";
import { usePusherContext } from "@/components/PusherProvider";
import { getGroupChannel, PUSHER_EVENTS } from "@/lib/pusher-constants";
import type { LocationUpdatedEvent } from "@/lib/pusher-types";
import { useSession } from "next-auth/react";

interface Group {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  memberCount: number;
  inviteCode: string;
  maxMembers?: number;
  requireApproval: boolean;
  hasPassword?: boolean; // true if group has password (private), false if no password (public)
  createdAt: string;
}

interface Membership {
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface GroupDetailData {
  group: Group;
  membership?: Membership;
  isMember: boolean;
}

export default function GroupDetailClient({ groupId }: { groupId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { pusher, isConnected } = usePusherContext();
  const [groupData, setGroupData] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "ranking" | "map" | "settings">("overview");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [locationNotification, setLocationNotification] = useState<LocationUpdatedEvent | null>(null);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  // 處理 URL 參數中的 tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["overview", "chat", "ranking", "map", "settings"].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
  }, [searchParams]);

  // 監聽 Pusher 位置更新事件
  useEffect(() => {
    if (!pusher || !isConnected || !groupData?.isMember || !session?.user?.userId) {
      return;
    }

    let channel: any = null;

    try {
      const channelName = getGroupChannel(groupId);
      channel = pusher.subscribe(channelName);

      const handleLocationUpdate = (data: LocationUpdatedEvent) => {
        // 不顯示自己的位置更新通知
        if (data.userId === session.user?.userId) {
          return;
        }

        // 顯示通知
        setLocationNotification(data);
      };

      channel.bind(PUSHER_EVENTS.LOCATION_UPDATED, handleLocationUpdate);

      // 監聽訂閱成功事件
      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`✅ Subscribed to location updates for group ${groupId}`);
      });

      // 監聽訂閱錯誤
      channel.bind("pusher:subscription_error", (error: any) => {
        console.error("❌ Pusher subscription error:", error);
      });
    } catch (error) {
      console.error("Error subscribing to location updates:", error);
    }

    return () => {
      if (channel) {
        try {
          channel.unbind(PUSHER_EVENTS.LOCATION_UPDATED);
          channel.unbind("pusher:subscription_succeeded");
          channel.unbind("pusher:subscription_error");
          const channelName = getGroupChannel(groupId);
          pusher.unsubscribe(channelName);
        } catch (error) {
          console.error("Error unsubscribing from location updates:", error);
        }
      }
    };
  }, [pusher, isConnected, groupId, groupData?.isMember, session?.user?.userId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}`);

      if (response.ok) {
        const data = await response.json();
        setGroupData(data);
        // If it's a private group and user is not a member, show password modal
        if (!data.isMember && data.group.hasPassword) {
          setShowPasswordModal(true);
        }
      } else if (response.status === 404) {
        router.push("/groups");
      } else if (response.status === 401) {
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-2">Loading group...</div>
        </div>
      </div>
    );
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!groupData) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successfully joined, refresh group data
        setShowPasswordModal(false);
        fetchGroupData();
      } else {
        alert(data.error || "Invalid password");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group. Please try again.");
    }
  };

  if (!groupData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">Group not found</div>
          <button
            onClick={() => router.push("/groups")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 位置更新通知 */}
      {locationNotification && (
        <LocationNotification
          notification={locationNotification}
          onClose={() => setLocationNotification(null)}
          groupId={groupId}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Group Header */}
        <GroupHeader
          group={groupData.group}
          membership={groupData.membership}
          isMember={groupData.isMember}
          onUpdate={fetchGroupData}
        />

        {/* Tabs */}
        <GroupTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          groupId={groupId}
          group={groupData.group}
          membership={groupData.membership}
          isMember={groupData.isMember}
          onGroupUpdate={fetchGroupData}
        />
      </div>

      {/* Password Modal for Private Groups */}
      {showPasswordModal && groupData && !groupData.isMember && (
        <PasswordPromptModal
          groupName={groupData.group.name}
          onClose={() => {
            setShowPasswordModal(false);
            router.push("/groups");
          }}
          onSuccess={handlePasswordSubmit}
        />
      )}
    </div>
  );
}

