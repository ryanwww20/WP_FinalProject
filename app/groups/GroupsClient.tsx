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
  isPublic: boolean; // true if no password, false if has password
  hasPassword: boolean;
  memberCount: number;
  inviteCode: string;
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

    // If group is public (no password), allow direct access
    if (group.isPublic) {
      router.push(`/groups/${group._id}`);
      return;
    }

    // If group is private (has password), show password prompt
    if (group.hasPassword) {
      setPasswordModalGroup(group);
      return;
    }

    // Default: try to access
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
          // No invite code needed - removed from UI
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Groups
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
        </div>

        {/* Search */}
        {groups.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Loading groups...
          </div>
        ) : (
          <>
            {/* Groups Grid */}
            {filteredGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    onClick={() => handleGroupClick(group)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchQuery ? (
                  <>
                    <p className="text-lg mb-2">No groups found</p>
                    <p className="text-sm">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">No groups yet</p>
                    <p className="text-sm mb-4">
                      Create your first group or join an existing one!
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Group
                      </button>
                    </div>
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

