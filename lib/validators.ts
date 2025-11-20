import { TIME_SLOTS, DAY_OF_WEEK_MIN, DAY_OF_WEEK_MAX, VALIDATION_RULES } from './constants';
import { CourseMeeting } from '@/models/User';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate userId format
 * @param userId - The userId to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateUserId(userId: unknown): ValidationResult {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return {
      isValid: false,
      error: 'UserId is required',
    };
  }

  const trimmed = userId.trim();
  if (!VALIDATION_RULES.USER_ID_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'UserId must be 3-30 characters and contain only letters, numbers, underscores, or hyphens',
    };
  }

  return { isValid: true };
}

/**
 * Validate user name
 * @param name - The name to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateName(name: unknown): ValidationResult {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      isValid: false,
      error: 'Name is required and must be a non-empty string',
    };
  }

  if (name.trim().length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Name must be less than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validate course name
 * @param name - The course name to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateCourseName(name: unknown): ValidationResult {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      isValid: false,
      error: 'Course name is required',
    };
  }

  return { isValid: true };
}

/**
 * Validate time slot
 * @param timeSlot - The time slot to validate (e.g., "1", "A")
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateTimeSlot(timeSlot: unknown): ValidationResult {
  if (typeof timeSlot !== 'string') {
    return {
      isValid: false,
      error: `Invalid timeSlot: must be a string`,
    };
  }

  if (!TIME_SLOTS.includes(timeSlot as any)) {
    return {
      isValid: false,
      error: `Invalid timeSlot: ${timeSlot}. Must be '0'-'9' or 'A'-'D'`,
    };
  }

  return { isValid: true };
}

/**
 * Validate day of week
 * @param dayOfWeek - The day of week to validate (1-6, Monday-Saturday)
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateDayOfWeek(dayOfWeek: unknown): ValidationResult {
  if (typeof dayOfWeek !== 'number') {
    return {
      isValid: false,
      error: 'dayOfWeek must be a number',
    };
  }

  if (dayOfWeek < DAY_OF_WEEK_MIN || dayOfWeek > DAY_OF_WEEK_MAX) {
    return {
      isValid: false,
      error: `dayOfWeek must be a number between ${DAY_OF_WEEK_MIN} and ${DAY_OF_WEEK_MAX}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate time slots array
 * @param timeSlots - Array of time slot strings
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateTimeSlots(timeSlots: unknown): ValidationResult {
  if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
    return {
      isValid: false,
      error: 'Each meeting must have at least one time slot',
    };
  }

  for (const slot of timeSlots) {
    const result = validateTimeSlot(slot);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

/**
 * Validate a single course meeting
 * @param meeting - The meeting object to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateMeeting(meeting: unknown): ValidationResult {
  if (!meeting || typeof meeting !== 'object' || Array.isArray(meeting)) {
    return {
      isValid: false,
      error: 'Meeting must be an object',
    };
  }

  const m = meeting as Partial<CourseMeeting>;

  // Validate dayOfWeek
  const dayResult = validateDayOfWeek(m.dayOfWeek);
  if (!dayResult.isValid) {
    return dayResult;
  }

  // Validate timeSlots
  const slotsResult = validateTimeSlots(m.timeSlots);
  if (!slotsResult.isValid) {
    return slotsResult;
  }

  return { isValid: true };
}

/**
 * Validate meetings array
 * @param meetings - Array of meeting objects
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateMeetings(meetings: unknown): ValidationResult {
  if (!Array.isArray(meetings) || meetings.length === 0) {
    return {
      isValid: false,
      error: 'At least one meeting is required',
    };
  }

  for (const meeting of meetings) {
    const result = validateMeeting(meeting);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

/**
 * Validate course color
 * @param color - The color string to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateCourseColor(color: unknown): ValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color is required',
    };
  }

  return { isValid: true };
}

