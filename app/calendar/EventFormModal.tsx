"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { IEvent } from "@/models/Event";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedDate?: Date | null;
  event?: IEvent | null;
}

export default function EventFormModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  event,
}: EventFormModalProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notification, setNotification] = useState("No Notification");
  const [location, setLocation] = useState("No Location");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      // Editing existing event
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      setTitle(event.title);
      setStartDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setEndDate(format(end, "yyyy-MM-dd"));
      setEndTime(format(end, "HH:mm"));
      setNotification(event.notification || "No Notification");
      setLocation(event.location || "No Location");
      setDescription(event.description || "");
    } else if (selectedDate) {
      // Creating new event
      const date = new Date(selectedDate);
      const defaultStart = new Date(date);
      defaultStart.setHours(9, 0, 0, 0);
      const defaultEnd = new Date(date);
      defaultEnd.setHours(10, 0, 0, 0);

      setTitle("");
      setStartDate(format(defaultStart, "yyyy-MM-dd"));
      setStartTime(format(defaultStart, "HH:mm"));
      setEndDate(format(defaultEnd, "yyyy-MM-dd"));
      setEndTime(format(defaultEnd, "HH:mm"));
      setNotification("No Notification");
      setLocation("No Location");
      setDescription("");
    }
  }, [event, selectedDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsSaving(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        alert("End time must be after start time");
        setIsSaving(false);
        return;
      }

      const eventData = {
        title: title.trim(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notification,
        location,
        description: description.trim(),
      };

      if (event) {
        // Update existing event
        const response = await fetch(`/api/calendar/${event._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          throw new Error("Failed to update event");
        }
      } else {
        // Create new event
        const response = await fetch("/api/calendar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          throw new Error("Failed to create event");
        }
      }

      onSave();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {event ? "Edit Event" : "New Event"}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Time Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Starts
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ends
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notification
              </label>
              <select
                value={notification}
                onChange={(e) => setNotification(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="No Notification">No Notification</option>
                <option value="5 minutes before">5 minutes before</option>
                <option value="10 minutes before">10 minutes before</option>
                <option value="15 minutes before">15 minutes before</option>
                <option value="30 minutes before">30 minutes before</option>
                <option value="1 hour before">1 hour before</option>
                <option value="1 day before">1 day before</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter location"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter event description"
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
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

