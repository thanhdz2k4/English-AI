'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { GoalsResponse, GoalSettings } from '@/types';

const DEFAULT_GOAL: GoalSettings = {
  weeklySessionGoal: 3,
  reminderEnabled: false,
  reminderTime: '19:00',
  reminderTimezone: null,
};

export default function GoalsPage() {
  const router = useRouter();
  const [goal, setGoal] = useState<GoalSettings>(DEFAULT_GOAL);
  const [progress, setProgress] = useState<GoalsResponse['progress'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const reminderTimerRef = useRef<number | null>(null);

  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        const user = data.user;
        setDisplayName(user?.name || user?.email || null);
        await fetchGoals();
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
        return;
      } finally {
        setIsAuthReady(true);
      }
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    if (!goal.reminderEnabled) {
      if (reminderTimerRef.current) {
        window.clearTimeout(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
      return;
    }

    if (reminderTimerRef.current) {
      window.clearTimeout(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }

    const scheduleReminder = () => {
      const [hourStr, minuteStr] = goal.reminderTime.split(':');
      const target = new Date();
      target.setHours(Number(hourStr), Number(minuteStr), 0, 0);
      if (target.getTime() <= Date.now()) {
        target.setDate(target.getDate() + 1);
      }

      const delay = target.getTime() - Date.now();
      reminderTimerRef.current = window.setTimeout(() => {
        if (Notification?.permission === 'granted') {
          new Notification('English AI Reminder', {
            body: 'Time to practice your English today.',
          });
        } else {
          setReminderMessage('Reminder: time to practice your English today.');
        }
        scheduleReminder();
      }, delay);
    };

    scheduleReminder();

    return () => {
      if (reminderTimerRef.current) {
        window.clearTimeout(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
    };
  }, [goal.reminderEnabled, goal.reminderTime]);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/goals');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load goals');
      }
      const data: GoalsResponse = await response.json();
      setGoal(data.goal);
      setProgress(data.progress);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setStatusMessage(null);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goal,
          reminderTimezone: goal.reminderTimezone || timeZone,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatusMessage(data.error || 'Failed to update goals');
        return;
      }
      const data: GoalsResponse = await response.json();
      setGoal(data.goal);
      setProgress(data.progress);
      setStatusMessage('Goals updated.');
    } catch (error) {
      console.error('Error updating goals:', error);
      setStatusMessage('Failed to update goals');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  const progressPercent = progress
    ? Math.min(
        100,
        Math.round(
          (progress.weeklyCompleted / goal.weeklySessionGoal) * 100
        )
      )
    : 0;

  const reminderLabel =
    goal.reminderEnabled && Notification?.permission !== 'granted'
      ? 'Enable notifications in your browser for alerts.'
      : 'Browser reminders trigger when this page is open.';

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4 inline-block"
          >
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Personalized Goals
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Set weekly targets and track your streak.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {displayName && (
              <span className="text-gray-500 dark:text-gray-400">
                Signed in as {displayName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Sign out
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">Loading...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Weekly progress
                </div>
                <div className="text-3xl font-bold mt-2">
                  {progress?.weeklyCompleted ?? 0}/{goal.weeklySessionGoal}
                </div>
                <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Current streak
                </div>
                <div className="text-3xl font-bold mt-2">
                  {progress?.streakDays ?? 0} days
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Last active:{' '}
                  {progress?.lastCompletedAt
                    ? new Date(progress.lastCompletedAt).toLocaleDateString()
                    : 'No sessions yet'}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Reminder status
                </div>
                <div className="text-3xl font-bold mt-2">
                  {goal.reminderEnabled ? 'On' : 'Off'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {reminderLabel}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Weekly session goal
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={goal.weeklySessionGoal}
                  onChange={(event) =>
                    setGoal((prev) => ({
                      ...prev,
                      weeklySessionGoal: Number(event.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="reminder-enabled"
                  type="checkbox"
                  checked={goal.reminderEnabled}
                  onChange={(event) =>
                    setGoal((prev) => ({
                      ...prev,
                      reminderEnabled: event.target.checked,
                    }))
                  }
                />
                <label htmlFor="reminder-enabled" className="text-sm font-semibold">
                  Enable daily reminder
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Reminder time
                </label>
                <input
                  type="time"
                  value={goal.reminderTime}
                  onChange={(event) =>
                    setGoal((prev) => ({
                      ...prev,
                      reminderTime: event.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Time zone: {goal.reminderTimezone || timeZone}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Save goals
                </button>
                {Notification?.permission !== 'granted' && (
                  <button
                    onClick={() => Notification.requestPermission()}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm"
                  >
                    Enable notifications
                  </button>
                )}
                {statusMessage && (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {statusMessage}
                  </span>
                )}
              </div>
              {reminderMessage && (
                <div className="rounded-md bg-yellow-100 dark:bg-yellow-900 px-3 py-2 text-sm">
                  {reminderMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
