"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

// Pomodoro Timer modes
type TimerMode = "work" | "shortBreak" | "longBreak";

const TIMER_SETTINGS = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

export default function Dashboard() {
  const { data: session } = useSession();
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
  const [todaysTodos, setTodaysTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Pomodoro Timer Effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      if (timerMode === "work") {
        setCompletedPomodoros((prev) => prev + 1);
        // After 4 pomodoros, take a long break
        if ((completedPomodoros + 1) % 4 === 0) {
          setTimerMode("longBreak");
          setTimeLeft(TIMER_SETTINGS.longBreak);
        } else {
          setTimerMode("shortBreak");
          setTimeLeft(TIMER_SETTINGS.shortBreak);
        }
      } else {
        setTimerMode("work");
        setTimeLeft(TIMER_SETTINGS.work);
      }
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, timerMode, completedPomodoros]);

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

  // Timer controls
  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(TIMER_SETTINGS[timerMode]);
  }, [timerMode]);

  const switchMode = useCallback((mode: TimerMode) => {
    setIsRunning(false);
    setTimerMode(mode);
    setTimeLeft(TIMER_SETTINGS[mode]);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Pomodoro Timer */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-6">Pomodoro Timer</h2>
              
              {/* Mode Selector */}
              <div className="flex justify-center gap-2 mb-8">
                <button
                  onClick={() => switchMode("work")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timerMode === "work"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Focus
                </button>
                <button
                  onClick={() => switchMode("shortBreak")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timerMode === "shortBreak"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Short Break
                </button>
                <button
                  onClick={() => switchMode("longBreak")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timerMode === "longBreak"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Long Break
                </button>
              </div>

              {/* Timer Display */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 120}
                    strokeDashoffset={
                      2 * Math.PI * 120 * (1 - timeLeft / TIMER_SETTINGS[timerMode])
                    }
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${
                      timerMode === "work" ? "text-primary" : "text-green-500"
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-foreground tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-sm text-muted-foreground mt-2 capitalize">
                    {timerMode === "work" ? "Focus Time" : timerMode === "shortBreak" ? "Short Break" : "Long Break"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={toggleTimer}
                  className={`px-8 py-3 rounded-full text-lg font-semibold transition-all ${
                    isRunning
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {isRunning ? "Pause" : "Start"}
                </button>
                <button
                  onClick={resetTimer}
                  className="px-6 py-3 rounded-full text-lg font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* Completed Pomodoros */}
              <div className="mt-8 flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Completed today:</span>
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < completedPomodoros % 4
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-foreground">{completedPomodoros}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Schedule & Stats (Sticky) */}
        <div className="space-y-4">
          <div className="sticky top-20 space-y-6">
            {/* Today's Schedule */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Today's Schedule</h2>
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden max-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                          className={`p-3 hover:bg-muted/50 transition-colors ${
                            isPast ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-mono text-muted-foreground min-w-[40px]">
                              {format(new Date(item.startTime), "HH:mm")}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isPast ? "text-muted-foreground" : "text-foreground"}`}>
                                {item.title}
                              </p>
                              <span
                                className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  item.type === "event"
                                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200"
                                    : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200"
                                }`}
                              >
                                {item.type === "event" ? "Event" : "Todo"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No schedule for today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Overview Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Overview</h3>
              <div className="space-y-3">
                {/* Events Today */}
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Events Today</p>
                      <h3 className="text-xl font-bold text-foreground">{todaysEvents.length}</h3>
                    </div>
                  </div>
                </div>

                {/* Remaining */}
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-secondary/10 text-secondary rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <h3 className="text-xl font-bold text-foreground">{upcomingEventsCount}</h3>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Tasks</p>
                      <h3 className="text-xl font-bold text-foreground">{todaysTodos.length}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
