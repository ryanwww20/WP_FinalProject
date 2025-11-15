"use client";

import { useState } from "react";

interface Course {
  id: string;
  name: string;
  dayOfWeek: number; // 1-5 (Monday-Friday), 0=Sunday, 6=Saturday
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

const mockCourses: Course[] = [
  {
    id: "1",
    name: "資料結構",
    dayOfWeek: 1, // Monday
    timeSlot: "2",
    location: "A101",
    teacher: "王教授",
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "演算法",
    dayOfWeek: 1, // Monday
    timeSlot: "3",
    location: "A101",
    teacher: "李教授",
    color: "bg-green-500",
  },
  {
    id: "3",
    name: "資料庫系統",
    dayOfWeek: 3, // Wednesday
    timeSlot: "7",
    location: "B205",
    teacher: "張教授",
    color: "bg-indigo-500",
  },
  {
    id: "4",
    name: "網頁程式設計",
    dayOfWeek: 5, // Friday
    timeSlot: "2",
    location: "C301",
    teacher: "陳教授",
    color: "bg-sky-400",
  },
];

export default function ScheduleView() {
  const [courses] = useState<Course[]>(mockCourses);
  const [showAddModal, setShowAddModal] = useState(false);

  const getCourseForSlot = (displayDayIndex: number, timeSlotIndex: string) => {
    // Convert display index (0-5 for 一-六) to actual dayOfWeek (1-6 for Mon-Sat)
    const actualDayOfWeek = displayDayIndex + 1;
    return courses.find(
      (course) =>
        course.dayOfWeek === actualDayOfWeek && course.timeSlot === timeSlotIndex
    );
  };

  return (
    <div className="bg-white dark:bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-300 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-700">
          課表
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
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
                          className={`${course.color} text-white rounded px-2 py-1 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center gap-1.5 h-full`}
                          title={`${course.name}\n${slot.start}-${slot.end}\n${course.location || ""}`}
                        >
                          <span className="font-medium truncate">
                            {course.name}
                          </span>
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

      {/* Add Course Modal (Placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-50 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-300">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-700 mb-4">
              新增課程
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-600 mb-4">
              此功能將在後續實作中完成
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-200 text-gray-800 dark:text-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-300 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
