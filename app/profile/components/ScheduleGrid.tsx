"use client";

import { Course } from "@/models/User";
import { TIME_SLOT_DEFINITIONS, DAYS_OF_WEEK } from "@/lib/constants";

interface ScheduleGridProps {
  courses: Course[];
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string | undefined, e?: React.MouseEvent) => void;
  readOnly?: boolean;
}

/**
 * Get course for a specific slot (day + timeSlot)
 */
function getCourseForSlot(
  courses: Course[],
  displayDayIndex: number,
  timeSlotIndex: string
): Course | null {
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
}

/**
 * Get the position of a time slot within a course's meeting
 * Returns: { index: number, total: number } or null if not found
 */
function getSlotPosition(
  course: Course,
  dayOfWeek: number,
  timeSlotIndex: string
): { index: number; total: number } | null {
  for (const meeting of course.meetings) {
    if (meeting.dayOfWeek === dayOfWeek && meeting.timeSlots.includes(timeSlotIndex)) {
      const slotIndex = meeting.timeSlots.indexOf(timeSlotIndex);
      return {
        index: slotIndex + 1, // 1-based (e.g., "1 of 3")
        total: meeting.timeSlots.length,
      };
    }
  }
  return null;
}

export default function ScheduleGrid({
  courses,
  onEditCourse,
  onDeleteCourse,
  readOnly = false,
}: ScheduleGridProps) {
  const timeSlots = TIME_SLOT_DEFINITIONS;
  const daysOfWeek = DAYS_OF_WEEK;

  return (
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
                const course = getCourseForSlot(courses, dayIndex, slot.index);
                const slotPosition = course
                  ? getSlotPosition(course, actualDayOfWeek, slot.index)
                  : null;

                return (
                  <div
                    key={dayIndex}
                    className="relative border-l border-gray-200 dark:border-gray-300 p-1"
                  >
                    {course && slotPosition && (
                      <div
                        className={`${course.color} text-white rounded px-2 py-1 text-xs shadow-sm ${!readOnly ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow flex items-center gap-1.5 h-full group relative`}
                        title={`${course.name}\n${
                          course.teacher ? `教師: ${course.teacher}\n` : ""
                        }${
                          course.meetings.find(
                            (m) => m.dayOfWeek === actualDayOfWeek
                          )?.location || ""
                        }`}
                        onClick={!readOnly ? (e) => {
                          // Only trigger edit if clicking on the card itself, not on buttons
                          if (
                            (e.target as HTMLElement).tagName !== "BUTTON" &&
                            !(e.target as HTMLElement).closest("button")
                          ) {
                            onEditCourse?.(course);
                          }
                        } : undefined}
                      >
                        <span className="font-medium truncate flex-1">
                          {course.name}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onDeleteCourse?.(course.id, e);
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
                        )}
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
  );
}

