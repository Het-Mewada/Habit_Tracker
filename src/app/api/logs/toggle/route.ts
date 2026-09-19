import { NextResponse } from 'next/server';
import { getCurrentUser, ensureUserInDb } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTodayDateString, getTaskTimeWindow, DEFAULT_TIMEZONE } from '@/lib/date-utils';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { habitId, date, completed, notes } = await req.json();

    if (!habitId) {
      return NextResponse.json({ error: 'habitId is required' }, { status: 400 });
    }

    const user = await ensureUserInDb(session);
    const userTimezone = user.timezone || DEFAULT_TIMEZONE;
    const targetDate = date || getTodayDateString(userTimezone);

    // Verify habit ownership
    const habit = await db.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.userId !== user.id) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Find existing log
    const existingLog = await db.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: targetDate,
        },
      },
    });

    let newCompleted = completed;
    if (newCompleted === undefined) {
      newCompleted = existingLog ? !existingLog.completed : true;
    }

    // Server-Side Authorization for Time-Specific Tasks
    if (newCompleted && habit.isTimeSpecific) {
      // 1. Cannot complete if already completed
      if (existingLog?.completed) {
        return NextResponse.json(
          { error: 'This task occurrence is already completed.' },
          { status: 400 }
        );
      }

      // 2. Validate strict rule: startMs <= serverNow < endMs
      const window = getTaskTimeWindow(targetDate, habit.startTime, habit.endTime, userTimezone);
      if (window) {
        const nowMs = Date.now();
        if (nowMs < window.startMs) {
          return NextResponse.json(
            {
              error: `Task window opens at ${window.startFormatted}. You cannot complete this task before its start time.`,
              code: 'BEFORE_START_WINDOW',
              window,
            },
            { status: 400 }
          );
        }
        if (nowMs >= window.endMs) {
          return NextResponse.json(
            {
              error: `Task completion window ended at ${window.endFormatted}. This task occurrence is missed and cannot be completed later.`,
              code: 'WINDOW_CLOSED',
              window,
            },
            { status: 400 }
          );
        }
      }
    }

    const upsertedLog = await db.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date: targetDate,
        },
      },
      create: {
        habitId,
        userId: user.id,
        date: targetDate,
        completed: Boolean(newCompleted),
        completedAt: newCompleted ? new Date() : null,
        notes: notes !== undefined ? notes : null,
      },
      update: {
        completed: Boolean(newCompleted),
        completedAt: newCompleted ? new Date() : null,
        ...(notes !== undefined && { notes: notes ? notes : null }),
      },
    });

    return NextResponse.json({ log: upsertedLog });
  } catch (err: unknown) {
    console.error('Toggle habit log error:', err);
    return NextResponse.json({ error: 'Failed to update habit log' }, { status: 500 });
  }
}
