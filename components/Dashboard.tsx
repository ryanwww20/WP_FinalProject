"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format, startOfDay, endOfDay, isAfter, addDays } from "date-fns";
import Link from "next/link";

interface CalendarEvent {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
}

interface TodoItem {
  _id: string;
  title: string;
  dueDate: string;
  description?: string;
  completed: boolean;
}

type ScheduleItem =
  | (CalendarEvent & { type: "event" })
  | ({
      _id: string;
      title: string;
      startTime: string;
      endTime: string;
      description?: string;
      completed: boolean;
    } & { type: "todo" });

export default function Dashboard() {
  const { data: session } = useSession();
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
  const [todaysTodos, setTodaysTodos] = useState<TodoItem[]>([]);
  const [tomorrowsEvents, setTomorrowsEvents] = useState<CalendarEvent[]>([]);
  const [tomorrowsTodos, setTomorrowsTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [studyingCount, setStudyingCount] = useState<number>(0);

  const fetchTodayData = useCallback(async () => {
    try {
      const now = new Date();
      const startDate = startOfDay(now).toISOString();
      const endDate = endOfDay(now).toISOString();

      const [eventsResponse, todosResponse] = await Promise.all([
        fetch(`/api/calendar?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/todos?startDate=${startDate}&endDate=${endDate}`),
      ]);

      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        const events = data.events || [];
        events.sort((a: CalendarEvent, b: CalendarEvent) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setTodaysEvents(events);
      }

      if (todosResponse.ok) {
        const todoData = await todosResponse.json();
        const todos: TodoItem[] = (todoData.todos || []).sort(
          (a: TodoItem, b: TodoItem) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        setTodaysTodos(todos);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTomorrowData = useCallback(async () => {
    try {
      const tomorrow = addDays(new Date(), 1);
      const startDate = startOfDay(tomorrow).toISOString();
      const endDate = endOfDay(tomorrow).toISOString();

      const [eventsResponse, todosResponse] = await Promise.all([
        fetch(`/api/calendar?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/todos?startDate=${startDate}&endDate=${endDate}`),
      ]);

      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        const events = data.events || [];
        events.sort((a: CalendarEvent, b: CalendarEvent) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setTomorrowsEvents(events);
      }

      if (todosResponse.ok) {
        const todoData = await todosResponse.json();
        const todos: TodoItem[] = (todoData.todos || []).sort(
          (a: TodoItem, b: TodoItem) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        setTomorrowsTodos(todos);
      }
    } catch (error) {
      console.error("Error fetching tomorrow's events:", error);
    }
  }, []);

  // Fetch studying count from all groups
  const fetchStudyingCount = useCallback(async () => {
    try {
      const response = await fetch('/api/groups/studying-count');
      if (response.ok) {
        const data = await response.json();
        setStudyingCount(data.studyingCount || 0);
      }
    } catch (error) {
      console.error('Error fetching studying count:', error);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.userId) return;

    let midnightTimeout: ReturnType<typeof setTimeout>;

    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = startOfDay(addDays(now, 1));
      const delay = nextMidnight.getTime() - now.getTime();
      midnightTimeout = setTimeout(() => {
        fetchTodayData();
        fetchTomorrowData();
        scheduleMidnightRefresh();
      }, delay);
    };

    fetchTodayData();
    fetchTomorrowData();
    fetchStudyingCount();
    scheduleMidnightRefresh();

    // Refresh studying count every 30 seconds
    const studyingInterval = setInterval(fetchStudyingCount, 30000);

    return () => {
      clearTimeout(midnightTimeout);
      clearInterval(studyingInterval);
    };
  }, [session?.user?.userId, fetchTodayData, fetchTomorrowData, fetchStudyingCount]);

  if (!session) return null;

  const upcomingEventsCount = todaysEvents.filter(e => isAfter(new Date(e.endTime), new Date())).length;
  const scheduleItems: ScheduleItem[] = [
    ...todaysEvents.map((event) => ({ ...event, type: "event" as const })),
    ...todaysTodos.map((todo) => ({
      _id: todo._id,
      title: todo.title,
      startTime: todo.dueDate,
      endTime: todo.dueDate,
      description: todo.description,
      completed: todo.completed,
      type: "todo" as const,
    })),
  ].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const tomorrowScheduleItems: ScheduleItem[] = [
    ...tomorrowsEvents.map((event) => ({ ...event, type: "event" as const })),
    ...tomorrowsTodos.map((todo) => ({
      _id: todo._id,
      title: todo.title,
      startTime: todo.dueDate,
      endTime: todo.dueDate,
      description: todo.description,
      completed: todo.completed,
      type: "todo" as const,
    })),
  ].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {session.user?.name?.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening today, {format(new Date(), "MMMM do")}
            </p>
          </div>
          <Link
            href="/calendar"
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <span>View Full Calendar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
              </div>

        {/* Schedule & Stats */}
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left Column - Schedule */}
          <div className="md:col-span-4 space-y-6">
            <div className="sticky top-20 space-y-6">
              {/* Today's Schedule */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Today's Schedule</h2>
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                        <p className="text-sm text-muted-foreground">Loading schedule...</p>
                      </div>
                    </div>
                  ) : scheduleItems.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {scheduleItems.map((item) => {
                        const itemEnd = item.endTime
                          ? new Date(item.endTime)
                          : new Date(item.startTime);
                        const isPast =
                          item.type === "todo"
                            ? item.completed || !isAfter(itemEnd, new Date())
                            : !isAfter(itemEnd, new Date());
                        return (
                          <div
                            key={`${item.type}-${item._id}`}
                            className={`p-5 hover:bg-muted/60 transition-all duration-200 ${
                              isPast ? "opacity-60 bg-muted/20" : "bg-card"
                            }`}
                          >
                            <div className="flex items-start gap-5">
                              {/* Time Display */}
                              <div className="flex flex-col items-center min-w-[60px]">
                                <span className={`text-base font-bold font-mono ${
                                  isPast ? "text-muted-foreground" : "text-primary"
                                }`}>
                                  {format(new Date(item.startTime), "HH:mm")}
                                </span>
                                {item.endTime && item.startTime !== item.endTime && (
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    {format(new Date(item.endTime), "HH:mm")}
                                  </span>
                                )}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {/* Icon */}
                                  {item.type === "event" ? (
                                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                  <p className={`text-lg font-semibold ${isPast ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                    {item.title}
                                  </p>
                                </div>
                                
                                {/* Badge and Description */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                                      item.type === "event"
                                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                        : "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                                    }`}
                                  >
                                    {item.type === "event" ? "Event" : "Todo"}
                                  </span>
                                  {item.description && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {item.description}
                                    </span>
                                  )}
                                  {item.type === "todo" && item.completed && (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                      ✓ Completed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <svg className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-base font-medium text-muted-foreground">No schedule for today</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Add events or todos to see them here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tomorrow's Schedule */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Tomorrow's Schedule</h2>
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                        <p className="text-sm text-muted-foreground">Loading schedule...</p>
                      </div>
                    </div>
                  ) : tomorrowScheduleItems.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {tomorrowScheduleItems.map((item) => {
                        return (
                          <div
                            key={`${item.type}-${item._id}`}
                            className="p-5 hover:bg-muted/60 transition-all duration-200 bg-card"
                          >
                            <div className="flex items-start gap-5">
                              {/* Time Display */}
                              <div className="flex flex-col items-center min-w-[60px]">
                                <span className="text-base font-bold font-mono text-primary">
                                  {format(new Date(item.startTime), "HH:mm")}
                                </span>
                                {item.endTime && item.startTime !== item.endTime && (
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    {format(new Date(item.endTime), "HH:mm")}
                                  </span>
                                )}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {/* Icon */}
                                  {item.type === "event" ? (
                                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                  <p className="text-lg font-semibold text-foreground">
                                    {item.title}
                                  </p>
                                </div>
                                
                                {/* Badge and Description */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                                      item.type === "event"
                                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                        : "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                                    }`}
                                  >
                                    {item.type === "event" ? "Event" : "Todo"}
                                  </span>
                                  {item.description && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {item.description}
                                    </span>
                                  )}
                                  {item.type === "todo" && item.completed && (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                      ✓ Completed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <svg className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-base font-medium text-muted-foreground">No schedule for tomorrow</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Add events or todos to see them here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Overview */}
          <div className="md:col-span-1 max-w-[200px]">
            <h3 className="text-base font-semibold text-foreground mb-3 uppercase tracking-wider">Overview</h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Events Today */}
              <div className="bg-gradient-to-br from-card to-card/80 p-4 rounded-xl shadow-md border border-border/50 aspect-square flex flex-col items-center justify-center w-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                {/* Icon with background */}
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
                  <div className="relative p-2.5 bg-primary/10 text-primary rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                {/* Number - Large and prominent */}
                <h3 className="text-4xl font-extrabold text-foreground mb-2 tabular-nums">
                  {todaysEvents.length}
                </h3>
                
                {/* Label */}
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
                  Events Today
                </p>
              </div>

              {/* Studying Now */}
              <div className="bg-gradient-to-br from-card to-card/80 p-4 rounded-xl shadow-md border border-border/50 aspect-square flex flex-col items-center justify-center w-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                {/* Icon with background */}
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md"></div>
                  <div className="relative p-2.5 bg-green-500/10 text-green-500 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                
                {/* Number - Large and prominent */}
                <h3 className="text-4xl font-extrabold text-foreground mb-2 tabular-nums">
                  {studyingCount}
                </h3>
                
                {/* Label */}
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
                  Studying Now
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
