/**
 * Application-wide constants
 */

// Time slots for course scheduling
export const TIME_SLOTS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D"] as const;

// Status types
export const STATUS_TYPES = ["studying", "busy", "offline"] as const;
export type StatusType = typeof STATUS_TYPES[number];

// Days of week (Monday-Saturday, 1-6)
export const DAYS_OF_WEEK = ["一", "二", "三", "四", "五", "六"] as const;
export const DAY_OF_WEEK_MIN = 1;
export const DAY_OF_WEEK_MAX = 6;

// Validation rules
export const VALIDATION_RULES = {
  USER_ID_MIN_LENGTH: 3,
  USER_ID_MAX_LENGTH: 30,
  USER_ID_REGEX: /^[a-zA-Z0-9_-]{3,30}$/,
  NAME_MAX_LENGTH: 100,
  COURSE_NAME_MIN_LENGTH: 1,
} as const;

