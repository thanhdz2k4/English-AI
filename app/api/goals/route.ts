import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getGoalProgress, getOrCreateGoal, updateGoal } from '@/services/goalService';

function isValidTime(value: string) {
  return /^([01]\\d|2[0-3]):([0-5]\\d)$/.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goal = await getOrCreateGoal(user.id);
    const progress = await getGoalProgress(user.id);

    return NextResponse.json({
      goal: {
        weeklySessionGoal: goal.weeklySessionGoal,
        reminderEnabled: goal.reminderEnabled,
        reminderTime: goal.reminderTime,
        reminderTimezone: goal.reminderTimezone,
      },
      progress,
    });
  } catch (error) {
    console.error('Error loading goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const weeklySessionGoalRaw = body.weeklySessionGoal;
    const reminderEnabled = Boolean(body.reminderEnabled);
    const reminderTime = String(body.reminderTime ?? '19:00').trim();
    const reminderTimezone = body.reminderTimezone
      ? String(body.reminderTimezone).trim()
      : null;

    let weeklySessionGoal: number | undefined;
    if (weeklySessionGoalRaw !== undefined) {
      const parsed = Number(weeklySessionGoalRaw);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 50) {
        return NextResponse.json(
          { error: 'weeklySessionGoal must be between 1 and 50' },
          { status: 400 }
        );
      }
      weeklySessionGoal = Math.round(parsed);
    }

    if (!isValidTime(reminderTime)) {
      return NextResponse.json(
        { error: 'reminderTime must be HH:MM' },
        { status: 400 }
      );
    }

    const goal = await updateGoal(user.id, {
      weeklySessionGoal,
      reminderEnabled,
      reminderTime,
      reminderTimezone,
    });
    const progress = await getGoalProgress(user.id);

    return NextResponse.json({
      goal: {
        weeklySessionGoal: goal.weeklySessionGoal,
        reminderEnabled: goal.reminderEnabled,
        reminderTime: goal.reminderTime,
        reminderTimezone: goal.reminderTimezone,
      },
      progress,
    });
  } catch (error) {
    console.error('Error updating goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
