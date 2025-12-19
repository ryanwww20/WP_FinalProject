"use client";

import { CourseMeeting } from "@/models/User";
import { TIME_SLOT_DEFINITIONS, DAYS_OF_WEEK } from "@/lib/constants";

interface MeetingFormProps {
  meetings: CourseMeeting[];
  onAddMeeting: () => void;
  onRemoveMeeting: (index: number) => void;
  onUpdateMeeting: (index: number, updates: Partial<CourseMeeting>) => void;
}

export default function MeetingForm({
  meetings,
  onAddMeeting,
  onRemoveMeeting,
  onUpdateMeeting,
}: MeetingFormProps) {
  const timeSlots = TIME_SLOT_DEFINITIONS;
  const daysOfWeek = DAYS_OF_WEEK;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-foreground">
          Meeting Times *
        </label>
        <button
          type="button"
          onClick={onAddMeeting}
          className="text-sm text-primary hover:text-primary/80"
        >
          + Add Time
        </button>
      </div>

      {meetings.map((meeting, meetingIndex) => (
        <div
          key={meetingIndex}
          className="mb-4 p-4 border border-border rounded-lg space-y-3 bg-muted/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Meeting {meetingIndex + 1}
            </span>
            {meetings.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveMeeting(meetingIndex)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Day of Week *
              </label>
              <select
                value={meeting.dayOfWeek}
                onChange={(e) =>
                  onUpdateMeeting(meetingIndex, {
                    dayOfWeek: parseInt(e.target.value),
                  })
                }
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
              >
                {daysOfWeek.map((day, index) => (
                  <option key={index} value={index + 1}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Time Slots *
              </label>
              <select
                multiple
                value={meeting.timeSlots}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  onUpdateMeeting(meetingIndex, { timeSlots: selected });
                }}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                size={5}
              >
                {timeSlots.map((slot) => (
                  <option key={slot.index} value={slot.index}>
                    {slot.index} ({slot.start}-{slot.end})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Hold Ctrl/Cmd (Mac) or Ctrl (Windows) to select multiple
              </p>
              {meeting.timeSlots.length > 0 && (
                <p className="text-xs text-primary mt-1">
                  Selected: {meeting.timeSlots.sort().join(", ")}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Location
            </label>
            <input
              type="text"
              value={meeting.location || ""}
              onChange={(e) =>
                onUpdateMeeting(meetingIndex, {
                  location: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

