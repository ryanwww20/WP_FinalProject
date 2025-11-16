"use client";

import { useState, useEffect } from "react";
import { Course, CourseMeeting } from "@/models/User";
import {
  TIME_SLOT_DEFINITIONS,
  DAYS_OF_WEEK,
  COURSE_COLOR_OPTIONS,
} from "@/lib/constants";

// Use constants from lib/constants.ts
const timeSlots = TIME_SLOT_DEFINITIONS;
const daysOfWeek = DAYS_OF_WEEK;
const colorOptions = COURSE_COLOR_OPTIONS;

export default function ScheduleView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    teacher: "",
    color: "bg-blue-500",
  });
  const [meetings, setMeetings] = useState<CourseMeeting[]>([
    { dayOfWeek: 1, timeSlots: [], location: "" },
  ]);

  // Load courses from API
  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch("/api/profile/courses");
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCourses();
  }, []);

  // Get course for a specific slot (day + timeSlot)
  const getCourseForSlot = (displayDayIndex: number, timeSlotIndex: string): Course | null => {
    const actualDayOfWeek = displayDayIndex + 1;
    
    for (const course of courses) {
      for (const meeting of course.meetings) {
        if (
          meeting.dayOfWeek === actualDayOfWeek &&
          meeting.timeSlots.includes(timeSlotIndex)
        ) {
          return course;
        }
      }
    }
    return null;
  };

  // Get the position of a time slot within a course's meeting
  // Returns: { index: number, total: number } or null if not found
  const getSlotPosition = (course: Course, dayOfWeek: number, timeSlotIndex: string): { index: number; total: number } | null => {
    for (const meeting of course.meetings) {
      if (meeting.dayOfWeek === dayOfWeek && meeting.timeSlots.includes(timeSlotIndex)) {
        const slotIndex = meeting.timeSlots.indexOf(timeSlotIndex);
        return {
          index: slotIndex + 1, // 1-based (e.g., "1 of 3")
          total: meeting.timeSlots.length
        };
      }
    }
    return null;
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setFormData({
      name: "",
      teacher: "",
      color: "bg-blue-500",
    });
    setMeetings([{ dayOfWeek: 1, timeSlots: [], location: "" }]);
    setShowAddModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      teacher: course.teacher || "",
      color: course.color,
    });
    setMeetings(course.meetings.map((m) => ({ ...m })));
    setShowAddModal(true);
  };

  const handleDeleteCourse = async (courseId: string | undefined, e?: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering edit
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (!courseId) {
      console.error("Course ID is missing");
      alert("無法刪除：課程 ID 不存在");
      return;
    }

    console.log("Attempting to delete course with ID:", courseId);
    console.log("Current courses:", courses.map(c => ({ id: c.id, name: c.name })));

    if (!confirm("確定要刪除此課程嗎？")) {
      return;
    }

    try {
      const response = await fetch("/api/profile/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: courseId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
        console.log("Course deleted successfully, updated courses:", data.courses);
      } else {
        const error = await response.json();
        console.error("Delete failed:", error);
        alert(`刪除失敗: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("刪除失敗，請稍後再試");
    }
  };

  const addMeeting = () => {
    setMeetings([...meetings, { dayOfWeek: 1, timeSlots: [], location: "" }]);
  };

  const removeMeeting = (index: number) => {
    if (meetings.length > 1) {
      setMeetings(meetings.filter((_, i) => i !== index));
    } else {
      alert("至少需要一個上課時段");
    }
  };

  const updateMeeting = (index: number, updates: Partial<CourseMeeting>) => {
    const updated = [...meetings];
    updated[index] = { ...updated[index], ...updates };
    setMeetings(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate meetings
    for (const meeting of meetings) {
      if (meeting.timeSlots.length === 0) {
        alert("請為每個上課時段選擇至少一個時間段");
        return;
      }
    }

    const courseData = {
      name: formData.name,
      color: formData.color,
      teacher: formData.teacher || undefined,
      meetings: meetings.map((m) => ({
        dayOfWeek: m.dayOfWeek,
        timeSlots: m.timeSlots,
        location: m.location?.trim() || undefined,
      })),
    };

    try {
      if (editingCourse) {
        // Update existing course
        const response = await fetch("/api/profile/courses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCourse.id,
            ...courseData,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
          setShowAddModal(false);
          setEditingCourse(null);
        } else {
          const error = await response.json();
          alert(`操作失敗: ${error.error}`);
        }
      } else {
        // Create new course
        const response = await fetch("/api/profile/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courseData),
        });

        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
          setShowAddModal(false);
        } else {
          const error = await response.json();
          alert(`操作失敗: ${error.error}`);
        }
      }
    } catch (error) {
      console.error("Error saving course:", error);
      alert("操作失敗，請稍後再試");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-300 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-700">
          課表
        </h2>
        <button
          onClick={handleAddCourse}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          + 新增課程
        </button>
      </div>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-300 dark:border-gray-400">
            <div className="p-3 text-sm font-medium text-gray-600 dark:text-gray-700 border-r border-gray-200 dark:border-gray-300">
              時間
            </div>
            {daysOfWeek.map((day, index) => {
              const actualDayOfWeek = index + 1;
              return (
                <div
                  key={index}
                  className={`p-3 text-center text-sm font-medium border-l border-gray-300 dark:border-gray-400 ${
                    actualDayOfWeek === new Date().getDay()
                      ? "bg-blue-50 dark:bg-blue-100 text-blue-700 dark:text-blue-800"
                      : "text-gray-700 dark:text-gray-800"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          <div className="relative">
            {timeSlots.map((slot) => (
              <div
                key={slot.index}
                className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-300"
                style={{ minHeight: "60px" }}
              >
                {/* Time Label */}
                <div className="p-2 text-xs border-r border-gray-200 dark:border-gray-300 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-100">
                  <div className="text-gray-400 dark:text-gray-500 text-[10px]">
                    {slot.start}
                  </div>
                  <div className="text-black dark:text-gray-900 font-bold text-base my-1">
                    {slot.index}
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 text-[10px]">
                    {slot.end}
                  </div>
                </div>

                {/* Day Columns */}
                {daysOfWeek.map((_, dayIndex) => {
                  const actualDayOfWeek = dayIndex + 1;
                  const course = getCourseForSlot(dayIndex, slot.index);
                  const slotPosition = course ? getSlotPosition(course, actualDayOfWeek, slot.index) : null;

                  return (
                    <div
                      key={dayIndex}
                      className="relative border-l border-gray-200 dark:border-gray-300 p-1"
                    >
                      {course && slotPosition && (
                        <div
                          className={`${course.color} text-white rounded px-2 py-1 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center gap-1.5 h-full group relative`}
                          title={`${course.name}\n${course.teacher ? `教師: ${course.teacher}\n` : ""}${course.meetings.find(m => m.dayOfWeek === actualDayOfWeek)?.location || ""}`}
                          onClick={(e) => {
                            // Only trigger edit if clicking on the card itself, not on buttons
                            if ((e.target as HTMLElement).tagName !== 'BUTTON' && 
                                !(e.target as HTMLElement).closest('button')) {
                              handleEditCourse(course);
                            }
                          }}
                        >
                          <span className="font-medium truncate flex-1">
                            {course.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteCourse(course.id, e);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 z-10 relative"
                            title="刪除課程"
                            type="button"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-50 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-700 mb-4">
              {editingCourse ? "編輯課程" : "新增課程"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">
                  課程名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">
                  授課教師
                </label>
                <input
                  type="text"
                  value={formData.teacher}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">
                  顏色 *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color: color.value })
                      }
                      className={`h-10 rounded-lg border-2 ${
                        formData.color === color.value
                          ? "border-gray-800 dark:border-gray-700"
                          : "border-gray-300 dark:border-gray-400"
                      } ${color.value}`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Meetings Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-600">
                    上課時段 *
                  </label>
                  <button
                    type="button"
                    onClick={addMeeting}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    + 新增時段
                  </button>
                </div>

                {meetings.map((meeting, meetingIndex) => (
                  <div
                    key={meetingIndex}
                    className="mb-4 p-4 border border-gray-200 dark:border-gray-300 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-600">
                        時段 {meetingIndex + 1}
                      </span>
                      {meetings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMeeting(meetingIndex)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          刪除
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-500 mb-1">
                          星期 *
                        </label>
                        <select
                          value={meeting.dayOfWeek}
                          onChange={(e) =>
                            updateMeeting(meetingIndex, {
                              dayOfWeek: parseInt(e.target.value),
                            })
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                        >
                          {daysOfWeek.map((day, index) => (
                            <option key={index} value={index + 1}>
                              週{day}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-500 mb-1">
                          時間段 *
                        </label>
                        <select
                          multiple
                          value={meeting.timeSlots}
                          onChange={(e) => {
                            const selected = Array.from(
                              e.target.selectedOptions,
                              (option) => option.value
                            );
                            updateMeeting(meetingIndex, { timeSlots: selected });
                          }}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                          size={5}
                        >
                          {timeSlots.map((slot) => (
                            <option 
                              key={slot.index} 
                              value={slot.index}
                            >
                              {slot.index} ({slot.start}-{slot.end})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          按住 Ctrl/Cmd (Mac) 或 Ctrl (Windows) 可多選
                        </p>
                        {meeting.timeSlots.length > 0 && (
                          <p className="text-xs text-indigo-600 mt-1">
                            已選擇: {meeting.timeSlots.sort().join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-500 mb-1">
                        地點
                      </label>
                      <input
                        type="text"
                        value={meeting.location || ""}
                        onChange={(e) =>
                          updateMeeting(meetingIndex, {
                            location: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingCourse ? "更新" : "新增"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCourse(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-300 text-gray-800 dark:text-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          載入中...
        </div>
      )}
    </div>
  );
}

