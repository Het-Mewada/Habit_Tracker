import { db } from '../db';
import { getPastDatesList, getDayOfWeekName, getTodayDateString, formatDateToYYYYMMDD } from '../date-utils';
import { calculateHabitStreaks } from '../streaks';

export interface HabitSummaryItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  missedDays: number;
  recent14DayRate: number;
  prior14DayRate: number;
  momentumDelta: number; // positive = improving, negative = declining
}

export interface DayOfWeekPerformance {
  day: string;
  totalOpportunities: number;
  totalCompleted: number;
  rate: number;
}

export interface DailyCompletionRecord {
  date: string;
  completedCount: number;
  totalActiveCount: number;
  rate: number;
}

export interface HabitAnalyticsSummary {
  period: string; // e.g. "last_30_days"
  generatedAt: string;
  userTimezone: string;
  totalActiveHabits: number;
  overallCompletionRate: number;
  habits: HabitSummaryItem[];
  dailyCompletion: DailyCompletionRecord[];
  weekdayPerformance: DayOfWeekPerformance[];
  bestPerformingDay: string;
  weakestPerformingDay: string;
  topHabitName: string | null;
  bottomHabitName: string | null;
}

export async function generateAnalyticsSummary(
  userId: string,
  userTimezone: string = 'UTC',
  daysBack: number = 30
): Promise<HabitAnalyticsSummary> {
  const habits = await db.habit.findMany({
    where: { userId, isArchived: false },
  });

  const todayStr = getTodayDateString(userTimezone);
  const pastDates = getPastDatesList(daysBack, todayStr);
  const recent14Dates = pastDates.slice(-14);
  const prior14Dates = pastDates.slice(-28, -14);

  // Fetch all completion logs for user for the past dates
  const logs = await db.habitLog.findMany({
    where: {
      userId,
      date: { in: pastDates },
      completed: true,
    },
  });

  // Map logs by habitId -> set of completed date strings
  const logsByHabit = new Map<string, Set<string>>();
  for (const habit of habits) {
    logsByHabit.set(habit.id, new Set());
  }
  for (const log of logs) {
    if (logsByHabit.has(log.habitId)) {
      logsByHabit.get(log.habitId)!.add(log.date);
    }
  }

  // Build HabitSummaryItem for each habit
  const habitSummaries: HabitSummaryItem[] = habits.map((h) => {
    const completedSet = logsByHabit.get(h.id) || new Set();
    const streakMetrics = calculateHabitStreaks(
      completedSet,
      h.createdAt,
      todayStr,
      userTimezone
    );

    // Calculate 14-day recent vs prior momentum
    let recent14Completed = 0;
    for (const d of recent14Dates) {
      if (completedSet.has(d)) recent14Completed++;
    }
    const recent14DayRate = Math.round((recent14Completed / 14) * 100);

    let prior14Completed = 0;
    for (const d of prior14Dates) {
      if (completedSet.has(d)) prior14Completed++;
    }
    const prior14DayRate = Math.round((prior14Completed / Math.max(1, prior14Dates.length)) * 100);
    const momentumDelta = recent14DayRate - prior14DayRate;

    const missedDays = Math.max(0, daysBack - completedSet.size);

    return {
      id: h.id,
      name: h.name,
      category: h.category,
      icon: h.icon,
      completionRate: streakMetrics.completionRate,
      currentStreak: streakMetrics.currentStreak,
      longestStreak: streakMetrics.longestStreak,
      completedDays: streakMetrics.totalCompletedDays,
      missedDays,
      recent14DayRate,
      prior14DayRate,
      momentumDelta,
    };
  });

  // Daily Completion list (date-aware active habit denominator)
  const dailyCompletion: DailyCompletionRecord[] = pastDates.map((dateStr) => {
    const activeHabitsOnDate = habits.filter(
      (h) => formatDateToYYYYMMDD(h.createdAt, userTimezone) <= dateStr
    );
    const totalActiveCount = activeHabitsOnDate.length;
    const count = logs.filter(
      (l) => l.date === dateStr && activeHabitsOnDate.some((h) => h.id === l.habitId)
    ).length;
    const rate = totalActiveCount > 0 ? Math.round((count / totalActiveCount) * 100) : 0;
    return {
      date: dateStr,
      completedCount: count,
      totalActiveCount,
      rate,
    };
  });

  // Overall completion rate
  let totalCompletionsInPeriod = 0;
  let totalOpportunitiesInPeriod = 0;
  dailyCompletion.forEach((d) => {
    totalCompletionsInPeriod += d.completedCount;
    totalOpportunitiesInPeriod += d.totalActiveCount;
  });
  const overallCompletionRate =
    totalOpportunitiesInPeriod > 0
      ? Math.round((totalCompletionsInPeriod / totalOpportunitiesInPeriod) * 100)
      : 0;

  // Weekday performance
  const weekdayTotals: Record<string, { total: number; completed: number }> = {
    Monday: { total: 0, completed: 0 },
    Tuesday: { total: 0, completed: 0 },
    Wednesday: { total: 0, completed: 0 },
    Thursday: { total: 0, completed: 0 },
    Friday: { total: 0, completed: 0 },
    Saturday: { total: 0, completed: 0 },
    Sunday: { total: 0, completed: 0 },
  };

  pastDates.forEach((dateStr) => {
    const dayName = getDayOfWeekName(dateStr);
    const record = dailyCompletion.find((d) => d.date === dateStr);
    if (weekdayTotals[dayName] && record) {
      weekdayTotals[dayName].total += record.totalActiveCount;
      weekdayTotals[dayName].completed += record.completedCount;
    }
  });

  const weekdayPerformance: DayOfWeekPerformance[] = Object.entries(weekdayTotals).map(
    ([day, data]) => ({
      day,
      totalOpportunities: data.total,
      totalCompleted: data.completed,
      rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    })
  );

  // Best / Weakest days
  let bestDay = 'Monday';
  let bestRate = -1;
  let weakestDay = 'Sunday';
  let weakestRate = 999;

  weekdayPerformance.forEach((wp) => {
    if (wp.rate > bestRate) {
      bestRate = wp.rate;
      bestDay = wp.day;
    }
    if (wp.rate < weakestRate) {
      weakestRate = wp.rate;
      weakestDay = wp.day;
    }
  });

  // Top and Bottom habits
  const sortedByRate = [...habitSummaries].sort((a, b) => b.completionRate - a.completionRate);
  const topHabitName = sortedByRate.length > 0 ? sortedByRate[0].name : null;
  const bottomHabitName = sortedByRate.length > 0 ? sortedByRate[sortedByRate.length - 1].name : null;

  return {
    period: `last_${daysBack}_days`,
    generatedAt: new Date().toISOString(),
    userTimezone,
    totalActiveHabits: habits.length,
    overallCompletionRate,
    habits: habitSummaries,
    dailyCompletion,
    weekdayPerformance,
    bestPerformingDay: bestDay,
    weakestPerformingDay: weakestDay,
    topHabitName,
    bottomHabitName,
  };
}
