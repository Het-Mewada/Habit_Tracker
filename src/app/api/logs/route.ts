import { NextResponse } from 'next/server';
import { getCurrentUser, ensureUserInDb } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTodayDateString, formatDateToYYYYMMDD } from '@/lib/date-utils';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const user = await ensureUserInDb(session);
  const userTimezone = user.timezone || 'UTC';
  const todayStr = getTodayDateString(userTimezone);

  try {
    if (date) {
      // Return details for a single date
      const allActiveHabits = await db.habit.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: { createdAt: 'asc' },
      });

      // Filter active habits created on or before this date
      const habitsOnDate = allActiveHabits.filter(
        (h) => formatDateToYYYYMMDD(h.createdAt, userTimezone) <= date
      );

      // Fetch lifecycle events recorded for this date
      const dbEvents = await db.habitEvent.findMany({
        where: { userId: user.id, date },
        orderBy: { createdAt: 'asc' },
      });

      // Fallback for legacy habits created before HabitEvent tracking
      const allUserHabits = await db.habit.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

      const eventsOnDate = dbEvents.map((e) => ({
        id: e.id,
        habitId: e.habitId,
        habitName: e.habitName,
        icon: e.icon,
        category: e.category,
        eventType: e.eventType,
        date: e.date,
      }));

      const existingCreatedHabitIds = new Set(
        dbEvents.filter((e) => e.eventType === 'CREATED').map((e) => e.habitId)
      );

      allUserHabits.forEach((h) => {
        if (formatDateToYYYYMMDD(h.createdAt, userTimezone) === date && !existingCreatedHabitIds.has(h.id)) {
          eventsOnDate.push({
            id: `legacy-${h.id}`,
            habitId: h.id,
            habitName: h.name,
            icon: h.icon,
            category: h.category,
            eventType: 'CREATED',
            date,
          });
        }
      });

      const logs = await db.habitLog.findMany({
        where: {
          userId: user.id,
          date,
        },
      });

      const logsMap = new Map(logs.map((l) => [l.habitId, l]));

      const habitStatuses = habitsOnDate.map((h) => {
        const log = logsMap.get(h.id);
        return {
          habit: h,
          completed: log ? log.completed : false,
          notes: log?.notes || '',
          completedAt: log?.completedAt || null,
        };
      });

      const createdHabitsOnDate = eventsOnDate
        .filter((e) => e.eventType === 'CREATED')
        .map((e) => ({
          id: e.habitId || e.id,
          name: e.habitName,
          icon: e.icon,
          category: e.category,
        }));

      return NextResponse.json({
        date,
        isToday: date === todayStr,
        habits: habitStatuses,
        eventsOnDate,
        createdHabitsOnDate,
      });
    }

    // Range query (e.g. for month calendar view)
    const logs = await db.habitLog.findMany({
      where: {
        userId: user.id,
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ logs });
  } catch (err: unknown) {
    console.error('Fetch logs error:', err);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
