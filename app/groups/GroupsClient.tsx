"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GroupCard from "./components/GroupCard";
import CreateGroupModal from "./components/CreateGroupModal";
import PasswordPromptModal from "./components/PasswordPromptModal";

interface Group {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  visibility: 'public' | 'private';
  hasPassword: boolean;
  memberCount: number;
  createdAt: string;
  role?: "owner" | "admin" | "member";
}

export default function GroupsClient() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [passwordModalGroup, setPasswordModalGroup] = useState<Group | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      // Fetch all groups (public listing)
      const response = await fetch("/api/groups/public");

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else if (response.status === 401) {
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = async (group: Group) => {
    // If user is already a member, allow direct access
    if (group.role) {
      router.push(`/groups/${group._id}`);
      return;
    }

    // If group has password (private), show password prompt to join
    if (group.hasPassword) {
      setPasswordModalGroup(group);
      return;
    }

    // For public groups (no password), just navigate to group page
    // User will see a "Join" button there to manually join
    router.push(`/groups/${group._id}`);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!passwordModalGroup) return;

    try {
      // Try to join the private group with the password
      const response = await fetch(`/api/groups/${passwordModalGroup._id}/join`, {
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
        // Successfully joined, navigate to group
        setPasswordModalGroup(null);
        router.push(`/groups/${passwordModalGroup._id}`);
        fetchGroups(); // Refresh groups list
      } else {
        // Show error in modal
        alert(data.error || "Invalid password");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group. Please try again.");
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Study Groups
            </h1>
            <p className="text-muted-foreground mt-1">
              Join or create groups to study together
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Group
          </button>
        </div>

        {/* Search */}
        {groups.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading groups...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Groups Grid */}
            {filteredGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    onClick={() => handleGroupClick(group)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                {searchQuery ? (
                  <>
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <p className="text-lg font-semibold text-foreground mb-2">No groups found</p>
                    <p className="text-sm text-muted-foreground">Try a different search term</p>
                  </>
                ) : (
                  <>
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-lg font-semibold text-foreground mb-2">No groups yet</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Create your first group or join an existing one!
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Create Group
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {isCreateModalOpen && (
          <CreateGroupModal
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              setIsCreateModalOpen(false);
              fetchGroups();
            }}
          />
        )}

        {passwordModalGroup && (
          <PasswordPromptModal
            groupName={passwordModalGroup.name}
            onClose={() => setPasswordModalGroup(null)}
            onSuccess={handlePasswordSubmit}
          />
        )}
      </div>
    </div>
  );
}

