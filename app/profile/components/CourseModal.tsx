"use client";

import { Course, CourseMeeting } from "@/models/User";
import { COURSE_COLOR_OPTIONS } from "@/lib/constants";
import MeetingForm from "./MeetingForm";

interface CourseModalProps {
  isOpen: boolean;
  editingCourse: Course | null;
  formData: {
    name: string;
    teacher: string;
    color: string;
  };
  meetings: CourseMeeting[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (updates: Partial<CourseModalProps["formData"]>) => void;
  onAddMeeting: () => void;
  onRemoveMeeting: (index: number) => void;
  onUpdateMeeting: (index: number, updates: Partial<CourseMeeting>) => void;
}

export default function CourseModal({
  isOpen,
  editingCourse,
  formData,
  meetings,
  onClose,
  onSubmit,
  onFormDataChange,
  onAddMeeting,
  onRemoveMeeting,
  onUpdateMeeting,
}: CourseModalProps) {
  if (!isOpen) return null;

  const colorOptions = COURSE_COLOR_OPTIONS;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-50 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-300 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-700 mb-4">
          {editingCourse ? "編輯課程" : "新增課程"}
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">
              課程名稱 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ name: e.target.value })
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
                onFormDataChange({ teacher: e.target.value })
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
                  onClick={() => onFormDataChange({ color: color.value })}
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

          <MeetingForm
            meetings={meetings}
            onAddMeeting={onAddMeeting}
            onRemoveMeeting={onRemoveMeeting}
            onUpdateMeeting={onUpdateMeeting}
          />

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {editingCourse ? "更新" : "新增"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-300 text-gray-800 dark:text-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-400 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

