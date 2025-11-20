/**
 * Application-wide constants
 */

// Time slots for course scheduling
export const TIME_SLOTS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D"] as const;

// Time slot definitions with start/end times (for UI display)
export interface TimeSlotDefinition {
  index: string;
  start: string;
  end: string;
}

export const TIME_SLOT_DEFINITIONS: TimeSlotDefinition[] = [
  { index: "0", start: "07:10", end: "08:00" },
  { index: "1", start: "08:10", end: "09:00" },
  { index: "2", start: "09:10", end: "10:00" },
  { index: "3", start: "10:20", end: "11:10" },
  { index: "4", start: "11:20", end: "12:10" },
  { index: "5", start: "12:20", end: "13:10" },
  { index: "6", start: "13:20", end: "14:10" },
  { index: "7", start: "14:20", end: "15:10" },
  { index: "8", start: "15:30", end: "16:20" },
  { index: "9", start: "16:30", end: "17:20" },
  { index: "A", start: "18:25", end: "19:15" },
  { index: "B", start: "19:20", end: "20:10" },
  { index: "C", start: "20:15", end: "21:05" },
  { index: "D", start: "21:10", end: "22:00" },
] as const;

// Status types
export const STATUS_TYPES = ["studying", "busy", "offline"] as const;
export type StatusType = typeof STATUS_TYPES[number];

// Days of week (Monday-Saturday, 1-6)
export const DAYS_OF_WEEK = ["一", "二", "三", "四", "五", "六"] as const;
export const DAY_OF_WEEK_MIN = 1;
export const DAY_OF_WEEK_MAX = 6;

// Course color options
export interface ColorOption {
  value: string;
  label: string;
}

export const COURSE_COLOR_OPTIONS: ColorOption[] = [
  { value: "bg-blue-500", label: "藍色" },
  { value: "bg-green-500", label: "綠色" },
  { value: "bg-indigo-500", label: "靛藍色" },
  { value: "bg-purple-500", label: "紫色" },
  { value: "bg-pink-500", label: "粉色" },
  { value: "bg-red-500", label: "紅色" },
  { value: "bg-orange-500", label: "橙色" },
  { value: "bg-yellow-500", label: "黃色" },
  { value: "bg-teal-500", label: "青綠色" },
  { value: "bg-cyan-500", label: "青色" },
] as const;

// Validation rules
export const VALIDATION_RULES = {
  USER_ID_MIN_LENGTH: 3,
  USER_ID_MAX_LENGTH: 30,
  USER_ID_REGEX: /^[a-zA-Z0-9_-]{3,30}$/,
  NAME_MAX_LENGTH: 100,
  COURSE_NAME_MIN_LENGTH: 1,
} as const;

