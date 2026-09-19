import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
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

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { timezone: true },
  });

  const userTimezone = user?.timezone || 'UTC';
  const todayStr = getTodayDateString(userTimezone);

  try {
    if (date) {
      // Return details for a single date
      const allActiveHabits = await db.habit.findMany({
        where: { userId: session.userId, isArchived: false },
        orderBy: { createdAt: 'asc' },
      });

      // Filter habits created on or before this date
      const habitsOnDate = allActiveHabits.filter(
        (h) => formatDateToYYYYMMDD(h.createdAt, userTimezone) <= date
      );

      // Habits created on this exact date
      const createdHabitsOnDate = allActiveHabits
        .filter((h) => formatDateToYYYYMMDD(h.createdAt, userTimezone) === date)
        .map((h) => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          color: h.color,
          category: h.category,
        }));

      const logs = await db.habitLog.findMany({
        where: {
          userId: session.userId,
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

      return NextResponse.json({
        date,
        isToday: date === todayStr,
        habits: habitStatuses,
        createdHabitsOnDate,
      });
    }

    // Range query (e.g. for month calendar view)
    const logs = await db.habitLog.findMany({
      where: {
        userId: session.userId,
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
