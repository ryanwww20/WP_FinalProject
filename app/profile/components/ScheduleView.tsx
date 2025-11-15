"use client";

import { useState, useEffect } from "react";

interface Course {
  id: string;
  name: string;
  dayOfWeek: number; // 1-6 (Monday-Saturday)
  timeSlot: string; // "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D"
  location?: string;
  teacher?: string;
  color: string;
}

// Time slot definitions
const timeSlots = [
  { index: "0", start: "07:10", end: "08:00" },
  { index: "1", start: "08:10", end: "09:00" },
  { index: "2", start: "09:10", end: "10:00" },
  { index: "3", start: "10:20", end: "11:10" },
  { index: "4", start: "11:20", end: "12:10" },
  { index: "5", start: "12:20", end: "13:10" },
  { index: "6", start: "13:20", end: "14:10" },
  { index: "7", start: "14:20", end: "15:10" },
  { index: "8", start: "15:30", end: "16:20" },
  { index: "9", start: "16:30", end: "17:20" },
  { index: "A", start: "18:25", end: "19:15" },
  { index: "B", start: "19:20", end: "20:10" },
  { index: "C", start: "20:15", end: "21:05" },
  { index: "D", start: "21:10", end: "22:00" },
];

const daysOfWeek = ["一", "二", "三", "四", "五", "六"];

const colorOptions = [
  { value: "bg-blue-500", label: "藍色" },
  { value: "bg-green-500", label: "綠色" },
  { value: "bg-indigo-500", label: "靛藍色" },
  { value: "bg-purple-500", label: "紫色" },
  { value: "bg-pink-500", label: "粉色" },
  { value: "bg-red-500", label: "紅色" },
  { value: "bg-orange-500", label: "橙色" },
  { value: "bg-yellow-500", label: "黃色" },
  { value: "bg-teal-500", label: "青綠色" },
  { value: "bg-cyan-500", label: "青色" },
];

export default function ScheduleView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dayOfWeek: 1,
    timeSlot: "0", // For editing only
    location: "",
    teacher: "",
    color: "bg-blue-500",
  });
  const [rangeStart, setRangeStart] = useState<string>("0");
  const [rangeEnd, setRangeEnd] = useState<string>("0");

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

  const getCourseForSlot = (displayDayIndex: number, timeSlotIndex: string) => {
    // Convert display index (0-5 for 一-六) to actual dayOfWeek (1-6 for Mon-Sat)
    const actualDayOfWeek = displayDayIndex + 1;
    return courses.find(
      (course) =>
        course.dayOfWeek === actualDayOfWeek && course.timeSlot === timeSlotIndex
    );
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setFormData({
      name: "",
      dayOfWeek: 1,
      timeSlot: "0",
      location: "",
      teacher: "",
      color: "bg-blue-500",
    });
    setRangeStart("0");
    setRangeEnd("0");
    setShowAddModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      dayOfWeek: course.dayOfWeek,
      timeSlot: course.timeSlot,
      location: course.location || "",
      teacher: course.teacher || "",
      color: course.color,
    });
    setShowAddModal(true);
  };

  const handleDeleteCourse = async (courseId: string | undefined) => {
    if (!courseId) {
      console.error("Course ID is missing");
      alert("無法刪除：課程 ID 不存在");
      return;
    }

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
      } else {
        const error = await response.json();
        alert(`刪除失敗: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("刪除失敗，請稍後再試");
    }
  };

  const getTimeSlotIndex = (slot: string): number => {
    const index = timeSlots.findIndex((s) => s.index === slot);
    return index >= 0 ? index : 0;
  };

  const getTimeSlotsInRange = (start: string, end: string): string[] => {
    const startIndex = getTimeSlotIndex(start);
    const endIndex = getTimeSlotIndex(end);
    const slots: string[] = [];
    for (let i = Math.min(startIndex, endIndex); i <= Math.max(startIndex, endIndex); i++) {
      slots.push(timeSlots[i].index);
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For editing, use single time slot
    if (editingCourse) {
      try {
        const response = await fetch("/api/profile/courses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCourse.id,
            name: formData.name,
            dayOfWeek: formData.dayOfWeek,
            timeSlot: formData.timeSlot,
            location: formData.location,
            teacher: formData.teacher,
            color: formData.color,
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
      } catch (error) {
        console.error("Error saving course:", error);
        alert("操作失敗，請稍後再試");
      }
      return;
    }

    // For adding, use range selection
    const timeSlotsToAdd = getTimeSlotsInRange(rangeStart, rangeEnd);

    if (timeSlotsToAdd.length === 0) {
      alert("請至少選擇一個時間段");
      return;
    }

    // Add all courses
    try {
      const promises = timeSlotsToAdd.map((timeSlot) =>
        fetch("/api/profile/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            dayOfWeek: formData.dayOfWeek,
            timeSlot,
            location: formData.location,
            teacher: formData.teacher,
            color: formData.color,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const errors: string[] = [];

      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json();
          errors.push(error.error || "Unknown error");
        }
      }

      if (errors.length > 0) {
        alert(`部分課程添加失敗:\n${errors.join("\n")}`);
      }

      // Reload all courses
      const coursesResponse = await fetch("/api/profile/courses");
      if (coursesResponse.ok) {
        const data = await coursesResponse.json();
        setCourses(data.courses || []);
      }

      setShowAddModal(false);
      setEditingCourse(null);
    } catch (error) {
      console.error("Error saving courses:", error);
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
              // Convert display index to actual day of week (1=Monday, 6=Saturday)
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
            {timeSlots.map((slot, slotIndex) => (
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
                  const course = getCourseForSlot(dayIndex, slot.index);
                  return (
                    <div
                      key={dayIndex}
                      className="relative border-l border-gray-200 dark:border-gray-300 p-1"
                    >
                      {course && (
                        <div
                          className={`${course.color} text-white rounded px-2 py-1 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center gap-1.5 h-full group relative`}
                          title={`${course.name}\n${slot.start}-${slot.end}\n${course.location || ""}`}
                          onClick={() => handleEditCourse(course)}
                        >
                          <span className="font-medium truncate flex-1">
                            {course.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (course.id) {
                                handleDeleteCourse(course.id);
                              } else {
                                console.error("Course missing ID:", course);
                                alert("無法刪除：課程 ID 不存在");
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
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
          <div className="bg-white dark:bg-gray-50 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-300 max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">
                    星期 *
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">
                    時間段 *
                  </label>
                  {editingCourse ? (
                    <select
                      value={formData.timeSlot}
                      onChange={(e) =>
                        setFormData({ ...formData, timeSlot: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot.index} value={slot.index}>
                          {slot.index} ({slot.start}-{slot.end})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-500 mb-1">
                            開始時間段
                          </label>
                          <select
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                          >
                            {timeSlots.map((slot) => (
                              <option key={slot.index} value={slot.index}>
                                {slot.index} ({slot.start}-{slot.end})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-500 mb-1">
                            結束時間段
                          </label>
                          <select
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                          >
                            {timeSlots.map((slot) => (
                              <option key={slot.index} value={slot.index}>
                                {slot.index} ({slot.start}-{slot.end})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">
                  地點
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
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
