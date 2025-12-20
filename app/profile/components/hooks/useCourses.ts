import { useState, useEffect } from "react";
import { Course } from "@/models/User";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const deleteCourse = async (courseId: string | undefined): Promise<boolean> => {
    if (!courseId) {
      console.error("Course ID is missing");
      alert("Unable to delete: Course ID does not exist");
      return false;
    }

    if (!confirm("Are you sure you want to delete this course?")) {
      return false;
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
        return true;
      } else {
        const error = await response.json();
        console.error("Delete failed:", error);
        alert(`Delete failed: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Delete failed, please try again later");
      return false;
    }
  };

  const saveCourse = async (
    courseData: {
      name: string;
      color: string;
      teacher?: string;
      meetings: Array<{
        dayOfWeek: number;
        timeSlots: string[];
        location?: string;
      }>;
    },
    courseId?: string
  ): Promise<boolean> => {
    try {
      const url = "/api/profile/courses";
      const method = courseId ? "PUT" : "POST";
      const body = courseId
        ? { id: courseId, ...courseData }
        : courseData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
        return true;
      } else {
        const error = await response.json();
        alert(`Operation failed: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Operation failed, please try again later");
      return false;
    }
  };

  return {
    courses,
    isLoading,
    setCourses,
    deleteCourse,
    saveCourse,
  };
}

