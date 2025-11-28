"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface JoinGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinGroupModal({
  onClose,
  onSuccess,
}: JoinGroupModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    inviteCode: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.inviteCode.trim()) {
      setError("Invite code is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, try to find the group by invite code
      // We'll need to search for it or use a different endpoint
      // For now, we'll use the join endpoint with the invite code
      // The API will handle finding the group by invite code
      
      // Since we don't have a search endpoint yet, we'll need to use the join endpoint
      // But it requires a group ID. Let's create a workaround:
      // We'll try to join using the invite code directly
      // The API should handle this, but we need to update it to accept invite code only
      
      // For MVP, let's require both invite code and we'll find the group
      // Actually, let me check the join API - it accepts inviteCode in the body
      // So we can call it with a dummy ID and the inviteCode in body
      
      // Better approach: Create a search endpoint or modify join to work with just invite code
      // For now, let's use a workaround: fetch all groups and find by invite code
      // But that's inefficient. Let's just call the join endpoint with invite code
      
      // Search for group by invite code
      const searchResponse = await fetch(`/api/groups/search?inviteCode=${formData.inviteCode.toUpperCase()}`);
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({}));
        setError(errorData.error || "Group not found. Please check the invite code.");
        setIsSubmitting(false);
        return;
      }

      const searchData = await searchResponse.json();
      if (!searchData.group) {
        setError("Group not found. Please check the invite code.");
        setIsSubmitting(false);
        return;
      }

      const groupId = searchData.group._id;

      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: formData.inviteCode.toUpperCase(),
          password: formData.password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      onSuccess();
      // Optionally navigate to the group
      router.push(`/groups/${groupId}`);
    } catch (error: any) {
      console.error("Error joining group:", error);
      setError(error.message || "Failed to join group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Join Group
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Invite Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invite Code *
              </label>
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white uppercase"
                placeholder="Enter 6-character invite code"
                required
                maxLength={6}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password (If Required)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter group password if required"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Joining..." : "Join Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

