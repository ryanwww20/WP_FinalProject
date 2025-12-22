"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

type TimerMode = "work" | "shortBreak" | "longBreak";

export const TIMER_SETTINGS = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

interface PomodoroTimerState {
  timerMode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
  startTime: number | null; // Timestamp when timer started
  initialTimeLeft: number; // Time left when timer started
}

interface PomodoroTimerContextType {
  timerMode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: TimerMode) => void;
  formatTime: (seconds: number) => string;
}

const PomodoroTimerContext = createContext<PomodoroTimerContextType | undefined>(undefined);

const STORAGE_KEY = "pomodoro-timer-state";

// Load state from localStorage
function loadStateFromStorage(): Partial<PomodoroTimerState> | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const state = JSON.parse(stored);
    
    // If timer was running, calculate elapsed time
    if (state.isRunning && state.startTime) {
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      const newTimeLeft = Math.max(0, state.initialTimeLeft - elapsed);
      
      // If timer completed while away, handle completion
      if (newTimeLeft === 0) {
        return {
          ...state,
          isRunning: false,
          timeLeft: 0,
        };
      }
      
      return {
        ...state,
        timeLeft: newTimeLeft,
        startTime: state.startTime,
        initialTimeLeft: state.initialTimeLeft,
      };
    }
    
    return state;
  } catch (error) {
    console.error("Error loading timer state from storage:", error);
    return null;
  }
}

// Save state to localStorage
function saveStateToStorage(state: PomodoroTimerState) {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving timer state to storage:", error);
  }
}

