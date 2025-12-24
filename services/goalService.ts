import { prisma } from '@/lib/prisma';
import { SessionStatus } from '@prisma/client';

const DEFAULT_WEEKLY_GOAL = 3;

function startOfWeekUtc(date: Date) {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - diff
  ));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function dateKeyUtc(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreak(dates: Set<string>, today: Date) {
  const todayKey = dateKeyUtc(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const yesterdayKey = dateKeyUtc(yesterday);

  let current = dates.has(todayKey) ? today : yesterday;
  let currentKey = dateKeyUtc(current);
  if (!dates.has(currentKey)) return 0;

  let streak = 0;
  while (dates.has(currentKey)) {
    streak += 1;
    current.setUTCDate(current.getUTCDate() - 1);
    currentKey = dateKeyUtc(current);
  }
  return streak;
}

export async function getOrCreateGoal(userId: string) {
  return prisma.userGoal.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      weeklySessionGoal: DEFAULT_WEEKLY_GOAL,
    },
  });
}

export async function updateGoal(
  userId: string,
  data: {
    weeklySessionGoal?: number;
    reminderEnabled?: boolean;
    reminderTime?: string;
    reminderTimezone?: string | null;
  }
) {
  return prisma.userGoal.upsert({
    where: { userId },
    update: {
      weeklySessionGoal: data.weeklySessionGoal,
      reminderEnabled: data.reminderEnabled,
      reminderTime: data.reminderTime,
      reminderTimezone: data.reminderTimezone ?? null,
    },
    create: {
      userId,
      weeklySessionGoal: data.weeklySessionGoal ?? DEFAULT_WEEKLY_GOAL,
      reminderEnabled: data.reminderEnabled ?? false,
      reminderTime: data.reminderTime ?? '19:00',
      reminderTimezone: data.reminderTimezone ?? null,
    },
  });
}

export async function getGoalProgress(userId: string) {
  const now = new Date();
  const weekStart = startOfWeekUtc(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  const weeklyCompleted = await prisma.writingSession.count({
    where: {
      userId,
      status: SessionStatus.COMPLETED,
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const recentSessions = await prisma.writingSession.findMany({
    where: {
      userId,
      status: SessionStatus.COMPLETED,
      createdAt: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const dateSet = new Set(
    recentSessions.map((s) => dateKeyUtc(s.createdAt))
  );
  const streakDays = calculateStreak(dateSet, now);
  const lastCompletedAt = recentSessions[0]?.createdAt?.toISOString() ?? null;

  return {
    weeklyCompleted,
    streakDays,
    lastCompletedAt,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
}
