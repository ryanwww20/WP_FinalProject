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
      <div className="bg-card rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 border border-border max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {editingCourse ? "Edit Course" : "Add Course"}
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Course Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ name: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Teacher
            </label>
            <input
              type="text"
              value={formData.teacher}
              onChange={(e) =>
                onFormDataChange({ teacher: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Color *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => onFormDataChange({ color: color.value })}
                  className={`h-10 rounded-lg border-2 ${
                    formData.color === color.value
                      ? "border-foreground ring-2 ring-primary/30"
                      : "border-border"
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
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              {editingCourse ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