export function PomodoroTimerProvider({ children }: { children: ReactNode }) {
  const [timerMode, setTimerMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [initialTimeLeft, setInitialTimeLeft] = useState(TIMER_SETTINGS.work);
  const [isApiSyncing, setIsApiSyncing] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing focus session on mount
  const checkExistingSession = useCallback(async () => {
    try {
      const response = await fetch('/api/focus-session');
      if (response.ok) {
        const data = await response.json();
        if (data.isActive && data.session) {
          // Resume the session from server state
          setSessionStartTime(new Date(data.session.startedAt));
          const elapsedSeconds = Math.floor((Date.now() - new Date(data.session.startedAt).getTime()) / 1000);
          const remainingSeconds = (data.session.targetDuration || 25) * 60 - elapsedSeconds;

          if (remainingSeconds > 0) {
            setTimeLeft(remainingSeconds);
            setIsRunning(true);
            setTimerMode('work');
            setStartTime(new Date(data.session.startedAt).getTime());
            setInitialTimeLeft(remainingSeconds + elapsedSeconds);
          }
          return { isActive: true };
        }
      }
      return { isActive: false };
    } catch (error) {
      console.error('Error checking existing session:', error);
      return { isActive: false };
    }
  }, []);

  // Load state from localStorage on mount and check for active session
  useEffect(() => {
    let hasServerSession = false;
    
    // First check for active focus session from server (takes priority)
    checkExistingSession().then((sessionData) => {
      hasServerSession = sessionData?.isActive || false;
      
      if (!hasServerSession) {
        // No server session, load from localStorage
        const savedState = loadStateFromStorage();
        if (savedState) {
          setTimerMode(savedState.timerMode || "work");
          setCompletedPomodoros(savedState.completedPomodoros ?? 0);
          
          // If timer was running, recalculate time left based on elapsed time
          if (savedState.isRunning && savedState.startTime && savedState.initialTimeLeft) {
            const elapsed = Math.floor((Date.now() - savedState.startTime) / 1000);
            const newTimeLeft = Math.max(0, savedState.initialTimeLeft - elapsed);
            
            if (newTimeLeft > 0) {
              // Timer is still running, restore it
              setTimeLeft(newTimeLeft);
              setIsRunning(true);
              setStartTime(savedState.startTime);
              setInitialTimeLeft(savedState.initialTimeLeft);
            } else {
              // Timer completed while away, handle completion
              setTimeLeft(0);
              setIsRunning(false);
              setStartTime(null);
              setInitialTimeLeft(savedState.initialTimeLeft);
              
              // Handle completion logic
              if (savedState.timerMode === "work") {
                const newCompleted = (savedState.completedPomodoros ?? 0) + 1;
                setCompletedPomodoros(newCompleted);
                if (newCompleted % 4 === 0) {
                  setTimerMode("longBreak");
                  setTimeLeft(TIMER_SETTINGS.longBreak);
                  setInitialTimeLeft(TIMER_SETTINGS.longBreak);
                } else {
                  setTimerMode("shortBreak");
                  setTimeLeft(TIMER_SETTINGS.shortBreak);
                  setInitialTimeLeft(TIMER_SETTINGS.shortBreak);
                }
              } else {
                setTimerMode("work");
                setTimeLeft(TIMER_SETTINGS.work);
                setInitialTimeLeft(TIMER_SETTINGS.work);
              }
            }
          } else {
            // Timer was not running, just restore state
            setTimeLeft(savedState.timeLeft ?? TIMER_SETTINGS.work);
            setIsRunning(false);
            setStartTime(null);
            setInitialTimeLeft(savedState.initialTimeLeft ?? TIMER_SETTINGS.work);
          }
        }
      } else {
        // Server session exists, just restore completed pomodoros from localStorage
        const savedState = loadStateFromStorage();
        if (savedState) {
          setCompletedPomodoros(savedState.completedPomodoros ?? 0);
        }
      }
    });
  }, [checkExistingSession]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveStateToStorage({
      timerMode,
      timeLeft,
      isRunning,
      completedPomodoros,
      startTime,
      initialTimeLeft,
    });
  }, [timerMode, timeLeft, isRunning, completedPomodoros, startTime, initialTimeLeft]);

  // Timer effect - runs continuously and calculates time based on startTime
  useEffect(() => {
    if (isRunning && timeLeft > 0 && startTime) {
      // Calculate time left based on elapsed time
      const updateTime = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTimeLeft = Math.max(0, initialTimeLeft - elapsed);
        setTimeLeft(newTimeLeft);
        
        // If timer completed, it will be handled by the completion effect
        if (newTimeLeft === 0) {
          setIsRunning(false);
          setStartTime(null);
        }
      };
      
      // Update immediately
      updateTime();
      
      // Then update every second
      intervalRef.current = setInterval(updateTime, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, startTime, initialTimeLeft]);

  // Stop focus session (API integration)
  const stopFocusSession = useCallback(async () => {
    if (isApiSyncing || !sessionStartTime) return;

    setIsApiSyncing(true);
    try {
      console.log('[PomodoroTimer] Stopping focus session...');
      const response = await fetch('/api/focus-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[PomodoroTimer] Session completed: ${data.studyTime} minutes studied`);
        setSessionStartTime(null);
      } else {
        const error = await response.json();
        console.error('Failed to stop session:', error);
      }
    } catch (error) {
      console.error('Error stopping session:', error);
    } finally {
      setIsApiSyncing(false);
    }
  }, [isApiSyncing, sessionStartTime]);

  // Start focus session (API integration)
  const startFocusSession = useCallback(async () => {
    if (isApiSyncing) return;

    setIsApiSyncing(true);
    try {
      console.log('[PomodoroTimer] Starting focus session...');
      const response = await fetch('/api/focus-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: 'pomodoro',
          targetDuration: Math.floor(TIMER_SETTINGS.work / 60), // Convert seconds to minutes
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[PomodoroTimer] Focus session started:', data);
        setSessionStartTime(new Date(data.session.startedAt));
      } else {
        const error = await response.json();
        console.error('Failed to start session:', error);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsApiSyncing(false);
    }
  }, [isApiSyncing]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setStartTime(null);
      
      if (timerMode === "work") {
        // Work session completed - sync with API
        stopFocusSession();
        const newCompleted = completedPomodoros + 1;
        setCompletedPomodoros(newCompleted);
        
        // After 4 pomodoros, take a long break
        if (newCompleted % 4 === 0) {
          setTimerMode("longBreak");
          setTimeLeft(TIMER_SETTINGS.longBreak);
          setInitialTimeLeft(TIMER_SETTINGS.longBreak);
        } else {
          setTimerMode("shortBreak");
          setTimeLeft(TIMER_SETTINGS.shortBreak);
          setInitialTimeLeft(TIMER_SETTINGS.shortBreak);
        }
      } else {
        setTimerMode("work");
        setTimeLeft(TIMER_SETTINGS.work);
        setInitialTimeLeft(TIMER_SETTINGS.work);
      }
    }
  }, [timeLeft, isRunning, timerMode, completedPomodoros, stopFocusSession]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => {
      const newRunning = !prev;
      if (newRunning) {
        // Starting timer - record start time
        setStartTime(Date.now());
        setInitialTimeLeft(timeLeft);
        
        // If starting work mode, sync with API
        if (timerMode === 'work' && !sessionStartTime) {
          startFocusSession();
        }
      } else {
        // Pausing timer - clear start time
        setStartTime(null);
        
        // If pausing work mode, stop API session
        if (timerMode === 'work' && sessionStartTime) {
          stopFocusSession();
        }
      }
      return newRunning;
    });
  }, [timeLeft, timerMode, sessionStartTime, startFocusSession, stopFocusSession]);

  const resetTimer = useCallback(() => {
    if (isRunning && timerMode === 'work' && sessionStartTime) {
      // Stop API session when resetting active work timer
      stopFocusSession();
    }
    setIsRunning(false);
    setStartTime(null);
    const resetTime = TIMER_SETTINGS[timerMode];
    setTimeLeft(resetTime);
    setInitialTimeLeft(resetTime);
  }, [timerMode, isRunning, sessionStartTime, stopFocusSession]);

  const switchMode = useCallback((mode: TimerMode) => {
    if (isRunning && timerMode === 'work' && sessionStartTime) {
      // Stop API session when switching modes
      stopFocusSession();
    }
    setIsRunning(false);
    setStartTime(null);
    setTimerMode(mode);
    const newTime = TIMER_SETTINGS[mode];
    setTimeLeft(newTime);
    setInitialTimeLeft(newTime);
  }, [isRunning, timerMode, sessionStartTime, stopFocusSession]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return (
    <PomodoroTimerContext.Provider
      value={{
        timerMode,
        timeLeft,
        isRunning,
        completedPomodoros,
        toggleTimer,
        resetTimer,
        switchMode,
        formatTime,
      }}
    >
      {children}
    </PomodoroTimerContext.Provider>
  );
}

export function usePomodoroTimer() {
  const context = useContext(PomodoroTimerContext);
  if (context === undefined) {
    throw new Error("usePomodoroTimer must be used within a PomodoroTimerProvider");
  }
  return context;
}

