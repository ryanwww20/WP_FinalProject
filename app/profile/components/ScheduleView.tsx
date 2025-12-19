"use client";

import { useState, useEffect } from "react";
import { Course, CourseMeeting } from "@/models/User";
import ScheduleGrid from "./ScheduleGrid";
import CourseModal from "./CourseModal";
import { useCourses } from "./hooks/useCourses";

interface ScheduleViewProps {
  targetUserId?: string; // If provided, viewing another user's schedule
  readOnly?: boolean; // If true, disable editing
}

export default function ScheduleView({ targetUserId, readOnly = false }: ScheduleViewProps) {
  const { courses: myCourses, isLoading: myIsLoading, deleteCourse, saveCourse } = useCourses();
  const [viewedCourses, setViewedCourses] = useState<Course[]>([]);
  const [viewedLoading, setViewedLoading] = useState(false);

  // Fetch other user's courses if viewing their profile
  useEffect(() => {
    if (targetUserId) {
      const fetchUserCourses = async () => {
        setViewedLoading(true);
        try {
          const response = await fetch(`/api/profile/${targetUserId}`);
          if (response.ok) {
            const data = await response.json();
            setViewedCourses(data.user.courses || []);
          }
        } catch (error) {
          console.error("Error fetching user courses:", error);
        } finally {
          setViewedLoading(false);
        }
      };
      fetchUserCourses();
    }
  }, [targetUserId]);

  const courses = targetUserId ? viewedCourses : myCourses;
  const isLoading = targetUserId ? viewedLoading : myIsLoading;
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
      alert("At least one meeting time is required");
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
        alert("Please select at least one time slot for each meeting");
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
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Course Schedule
        </h2>
        {!readOnly && (
          <button
            onClick={handleAddCourse}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
          >
            + Add Course
          </button>
        )}
      </div>

      {/* Schedule Grid */}
        <ScheduleGrid
          courses={courses}
          onEditCourse={readOnly ? undefined : handleEditCourse}
          onDeleteCourse={readOnly ? undefined : handleDeleteCourse}
          readOnly={readOnly}
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
        <div className="text-center py-8 text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  );
}

