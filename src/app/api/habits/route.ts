import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTodayDateString, evaluateTaskOccurrence, DEFAULT_TIMEZONE } from '@/lib/date-utils';
import { calculateHabitStreaks } from '@/lib/streaks';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get('includeArchived') === 'true';

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { timezone: true },
  });
  const userTimezone = user?.timezone || DEFAULT_TIMEZONE;
  const todayStr = getTodayDateString(userTimezone);

  const habits = await db.habit.findMany({
    where: {
      userId: session.userId,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: { createdAt: 'asc' },
  });

  // Fetch all logs for calculations
  const allLogs = await db.habitLog.findMany({
    where: {
      userId: session.userId,
    },
  });

  const logsByHabit = new Map<string, Set<string>>();
  allLogs.forEach((l) => {
    if (l.completed) {
      if (!logsByHabit.has(l.habitId)) {
        logsByHabit.set(l.habitId, new Set());
      }
      logsByHabit.get(l.habitId)!.add(l.date);
    }
  });

  const nowDate = new Date();

  const enrichedHabits = habits.map((h) => {
    const completedSet = logsByHabit.get(h.id) || new Set();
    const isCompletedToday = completedSet.has(todayStr);
    const streakMetrics = calculateHabitStreaks(completedSet, h.createdAt, todayStr, userTimezone);

    // Get today's log notes if any
    const todayLog = allLogs.find((l) => l.habitId === h.id && l.date === todayStr);

    const evaluation = evaluateTaskOccurrence(h, todayLog || null, todayStr, nowDate, userTimezone);

    return {
      ...h,
      isCompletedToday,
      notesToday: todayLog?.notes || '',
      currentStreak: streakMetrics.currentStreak,
      longestStreak: streakMetrics.longestStreak,
      totalCompletedDays: streakMetrics.totalCompletedDays,
      completionRate: streakMetrics.completionRate,
      occurrenceEvaluation: evaluation,
    };
  });

  return NextResponse.json({ habits: enrichedHabits, todayDate: todayStr });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, icon, color, category, isTimeSpecific, startTime, endTime } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Habit name is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { timezone: true },
    });
    const userTimezone = user?.timezone || DEFAULT_TIMEZONE;
    const todayStr = getTodayDateString(userTimezone);

    const newHabit = await db.habit.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || '⚡',
        color: color || '#3b82f6',
        category: category || 'General',
        isTimeSpecific: Boolean(isTimeSpecific),
        startTime: isTimeSpecific && startTime ? startTime : null,
        endTime: isTimeSpecific && endTime ? endTime : null,
      },
    });

    await db.habitEvent.create({
      data: {
        userId: session.userId,
        habitId: newHabit.id,
        habitName: newHabit.name,
        icon: newHabit.icon,
        category: newHabit.category,
        eventType: 'CREATED',
        date: todayStr,
      },
    });

    return NextResponse.json({ habit: newHabit }, { status: 201 });
  } catch (err: unknown) {
    console.error('Create habit error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create habit';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
