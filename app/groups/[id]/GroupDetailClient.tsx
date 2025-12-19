"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GroupHeader from "./components/GroupHeader";
import GroupTabs from "./components/GroupTabs";
import PasswordPromptModal from "../components/PasswordPromptModal";

interface Group {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  visibility?: 'public' | 'private';
  memberCount: number;
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
  const [groupData, setGroupData] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "ranking" | "map" | "settings">("overview");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
      <div className="min-h-[calc(100vh-4rem)] bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading group...</div>
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
      <div className="min-h-[calc(100vh-4rem)] bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-muted-foreground mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-lg font-semibold text-foreground mb-2">Group not found</div>
          <button
            onClick={() => router.push("/groups")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm transition-colors"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/40">
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

