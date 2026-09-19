import type { Habit } from '../types/habit';

/**
 * Normalizes Eastern Arabic numerals (٠-٩) and Persian numerals (۰-۹) to standard ASCII digits (0-9).
 */
export const normalizeArabicNumerals = (input: string | number | null | undefined): string => {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
};

export interface ReminderTriggerDescriptor {
  identifier: string;
  type: 'daily' | 'weekly' | 'monthly';
  hour: number;
  minute: number;
  weekday?: number; // 1 = Sunday, 7 = Saturday
  day?: number;     // 1 - 31 for monthly reminders
}

/**
 * Parses a time string in "HH:mm" format into hour and minute components.
 * Supports both ASCII digits and Arabic-Indic numerals.
 * Returns null if the format is invalid or values are out of bounds.
 */
export const parseReminderTime = (
  timeStr?: string | null
): { hour: number; minute: number } | null => {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const trimmed = normalizeArabicNumerals(timeStr.trim());
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return null;

  const parts = trimmed.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);

  if (isNaN(hour) || isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
};

/**
 * Checks whether a reminder time string is strictly valid.
 */
export const isValidReminderTime = (timeStr?: string | null): boolean => {
  return parseReminderTime(timeStr) !== null;
};

/**
 * Formats hour and minute into "HH:mm" string.
 */
export const formatReminderTime = (hour: number, minute: number): string => {
  const h = Math.max(0, Math.min(23, hour)).toString().padStart(2, '0');
  const m = Math.max(0, Math.min(59, minute)).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * Formats a 24-hour time string into a friendly Arabic string with Eastern Arabic numerals (e.g. "٠٨:٣٠ ص" or "٠٨:١٥ م").
 */
export const formatReminderTimeArabic = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  const parsed = parseReminderTime(timeStr);
  if (!parsed) return timeStr;

  const { hour, minute } = parsed;
  const isPM = hour >= 12;
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const period = isPM ? 'م' : 'ص';
  const m = minute.toString().padStart(2, '0');
  const h = displayHour.toString().padStart(2, '0');

  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const toAr = (s: string) => s.replace(/[0-9]/g, (w) => arabicDigits[Number(w)]);

  return `${toAr(h)}:${toAr(m)} ${period}`;
};

/**
 * Maps app day index (0: Sun, 1: Mon, ..., 6: Sat)
 * to Expo Notifications Calendar/Weekly weekday (1: Sun, 2: Mon, ..., 7: Sat).
 */
export const mapDayIndexToExpoWeekday = (dayIndex: number): number => {
  const normalized = ((dayIndex % 7) + 7) % 7;
  return normalized + 1;
};

/**
 * Generates notification trigger descriptors for a habit.
 * Returns an empty array if habit is inactive, archived, or lacks a valid reminder time.
 */
export const generateHabitReminderTriggers = (
  habit: Habit
): ReminderTriggerDescriptor[] => {
  if (!habit.isActive || habit.archivedAt || !habit.reminderTime) {
    return [];
  }

  const parsed = parseReminderTime(habit.reminderTime);
  if (!parsed) return [];

  const { hour, minute } = parsed;

  if (habit.frequency === 'daily') {
    return [
      {
        identifier: `habit_${habit.id}_daily`,
        type: 'daily',
        hour,
        minute,
      },
    ];
  }

  if (habit.frequency === 'monthly_day') {
    const day =
      habit.monthlyDay && habit.monthlyDay >= 1 && habit.monthlyDay <= 31
        ? Math.floor(habit.monthlyDay)
        : 1;
    return [
      {
        identifier: `habit_${habit.id}_monthly_${day}`,
        type: 'monthly',
        day,
        hour,
        minute,
      },
    ];
  }

  if (
    (habit.frequency === 'specific_days' || habit.frequency === 'weekly_target') &&
    Array.isArray(habit.frequencyDays) &&
    habit.frequencyDays.length > 0 &&
    habit.frequencyDays.length < 7
  ) {
    return habit.frequencyDays.map((dayIdx) => ({
      identifier: `habit_${habit.id}_d${dayIdx}`,
      type: 'weekly',
      weekday: mapDayIndexToExpoWeekday(dayIdx),
      hour,
      minute,
    }));
  }

  // Fallback for weekly_target, monthly_target, or general schedule
  return [
    {
      identifier: `habit_${habit.id}_daily`,
      type: 'daily',
      hour,
      minute,
    },
  ];
};

/**
 * Identifier for the global evening review reminder.
 */
export const EVENING_REVIEW_REMINDER_ID = 'enjaz_evening_review_reminder';

/**
 * Generates a daily trigger descriptor for the evening review reminder.
 * Returns null if the provided time string is invalid.
 */
export const generateEveningReviewTrigger = (
  timeStr: string
): ReminderTriggerDescriptor | null => {
  const parsed = parseReminderTime(timeStr);
  if (!parsed) return null;

  return {
    identifier: EVENING_REVIEW_REMINDER_ID,
    type: 'daily',
    hour: parsed.hour,
    minute: parsed.minute,
  };
};

