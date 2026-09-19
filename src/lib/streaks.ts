import { getTodayDateString, formatDateToYYYYMMDD } from './date-utils';

export interface StreakMetrics {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  completionRate: number; // percentage 0 - 100
}

export function calculateHabitStreaks(
  completedDateSet: Set<string>,
  habitCreatedAt: Date,
  todayStr?: string,
  userTimezone?: string
): StreakMetrics {
  const today = todayStr || getTodayDateString(userTimezone);
  const totalCompletedDays = completedDateSet.size;

  // Calculate days active since creation
  const createdStr = formatDateToYYYYMMDD(habitCreatedAt, userTimezone);
  const startDate = new Date(`${createdStr}T00:00:00`);
  const endDate = new Date(`${today}T00:00:00`);
  const totalDaysActive = Math.max(
    1,
    Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const completionRate = Math.round((totalCompletedDays / totalDaysActive) * 100);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  let checkDate = new Date(`${today}T00:00:00`);
  const todayCompleted = completedDateSet.has(today);

  if (todayCompleted) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // If today is not completed yet, check if yesterday was completed
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = formatDateToYYYYMMDD(checkDate, userTimezone);
    if (!completedDateSet.has(yesterdayStr)) {
      currentStreak = 0;
    }
  }

  // Continue checking backwards as long as previous dates are completed
  if (currentStreak > 0 || !todayCompleted) {
    while (true) {
      const dStr = formatDateToYYYYMMDD(checkDate, userTimezone);
      if (completedDateSet.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 2. Calculate Longest Streak
  const sortedDates = Array.from(completedDateSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currDate = new Date(`${dateStr}T00:00:00`);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = currDate;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCompletedDays,
    completionRate: Math.min(100, Math.max(0, completionRate)),
  };
}
