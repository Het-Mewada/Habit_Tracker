import { HabitAnalyticsSummary } from './aggregator';

export interface StructuredAiInsight {
  provider: 'groq' | 'gemini' | 'heuristic' | 'insufficient_data';
  modelUsed?: string;
  generatedAt: string;
  overallPerformance: {
    summaryText: string;
    score: number; // 0-100
    statusLabel: string; // e.g. "Thriving", "Steady", "Needs Focus"
  };
  strongestHabits: {
    name: string;
    icon: string;
    completionRate: number;
    streak: number;
    insight: string;
  }[];
  strugglingHabits: {
    name: string;
    icon: string;
    completionRate: number;
    missedDays: number;
    insight: string;
  }[];
  improvingTrends: {
    name: string;
    icon: string;
    delta: number;
    insight: string;
  }[];
  decliningTrends: {
    name: string;
    icon: string;
    delta: number;
    insight: string;
  }[];
  behavioralPatterns: string[];
  recommendations: string[];
}

export function generateHeuristicInsights(summary: HabitAnalyticsSummary): StructuredAiInsight {
  const {
    totalActiveHabits,
    overallCompletionRate,
    habits,
    weekdayPerformance,
    bestPerformingDay,
    weakestPerformingDay,
  } = summary;

  if (totalActiveHabits === 0) {
    return {
      provider: 'heuristic',
      modelUsed: 'Offline Heuristic Rule Engine',
      generatedAt: new Date().toISOString(),
      overallPerformance: {
        summaryText: 'You currently have no active habits. Create your first habit to begin tracking your journey and unlock AI behavioral insights!',
        score: 0,
        statusLabel: 'Getting Started',
      },
      strongestHabits: [],
      strugglingHabits: [],
      improvingTrends: [],
      decliningTrends: [],
      behavioralPatterns: [
        'No active habit logs available yet.',
      ],
      recommendations: [
        'Create 2-3 simple daily habits (e.g. Drink Water, Read 15 mins) to build your initial momentum.',
        'Set achievable goals and complete them today to kick off your streak.',
      ],
    };
  }

  // 1. Overall Status Label & Score
  let statusLabel = 'Steady';
  if (overallCompletionRate >= 80) statusLabel = 'Exceptional';
  else if (overallCompletionRate >= 65) statusLabel = 'Thriving';
  else if (overallCompletionRate >= 45) statusLabel = 'Steady';
  else statusLabel = 'Needs Focus';

  const overallText = `Over the past 30 days, your overall habit completion rate is ${overallCompletionRate}% across ${totalActiveHabits} active habit${
    totalActiveHabits > 1 ? 's' : ''
  }. Your peak performance occurs on ${bestPerformingDay}s, while ${weakestPerformingDay}s present your greatest opportunity for growth.`;

  // 2. Strongest Habits (Rate >= 60% or highest)
  const sortedByRate = [...habits].sort((a, b) => b.completionRate - a.completionRate);
  const strongest = sortedByRate.slice(0, 3).map((h) => ({
    name: h.name,
    icon: h.icon,
    completionRate: h.completionRate,
    streak: h.currentStreak,
    insight: `You have completed "${h.name}" on ${h.completionRate}% of days with a current streak of ${h.currentStreak} day${
      h.currentStreak === 1 ? '' : 's'
    } (best: ${h.longestStreak} days).`,
  }));

  // 3. Struggling Habits (Rate < 60%)
  const struggling = [...habits]
    .sort((a, b) => a.completionRate - b.completionRate)
    .filter((h) => h.completionRate < 60 || habits.length <= 2)
    .slice(0, 3)
    .map((h) => ({
      name: h.name,
      icon: h.icon,
      completionRate: h.completionRate,
      missedDays: h.missedDays,
      insight: `You have completed "${h.name}" on ${h.completionRate}% of days over the last 30 days, missing ${h.missedDays} days total.`,
    }));

  // 4. Improving Trends (momentumDelta > 0)
  const improving = habits
    .filter((h) => h.momentumDelta > 5)
    .sort((a, b) => b.momentumDelta - a.momentumDelta)
    .slice(0, 3)
    .map((h) => ({
      name: h.name,
      icon: h.icon,
      delta: h.momentumDelta,
      insight: `You increased your "${h.name}" performance by +${h.momentumDelta}% over the last 14 days!`,
    }));

  // 5. Declining Trends (momentumDelta < 0)
  const declining = habits
    .filter((h) => h.momentumDelta < -5)
    .sort((a, b) => a.momentumDelta - b.momentumDelta)
    .slice(0, 3)
    .map((h) => ({
      name: h.name,
      icon: h.icon,
      delta: h.momentumDelta,
      insight: `Your "${h.name}" consistency dropped by ${Math.abs(h.momentumDelta)}% over the last 14 days. Re-evaluating your schedule may help rebuild your momentum.`,
    }));

  // 6. Behavioral Patterns
  const patterns: string[] = [];
  const weekendDays = weekdayPerformance.filter((w) => w.day === 'Saturday' || w.day === 'Sunday');
  const weekdayDays = weekdayPerformance.filter((w) => w.day !== 'Saturday' && w.day !== 'Sunday');

  const avgWeekendRate = Math.round(
    weekendDays.reduce((acc, w) => acc + w.rate, 0) / Math.max(1, weekendDays.length)
  );
  const avgWeekdayRate = Math.round(
    weekdayDays.reduce((acc, w) => acc + w.rate, 0) / Math.max(1, weekdayDays.length)
  );

  if (avgWeekdayRate - avgWeekendRate > 15) {
    patterns.push(
      `Weekend Drop-off: Your completion rate drops by ${avgWeekdayRate - avgWeekendRate}% on weekends (${avgWeekendRate}% weekend vs ${avgWeekdayRate}% weekday).`
    );
  } else if (avgWeekendRate - avgWeekdayRate > 15) {
    patterns.push(
      `Weekend Surge: You perform significantly better on weekends (${avgWeekendRate}%) compared to weekdays (${avgWeekdayRate}%).`
    );
  } else {
    patterns.push(
      `Consistent Schedule: Your weekend consistency (${avgWeekendRate}%) closely aligns with your weekday routine (${avgWeekdayRate}%).`
    );
  }

  patterns.push(
    `Day-of-Week Peak: You achieve maximum productivity on ${bestPerformingDay}s (${
      weekdayPerformance.find((w) => w.day === bestPerformingDay)?.rate || 0
    }% completion rate).`
  );

  const longStreakHabit = habits.reduce((prev, curr) =>
    curr.longestStreak > prev.longestStreak ? curr : prev
  , habits[0]);

  if (longStreakHabit && longStreakHabit.longestStreak >= 3) {
    patterns.push(
      `Streak Master: "${longStreakHabit.name}" holds your record for longest unbroken streak at ${longStreakHabit.longestStreak} consecutive days.`
    );
  }

  // 7. Recommendations
  const recommendations: string[] = [];
  if (struggling.length > 0) {
    recommendations.push(
      `Anchor Struggling Habits: Pair "${struggling[0].name}" right after your most consistent habit ("${strongest[0]?.name || 'a strong routine'}").`
    );
  }

  if (weakestPerformingDay) {
    recommendations.push(
      `Optimize ${weakestPerformingDay}s: Set morning reminders on ${weakestPerformingDay}s to counteract your lowest completion day.`
    );
  }

  if (declining.length > 0) {
    recommendations.push(
      `Simplify "${declining[0].name}": Reduce target intensity for a few days to restore your completion momentum.`
    );
  } else {
    recommendations.push(
      'Maintain Momentum: Keep up your current habit routine and review your progress weekly.'
    );
  }

  return {
    provider: 'heuristic',
    modelUsed: 'Offline Heuristic Rule Engine',
    generatedAt: new Date().toISOString(),
    overallPerformance: {
      summaryText: overallText,
      score: overallCompletionRate,
      statusLabel,
    },
    strongestHabits: strongest,
    strugglingHabits: struggling,
    improvingTrends: improving,
    decliningTrends: declining,
    behavioralPatterns: patterns,
    recommendations,
  };
}
