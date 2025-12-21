"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type TimerMode = "work" | "shortBreak" | "longBreak";

const TIMER_SETTINGS = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

interface PomodoroTimerProps {
  compact?: boolean; // 是否使用紧凑模式（用于 Laptop 屏幕）
}

export default function PomodoroTimer({ compact = false }: PomodoroTimerProps) {
  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  if (compact) {
    // 紧凑模式 - 用于 Laptop 屏幕
    return (
      <div className="h-full flex flex-col p-2 min-h-0">
        <h3 className="text-[8px] font-bold text-primary mb-1 flex-shrink-0">Pomodoro Timer</h3>
        
        {/* Timer Display - 小型圆形进度条 */}
        <div className="relative w-full max-w-[55%] mx-auto mb-1.5 flex-shrink-0" style={{ aspectRatio: '1 / 1' }}>
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}%`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeLeft / TIMER_SETTINGS[timerMode])}%`}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                timerMode === "work" ? "text-primary" : "text-green-500"
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[12px] font-bold text-foreground tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[5px] text-muted-foreground mt-0.5 capitalize">
              {timerMode === "work" ? "Focus" : timerMode === "shortBreak" ? "Break" : "Long Break"}
            </span>
          </div>
        </div>

        {/* Mode Selector - 紧凑版 */}
        <div className="flex gap-0.5 mb-1.5 flex-shrink-0">
          <button
            onClick={() => switchMode("work")}
            className={`flex-1 px-0.5 py-0.5 rounded text-[5px] font-medium transition-colors ${
              timerMode === "work"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={`flex-1 px-0.5 py-0.5 rounded text-[5px] font-medium transition-colors ${
              timerMode === "shortBreak"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Short
          </button>
          <button
            onClick={() => switchMode("longBreak")}
            className={`flex-1 px-0.5 py-0.5 rounded text-[5px] font-medium transition-colors ${
              timerMode === "longBreak"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Long
          </button>
        </div>

        {/* Controls - 紧凑版 */}
        <div className="flex gap-1 mb-1.5 flex-shrink-0">
          <button
            onClick={toggleTimer}
            className={`flex-1 px-1.5 py-1 rounded text-[6px] font-semibold transition-all ${
              isRunning
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={resetTimer}
            className="flex-1 px-1.5 py-1 rounded text-[6px] font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Completed Pomodoros - 紧凑版 */}
        <div className="flex items-center justify-center gap-1 mt-auto pt-1 flex-shrink-0">
          <span className="text-[5px] text-muted-foreground">Done:</span>
          <div className="flex gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                  i < completedPomodoros % 4
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-[6px] font-medium text-foreground ml-0.5">{completedPomodoros}</span>
        </div>
      </div>
    );
  }

  // 完整模式 - 用于 Monitor 屏幕（如果需要的话）
  return (
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
            className={`px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 ${
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
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
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
  );
}

