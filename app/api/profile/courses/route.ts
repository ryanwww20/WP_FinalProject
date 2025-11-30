import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { Course, CourseMeeting } from "@/models/User";
import {
  validateCourseName,
  validateCourseColor,
  validateMeetings,
} from "@/lib/validators";
import { requireAuth } from "@/lib/middleware/auth";

/**
 * Helper function to check for time slot conflicts
 * Returns true if there's a conflict, false otherwise
 */
function hasConflict(
  newMeetings: CourseMeeting[],
  existingCourses: Course[],
  excludeCourseId?: string
): { hasConflict: boolean; conflictInfo?: string } {
  for (const newMeeting of newMeetings) {
    for (const timeSlot of newMeeting.timeSlots) {
      // Check against all existing courses
      for (const existingCourse of existingCourses) {
        // Skip the course being updated
        if (excludeCourseId && existingCourse.id === excludeCourseId) {
          continue;
        }

        // Check if any meeting of the existing course conflicts
        for (const existingMeeting of existingCourse.meetings) {
          if (
            existingMeeting.dayOfWeek === newMeeting.dayOfWeek &&
            existingMeeting.timeSlots.includes(timeSlot)
          ) {
            return {
              hasConflict: true,
              conflictInfo: `Conflict with "${existingCourse.name}" on day ${newMeeting.dayOfWeek} at time slot ${timeSlot}`,
            };
          }
        }
      }
    }
  }
  return { hasConflict: false };
}

