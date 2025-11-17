"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfDay, addDays } from "date-fns";
import EventFormModal from "./EventFormModal";
import type { IEvent } from "@/models/Event";

type ViewMode = "monthly" | "weekly";

export default function CalendarClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [events, setEvents] = useState<IEvent[]>([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const [selectedDateForView, setSelectedDateForView] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch events for the current view
  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let startDate: Date;
      let endDate: Date;

      if (viewMode === "monthly") {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        startDate = weekStart;
        endDate = weekEnd;
      }

      const response = await fetch(
        `/api/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (viewMode === "monthly") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "monthly") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    const clickedDateStr = startOfDay(date).toISOString();
    const selectedDateStr = selectedDateForView ? startOfDay(selectedDateForView).toISOString() : null;
    
    // 如果点击的是已选中的日期，打开新建事件表单
    if (selectedDateStr === clickedDateStr) {
      setSelectedDate(date);
      setSelectedEvent(null);
      setIsEventFormOpen(true);
    } else {
      // 否则选中该日期，显示右侧面板
      setSelectedDateForView(date);
    }
  };

  const handleEventClick = (event: IEvent) => {
    setSelectedEvent(event);
    setSelectedDate(new Date(event.startTime));
    setIsEventFormOpen(true);
  };

  const handleEventSaved = () => {
    setIsEventFormOpen(false);
    setSelectedDate(null);
    setSelectedEvent(null);
    fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(`/api/calendar/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const getEventsForDate = (date: Date): IEvent[] => {
    return events.filter((event) => {
      const eventDate = startOfDay(new Date(event.startTime));
      const compareDate = startOfDay(date);
      return isSameDay(eventDate, compareDate);
    });
  };

  // Monthly view
  const renderMonthlyView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                !isCurrentMonth ? "bg-gray-50 dark:bg-gray-900 text-gray-400" : ""
              } ${isToday ? "ring-2 ring-blue-500" : ""} ${
                selectedDateForView && isSameDay(day, selectedDateForView)
                  ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20"
                  : ""
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday ? "text-blue-600 dark:text-blue-400" : ""
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event._id.toString()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                    className="text-xs p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    {format(new Date(event.startTime), "HH:mm")} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Weekly view
  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2"></div>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDateForView && isSameDay(day, selectedDateForView);
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`p-2 text-center border-l border-gray-200 dark:border-gray-700 cursor-pointer ${
                      isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    } ${
                      isSelected
                        ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800"
            >
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                {(() => {
                  const time = new Date();
                  time.setHours(hour, 0, 0, 0);
                  return format(time, "HH:mm");
                })()}
              </div>
              {weekDays.map((day) => {
                const dayEvents = getEventsForDate(day).filter((event) => {
                  const eventHour = new Date(event.startTime).getHours();
                  return eventHour === hour;
                });

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => {
                      // 在 weekly view 中，点击时间格子时，先选中该日期（不包含时间）
                      // 如果该日期已经选中，则打开表单
                      const dayOnly = startOfDay(day);
                      const clickedDateStr = dayOnly.toISOString();
                      const selectedDateStr = selectedDateForView ? startOfDay(selectedDateForView).toISOString() : null;
                      
                      if (selectedDateStr === clickedDateStr) {
                        // 如果已选中，打开表单并设置时间
                        const clickedDate = new Date(day);
                        clickedDate.setHours(hour, 0, 0, 0);
                        setSelectedDate(clickedDate);
                        setSelectedEvent(null);
                        setIsEventFormOpen(true);
                      } else {
                        // 否则选中该日期
                        setSelectedDateForView(dayOnly);
                      }
                    }}
                    className={`p-1 border-l border-gray-200 dark:border-gray-700 min-h-[60px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedDateForView && isSameDay(day, selectedDateForView)
                        ? "bg-green-50 dark:bg-green-900/10"
                        : ""
                    }`}
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event._id.toString()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className="text-xs p-1 mb-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render right side panel with events for selected date
  const renderEventSidebar = () => {
    if (!selectedDateForView) return null;

    const dayEvents = getEventsForDate(selectedDateForView);

    return (
      <div className="w-full lg:w-1/4 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(selectedDateForView, "MMMM d, yyyy")}
          </h2>
          <button
            onClick={() => setSelectedDateForView(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">No events for this day</p>
              <button
                onClick={() => {
                  setSelectedDate(selectedDateForView);
                  setSelectedEvent(null);
                  setIsEventFormOpen(true);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create event
              </button>
            </div>
          ) : (
            dayEvents.map((event) => (
              <div
                key={event._id.toString()}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(event.startTime), "HH:mm")} -{" "}
                      {format(new Date(event.endTime), "HH:mm")}
                    </p>
                    {event.location && event.location !== "No Location" && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        📍 {event.location}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setSelectedDate(new Date(event.startTime));
                      setIsEventFormOpen(true);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event._id.toString())}
                    className="flex-1 px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {viewMode === "monthly"
                ? format(currentDate, "MMMM yyyy")
                : `Week of ${format(currentDate, "MMMM d, yyyy")}`}
            </h1>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Today
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === "monthly"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode("weekly")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === "weekly"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Calendar View with Sidebar */}
        <div className="flex flex-col lg:flex-row">
          {loading ? (
            <div className="flex items-center justify-center h-96 flex-1">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : (
            <div className="flex-1 min-h-[600px] lg:pr-4">
              {viewMode === "monthly" ? renderMonthlyView() : renderWeeklyView()}
            </div>
          )}
          {renderEventSidebar()}
        </div>

        {/* Add Event Button (右下角) */}
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setSelectedEvent(null);
            setIsEventFormOpen(true);
          }}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Event Form Modal */}
        {isEventFormOpen && (
          <EventFormModal
            isOpen={isEventFormOpen}
            onClose={() => {
              setIsEventFormOpen(false);
              setSelectedDate(null);
              setSelectedEvent(null);
            }}
            onSave={handleEventSaved}
            selectedDate={selectedDate}
            event={selectedEvent}
          />
        )}
      </div>
    </div>
  );
}

