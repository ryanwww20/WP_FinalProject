"use client";

import { CourseMeeting } from "@/models/User";
import { TIME_SLOT_DEFINITIONS, DAYS_OF_WEEK } from "@/lib/constants";

interface MeetingFormProps {
  meetings: CourseMeeting[];
  onAddMeeting: () => void;
  onRemoveMeeting: (index: number) => void;
  onUpdateMeeting: (index: number, updates: Partial<CourseMeeting>) => void;
}

export default function MeetingForm({
  meetings,
  onAddMeeting,
  onRemoveMeeting,
  onUpdateMeeting,
}: MeetingFormProps) {
  const timeSlots = TIME_SLOT_DEFINITIONS;
  const daysOfWeek = DAYS_OF_WEEK;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-600">
          上課時段 *
        </label>
        <button
          type="button"
          onClick={onAddMeeting}
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
                onClick={() => onRemoveMeeting(meetingIndex)}
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
                  onUpdateMeeting(meetingIndex, {
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
                  onUpdateMeeting(meetingIndex, { timeSlots: selected });
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
                size={5}
              >
                {timeSlots.map((slot) => (
                  <option key={slot.index} value={slot.index}>
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
                onUpdateMeeting(meetingIndex, {
                  location: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-50 text-gray-800 dark:text-gray-700"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

