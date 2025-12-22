"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { PusherProvider } from "./PusherProvider";
import { PomodoroTimerProvider } from "./PomodoroTimerContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <PusherProvider>
          <PomodoroTimerProvider>
            {children}
          </PomodoroTimerProvider>
        </PusherProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

