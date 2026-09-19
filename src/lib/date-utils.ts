export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function getTodayDateString(timeZone: string = DEFAULT_TIMEZONE): string {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // Output: YYYY-MM-DD
  } catch {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function formatDateToYYYYMMDD(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function getPastDatesList(days: number, endDateStr?: string): string[] {
  const result: string[] = [];
  const baseDate = endDateStr ? new Date(`${endDateStr}T00:00:00`) : new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(`${year}-${month}-${day}`);
  }

  return result;
}

export function getDayOfWeekName(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function getShortDayOfWeekName(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getFormattedDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function parseYYYYMMDD(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minFormatted = String(minutes).padStart(2, '0');
  return `${hours}:${minFormatted} ${ampm}`;
}

export function getTimeZoneOffsetString(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  const tz = (timeZone || DEFAULT_TIMEZONE).trim();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    });
    const tzPart = formatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value;
    if (tzPart) {
      if (tzPart === 'GMT' || tzPart === 'UTC') return 'Z';
      const match = tzPart.match(/GMT([+-]\d{2}:\d{2})/);
      if (match) return match[1];
    }
  } catch {
    // Fallback on invalid timezone
  }
  return '+05:30';
}

export interface TaskTimeWindow {
  startMs: number;
  endMs: number;
  startFormatted: string;
  endFormatted: string;
  isMidnightCrossing: boolean;
}

export function getTaskTimeWindow(
  scheduledDateStr: string,
  startTimeStr?: string | null,
  endTimeStr?: string | null,
  timeZone: string = DEFAULT_TIMEZONE
): TaskTimeWindow | null {
  if (!startTimeStr || !endTimeStr) return null;

  const sParts = startTimeStr.split(':').map(Number);
  const eParts = endTimeStr.split(':').map(Number);
  if (sParts.length < 2 || eParts.length < 2) return null;

  const [sH, sM] = sParts;
  const [eH, eM] = eParts;

  // Midnight crossing if end time is earlier or equal to start time
  const isMidnightCrossing = eH < sH || (eH === sH && eM <= sM);

  const startDate = new Date(`${scheduledDateStr}T00:00:00`);
  const endDate = new Date(startDate);
  if (isMidnightCrossing) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  const nextDateStr = `${year}-${month}-${day}`;

  const tzOffset = getTimeZoneOffsetString(startDate, timeZone);
  const startISO = `${scheduledDateStr}T${startTimeStr.slice(0, 5)}:00${tzOffset}`;
  const endISO = `${nextDateStr}T${endTimeStr.slice(0, 5)}:00${tzOffset}`;

  const startMs = new Date(startISO).getTime();
  const endMs = new Date(endISO).getTime();

  return {
    startMs,
    endMs,
    startFormatted: formatTime12h(startTimeStr),
    endFormatted: formatTime12h(endTimeStr),
    isMidnightCrossing,
  };
}

export interface TaskOccurrenceEvaluation {
  status: 'pending' | 'completed' | 'missed';
  canComplete: boolean;
  isTimeSpecific: boolean;
  isMidnightCrossing: boolean;
  startFormatted?: string;
  endFormatted?: string;
  completedAtFormatted?: string | null;
  statusMessage: string;
}

export function evaluateTaskOccurrence(
  habit: { isTimeSpecific?: boolean; startTime?: string | null; endTime?: string | null },
  log: { completed: boolean; completedAt?: Date | string | null } | null,
  targetDateStr: string,
  nowDate: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): TaskOccurrenceEvaluation {
  if (log?.completed) {
    const compDate = log.completedAt ? new Date(log.completedAt) : null;
    const timeFormatted = compDate
      ? compDate.toLocaleTimeString('en-US', {
          timeZone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : null;

    const sParts = habit.startTime ? habit.startTime.split(':').map(Number) : [0, 0];
    const eParts = habit.endTime ? habit.endTime.split(':').map(Number) : [0, 0];
    const isMidnightCrossing = Boolean(
      habit.isTimeSpecific &&
        habit.startTime &&
        habit.endTime &&
        (eParts[0] < sParts[0] || (eParts[0] === sParts[0] && eParts[1] <= sParts[1]))
    );

    return {
      status: 'completed',
      canComplete: false,
      isTimeSpecific: Boolean(habit.isTimeSpecific),
      isMidnightCrossing,
      startFormatted: formatTime12h(habit.startTime),
      endFormatted: formatTime12h(habit.endTime),
      completedAtFormatted: timeFormatted,
      statusMessage: timeFormatted ? `Completed at ${timeFormatted}` : 'Completed',
    };
  }

  // Non-time-specific task
  if (!habit.isTimeSpecific) {
    return {
      status: 'pending',
      canComplete: true,
      isTimeSpecific: false,
      isMidnightCrossing: false,
      statusMessage: 'Available anytime today',
    };
  }

  // Time-specific task
  const window = getTaskTimeWindow(targetDateStr, habit.startTime, habit.endTime, timeZone);
  if (!window) {
    return {
      status: 'pending',
      canComplete: true,
      isTimeSpecific: true,
      isMidnightCrossing: false,
      statusMessage: 'Time-specific (No window set)',
    };
  }

  const nowMs = nowDate.getTime();

  // Strict Rule: startMs <= nowMs < endMs
  if (nowMs < window.startMs) {
    return {
      status: 'pending',
      canComplete: false,
      isTimeSpecific: true,
      isMidnightCrossing: window.isMidnightCrossing,
      startFormatted: window.startFormatted,
      endFormatted: window.endFormatted,
      statusMessage: `⏳ Starts at ${window.startFormatted}`,
    };
  }

  if (nowMs >= window.startMs && nowMs < window.endMs) {
    return {
      status: 'pending',
      canComplete: true,
      isTimeSpecific: true,
      isMidnightCrossing: window.isMidnightCrossing,
      startFormatted: window.startFormatted,
      endFormatted: window.endFormatted,
      statusMessage: `🟢 Active now (${window.startFormatted} - ${window.endFormatted})`,
    };
  }

  // nowMs >= window.endMs -> Missed
  return {
    status: 'missed',
    canComplete: false,
    isTimeSpecific: true,
    isMidnightCrossing: window.isMidnightCrossing,
    startFormatted: window.startFormatted,
    endFormatted: window.endFormatted,
    statusMessage: `❌ Missed (Ended at ${window.endFormatted})`,
  };
}
