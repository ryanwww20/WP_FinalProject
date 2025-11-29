"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GroupHeader from "./components/GroupHeader";
import GroupTabs from "./components/GroupTabs";

interface Group {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  visibility: "public" | "private";
  memberCount: number;
  inviteCode: string;
  maxMembers?: number;
  requireApproval: boolean;
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
  const [groupData, setGroupData] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "ranking" | "map" | "settings">("overview");

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}`);

      if (response.ok) {
        const data = await response.json();
        setGroupData(data);
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
    </div>
  );
}

