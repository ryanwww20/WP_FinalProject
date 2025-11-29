"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
}

interface Membership {
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface Member {
  _id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  user: {
    name: string;
    image?: string;
    userId: string;
  };
}

interface SettingsTabProps {
  groupId: string;
  group: Group;
  membership?: Membership;
  onUpdate: () => void;
}

export default function SettingsTab({
  groupId,
  group,
  membership,
  onUpdate,
}: SettingsTabProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"info" | "members" | "danger">("info");

  // Form states
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || "",
    coverImage: group.coverImage || "",
    visibility: group.visibility,
    password: "",
    maxMembers: group.maxMembers?.toString() || "",
    requireApproval: group.requireApproval,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeSection === "members") {
      fetchMembers();
    }
  }, [activeSection, groupId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroupInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        visibility: formData.visibility,
        requireApproval: formData.requireApproval,
      };

      if (formData.coverImage.trim()) {
        payload.coverImage = formData.coverImage.trim();
      } else {
        payload.coverImage = "";
      }

      if (membership?.role === "owner") {
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        } else if (formData.password === "") {
          payload.password = ""; // Remove password
        }
      }

      if (formData.maxMembers && parseInt(formData.maxMembers) > 0) {
        payload.maxMembers = parseInt(formData.maxMembers);
      } else {
        payload.maxMembers = undefined;
      }

      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update group");
      }

      setSuccess("Group settings updated successfully!");
      setFormData((prev) => ({ ...prev, password: "" })); // Clear password field
      onUpdate();
    } catch (error: any) {
      setError(error.message || "Failed to update group settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeMemberRole = async (memberId: string, newRole: "admin" | "member") => {
    if (!confirm(`Are you sure you want to change this member's role to ${newRole}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchMembers();
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update member role");
      }
    } catch (error) {
      console.error("Error updating member role:", error);
      alert("Failed to update member role");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMembers();
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    }
  };

  const handleDeleteGroup = async () => {
    const groupName = prompt(
      `Type "${group.name}" to confirm deletion. This action cannot be undone.`
    );

    if (groupName !== group.name) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/groups");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group");
    }
  };

  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "admin" || isOwner;

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection("info")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === "info"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Group Info
        </button>
        <button
          onClick={() => setActiveSection("members")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === "members"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Members
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveSection("danger")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === "danger"
                ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Danger Zone
          </button>
        )}
      </div>

      {/* Group Info Section */}
      {activeSection === "info" && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Group Information
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSaveGroupInfo} className="space-y-4">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                maxLength={500}
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, coverImage: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Visibility (Owner only) */}
            {isOwner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      visibility: e.target.value as "public" | "private",
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="private">Private (Invite only)</option>
                  <option value="public">Public (Searchable)</option>
                </select>
              </div>
            )}

            {/* Password (Owner only) */}
            {isOwner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password (Leave empty to remove)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter new password or leave empty"
                  minLength={4}
                  maxLength={50}
                />
              </div>
            )}

            {/* Max Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Members (Leave empty for no limit)
              </label>
              <input
                type="number"
                value={formData.maxMembers}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, maxMembers: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min={2}
                max={1000}
              />
            </div>

            {/* Require Approval */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireApproval"
                checked={formData.requireApproval}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requireApproval: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="requireApproval"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Require approval for new members
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members Section */}
      {activeSection === "members" && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Member Management
          </h3>

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading members...
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 font-semibold">
                          {member.user.name[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {member.user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user.userId}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        member.role === "owner"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : member.role === "admin"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  {isAdmin && member.role !== "owner" && (
                    <div className="flex gap-2 ml-4">
                      {member.role === "admin" && isOwner && (
                        <button
                          onClick={() => handleChangeMemberRole(member._id, "member")}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Demote
                        </button>
                      )}
                      {member.role === "member" && isOwner && (
                        <button
                          onClick={() => handleChangeMemberRole(member._id, "admin")}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Promote
                        </button>
                      )}
                      {(isOwner || (member.role === "member" && isAdmin)) && (
                        <button
                          onClick={() => handleRemoveMember(member._id, member.user.name)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone Section */}
      {activeSection === "danger" && isOwner && (
        <div>
          <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h3>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
              Delete Group
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              Once you delete a group, there is no going back. This will permanently
              delete the group, all messages, and remove all members.
            </p>
            <button
              onClick={handleDeleteGroup}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

