"use client";

import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.userId) return;

    let midnightTimeout: ReturnType<typeof setTimeout>;

    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = startOfDay(addDays(now, 1));
      const delay = nextMidnight.getTime() - now.getTime();
      midnightTimeout = setTimeout(() => {
        fetchTodayData();
        scheduleMidnightRefresh();
      }, delay);
    };

    fetchTodayData();
    scheduleMidnightRefresh();

    return () => {
      clearTimeout(midnightTimeout);
    };
  }, [session?.user?.userId]);

  const fetchTodayData = async () => {
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
        // Sort events by start time
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
  };

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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-4 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Events Today</p>
              <h3 className="text-2xl font-bold text-foreground">{todaysEvents.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 text-secondary rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <h3 className="text-2xl font-bold text-foreground">{upcomingEventsCount}</h3>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasks</p>
              <h3 className="text-2xl font-bold text-foreground">
                {todaysTodos.length}
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Schedule Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
          </div>
          
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : scheduleItems.length > 0 ? (
              <div className="divide-y divide-border">
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
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        isPast ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center min-w-[4rem]">
                          <span className="text-sm font-semibold text-foreground">
                            {format(new Date(item.startTime), "HH:mm")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.type === "event"
                              ? format(new Date(item.endTime), "HH:mm")
                              : "Due"}
                          </span>
                          <div
                            className={`h-full w-0.5 mt-2 ${
                              isPast ? "bg-border" : "bg-primary/30"
                            }`}
                          ></div>
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`font-medium ${
                              isPast ? "text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.type === "event"
                                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200"
                                  : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200"
                              }`}
                            >
                              {item.type === "event" ? "Event" : "Todo"}
                            </span>
                            {item.type === "todo" && (
                              <span>
                                {item.completed ? "Completed" : "Pending"}
                              </span>
                            )}
                          </div>
                          {item.type === "event" && item.location && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {item.location}
                            </div>
                          )}
                          {item.type === "todo" && item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.type === "event" && isPast && (
                          <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full h-fit">
                            Done
                          </span>
                        )}
                        {item.type === "todo" && item.completed && (
                          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full h-fit">
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">Nothing scheduled today</h3>
                <p className="text-muted-foreground">You're all caught up! Enjoy your free time.</p>
                <Link 
                  href="/calendar"
                  className="mt-4 text-primary hover:underline text-sm"
                >
                  Schedule an event
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tasks/Todo Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          </div>
          
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 h-[400px] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
              </div>
            ) : todaysTodos.length > 0 ? (
              <div className="space-y-4">
                {todaysTodos.map((todo) => {
                  const due = new Date(todo.dueDate);
                  const isDone = todo.completed;
                  return (
                    <div
                      key={todo._id}
                      className="p-4 border border-border/70 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Due {format(due, "HH:mm")}
                          </p>
                          <h3 className="font-semibold text-foreground">
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {todo.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            isDone
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                          }`}
                        >
                          {isDone ? "Completed" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-4 bg-secondary/10 rounded-full">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">No to-dos today</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a todo to see it appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
