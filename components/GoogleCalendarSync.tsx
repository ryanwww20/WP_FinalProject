"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SyncStatus {
  connected: boolean;
  hasSyncToken: boolean;
}

export default function GoogleCalendarSync() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/google-calendar/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching Google Calendar status:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-calendar/connect');
      if (response.ok) {
        const data = await response.json();
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        setMessage({ type: 'error', text: 'Failed to initiate connection' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error connecting to Google Calendar' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'DELETE',
      });
      if (response.ok) {
        setStatus({ connected: false, hasSyncToken: false });
        setMessage({ type: 'success', text: 'Disconnected from Google Calendar' });
      } else {
        setMessage({ type: 'error', text: 'Failed to disconnect' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error disconnecting from Google Calendar' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Sync completed! Synced ${data.syncedToGoogle} events to Google, ${data.syncedFromGoogle} events from Google.`,
        });
        // Refresh the calendar view
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error syncing with Google Calendar' });
    } finally {
      setSyncing(false);
    }
  };

  // Check for URL parameters (from callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setMessage({ type: 'success', text: 'Successfully connected to Google Calendar!' });
      fetchStatus();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error')) {
      setMessage({ type: 'error', text: 'Failed to connect to Google Calendar' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!session?.user?.userId) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Google Calendar Sync
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {status?.connected
                ? 'Connected and ready to sync'
                : 'Connect your Google Calendar to sync events'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status?.connected ? (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {syncing ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Sync Now
                  </>
                )}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                'Connecting...'
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Connect Google Calendar
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

