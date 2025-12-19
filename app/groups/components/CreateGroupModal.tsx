"use client";

import { useState } from "react";

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({
  onClose,
  onSuccess,
}: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverImage: "",
    password: "",
    maxMembers: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Group name is required");
      return;
    }

    // Validate maxMembers if provided
    if (formData.maxMembers) {
      const maxMembersNum = parseInt(formData.maxMembers);
      if (isNaN(maxMembersNum) || maxMembersNum < 2) {
        setError("Maximum members must be at least 2");
        return;
      }
      if (maxMembersNum > 1000) {
        setError("Maximum members cannot exceed 1000");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Determine visibility based on password: has password = private, no password = public
      const hasPassword = formData.password.trim().length > 0;
      
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        visibility: hasPassword ? "private" : "public",
      };

      if (formData.coverImage.trim()) {
        payload.coverImage = formData.coverImage.trim();
      }

      if (hasPassword) {
        payload.password = formData.password.trim();
      }

      if (formData.maxMembers && parseInt(formData.maxMembers) > 0) {
        payload.maxMembers = parseInt(formData.maxMembers);
      }

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error creating group:", error);
      setError(error.message || "Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    
    // For maxMembers, only allow numeric input
    if (name === "maxMembers" && value !== "") {
      if (!/^\d+$/.test(value)) {
        return; // Ignore non-numeric input
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Create New Group
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
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
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Group Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground shadow-sm"
                placeholder="Enter group name"
                required
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground shadow-sm resize-none"
                placeholder="Describe your group..."
                maxLength={500}
              />
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground shadow-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password (Optional)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground shadow-sm"
                placeholder="Leave empty for public group"
                minLength={4}
                maxLength={50}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Set a password to make your group private
              </p>
            </div>

            {/* Max Members */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Maximum Members (Optional)
              </label>
              <input
                type="text"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground shadow-sm"
                placeholder="No limit"
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Enter a number (minimum 2) or leave empty for unlimited members
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