/**
 * GET /api/profile/courses
 * Get user's courses
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    await connectDB();

    const user = await User.findOne({ userId: session.user.userId }).select(
      "schedule"
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Convert Mongoose subdocuments to plain objects
    const courses = (user.schedule?.courses || []).map((course: any) => {
      const courseObj = course.toObject ? course.toObject() : course;
      return {
        ...courseObj,
        id: courseObj.id || String(courseObj._id) || `temp_${Date.now()}_${Math.random()}`,
      };
    });

    return NextResponse.json({
      courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/courses
 * Add a new course
 * Body: {
 *   name: string;
 *   color: string;
 *   teacher?: string;
 *   meetings: Array<{
 *     dayOfWeek: number; // 1-6
 *     timeSlots: string[]; // ["1", "2", ...]
 *     location?: string;
 *   }>;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const body = await request.json();
    const { name, color, teacher, meetings } = body;

    // Validation
    const nameValidation = validateCourseName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    const colorValidation = validateCourseColor(color);
    if (!colorValidation.isValid) {
      return NextResponse.json(
        { error: colorValidation.error },
        { status: 400 }
      );
    }

    const meetingsValidation = validateMeetings(meetings);
    if (!meetingsValidation.isValid) {
      return NextResponse.json(
        { error: meetingsValidation.error },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ userId: session.user.userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure schedule exists
    if (!user.schedule) {
      await User.findOneAndUpdate(
        { userId: session.user.userId },
        { $set: { schedule: { courses: [] } } }
      );
    }

    const existingCourses = (user.schedule?.courses || []) as Course[];

    // Check for conflicts
    const conflictCheck = hasConflict(meetings, existingCourses);
    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        { error: conflictCheck.conflictInfo || "A course already exists at this time slot" },
        { status: 400 }
      );
    }

    // Generate unique ID
    const newCourse: Course = {
      id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      color,
      teacher: teacher?.trim() || undefined,
      meetings: meetings.map((m: any) => ({
        dayOfWeek: m.dayOfWeek,
        timeSlots: m.timeSlots,
        location: m.location?.trim() || undefined,
      })),
    };

    // Add course to user's schedule
    const updatedUser = await User.findOneAndUpdate(
      { userId: session.user.userId },
      {
        $push: {
          "schedule.courses": newCourse,
        },
      },
      { new: true, upsert: false }
    ).select("schedule");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to add course" },
        { status: 500 }
      );
    }

    // Convert to plain objects
    const courses = (updatedUser.schedule?.courses || []).map((course: any) => {
      const courseObj = course.toObject ? course.toObject() : course;
      return {
        ...courseObj,
        id: courseObj.id || String(courseObj._id) || newCourse.id,
      };
    });

    return NextResponse.json({
      success: true,
      course: newCourse,
      courses,
    });
  } catch (error) {
    console.error("Error adding course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/courses
 * Update an existing course
 * Body: {
 *   id: string;
 *   name?: string;
 *   color?: string;
 *   teacher?: string;
 *   meetings?: Array<{
 *     dayOfWeek: number;
 *     timeSlots: string[];
 *     location?: string;
 *   }>;
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ userId: session.user.userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure schedule exists
    if (!user.schedule) {
      await User.findOneAndUpdate(
        { userId: session.user.userId },
        { $set: { schedule: { courses: [] } } }
      );
    }

    const courses = (user.schedule?.courses || []) as Course[];
    
    // Convert courses to plain objects to ensure we can access the id field properly
    const coursesPlain = courses.map((course: any) => {
      const courseObj = course.toObject ? course.toObject() : course;
      return {
        ...courseObj,
        id: courseObj.id || String(courseObj._id) || `temp_${Date.now()}_${Math.random()}`,
      };
    });
    
    const courseIndex = coursesPlain.findIndex((course: any) => course.id === id);

    if (courseIndex === -1) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const courseToUpdate = coursesPlain[courseIndex];

    // Validate name if provided
    if (updates.name !== undefined) {
      const nameValidation = validateCourseName(updates.name);
      if (!nameValidation.isValid) {
        return NextResponse.json(
          { error: nameValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate color if provided
    if (updates.color !== undefined) {
      const colorValidation = validateCourseColor(updates.color);
      if (!colorValidation.isValid) {
        return NextResponse.json(
          { error: colorValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate meetings if provided
    if (updates.meetings !== undefined) {
      const meetingsValidation = validateMeetings(updates.meetings);
      if (!meetingsValidation.isValid) {
        return NextResponse.json(
          { error: meetingsValidation.error },
          { status: 400 }
        );
      }

      // Check for conflicts with other courses (use coursesPlain to ensure proper id comparison)
      const conflictCheck = hasConflict(updates.meetings, coursesPlain, id);
      if (conflictCheck.hasConflict) {
        return NextResponse.json(
          { error: conflictCheck.conflictInfo || "A course already exists at this time slot" },
          { status: 400 }
        );
      }
    }

    // Build the complete updated course object
    // IMPORTANT: Explicitly preserve the id field to prevent it from being lost
    const updatedCourse: Course = {
      id: courseToUpdate.id, // Explicitly preserve the id
      ...courseToUpdate,
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.teacher !== undefined && {
        teacher: updates.teacher?.trim() || undefined,
      }),
      ...(updates.meetings !== undefined && {
        meetings: updates.meetings.map((m: any) => ({
          dayOfWeek: m.dayOfWeek,
          timeSlots: m.timeSlots,
          location: m.location?.trim() || undefined,
        })),
      }),
    };

    // Replace the course at the specific index
    // Use coursesPlain and update the specific course to ensure all courses are plain objects
    const updatedCourses = [...coursesPlain];
    updatedCourses[courseIndex] = updatedCourse;

    // Update the entire courses array
    const updatedUser = await User.findOneAndUpdate(
      { userId: session.user.userId },
      { $set: { "schedule.courses": updatedCourses } },
      { new: true }
    ).select("schedule");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update course" },
        { status: 500 }
      );
    }

    // Convert to plain objects
    const formattedCourses = (updatedUser.schedule?.courses || []).map((course: any) => {
      const courseObj = course.toObject ? course.toObject() : course;
      return {
        ...courseObj,
        id: courseObj.id || String(courseObj._id) || id,
      };
    });

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      courses: formattedCourses,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/courses
 * Delete a course
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, { requireUserId: true });

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the user first to find the course
    const user = await User.findOne({ userId: session.user.userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure schedule exists
    if (!user.schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const courses = (user.schedule.courses || []) as Course[];
    
    // Find the course index - check both id and _id, handle Mongoose documents
    const courseIndex = courses.findIndex((course: any) => {
      // Convert to plain object if it's a Mongoose document
      const courseObj = course.toObject ? course.toObject() : course;
      const courseId = courseObj.id || String(courseObj._id);
      // Compare with the provided id (could be string or ObjectId)
      return courseId === id || String(courseObj._id) === id || String(course._id) === id;
    });

    if (courseIndex === -1) {
      // Debug logging
      const courseIds = courses.map((c: any) => {
        const cObj = c.toObject ? c.toObject() : c;
        return cObj.id || String(cObj._id) || String(c._id);
      });
      console.error("Course not found. Looking for ID:", id);
      console.error("Available course IDs:", courseIds);
      console.error("Course objects:", courses.map((c: any) => {
        const cObj = c.toObject ? c.toObject() : c;
        return { id: cObj.id, _id: String(cObj._id || c._id) };
      }));
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    // Remove the course from the array
    courses.splice(courseIndex, 1);

    // Update the user with the modified courses array
    const updatedUser = await User.findOneAndUpdate(
      { userId: session.user.userId },
      { $set: { "schedule.courses": courses } },
      { new: true }
    ).select("schedule");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to delete course" },
        { status: 500 }
      );
    }

    // Convert to plain objects
    const formattedCourses = (updatedUser.schedule?.courses || []).map((course: any) => {
      const courseObj = course.toObject ? course.toObject() : course;
      return {
        ...courseObj,
        id: courseObj.id || String(courseObj._id) || `temp_${Date.now()}_${Math.random()}`,
      };
    });

    return NextResponse.json({
      success: true,
      courses: formattedCourses,
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
