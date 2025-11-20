"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format, startOfDay, endOfDay } from "date-fns";

interface CalendarEvent {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.userId) {
      fetchTodaysEvents();
    }
  }, [session]);

  const fetchTodaysEvents = async () => {
    try {
      const now = new Date();
      const startDate = startOfDay(now).toISOString();
      const endDate = endOfDay(now).toISOString();

      const response = await fetch(
        `/api/calendar?startDate=${startDate}&endDate=${endDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setTodaysEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-left">
        <div className="flex items-center space-x-4">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h2 className="text-2xl font-semibold">
              Welcome back, {session.user?.name}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Todo for Today Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">📝</span> Todo for Today
            </h2>
            <span className="text-xs font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full">
              Coming Soon
            </span>
          </div>
          <div className="space-y-3">
            <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400 italic">
                Stay tuned! Your daily tasks will appear here.
              </p>
            </div>
          </div>
        </div>

        {/* Deadlines/Events Today Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">📅</span> Deadlines Today
            </h2>
            <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
              {loading ? "..." : `${todaysEvents.length} Events`}
            </span>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : todaysEvents.length > 0 ? (
              todaysEvents.map((event) => (
                <div 
                  key={event._id} 
                  className="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </h3>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                      {format(new Date(event.startTime), "HH:mm")}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {event.description}
                    </p>
                  )}
                  {event.location && event.location !== "No Location" && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>📍</span> {event.location}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No deadlines or events scheduled for today.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Enjoy your free time!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

