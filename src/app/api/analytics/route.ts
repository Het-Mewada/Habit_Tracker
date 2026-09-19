import { NextResponse } from 'next/server';
import { getCurrentUser, ensureUserInDb } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTodayDateString, getPastDatesList, getFormattedDateLabel, formatDateToYYYYMMDD } from '@/lib/date-utils';
import { calculateHabitStreaks } from '@/lib/streaks';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get('period') || '30'; // '7', '30', '90', 'all'
  const days = periodParam === '7' ? 7 : periodParam === '90' ? 90 : periodParam === 'all' ? 180 : 30;

  const user = await ensureUserInDb(session);
  const userTimezone = user.timezone || 'UTC';
  const todayStr = getTodayDateString(userTimezone);

  // 1. Fetch active habits
  const activeHabits = await db.habit.findMany({
    where: { userId: user.id, isArchived: false },
    orderBy: { createdAt: 'asc' },
  });

  const currentTotalActiveHabits = activeHabits.length;

  // 2. Fetch past dates for daily completion chart
  const chartDates = getPastDatesList(days, todayStr);
  
  // 3. Heatmap dates (last 365 days for GitHub-style year view)
  const heatmapDates = getPastDatesList(365, todayStr);

  // Fetch all completed logs for the user
  const allLogs = await db.habitLog.findMany({
    where: {
      userId: user.id,
      completed: true,
    },
  });

  const logsByDate = new Map<string, Set<string>>();
  const logsByHabit = new Map<string, Set<string>>();

  allLogs.forEach((l) => {
    // By date
    if (!logsByDate.has(l.date)) {
      logsByDate.set(l.date, new Set());
    }
    logsByDate.get(l.date)!.add(l.habitId);

    // By habit
    if (!logsByHabit.has(l.habitId)) {
      logsByHabit.set(l.habitId, new Set());
    }
    logsByHabit.get(l.habitId)!.add(l.date);
  });

  // 4. Daily Completion Chart Data (Date-aware active habit denominator)
  const dailyChart = chartDates.map((dateStr) => {
    const activeHabitsOnDate = activeHabits.filter(
      (h) => formatDateToYYYYMMDD(h.createdAt, userTimezone) <= dateStr
    );
    const totalActiveOnDate = activeHabitsOnDate.length;

    const completedSet = logsByDate.get(dateStr) || new Set();
    let completedCount = 0;
    activeHabitsOnDate.forEach((h) => {
      if (completedSet.has(h.id)) completedCount++;
    });

    const rate =
      totalActiveOnDate > 0
        ? Math.round((completedCount / totalActiveOnDate) * 100)
        : 0;

    return {
      date: dateStr,
      label: getFormattedDateLabel(dateStr),
      completed: completedCount,
      total: totalActiveOnDate,
      rate,
    };
  });

  // 5. Heatmap Cells Data (Date-aware active habit denominator)
  const heatmap = heatmapDates.map((dateStr) => {
    const activeHabitsOnDate = activeHabits.filter(
      (h) => formatDateToYYYYMMDD(h.createdAt, userTimezone) <= dateStr
    );
    const totalActiveOnDate = activeHabitsOnDate.length;

    const completedSet = logsByDate.get(dateStr) || new Set();
    let activeCompletedCount = 0;
    activeHabitsOnDate.forEach((h) => {
      if (completedSet.has(h.id)) activeCompletedCount++;
    });

    let ratio = 0;
    let percentage = 0;
    let tier = 0;

    if (totalActiveOnDate > 0) {
      ratio = activeCompletedCount / totalActiveOnDate;
      percentage = Math.round(ratio * 100);

      if (ratio <= 0) tier = 0;
      else if (ratio < 0.25) tier = 1;
      else if (ratio < 0.50) tier = 2;
      else if (ratio < 0.75) tier = 3;
      else if (ratio < 1.0) tier = 4;
      else tier = 5; // 100%
    }

    const formattedDate = getFormattedDateLabel(dateStr);
    const tooltipText = `${formattedDate}: ${activeCompletedCount} of ${totalActiveOnDate} habits completed (${percentage}%)`;

    return {
      date: dateStr,
      formattedDate,
      completedCount: activeCompletedCount,
      totalActive: totalActiveOnDate,
      percentage,
      tier,
      tooltipText,
    };
  });

  // 6. Habit Performance Table Data
  const performanceTable = activeHabits.map((h) => {
    const completedSet = logsByHabit.get(h.id) || new Set();
    const streakMetrics = calculateHabitStreaks(completedSet, h.createdAt, todayStr, userTimezone);

    const completedDays = streakMetrics.totalCompletedDays;
    const missedDays = Math.max(0, days - completedDays);

    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      category: h.category,
      completionRate: streakMetrics.completionRate,
      currentStreak: streakMetrics.currentStreak,
      longestStreak: streakMetrics.longestStreak,
      completedDays,
      missedDays,
    };
  });

  return NextResponse.json({
    period: periodParam,
    currentTotalActiveHabits,
    dailyChart,
    heatmap,
    performanceTable,
  });
}
