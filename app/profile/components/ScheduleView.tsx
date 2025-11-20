"use client";

import { useState } from "react";
import { Course, CourseMeeting } from "@/models/User";
import ScheduleGrid from "./ScheduleGrid";
import CourseModal from "./CourseModal";
import { useCourses } from "./hooks/useCourses";

export default function ScheduleView() {
  const { courses, isLoading, deleteCourse, saveCourse } = useCourses();
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

  const handleDeleteCourse = async (
    courseId: string | undefined,
    e?: React.MouseEvent
  ) => {
    // Prevent event propagation to avoid triggering edit
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    await deleteCourse(courseId);
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

    const success = await saveCourse(courseData, editingCourse?.id);
    if (success) {
      setShowAddModal(false);
      setEditingCourse(null);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCourse(null);
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
      <ScheduleGrid
        courses={courses}
        onEditCourse={handleEditCourse}
        onDeleteCourse={handleDeleteCourse}
      />

      {/* Add/Edit Course Modal */}
      <CourseModal
        isOpen={showAddModal}
        editingCourse={editingCourse}
        formData={formData}
        meetings={meetings}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onFormDataChange={(updates) => setFormData({ ...formData, ...updates })}
        onAddMeeting={addMeeting}
        onRemoveMeeting={removeMeeting}
        onUpdateMeeting={updateMeeting}
      />

      {isLoading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          載入中...
        </div>
      )}
    </div>
  );
}

