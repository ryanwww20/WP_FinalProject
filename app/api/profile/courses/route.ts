import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/profile/courses
 * Get user's courses
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Ensure all courses have id field
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
 *   dayOfWeek: number; // 1-6
 *   timeSlot: string; // "0"-"9" or "A"-"D"
 *   location?: string;
 *   teacher?: string;
 *   color: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, dayOfWeek, timeSlot, location, teacher, color } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    if (
      !dayOfWeek ||
      typeof dayOfWeek !== "number" ||
      dayOfWeek < 1 ||
      dayOfWeek > 6
    ) {
      return NextResponse.json(
        { error: "dayOfWeek must be a number between 1 and 6" },
        { status: 400 }
      );
    }

    if (
      !timeSlot ||
      typeof timeSlot !== "string" ||
      !["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D"].includes(
        timeSlot
      )
    ) {
      return NextResponse.json(
        { error: "Invalid timeSlot. Must be '0'-'9' or 'A'-'D'" },
        { status: 400 }
      );
    }

    if (!color || typeof color !== "string") {
      return NextResponse.json(
        { error: "Color is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if there's already a course at this time slot
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

    const existingCourses = user.schedule?.courses || [];
    const conflict = existingCourses.find(
      (course: any) =>
        course.dayOfWeek === dayOfWeek && course.timeSlot === timeSlot
    );

    if (conflict) {
      return NextResponse.json(
        { error: "A course already exists at this time slot" },
        { status: 400 }
      );
    }

    // Generate unique ID
    const newCourse = {
      id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      dayOfWeek,
      timeSlot,
      location: location?.trim() || undefined,
      teacher: teacher?.trim() || undefined,
      color,
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

    // Ensure courses have id field
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
 *   dayOfWeek?: number;
 *   timeSlot?: string;
 *   location?: string;
 *   teacher?: string;
 *   color?: string;
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const courses = user.schedule?.courses || [];
    const courseIndex = courses.findIndex(
      (course: any) => course.id === id
    );

    if (courseIndex === -1) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Validate updates
    if (updates.dayOfWeek !== undefined) {
      if (
        typeof updates.dayOfWeek !== "number" ||
        updates.dayOfWeek < 1 ||
        updates.dayOfWeek > 6
      ) {
        return NextResponse.json(
          { error: "dayOfWeek must be a number between 1 and 6" },
          { status: 400 }
        );
      }
    }

    if (updates.timeSlot !== undefined) {
      if (
        typeof updates.timeSlot !== "string" ||
        !["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D"].includes(
          updates.timeSlot
        )
      ) {
        return NextResponse.json(
          { error: "Invalid timeSlot" },
          { status: 400 }
        );
      }
    }

    // Check for conflicts if dayOfWeek or timeSlot is being updated
    if (updates.dayOfWeek !== undefined || updates.timeSlot !== undefined) {
      const newDayOfWeek = updates.dayOfWeek ?? courses[courseIndex].dayOfWeek;
      const newTimeSlot = updates.timeSlot ?? courses[courseIndex].timeSlot;

      const conflict = courses.find(
        (course: any, index: number) =>
          index !== courseIndex &&
          course.dayOfWeek === newDayOfWeek &&
          course.timeSlot === newTimeSlot
      );

      if (conflict) {
        return NextResponse.json(
          { error: "A course already exists at this time slot" },
          { status: 400 }
        );
      }
    }

    // Build the complete updated course object
    const courseToUpdate = courses[courseIndex];
    const updatedCourse = {
      ...courseToUpdate,
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.dayOfWeek !== undefined && { dayOfWeek: updates.dayOfWeek }),
      ...(updates.timeSlot !== undefined && { timeSlot: updates.timeSlot }),
      ...(updates.location !== undefined && {
        location: updates.location?.trim() || undefined,
      }),
      ...(updates.teacher !== undefined && {
        teacher: updates.teacher?.trim() || undefined,
      }),
      ...(updates.color !== undefined && { color: updates.color }),
    };

    // Replace the course at the specific index
    courses[courseIndex] = updatedCourse;

    // Update the entire courses array
    const updatedUser = await User.findOneAndUpdate(
      { userId: session.user.userId },
      { $set: { "schedule.courses": courses } },
      { new: true }
    ).select("schedule");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update course" },
        { status: 500 }
      );
    }

    // Ensure courses have id field
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const updatedUser = await User.findOneAndUpdate(
      { userId: session.user.userId },
      {
        $pull: {
          "schedule.courses": { id },
        },
      },
      { new: true }
    ).select("schedule");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure courses have id field
    const courses = (updatedUser.schedule?.courses || []).map((course: any) => {
      const courseObj = course.toObject ? course.toObject() : course;
      return {
        ...courseObj,
        id: courseObj.id || String(courseObj._id) || `temp_${Date.now()}_${Math.random()}`,
      };
    });

    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

