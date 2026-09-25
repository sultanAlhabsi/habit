import dayjs from 'dayjs';
import type {
  Habit,
  HabitFrequency,
  HabitCheckin,
  HabitStats,
  OverallStats,
  DayAdherence,
  HabitSortOption,
  MonthAdherenceStats,
  StreakMilestoneTier,
  StreakMilestoneInfo,
  HabitDayDistribution,
  HabitConsistencyPattern,
  CategoryPerformanceItem,
  CategoryAnalytics,
} from '../types/habit';

export const DAYS_OF_WEEK_AR = [
  { index: 0, name: 'الأحد', short: 'أحد' },
  { index: 1, name: 'الإثنين', short: 'إثن' },
  { index: 2, name: 'الثلاثاء', short: 'ثلا' },
  { index: 3, name: 'الأربعاء', short: 'أرب' },
  { index: 4, name: 'الخميس', short: 'خمي' },
  { index: 5, name: 'الجمعة', short: 'جمع' },
  { index: 6, name: 'السبت', short: 'سبت' },
];

export const HABIT_CATEGORIES = ['الكل', 'صحة', 'إنتاجية', 'روتين', 'روحانية', 'تطوير'] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

const ICON_CATEGORY_MAP: Record<string, string> = {
  // تطوير
  'book-outline': 'تطوير',
  'journal-outline': 'تطوير',
  'school-outline': 'تطوير',
  'library-outline': 'تطوير',
  'bulb-outline': 'تطوير',
  'language-outline': 'تطوير',
  'pencil-outline': 'تطوير',
  'color-palette-outline': 'تطوير',
  'musical-notes-outline': 'تطوير',
  'camera-outline': 'تطوير',
  'mic-outline': 'تطوير',
  'headset-outline': 'تطوير',
  'people-outline': 'تطوير',
  'chatbubbles-outline': 'تطوير',

  // صحة
  'water-outline': 'صحة',
  'fitness-outline': 'صحة',
  'walk-outline': 'صحة',
  'footsteps-outline': 'صحة',
  'bicycle-outline': 'صحة',
  'barbell-outline': 'صحة',
  'moon-outline': 'صحة',
  'bed-outline': 'صحة',
  'heart-outline': 'صحة',
  'pulse-outline': 'صحة',
  'nutrition-outline': 'صحة',
  'restaurant-outline': 'صحة',
  'medkit-outline': 'صحة',
  'body-outline': 'صحة',
  'bandage-outline': 'صحة',

  // إنتاجية
  'laptop-outline': 'إنتاجية',
  'briefcase-outline': 'إنتاجية',
  'code-slash-outline': 'إنتاجية',
  'trophy-outline': 'إنتاجية',
  'rocket-outline': 'إنتاجية',
  'timer-outline': 'إنتاجية',
  'wallet-outline': 'إنتاجية',
  'cash-outline': 'إنتاجية',
  'calculator-outline': 'إنتاجية',
  'trending-up-outline': 'إنتاجية',
  'document-text-outline': 'إنتاجية',
  'clipboard-outline': 'إنتاجية',
  'folder-outline': 'إنتاجية',

  // روتين
  'sunny-outline': 'روتين',
  'alarm-outline': 'روتين',
  'cafe-outline': 'روتين',
  'home-outline': 'روتين',
  'brush-outline': 'روتين',
  'shirt-outline': 'روتين',
  'calendar-outline': 'روتين',
  'cart-outline': 'روتين',
  'time-outline': 'روتين',
  'hourglass-outline': 'روتين',
  'car-outline': 'روتين',

  // روحانية
  'sparkles-outline': 'روحانية',
  'leaf-outline': 'روحانية',
  'flower-outline': 'روحانية',
  'bonfire-outline': 'روحانية',
  'compass-outline': 'روحانية',
  'heart-half-outline': 'روحانية',
  'planet-outline': 'روحانية',
};

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

/**
 * Converts standard ASCII digits (0-9) and Persian digits to Eastern Arabic numerals (٠-٩),
 * turns decimals into Arabic decimal separator (٫), and percent signs to (٪).
 */
export const toArabicNumerals = (input: number | string | null | undefined): string => {
  if (input === null || input === undefined) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(input)
    .replace(/(\d)\.(\d)/g, '$1٫$2')
    .replace(/([٠-٩0-9])\.([٠-٩0-9])/g, '$1٫$2')
    .replace(/%/g, '٪')
    .replace(/[0-9]/g, (w) => arabicDigits[Number(w)])
    .replace(/[۰]/g, '٠')
    .replace(/[۱]/g, '١')
    .replace(/[۲]/g, '٢')
    .replace(/[۳]/g, '٣')
    .replace(/[۴]/g, '٤')
    .replace(/[۵]/g, '٥')
    .replace(/[۶]/g, '٦')
    .replace(/[۷]/g, '٧')
    .replace(/[۸]/g, '٨')
    .replace(/[۹]/g, '٩');
};

/**
 * Returns the category name for a given habit based on its icon name
 */
export const getHabitCategory = (iconName?: string): string => {
  if (!iconName) return 'تطوير';
  return ICON_CATEGORY_MAP[iconName] || 'تطوير';
};

/**
 * Check if a habit is scheduled to be done on a specific date (YYYY-MM-DD)
 * @param habit Habit object
 * @param dateStr Date in YYYY-MM-DD format
 * @param requireActive When true, inactive habits return false (used for daily checklist). When false, checks schedule regardless of pause (used for statistics).
 */
export const isHabitDueOnDate = (habit: Habit, dateStr: string, requireActive = true): boolean => {
  if (requireActive && (!habit.isActive || habit.archivedAt)) return false;

  const targetDateOnly = dateStr.slice(0, 10);
  const createdDateOnly = (habit.createdAt || '').slice(0, 10);

  // If date is before habit creation, it wasn't due then
  if (createdDateOnly && targetDateOnly < createdDateOnly) return false;

  // If habit was archived, it was not due on dates after archive date
  if (habit.archivedAt) {
    const archivedDateOnly = habit.archivedAt.slice(0, 10);
    if (targetDateOnly > archivedDateOnly) return false;
  }

  if (habit.frequency === 'daily') {
    return true;
  }

  if (habit.frequency === 'specific_days') {
    // 0 is Sunday, 6 is Saturday
    const dayOfWeek = new Date(targetDateOnly + 'T00:00:00Z').getUTCDay();
    return Array.isArray(habit.frequencyDays) && habit.frequencyDays.includes(dayOfWeek);
  }

  if (habit.frequency === 'monthly_day') {
    const targetDayjs = dayjs(targetDateOnly);
    const daysInMonth = targetDayjs.daysInMonth();
    const targetDayOfMonth = targetDayjs.date();
    const desiredDay = habit.monthlyDay || 1;
    const effectiveDay = Math.min(desiredDay, daysInMonth);
    return targetDayOfMonth === effectiveDay;
  }

  // Periodic flexible habits (weekly_target, monthly_target) are not bound to a single calendar due day
  return false;
};

/**
 * Checks if a habit is a flexible periodic habit (weekly_target or monthly_target)
 */
export const isPeriodicFlexibleHabit = (habitOrFrequency: Habit | HabitFrequency): boolean => {
  const freq = typeof habitOrFrequency === 'string' ? habitOrFrequency : habitOrFrequency.frequency;
  return freq === 'weekly_target' || freq === 'monthly_target';
};

/**
 * Computes weekly progress for a weekly_target habit.
 * Week runs from Sunday to Saturday.
 */
export const getWeeklyTargetProgress = (
  habit: Habit,
  completedDates: Set<string> | HabitCheckin[],
  referenceDate?: string | dayjs.Dayjs
): {
  completedCount: number;
  targetCount: number;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
} => {
  const ref = referenceDate ? dayjs(referenceDate) : dayjs();
  const startOfWeek = ref.day(0).startOf('day');
  const endOfWeek = ref.day(6).endOf('day');
  const startStr = startOfWeek.format('YYYY-MM-DD');
  const endStr = endOfWeek.format('YYYY-MM-DD');

  let completedCount = 0;
  if (completedDates instanceof Set) {
    for (let i = 0; i < 7; i++) {
      const dStr = startOfWeek.add(i, 'day').format('YYYY-MM-DD');
      if (completedDates.has(dStr)) {
        completedCount++;
      }
    }
  } else {
    const datesInWeek = new Set<string>();
    for (const c of completedDates) {
      if (c.habitId === habit.id && c.completed && c.date >= startStr && c.date <= endStr) {
        datesInWeek.add(c.date);
      }
    }
    completedCount = datesInWeek.size;
  }

  const targetCount = habit.weeklyTargetCount && habit.weeklyTargetCount > 0 ? habit.weeklyTargetCount : 1;
  return {
    completedCount,
    targetCount,
    isCompleted: completedCount >= targetCount,
    startDate: startStr,
    endDate: endStr,
  };
};

/**
 * Computes monthly progress for a monthly_target habit.
 */
export const getMonthlyTargetProgress = (
  habit: Habit,
  completedDates: Set<string> | HabitCheckin[],
  referenceDate?: string | dayjs.Dayjs
): {
  completedCount: number;
  targetCount: number;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
} => {
  const ref = referenceDate ? dayjs(referenceDate) : dayjs();
  const startOfMonth = ref.startOf('month');
  const endOfMonth = ref.endOf('month');
  const startStr = startOfMonth.format('YYYY-MM-DD');
  const endStr = endOfMonth.format('YYYY-MM-DD');
  const daysInMonth = ref.daysInMonth();

  let completedCount = 0;
  if (completedDates instanceof Set) {
    for (let i = 0; i < daysInMonth; i++) {
      const dStr = startOfMonth.add(i, 'day').format('YYYY-MM-DD');
      if (completedDates.has(dStr)) {
        completedCount++;
      }
    }
  } else {
    const datesInMonth = new Set<string>();
    for (const c of completedDates) {
      if (c.habitId === habit.id && c.completed && c.date >= startStr && c.date <= endStr) {
        datesInMonth.add(c.date);
      }
    }
    completedCount = datesInMonth.size;
  }

  const targetCount = habit.monthlyTargetCount && habit.monthlyTargetCount > 0 ? habit.monthlyTargetCount : 1;
  return {
    completedCount,
    targetCount,
    isCompleted: completedCount >= targetCount,
    startDate: startStr,
    endDate: endStr,
  };
};

/**
 * Returns a user-friendly Arabic badge text for periodic flexible habits (weekly/monthly target).
 * E.g. "1/3 هذا الأسبوع", "مكتمل للأسبوع (3/3) 🎯", "2/4 هذا الشهر"
 */
export const getPeriodicBadgeText = (
  habit: Habit,
  completedDates: Set<string> | HabitCheckin[],
  referenceDate?: string | dayjs.Dayjs
): string | undefined => {
  if (habit.frequency === 'weekly_target') {
    const prog = getWeeklyTargetProgress(habit, completedDates, referenceDate);
    if (prog.isCompleted) {
      return undefined;
    }
    return `${toArabicNumerals(prog.completedCount)}/${toArabicNumerals(prog.targetCount)} هذا الأسبوع`;
  }

  if (habit.frequency === 'monthly_target') {
    const prog = getMonthlyTargetProgress(habit, completedDates, referenceDate);
    if (prog.isCompleted) {
      return undefined;
    }
    return `${toArabicNumerals(prog.completedCount)}/${toArabicNumerals(prog.targetCount)} هذا الشهر`;
  }

  return undefined;
};

export const calculateWeeklyStreak = (
  habit: Habit,
  completedDates: Set<string>,
  referenceDate?: string | dayjs.Dayjs
): number => {
  const ref = referenceDate ? dayjs(referenceDate) : dayjs();
  const target = habit.weeklyTargetCount && habit.weeklyTargetCount > 0 ? habit.weeklyTargetCount : 1;
  const created = dayjs(habit.createdAt || ref).day(0).startOf('day');

  let curWeekRef = ref;
  const currentWeekProgress = getWeeklyTargetProgress(habit, completedDates, curWeekRef);

  let streak = 0;
  if (currentWeekProgress.completedCount >= target) {
    streak = 1;
    curWeekRef = curWeekRef.subtract(1, 'week');
  } else {
    curWeekRef = curWeekRef.subtract(1, 'week');
  }

  while (!curWeekRef.day(0).startOf('day').isBefore(created)) {
    const prevWeekProg = getWeeklyTargetProgress(habit, completedDates, curWeekRef);
    if (prevWeekProg.completedCount >= target) {
      streak++;
      curWeekRef = curWeekRef.subtract(1, 'week');
    } else {
      break;
    }
  }

  return streak;
};

export const calculateMonthlyStreak = (
  habit: Habit,
  completedDates: Set<string>,
  referenceDate?: string | dayjs.Dayjs
): number => {
  const ref = referenceDate ? dayjs(referenceDate) : dayjs();
  const target = habit.monthlyTargetCount && habit.monthlyTargetCount > 0 ? habit.monthlyTargetCount : 1;
  const created = dayjs(habit.createdAt || ref).startOf('month');

  let curMonthRef = ref;
  const currentMonthProgress = getMonthlyTargetProgress(habit, completedDates, curMonthRef);

  let streak = 0;
  if (currentMonthProgress.completedCount >= target) {
    streak = 1;
    curMonthRef = curMonthRef.subtract(1, 'month');
  } else {
    curMonthRef = curMonthRef.subtract(1, 'month');
  }

  while (!curMonthRef.startOf('month').isBefore(created)) {
    const prevMonthProg = getMonthlyTargetProgress(habit, completedDates, curMonthRef);
    if (prevMonthProg.completedCount >= target) {
      streak++;
      curMonthRef = curMonthRef.subtract(1, 'month');
    } else {
      break;
    }
  }

  return streak;
};

const calculateWeeklyStatsInternal = (
  habit: Habit,
  completedDates: Set<string>,
  today: dayjs.Dayjs,
  totalCompletions: number
): HabitStats => {
  const currentStreak = calculateWeeklyStreak(habit, completedDates, today);
  const target = habit.weeklyTargetCount && habit.weeklyTargetCount > 0 ? habit.weeklyTargetCount : 1;
  const created = dayjs(habit.createdAt || today).day(0).startOf('day');
  const endOfWeek = today.day(6).endOf('day');

  let bestStreak = currentStreak;
  let runningStreak = 0;
  let totalWeeks = 0;
  let successfulWeeks = 0;

  let iterWeek = created;
  while (!iterWeek.isAfter(endOfWeek)) {
    totalWeeks++;
    const prog = getWeeklyTargetProgress(habit, completedDates, iterWeek);
    if (prog.completedCount >= target) {
      successfulWeeks++;
      runningStreak++;
      if (runningStreak > bestStreak) bestStreak = runningStreak;
    } else {
      if (!iterWeek.isSame(today, 'week')) {
        runningStreak = 0;
      }
    }
    iterWeek = iterWeek.add(1, 'week');
  }

  const completionRate = totalWeeks > 0 ? Math.round((successfulWeeks / totalWeeks) * 100) : 0;
  return {
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRate: Math.min(100, Math.max(0, completionRate)),
    totalDueDays: totalWeeks,
  };
};

const calculateMonthlyStatsInternal = (
  habit: Habit,
  completedDates: Set<string>,
  today: dayjs.Dayjs,
  totalCompletions: number
): HabitStats => {
  const currentStreak = calculateMonthlyStreak(habit, completedDates, today);
  const target = habit.monthlyTargetCount && habit.monthlyTargetCount > 0 ? habit.monthlyTargetCount : 1;
  const created = dayjs(habit.createdAt || today).startOf('month');
  const endOfMonth = today.endOf('month');

  let bestStreak = currentStreak;
  let runningStreak = 0;
  let totalMonths = 0;
  let successfulMonths = 0;

  let iterMonth = created;
  while (!iterMonth.isAfter(endOfMonth)) {
    totalMonths++;
    const prog = getMonthlyTargetProgress(habit, completedDates, iterMonth);
    if (prog.completedCount >= target) {
      successfulMonths++;
      runningStreak++;
      if (runningStreak > bestStreak) bestStreak = runningStreak;
    } else {
      if (!iterMonth.isSame(today, 'month')) {
        runningStreak = 0;
      }
    }
    iterMonth = iterMonth.add(1, 'month');
  }

  const completionRate = totalMonths > 0 ? Math.round((successfulMonths / totalMonths) * 100) : 0;
  return {
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRate: Math.min(100, Math.max(0, completionRate)),
    totalDueDays: totalMonths,
  };
};

/**
 * Ultra-fast O(1) current streak calculation using a pre-indexed Set of completed dates.
 * Stops immediately once the streak is broken, avoiding linear scans through multi-year history.
 */
export const calculateCurrentStreakFromDates = (
  habit: Habit,
  completedDates: Set<string>,
  referenceDate?: string | dayjs.Dayjs
): number => {
  if (habit.frequency === 'weekly_target') {
    return calculateWeeklyStreak(habit, completedDates, referenceDate);
  }
  if (habit.frequency === 'monthly_target') {
    return calculateMonthlyStreak(habit, completedDates, referenceDate);
  }

  const today = (referenceDate ? dayjs(referenceDate) : dayjs()).startOf('day');
  const todayStr = today.format('YYYY-MM-DD');
  const createdDate = dayjs(habit.createdAt).startOf('day');

  let currentStreak = 0;
  if (completedDates.has(todayStr)) {
    currentStreak = 1;
  }
  let checkDate = today.subtract(1, 'day');

  // Look back consecutive days until streak is broken or creation date is reached
  const maxDays = Math.min(3650, Math.max(1, today.diff(createdDate, 'day') + 1));
  for (let i = 0; i < maxDays; i++) {
    if (checkDate.isBefore(createdDate)) break;
    const dateStr = checkDate.format('YYYY-MM-DD');
    const isDue = isHabitDueOnDate(habit, dateStr, false);
    const isCompleted = completedDates.has(dateStr);

    if (isDue) {
      if (isCompleted) {
        currentStreak++;
      } else {
        break;
      }
    } else if (isCompleted) {
      currentStreak++;
    }

    checkDate = checkDate.subtract(1, 'day');
  }

  return currentStreak;
};

/**
 * Calculate streaks and completion statistics for an individual habit
 */
export const calculateHabitStats = (
  habit: Habit,
  allCheckins: HabitCheckin[],
  referenceDate?: string | dayjs.Dayjs
): HabitStats => {
  const today = (referenceDate ? dayjs(referenceDate) : dayjs()).startOf('day');
  const todayStr = today.format('YYYY-MM-DD');

  // Filter valid completed checkins up to today using fast string comparison
  const habitCheckins = allCheckins.filter(
    (c) => c.habitId === habit.id && c.completed && c.date <= todayStr
  );

  const completedDates = new Set(habitCheckins.map((c) => c.date));
  const totalCompletions = completedDates.size;

  if (habit.frequency === 'weekly_target') {
    return calculateWeeklyStatsInternal(habit, completedDates, today, totalCompletions);
  }
  if (habit.frequency === 'monthly_target') {
    return calculateMonthlyStatsInternal(habit, completedDates, today, totalCompletions);
  }

  const createdDateStr = (habit.createdAt || '').slice(0, 10) || todayStr;

  // Find earliest relevant date string without Dayjs allocations
  let earliestDateStr = createdDateStr;
  for (const dStr of completedDates) {
    if (dStr < earliestDateStr) {
      earliestDateStr = dStr;
    }
  }

  // Calculate current streak using ultra-fast backwards search
  const currentStreak = calculateCurrentStreakFromDates(habit, completedDates, today);

  // Calculate best streak and total due days chronologically using native Date stepping
  let bestStreak = currentStreak;
  let runningStreak = 0;
  let totalDueDays = 0;

  const [eY, eM, eD] = earliestDateStr.split('-').map(Number);
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const curNativeDate = new Date(Date.UTC(eY, eM - 1, eD));
  const endNativeTime = new Date(Date.UTC(tY, tM - 1, tD)).getTime();

  const isDaily = habit.frequency === 'daily';
  const isSpecificDays = habit.frequency === 'specific_days';
  const isMonthlyDay = habit.frequency === 'monthly_day';
  const targetMonthlyDay = habit.monthlyDay || 1;
  const freqDays = Array.isArray(habit.frequencyDays) ? habit.frequencyDays : [];
  const archivedDateStr = habit.archivedAt ? habit.archivedAt.slice(0, 10) : null;

  while (curNativeDate.getTime() <= endNativeTime) {
    const y = curNativeDate.getUTCFullYear();
    const m = String(curNativeDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(curNativeDate.getUTCDate()).padStart(2, '0');
    const curStr = `${y}-${m}-${d}`;
    const dayOfWeek = curNativeDate.getUTCDay();

    // Fast inlined check for isHabitDueOnDate(habit, curStr, false)
    let isDue = false;
    if (curStr >= createdDateStr && (!archivedDateStr || curStr <= archivedDateStr)) {
      if (isDaily) {
        isDue = true;
      } else if (isSpecificDays) {
        isDue = freqDays.includes(dayOfWeek);
      } else if (isMonthlyDay) {
        isDue = curNativeDate.getUTCDate() === targetMonthlyDay;
      } else {
        isDue = true;
      }
    }

    const isCompleted = completedDates.has(curStr);

    if (isDue) {
      totalDueDays++;
    }

    if (isCompleted) {
      runningStreak++;
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else if (isDue) {
      if (curStr !== todayStr) {
        runningStreak = 0;
      }
    }

    curNativeDate.setUTCDate(curNativeDate.getUTCDate() + 1);
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  // Effective opportunities includes both due days and off-day completions
  const effectiveOpportunities = Math.max(totalDueDays, totalCompletions);
  const completionRate =
    effectiveOpportunities > 0 ? Math.round((totalCompletions / effectiveOpportunities) * 100) : 0;

  return {
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRate: Math.min(100, Math.max(0, completionRate)),
    totalDueDays,
  };
};

/**
 * Get relevant habits for a specific date:
 * Returns active habits due on that date, PLUS any paused habit that was actually completed on that date.
 */
export const getHabitsForDate = (
  habits: Habit[],
  allCheckins: HabitCheckin[],
  dateStr: string
): Habit[] => {
  const targetDate = dayjs(dateStr).startOf('day');

  // Build a Set of habitIds completed on this date for O(1) lookup
  const completedHabitIdsOnDate = new Set(
    allCheckins
      .filter((c) => c.date === dateStr && c.completed)
      .map((c) => c.habitId)
  );

  return habits.filter((h) => {
    // If habit was archived prior to this date, skip
    if (h.archivedAt && targetDate.isAfter(dayjs(h.archivedAt).startOf('day'))) {
      return false;
    }

    // Is it due today while active?
    if (isHabitDueOnDate(h, dateStr, true)) {
      return true;
    }

    // Or was it already completed on this past date?
    return completedHabitIdsOnDate.has(h.id);
  });
};

/**
 * Retrieve habits that are active, non-archived, scheduled on dateStr, and not completed yet.
 */
export const getPendingDueHabitsForDate = (
  habits: Habit[],
  allCheckins: HabitCheckin[],
  dateStr: string
): Habit[] => {
  const targetDay = dayjs(dateStr).startOf('day');
  const today = dayjs().startOf('day');
  // Disallow completing future dates
  if (targetDay.isAfter(today)) return [];

  // Completed habit IDs on this date
  const completedIds = new Set(
    allCheckins
      .filter((c) => c.date === dateStr && c.completed)
      .map((c) => c.habitId)
  );

  return habits.filter((h) => {
    if (!h.isActive || h.archivedAt) return false;
    if (!isHabitDueOnDate(h, dateStr, true)) return false;
    return !completedIds.has(h.id);
  });
};

/**
 * Retrieve habits that are active, non-archived, scheduled on dateStr, and currently completed.
 */
export const getCompletedDueHabitsForDate = (
  habits: Habit[],
  allCheckins: HabitCheckin[],
  dateStr: string
): Habit[] => {
  const completedIds = new Set(
    allCheckins
      .filter((c) => c.date === dateStr && c.completed)
      .map((c) => c.habitId)
  );

  return habits.filter((h) => {
    if (!h.isActive || h.archivedAt) return false;
    if (!isHabitDueOnDate(h, dateStr, true)) return false;
    return completedIds.has(h.id);
  });
};

/**
 * Generate HabitCheckin records to mark pending habits completed on dateStr.
 */
export const buildBatchCheckinPayloadForCompletion = (
  pendingHabits: Habit[],
  allCheckins: HabitCheckin[],
  dateStr: string,
  nowIso = new Date().toISOString()
): HabitCheckin[] => {
  const existingMap = new Map<string, HabitCheckin>();
  for (const c of allCheckins) {
    if (c.date === dateStr) {
      existingMap.set(c.habitId, c);
    }
  }

  return pendingHabits.map((habit) => {
    const existing = existingMap.get(habit.id);
    const targetCount = Math.max(1, habit.targetCount || 1);
    return {
      id: existing ? existing.id : `chk_${habit.id}_${dateStr}`,
      habitId: habit.id,
      date: dateStr,
      count: targetCount,
      completed: true,
      updatedAt: nowIso,
      note: existing?.note,
    };
  });
};

/**
 * Generate HabitCheckin records to reset completed habits back to pending on dateStr.
 */
export const buildBatchCheckinPayloadForReset = (
  completedHabits: Habit[],
  allCheckins: HabitCheckin[],
  dateStr: string,
  nowIso = new Date().toISOString()
): HabitCheckin[] => {
  const existingMap = new Map<string, HabitCheckin>();
  for (const c of allCheckins) {
    if (c.date === dateStr) {
      existingMap.set(c.habitId, c);
    }
  }

  return completedHabits.map((habit) => {
    const existing = existingMap.get(habit.id);
    return {
      id: existing ? existing.id : `chk_${habit.id}_${dateStr}`,
      habitId: habit.id,
      date: dateStr,
      count: 0,
      completed: false,
      updatedAt: nowIso,
      note: existing?.note,
    };
  });
};


/**
 * Calculate 7-day adherence for any week (Sunday to Saturday) around a reference date
 */
export const calculateWeekAdherence = (
  habits: Habit[],
  allCheckins: HabitCheckin[],
  referenceDate: string | dayjs.Dayjs
): DayAdherence[] => {
  const ref = dayjs(referenceDate);
  const today = dayjs().startOf('day');
  const startOfWeek = ref.startOf('week'); // Sunday

  // Build a Set of `habitId:date` for O(1) lookups inside the loop
  const completedSet = new Set(
    allCheckins.filter((c) => c.completed).map((c) => `${c.habitId}:${c.date}`)
  );

  const dayNamesArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayShortArabic = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  const weeklyAdherence: DayAdherence[] = [];

  for (let i = 0; i < 7; i++) {
    const day = startOfWeek.add(i, 'day');
    const dStr = day.format('YYYY-MM-DD');
    const dayIdx = day.day();
    const isToday = day.isSame(today, 'day');
    const isFuture = day.isAfter(today, 'day');

    const dueHabits = habits.filter((h) => isHabitDueOnDate(h, dStr, false));
    const dueHabitIds = new Set(dueHabits.map((h) => h.id));

    const completedOffScheduleHabits = habits.filter(
      (h) => !dueHabitIds.has(h.id) && completedSet.has(`${h.id}:${dStr}`)
    );

    const completedDueCount = dueHabits.filter((h) =>
      completedSet.has(`${h.id}:${dStr}`)
    ).length;

    const totalCompleted = completedDueCount + completedOffScheduleHabits.length;
    const totalOpportunities = dueHabits.length + completedOffScheduleHabits.length;

    const rate =
      isFuture || totalOpportunities === 0
        ? 0
        : Math.min(100, Math.round((totalCompleted / totalOpportunities) * 100));

    weeklyAdherence.push({
      dayName: dayNamesArabic[dayIdx],
      dayShort: dayShortArabic[dayIdx],
      date: dStr,
      dayIndex: dayIdx,
      completedCount: totalCompleted,
      totalCount: totalOpportunities,
      rate,
      isFuture,
      isToday,
    });
  }

  return weeklyAdherence;
};

/**
 * Check if the user has ever achieved 100% completion on any past day
 */
export const hasEverHadPerfectDay = (
  habits: Habit[],
  allCheckins: HabitCheckin[]
): boolean => {
  if (habits.length === 0 || allCheckins.length === 0) return false;

  const completedCheckins = allCheckins.filter((c) => c.completed);
  if (completedCheckins.length === 0) return false;

  // Build a Set of `habitId:date` for O(1) lookups
  const completedSet = new Set(completedCheckins.map((c) => `${c.habitId}:${c.date}`));
  // Sort descending so the most recent dates are checked first, terminating early
  const distinctDates = Array.from(new Set(completedCheckins.map((c) => c.date))).sort().reverse();

  for (const dateStr of distinctDates) {
    const dueHabits = habits.filter((h) => isHabitDueOnDate(h, dateStr, false));
    if (dueHabits.length > 0) {
      const allCompleted = dueHabits.every((h) => completedSet.has(`${h.id}:${dateStr}`));
      if (allCompleted) {
        return true;
      }
    }
  }

  return false;

};

/**
 * Calculate overall progress for Home & Statistics screens
 */
export const calculateOverallStats = (
  habits: Habit[],
  allCheckins: HabitCheckin[],
  selectedDate: string,
  precalculatedBestStreak?: number,
  precalculatedCheckinsByHabit?: Map<string, HabitCheckin[]>
): OverallStats => {
  const activeHabits = habits.filter((h) => h.isActive && !h.archivedAt);
  const completedCheckins = allCheckins.filter((c) => c.completed);

  // Build a Set of `habitId:date` for completed checkins - O(1) lookup instead of O(n)
  const completedSet = new Set(completedCheckins.map((c) => `${c.habitId}:${c.date}`));

  // Relevant habits for the selected date
  const relevantHabits = getHabitsForDate(habits, allCheckins, selectedDate);
  const todayCompletedCount = relevantHabits.filter((h) =>
    completedSet.has(`${h.id}:${selectedDate}`)
  ).length;

  const todayTotalCount = relevantHabits.length;
  const todayCompletionRate =
    todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  // Best streak across all habits
  let bestOverallStreak: number;
  if (precalculatedBestStreak !== undefined) {
    bestOverallStreak = precalculatedBestStreak;
  } else {
    const checkinsByHabit =
      precalculatedCheckinsByHabit ||
      (() => {
        const map = new Map<string, HabitCheckin[]>();
        for (const c of allCheckins) {
          let list = map.get(c.habitId);
          if (!list) {
            list = [];
            map.set(c.habitId, list);
          }
          list.push(c);
        }
        return map;
      })();

    let maxStreak = 0;
    habits.forEach((h) => {
      const habitCheckins = checkinsByHabit.get(h.id) || [];
      const stats = calculateHabitStats(h, habitCheckins);
      if (stats.bestStreak > maxStreak) {
        maxStreak = stats.bestStreak;
      }
    });
    bestOverallStreak = maxStreak;
  }

  const weeklyAdherence = calculateWeekAdherence(habits, allCheckins, selectedDate);
  const perfectDayAchieved = hasEverHadPerfectDay(habits, allCheckins);

  return {
    totalHabits: habits.length,
    activeHabits: activeHabits.length,
    todayCompletionRate,
    todayCompletedCount,
    todayTotalCount,
    bestOverallStreak,
    totalCheckinsEver: completedCheckins.length,
    hasEverHadPerfectDay: perfectDayAchieved,
    weeklyAdherence,
  };
};

/**
 * Format Arabic date string nicely
 * e.g. "الخميس، 10 سبتمبر"
 */
export const formatArabicDate = (dateStr: string): string => {
  const d = dayjs(dateStr);
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const dayName = arabicDays[d.day()];
  const dayNum = d.date();
  const monthName = arabicMonths[d.month()];

  return `${dayName}، ${toArabicNumerals(dayNum)} ${monthName}`;
};

/**
 * Format week date range in Arabic
 * e.g. "١٠ - ١٦ سبتمبر ٢٠٢٦"
 */
export const formatWeekRangeArabic = (referenceDate: string | dayjs.Dayjs): string => {
  const ref = dayjs(referenceDate);
  const start = ref.startOf('week');
  const end = ref.endOf('week');

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const sDate = toArabicNumerals(start.date());
  const eDate = toArabicNumerals(end.date());
  const yearStr = toArabicNumerals(start.year());

  if (start.month() === end.month()) {
    return `${sDate} - ${eDate} ${arabicMonths[start.month()]} ${yearStr}`;
  } else {
    return `${sDate} ${arabicMonths[start.month()]} - ${eDate} ${arabicMonths[end.month()]} ${yearStr}`;
  }
};

/**
 * Normalizes Arabic text for robust search matching:
 * - Unifies Alef variants (أ, إ, آ, ٱ) -> ا
 * - Unifies Taa Marbuta (ة) -> ه
 * - Unifies Alif Maqsura (ى) -> ي
 * - Strips Arabic diacritics (tashkeel / harakat)
 * - Lowercases and trims whitespace
 */
export const normalizeArabicText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
};

/**
 * Filter habits by search query matching name or description with Arabic normalization
 */
export const filterHabitsByQuery = (habits: Habit[], query: string): Habit[] => {
  const normalizedQuery = normalizeArabicText(query);
  if (!normalizedQuery) return habits;

  return habits.filter((h) => {
    const normName = normalizeArabicText(h.name);
    const normDesc = h.description ? normalizeArabicText(h.description) : '';
    return normName.includes(normalizedQuery) || normDesc.includes(normalizedQuery);
  });
};

export interface CheckinProgress {
  count: number;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
  progressRatio: number;
  progressPercent: number;
  rawRatio: number;
  rawPercent: number;
}

/**
 * Determines whether a habit is quantitative (measured by numerical quantity/unit rather than a simple boolean checkbox).
 */
export const isQuantitativeHabit = (habit?: Habit | null): boolean => {
  if (!habit) return false;
  if (habit.targetCount > 1) return true;
  const unit = (habit.unit || '').trim();
  if (unit && unit !== 'مرة' && unit !== 'يوم') {
    return true;
  }
  return false;
};

/**
 * Calculate progress details for a habit checkin
 */
export const calculateCheckinProgress = (
  habit: Habit,
  checkin?: HabitCheckin
): CheckinProgress => {
  const targetCount = Math.max(1, habit.targetCount || 1);
  const count = Math.max(0, checkin ? checkin.count : 0);
  const isCompleted = Boolean(checkin?.completed) || count >= targetCount;
  const progressRatio = isCompleted ? 1 : Math.min(1, count / targetCount);
  const progressPercent = Math.round(progressRatio * 100);
  const rawRatio = targetCount > 0 ? count / targetCount : 0;
  const rawPercent = Math.round(rawRatio * 100);

  return {
    count,
    currentCount: count,
    targetCount,
    isCompleted,
    progressRatio,
    progressPercent,
    rawRatio,
    rawPercent,
  };
};

/**
 * Calculates the total logged units across all checkins for a quantitative habit.
 */
export const calculateTotalLoggedUnits = (
  habitId: string,
  allCheckins: HabitCheckin[]
): number => {
  let total = 0;
  for (const c of allCheckins) {
    if (c.habitId === habitId && c.count && c.count > 0) {
      total += c.count;
    }
  }
  return total;
};

export interface HabitStreakStatusInfo {
  status: 'completed' | 'rest_day' | 'pending';
  message: string;
  iconName: string;
}

/**
 * Determines current status and friendly message for a habit on a specific date
 */
export const getHabitStreakStatus = (
  habit: Habit,
  allCheckins: HabitCheckin[],
  dateStr: string
): HabitStreakStatusInfo => {
  const isDue = isHabitDueOnDate(habit, dateStr, false);
  const isCompleted = allCheckins.some(
    (c) => c.habitId === habit.id && c.date === dateStr && c.completed
  );

  if (isCompleted) {
    return {
      status: 'completed',
      message: 'تم إنجاز العادة بنجاح! سلسلتك في استمرار وتألق',
      iconName: 'checkmark-circle-outline',
    };
  }

  if (!isDue) {
    return {
      status: 'rest_day',
      message: 'اليوم يوم استراحة مجدول لهذه العادة (السلسلة محفوظة)',
      iconName: 'cafe-outline',
    };
  }

  return {
    status: 'pending',
    message: 'بانتظار إنجازك اليوم للحفاظ على استمرارية سلسلتك',
    iconName: 'time-outline',
  };
};


/**
 * Calculate the next clamped count for incremental checkins
 */
export const getNextProgressCount = (
  currentCount: number,
  targetCount: number,
  direction: 'increment' | 'decrement',
  step = 1
): number => {
  const safeTarget = Math.max(1, targetCount);
  const safeCurrent = Math.max(0, currentCount);

  if (direction === 'increment') {
    return Math.min(safeTarget, safeCurrent + step);
  } else {
    return Math.max(0, safeCurrent - step);
  }
};

/**
 * Format daily habits progress summary for sharing
 */
export const formatDailySummaryForShare = (
  dateStr: string,
  habits: Habit[],
  allCheckins: HabitCheckin[]
): string => {
  const dateFormatted = formatArabicDate(dateStr);
  const dueHabits = getHabitsForDate(habits, allCheckins, dateStr);

  if (dueHabits.length === 0) {
    return `تطبيق إنجاز | ${dateFormatted}\nلا توجد عادات مجدولة لهذا اليوم.`;
  }

  const completedList: string[] = [];
  const pendingList: string[] = [];

  dueHabits.forEach((h) => {
    const chk = allCheckins.find((c) => c.habitId === h.id && c.date === dateStr);
    const isCompleted = Boolean(chk?.completed);
    const count = chk ? chk.count : 0;

    let text = h.name;
    if (isQuantitativeHabit(h)) {
      text += ` (${toArabicNumerals(count)}/${toArabicNumerals(h.targetCount)} ${h.unit})`;
    }

    if (isCompleted) {
      completedList.push(`• [مكتملة] ${text}`);
    } else {
      pendingList.push(`• [متبقية] ${text}`);
    }
  });

  const completionRate = Math.round((completedList.length / dueHabits.length) * 100);

  const sections = [
    `تقرير إنجاز (${dateFormatted})`,
    `نسبة الالتزام: ${toArabicNumerals(completionRate)}٪ (${toArabicNumerals(completedList.length)} من ${toArabicNumerals(dueHabits.length)} مكتملة)`,
    '',
  ];

  if (completedList.length > 0) {
    sections.push('العادات المنجزة:');
    sections.push(...completedList);
    sections.push('');
  }

  if (pendingList.length > 0) {
    sections.push('العادات المتبقية:');
    sections.push(...pendingList);
    sections.push('');
  }

  sections.push('تم التوثيق عبر تطبيق إنجاز');

  return sections.join('\n').trim();
};

/**
 * Format overall user stats summary for sharing
 */
export const formatOverallStatsForShare = (
  habits: Habit[],
  allCheckins: HabitCheckin[],
  todayStr: string
): string => {
  const overall = calculateOverallStats(habits, allCheckins, todayStr);
  const streakText = formatArabicStreakDays(overall.bestOverallStreak);

  return [
    'إحصائياتي في تطبيق إنجاز:',
    `• نسبة إنجاز اليوم: ${toArabicNumerals(overall.todayCompletionRate)}٪`,
    `• أعلى سلسلة متتالية: ${streakText}`,
    `• إجمالي الإنجازات: ${toArabicNumerals(overall.totalCheckinsEver)} إنجاز`,
    `• العادات النشطة: ${formatArabicCount(overall.activeHabits, 'عادة واحدة', 'عادتان', 'عادات', 'عادة')}`,
    '',
    'تطبيق إنجاز للالتزام وبناء العادات',
  ].join('\n');
};

/**
 * Sort habits according to user preference:
 * - 'default': retains initial list order (creation chronological)
 * - 'pending_first': uncompleted habits on selectedDate come first, followed by completed habits
 * - 'reminder_time': earliest reminder to latest, habits without reminders at the end
 * - 'streak': highest streak first
 */
export const sortHabits = (
  habits: Habit[],
  sortOption: HabitSortOption,
  allCheckins: HabitCheckin[],
  selectedDate: string
): Habit[] => {
  if (habits.length <= 1) {
    return [...habits];
  }

  const completedSet = new Set(
    allCheckins
      .filter((c) => c.date === selectedDate && c.completed)
      .map((c) => c.habitId)
  );

  let streakCache: Map<string, number> | null = null;
  if (sortOption === 'streak') {
    streakCache = new Map();
    const completedDatesByHabit = new Map<string, Set<string>>();
    for (const c of allCheckins) {
      if (c.completed) {
        let set = completedDatesByHabit.get(c.habitId);
        if (!set) {
          set = new Set();
          completedDatesByHabit.set(c.habitId, set);
        }
        set.add(c.date);
      }
    }
    habits.forEach((h) => {
      const dates = completedDatesByHabit.get(h.id) || new Set<string>();
      streakCache!.set(
        h.id,
        calculateCurrentStreakFromDates(h, dates, selectedDate)
      );
    });
  }

  return [...habits].sort((a, b) => {
    // 1. In default and pending_first modes: completed habits always go to the bottom of the list (below all habits, even unpinned)
    if (sortOption === 'default' || sortOption === 'pending_first') {
      const aDone = completedSet.has(a.id) ? 1 : 0;
      const bDone = completedSet.has(b.id) ? 1 : 0;
      if (aDone !== bDone) {
        return aDone - bDone;
      }
    }

    // 2. Among habits with identical completion status, pinned habits always come first
    const aPinned = a.isPinned ? 1 : 0;
    const bPinned = b.isPinned ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }

    // 3. Secondary sort according to sortOption
    if (sortOption === 'pending_first') {
      return 0;
    }

    if (sortOption === 'reminder_time') {
      const aTime = a.reminderTime ? normalizeArabicNumerals(a.reminderTime) : null;
      const bTime = b.reminderTime ? normalizeArabicNumerals(b.reminderTime) : null;

      if (aTime && bTime) {
        return aTime.localeCompare(bTime);
      }
      if (aTime && !bTime) return -1;
      if (!aTime && bTime) return 1;
      return 0;
    }

    if (sortOption === 'streak' && streakCache) {
      const aStreak = streakCache.get(a.id) ?? 0;
      const bStreak = streakCache.get(b.id) ?? 0;
      if (bStreak !== aStreak) {
        return bStreak - aStreak;
      }
      return 0;
    }

    if (sortOption === 'alphabetical') {
      return a.name.localeCompare(b.name, 'ar');
    }

    if (sortOption === 'default') {
      if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
        return a.order - b.order;
      }
      return 0;
    }

    return 0;
  });
};

/**
 * Reorders an array by moving an item from fromIndex to toIndex immutably
 */
export const reorderArray = <T>(list: T[], fromIndex: number, toIndex: number): T[] => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= list.length ||
    toIndex < 0 ||
    toIndex >= list.length
  ) {
    return [...list];
  }
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

const ARABIC_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/**
 * Calculate month-level adherence, total completions, and perfect days count
 */
export const calculateMonthAdherence = (
  habits: Habit[],
  allCheckins: HabitCheckin[],
  referenceDate: dayjs.Dayjs = dayjs()
): MonthAdherenceStats => {
  const targetMonth = referenceDate.startOf('month');
  const today = dayjs().startOf('day');
  const daysInMonth = targetMonth.daysInMonth();
  const year = targetMonth.year();
  const monthIndex = targetMonth.month();
  const monthLabel = `${ARABIC_MONTH_NAMES[monthIndex]} ${year}`;

  const activeHabits = habits.filter((h) => !h.archivedAt && h.isActive);
  const activeHabitsCount = activeHabits.length;

  const isCurrentMonth = today.isSame(targetMonth, 'month');
  const isFutureMonth = targetMonth.isAfter(today, 'month');

  const daysToEvaluate = isFutureMonth
    ? 0
    : isCurrentMonth
    ? Math.min(daysInMonth, today.date())
    : daysInMonth;

  let totalDueOpportunities = 0;
  let totalCompletions = 0;
  let perfectDaysCount = 0;

  // Pre-group completed checkins by date for O(1) lookups per day
  const completedHabitsByDate = new Map<string, Set<string>>();
  const completedCountByDate = new Map<string, number>();
  for (const c of allCheckins) {
    if (c.completed) {
      let set = completedHabitsByDate.get(c.date);
      if (!set) {
        set = new Set<string>();
        completedHabitsByDate.set(c.date, set);
      }
      set.add(c.habitId);
      completedCountByDate.set(c.date, (completedCountByDate.get(c.date) || 0) + 1);
    }
  }

  for (let day = 1; day <= daysToEvaluate; day++) {
    const curDate = targetMonth.date(day);
    const dateStr = curDate.format('YYYY-MM-DD');

    const dueOnDate = habits.filter((h) => isHabitDueOnDate(h, dateStr, false));
    const completedSetOnDay = completedHabitsByDate.get(dateStr);
    const completedCountOnDay = completedCountByDate.get(dateStr) || 0;

    totalDueOpportunities += dueOnDate.length;
    totalCompletions += completedCountOnDay;

    if (dueOnDate.length > 0 && completedSetOnDay) {
      const allDueCompleted = dueOnDate.every((h) => completedSetOnDay.has(h.id));
      if (allDueCompleted) {
        perfectDaysCount++;
      }
    }
  }

  const completionRate =
    totalDueOpportunities > 0
      ? Math.round((totalCompletions / totalDueOpportunities) * 100)
      : 0;

  return {
    monthLabel,
    year,
    monthIndex,
    totalDueOpportunities,
    totalCompletions,
    completionRate: Math.min(100, Math.max(0, completionRate)),
    perfectDaysCount,
    totalDaysInMonth: daysInMonth,
    daysPassedInMonth: daysToEvaluate,
    activeHabitsCount,
  };
};

/**
 * Format month achievement summary for native sharing
 */
export const formatMonthlySummaryForShare = (stats: MonthAdherenceStats): string => {
  return [
    `ملخص إنجازات شهر ${stats.monthLabel}:`,
    `• نسبة الالتزام الشهرية: ${toArabicNumerals(stats.completionRate)}٪`,
    `• إجمالي الإنجازات: ${toArabicNumerals(stats.totalCompletions)} إنجاز`,
    `• الأيام المكتملة ١٠٠٪: ${formatArabicDaysCount(stats.perfectDaysCount)}`,
    `• العادات النشطة: ${formatArabicCount(stats.activeHabitsCount, 'عادة واحدة', 'عادتان', 'عادات', 'عادة')}`,
    '',
    'تطبيق إنجاز لبناء العادات وتتبع الأهداف',
  ].join('\n');
};

/**
 * Habit formation milestones based on behavioral psychology
 */
export const STREAK_MILESTONES: StreakMilestoneTier[] = [
  {
    id: 'tier_0',
    name: 'بداية الرحلة',
    days: 0,
    icon: 'flag-outline',
    description: 'الخطوات الأولى نحو بناء روتين يومي راسخ',
  },
  {
    id: 'tier_3',
    name: 'انطلاقة واعدة',
    days: 3,
    icon: 'flash-outline',
    description: 'تجاوز حاجز البداية والانطلاق بقوة وثبات',
  },
  {
    id: 'tier_7',
    name: 'أسبوع متواصل',
    days: 7,
    icon: 'ribbon-outline',
    description: 'إتمام ٧ أيام متتالية وبناء الزخم الإيجابي',
  },
  {
    id: 'tier_14',
    name: 'تثبيت المسار',
    days: 14,
    icon: 'shield-checkmark-outline',
    description: 'أسبوعان كاملان من الثبات ومقاومة التكاسل',
  },
  {
    id: 'tier_21',
    name: 'بناء العادة',
    days: 21,
    icon: 'flame-outline',
    description: 'تجاوز مرحلة التكوين الكلاسيكية وترسيخ العادة',
  },
  {
    id: 'tier_30',
    name: 'شهر الإنجاز',
    days: 30,
    icon: 'trophy-outline',
    description: 'شهر كامل من الانضباط الذاتي والإرادة القوية',
  },
  {
    id: 'tier_66',
    name: 'العادة التلقائية',
    days: 66,
    icon: 'sparkles-outline',
    description: 'الوصول لمرحلة التلقائية العصبية وثبات السلوك',
  },
  {
    id: 'tier_100',
    name: 'احتراف وإتقان',
    days: 100,
    icon: 'diamond-outline',
    description: 'نادي المئة، تحولت العادة إلى جزء أصيل من هويتك',
  },
  {
    id: 'tier_365',
    name: 'سنة التميز والأسطورة',
    days: 365,
    icon: 'medal-outline',
    description: 'عام كامل من الإنجاز والتحول الإيجابي الشامل',
  },
];

/**
 * Calculates current streak milestone tier, next target, and progress percentage
 */
export const calculateStreakMilestone = (currentStreak: number): StreakMilestoneInfo => {
  const safeStreak = Math.max(0, currentStreak || 0);

  let currentTierIndex = 0;
  for (let i = 0; i < STREAK_MILESTONES.length; i++) {
    if (safeStreak >= STREAK_MILESTONES[i].days) {
      currentTierIndex = i;
    } else {
      break;
    }
  }

  const currentTier = STREAK_MILESTONES[currentTierIndex];
  const nextTier =
    currentTierIndex < STREAK_MILESTONES.length - 1
      ? STREAK_MILESTONES[currentTierIndex + 1]
      : null;

  if (!nextTier) {
    return {
      currentStreak: safeStreak,
      currentTier,
      nextMilestone: null,
      progressPercent: 100,
      isTopTier: true,
    };
  }

  const baseDays = currentTier.days;
  const targetDays = nextTier.days;
  const tierSpan = targetDays - baseDays;
  const achievedInTier = safeStreak - baseDays;
  const progressPercent =
    tierSpan > 0 ? Math.min(100, Math.max(0, Math.round((achievedInTier / tierSpan) * 100))) : 0;
  const remainingDays = Math.max(0, targetDays - safeStreak);

  return {
    currentStreak: safeStreak,
    currentTier,
    nextMilestone: {
      tier: nextTier,
      remainingDays,
    },
    progressPercent,
    isTopTier: false,
  };
};

/**
 * Calculates consistency and completion pattern across the 7 days of the week (Sunday to Saturday)
 */
export const calculateHabitConsistencyPattern = (
  habit: Habit,
  allCheckins: HabitCheckin[],
  referenceDate?: string | dayjs.Dayjs
): HabitConsistencyPattern => {
  const today = (referenceDate ? dayjs(referenceDate) : dayjs()).startOf('day');
  const createdDate = dayjs(habit.createdAt).startOf('day');

  // Filter completed checkins for this habit up to today
  const habitCompletedCheckins = allCheckins.filter(
    (c) => c.habitId === habit.id && c.completed && !dayjs(c.date).startOf('day').isAfter(today)
  );

  let earliestDate = createdDate;
  habitCompletedCheckins.forEach((c) => {
    const d = dayjs(c.date).startOf('day');
    if (d.isBefore(earliestDate)) {
      earliestDate = d;
    }
  });

  const dueCounts = [0, 0, 0, 0, 0, 0, 0];
  const completedCounts = [0, 0, 0, 0, 0, 0, 0];
  const completedDates = new Set(habitCompletedCheckins.map((c) => c.date));

  const totalDays = Math.max(1, today.diff(earliestDate, 'day') + 1);
  for (let i = 0; i < totalDays; i++) {
    const curDate = earliestDate.add(i, 'day');
    const curStr = curDate.format('YYYY-MM-DD');
    const dayOfWeek = curDate.day(); // 0 = Sun, ..., 6 = Sat

    const isDue = isHabitDueOnDate(habit, curStr, false);
    const isCompleted = completedDates.has(curStr);

    if (isDue) {
      dueCounts[dayOfWeek]++;
    }
    if (isCompleted) {
      completedCounts[dayOfWeek]++;
    }
  }

  const days: HabitDayDistribution[] = DAYS_OF_WEEK_AR.map((d) => {
    const due = dueCounts[d.index];
    const completed = completedCounts[d.index];
    const effectiveDue = Math.max(due, completed);
    const rate = effectiveDue > 0 ? Math.round((completed / effectiveDue) * 100) : 0;

    return {
      dayIndex: d.index,
      dayName: d.name,
      dayShort: d.short,
      dueCount: effectiveDue,
      completedCount: completed,
      rate: Math.min(100, Math.max(0, rate)),
    };
  });

  // If no checkins have been recorded yet for this habit
  if (habitCompletedCheckins.length === 0) {
    return {
      days,
      bestDay: null,
      weakestDay: null,
      insightMessage: 'سجل إنجازاتك خلال الأيام القادمة لبناء نمط الالتزام الأسبوعي الخاص بك.',
    };
  }

  // Evaluate active scheduled days with data
  const daysWithDue = days.filter((d) => d.dueCount > 0);

  let bestDay: HabitDayDistribution | null = null;
  let weakestDay: HabitDayDistribution | null = null;

  if (daysWithDue.length > 0) {
    const sorted = [...daysWithDue].sort(
      (a, b) => b.rate - a.rate || b.completedCount - a.completedCount
    );
    if (sorted[0].completedCount > 0 || sorted[0].rate > 0) {
      bestDay = sorted[0];
    }

    const lowest = [...daysWithDue].sort(
      (a, b) => a.rate - b.rate || a.completedCount - b.completedCount
    );
    if (lowest[0].rate < (bestDay?.rate ?? 100)) {
      weakestDay = lowest[0];
    }
  }

  let insightMessage = '';
  if (daysWithDue.length === 0 || (!bestDay && !weakestDay)) {
    insightMessage = 'سجل إنجازاتك خلال الأيام القادمة لبناء نمط الالتزام الأسبوعي الخاص بك.';
  } else if (bestDay && !weakestDay && bestDay.rate === 100) {
    insightMessage = 'ما شاء الله! التزام ممتاز ومثالي بنسبة ١٠٠٪ في جميع الأيام المجدولة.';
  } else if (bestDay && weakestDay) {
    insightMessage = `أفضل أيام التزامك هو يوم ${bestDay.dayName} بنسبة (${toArabicNumerals(bestDay.rate)}٪)، بينما يقل الإنجاز في يوم ${weakestDay.dayName} (${toArabicNumerals(weakestDay.rate)}٪).`;
  } else if (bestDay) {
    insightMessage = `يوم ${bestDay.dayName} هو أكثر أيامك التزامًا بهذه العادة بنسبة (${toArabicNumerals(bestDay.rate)}٪).`;
  } else {
    insightMessage = 'استمر في تسجيل إنجازاتك لاكتشاف نمط انضباطك الأسبوعي.';
  }

  return {
    days,
    bestDay,
    weakestDay,
    insightMessage,
  };
};

/**
 * Format single habit achievement summary for native sharing
 */
export const formatHabitStatsForShare = (
  habit: Habit,
  stats: HabitStats,
  milestone: StreakMilestoneInfo,
  latestNote?: string
): string => {
  const currentStreakText = formatHabitStreakArabic(stats.currentStreak, habit.frequency);
  const bestStreakText = formatHabitStreakArabic(stats.bestStreak, habit.frequency);

  const lines = [
    `إنجازي في عادة: ${habit.name}`,
    `• السلسلة الحالية: ${currentStreakText}`,
    `• أطول سلسلة: ${bestStreakText}`,
    `• مرحلة الالتزام: ${milestone.currentTier.name} (${toArabicNumerals(milestone.currentTier.days)} يوم)`,
    `• إجمالي الإنجازات: ${toArabicNumerals(stats.totalCompletions)} ${habit.unit}`,
    `• نسبة الالتزام: ${toArabicNumerals(stats.completionRate)}٪`,
  ];

  if (latestNote && latestNote.trim()) {
    lines.push(`• آخر خاطرة: "${latestNote.trim()}"`);
  }

  lines.push('', 'تطبيق إنجاز لبناء العادات وتتبع الأهداف');
  return lines.join('\n');
};

/**
 * Retrieves all checkin records with non-empty reflection notes for a habit,
 * ordered chronologically descending (newest first).
 */
export const getHabitCheckinNotes = (
  allCheckins: HabitCheckin[],
  habitId: string
): HabitCheckin[] => {
  return allCheckins
    .filter(
      (c) =>
        c.habitId === habitId &&
        typeof c.note === 'string' &&
        c.note.trim().length > 0
    )
    .sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Formats a reflection diary note summary for native sharing
 */
export const formatHabitNotesForShare = (
  habit: Habit,
  notes: HabitCheckin[]
): string => {
  if (!notes || notes.length === 0) {
    return `مذكرات وخواطر عادة: ${habit.name}\nلا توجد ملاحظات مسجلة بعد.`;
  }

  const formattedNotes = notes.slice(0, 5).map((n) => {
    const formattedDate = formatArabicDate(n.date);
    return `• ${formattedDate}:\n  "${n.note?.trim()}"`;
  });

  return [
    `مذكرات إنجازي في عادة: ${habit.name}`,
    `إجمالي الخواطر والتدوينات: ${toArabicNumerals(notes.length)}`,
    '',
    ...formattedNotes,
    '',
    'تطبيق إنجاز لبناء العادات وتتبع الأهداف',
  ].join('\n');
};

/**
 * Formats a count of days adhering to authentic Arabic grammar rules:
 * 0 -> '0 يوم'
 * 1 -> 'يوم واحد'
 * 2 -> 'يومان'
 * 3..10 -> 'X أيام'
 * 11+ -> 'X يوم'
 */
export const formatArabicDaysCount = (count: number): string => {
  const safe = Math.max(0, Math.floor(count || 0));
  if (safe === 0) return '٠ يوم';
  if (safe === 1) return 'يوم واحد';
  if (safe === 2) return 'يومان';
  if (safe >= 3 && safe <= 10) return `${toArabicNumerals(safe)} أيام`;
  return `${toArabicNumerals(safe)} يوم`;
};

/**
 * Formats streak count into authentic Arabic phrasing with 'متتالية':
 * 0 -> '٠ يوم'
 * 1 -> 'يوم واحد'
 * 2 -> 'يومان متتاليان'
 * 3..10 -> 'X أيام متتالية'
 * 11+ -> 'X يوم متتالية'
 */
export const formatArabicStreakDays = (count: number): string => {
  const safe = Math.max(0, Math.floor(count || 0));
  if (safe === 0) return '٠ يوم';
  if (safe === 1) return 'يوم واحد';
  if (safe === 2) return 'يومان متتاليان';
  if (safe >= 3 && safe <= 10) return `${toArabicNumerals(safe)} أيام متتالية`;
  return `${toArabicNumerals(safe)} يوم متتالية`;
};

/**
 * Formats streak count into Arabic according to habit frequency (days, weeks, months).
 */
export const formatHabitStreakArabic = (count: number, frequency: HabitFrequency): string => {
  const safe = Math.max(0, Math.floor(count || 0));
  if (frequency === 'weekly_target') {
    if (safe === 0) return '٠ أسبوع';
    if (safe === 1) return 'أسبوع واحد';
    if (safe === 2) return 'أسبوعان متتاليان';
    if (safe >= 3 && safe <= 10) return `${toArabicNumerals(safe)} أسابيع متتالية`;
    return `${toArabicNumerals(safe)} أسبوعاً متتالياً`;
  }
  if (frequency === 'monthly_target') {
    if (safe === 0) return '٠ شهر';
    if (safe === 1) return 'شهر واحد';
    if (safe === 2) return 'شهران متتاليان';
    if (safe >= 3 && safe <= 10) return `${toArabicNumerals(safe)} أشهر متتالية`;
    return `${toArabicNumerals(safe)} شهراً متتالياً`;
  }
  if (frequency === 'specific_days') {
    if (safe === 0) return '٠ إنجاز';
    if (safe === 1) return 'إنجاز واحد';
    if (safe === 2) return 'إنجازان متتاليان';
    if (safe >= 3 && safe <= 10) return `${toArabicNumerals(safe)} إنجازات متتالية`;
    return `${toArabicNumerals(safe)} إنجازاً متتالياً`;
  }
  return formatArabicStreakDays(safe);
};

/**
 * Returns a short concise schedule badge label for habits with specific days or periodic targets.
 */
export const formatHabitScheduleShort = (habit: Habit): string | undefined => {
  if (habit.frequency === 'specific_days') {
    const days = Array.isArray(habit.frequencyDays) ? habit.frequencyDays : [];
    if (days.length === 0 || days.length === 7) return undefined;
    if (days.length <= 4) {
      const sorted = [...days].sort((a, b) => a - b);
      return sorted
        .map((d) => DAYS_OF_WEEK_AR.find((item) => item.index === d)?.short || '')
        .filter(Boolean)
        .join(' • ');
    }
    return `${toArabicNumerals(days.length)} أيام/أسبوع`;
  }
  if (habit.frequency === 'monthly_day') {
    return `يوم ${toArabicNumerals(habit.monthlyDay || 1)} شهرياً`;
  }
  return undefined;
};

/**
 * Returns a human-friendly Arabic label describing the habit's frequency schedule.
 */
export const formatHabitFrequencyLabel = (habit: Habit): string => {
  switch (habit.frequency) {
    case 'daily':
      return 'يوميًا';
    case 'specific_days': {
      const daysCount = Array.isArray(habit.frequencyDays) ? habit.frequencyDays.length : 0;
      if (daysCount === 0 || daysCount === 7) return 'يوميًا';
      if (daysCount === 1) return 'يوم واحد أسبوعيًا';
      if (daysCount === 2) return 'يومان أسبوعيًا';
      if (daysCount >= 3 && daysCount <= 10) return `${toArabicNumerals(daysCount)} أيام أسبوعيًا`;
      return `${toArabicNumerals(daysCount)} يومًا أسبوعيًا`;
    }
    case 'weekly_target': {
      const count = habit.weeklyTargetCount || 1;
      if (count === 1) return 'مرة واحدة أسبوعيًا';
      if (count === 2) return 'مرتان أسبوعيًا';
      if (count >= 3 && count <= 10) return `${toArabicNumerals(count)} مرات أسبوعيًا`;
      return `${toArabicNumerals(count)} مرة أسبوعيًا`;
    }
    case 'monthly_day':
      return `يوم ${toArabicNumerals(habit.monthlyDay || 1)} من كل شهر`;
    case 'monthly_target': {
      const count = habit.monthlyTargetCount || 1;
      if (count === 1) return 'مرة واحدة شهريًا';
      if (count === 2) return 'مرتان شهريًا';
      if (count >= 3 && count <= 10) return `${toArabicNumerals(count)} مرات شهريًا`;
      return `${toArabicNumerals(count)} مرة شهريًا`;
    }
    default:
      return 'يوميًا';
  }
};

export const CATEGORY_CONFIG: {
  category: Exclude<HabitCategory, 'الكل'>;
  iconName: string;
  color: string;
}[] = [
  { category: 'صحة', iconName: 'fitness-outline', color: '#2ECC71' },
  { category: 'إنتاجية', iconName: 'laptop-outline', color: '#3498DB' },
  { category: 'روتين', iconName: 'sunny-outline', color: '#E67E22' },
  { category: 'روحانية', iconName: 'sparkles-outline', color: '#9B59B6' },
  { category: 'تطوير', iconName: 'book-outline', color: '#1ABC9C' },
];

/**
 * Calculates category breakdown, adherence balance, and personalized coaching insight.
 */
export const calculateCategoryAnalytics = (
  habits: Habit[],
  allCheckins: HabitCheckin[]
): CategoryAnalytics => {
  const activeHabits = habits.filter((h) => !h.archivedAt && h.isActive);
  const completedCheckins = allCheckins.filter((c) => c.completed);

  // Pre-calculate habit category and stats
  const habitCategoryMap = new Map<string, string>();
  const habitStatsCache = new Map<string, number>();

  const totalHabitsByCat = new Map<string, number>();
  const activeHabitsByCat = new Map<string, Habit[]>();

  for (const h of habits) {
    const cat = getHabitCategory(h.icon);
    habitCategoryMap.set(h.id, cat);
    totalHabitsByCat.set(cat, (totalHabitsByCat.get(cat) || 0) + 1);

    if (!h.archivedAt && h.isActive) {
      let activeList = activeHabitsByCat.get(cat);
      if (!activeList) {
        activeList = [];
        activeHabitsByCat.set(cat, activeList);
      }
      activeList.push(h);

      // Pre-compute completion rate for this active habit once
      const stats = calculateHabitStats(h, allCheckins);
      habitStatsCache.set(h.id, stats.completionRate);
    }
  }

  // Count checkins per category in one pass
  const checkinsByCat = new Map<string, number>();
  for (const c of completedCheckins) {
    const cat = habitCategoryMap.get(c.habitId);
    if (cat) {
      checkinsByCat.set(cat, (checkinsByCat.get(cat) || 0) + 1);
    }
  }

  const categories: CategoryPerformanceItem[] = CATEGORY_CONFIG.map((cfg) => {
    const catTotalHabits = totalHabitsByCat.get(cfg.category) || 0;
    const catActiveHabits = activeHabitsByCat.get(cfg.category) || [];
    const catTotalCheckins = checkinsByCat.get(cfg.category) || 0;

    let completionRate = 0;
    if (catActiveHabits.length > 0) {
      const sumRates = catActiveHabits.reduce((acc, h) => {
        return acc + (habitStatsCache.get(h.id) || 0);
      }, 0);
      completionRate = Math.round(sumRates / catActiveHabits.length);
    }

    return {
      category: cfg.category,
      iconName: cfg.iconName,
      color: cfg.color,
      totalHabits: catTotalHabits,
      activeHabits: catActiveHabits.length,
      totalCheckins: catTotalCheckins,
      completionRate: Math.min(100, Math.max(0, completionRate)),
    };
  });

  const categoriesWithActive = categories.filter((c) => c.activeHabits > 0);

  let topCategory: CategoryPerformanceItem | null = null;
  let focusCategory: CategoryPerformanceItem | null = null;

  if (categoriesWithActive.length > 0) {
    const sortedByRate = [...categoriesWithActive].sort(
      (a, b) => b.completionRate - a.completionRate || b.totalCheckins - a.totalCheckins
    );
    topCategory = sortedByRate[0];

    const sortedLowest = [...categoriesWithActive].sort(
      (a, b) => a.completionRate - b.completionRate || a.totalCheckins - b.totalCheckins
    );
    if (sortedLowest[0].completionRate < topCategory.completionRate) {
      focusCategory = sortedLowest[0];
    }
  }

  // Calculate life balance score
  let balanceScore = 0;
  if (activeHabits.length > 0) {
    const activeCatCount = categoriesWithActive.length;
    const coverageRatio = activeCatCount / CATEGORY_CONFIG.length;
    const avgRate =
      categoriesWithActive.reduce((acc, c) => acc + c.completionRate, 0) /
      Math.max(1, activeCatCount);
    balanceScore = Math.min(100, Math.max(0, Math.round(coverageRatio * 40 + avgRate * 0.6)));
  }

  let insightMessage = '';
  if (activeHabits.length === 0) {
    insightMessage = 'أضف عاداتك الأولى في مختلف مجالات الحياة لبدء رحلة التوازن والتطوير.';
  } else if (topCategory && !focusCategory && topCategory.completionRate === 100) {
    insightMessage = 'توازن استثنائي! التزام تام في جميع مجالات حياتك بنسبة ١٠٠٪';
  } else if (topCategory && focusCategory) {
    insightMessage = `أداؤك متميز في مجال ${topCategory.category} بنسبة (${toArabicNumerals(topCategory.completionRate)}٪)، وركّز أكثر على ${focusCategory.category} (${toArabicNumerals(focusCategory.completionRate)}٪) لتحقيق التوازن الشامل.`;
  } else if (topCategory) {
    insightMessage = `استمرارية رائعة في مجال ${topCategory.category} بنسبة (${toArabicNumerals(topCategory.completionRate)}٪)، وسّع نطاق عاداتك لتشمل مجالات جديدة`;
  } else {
    insightMessage = 'واصل بناء عاداتك في مختلف المجالات للارتقاء بنمط حياتك اليومي.';
  }

  return {
    categories,
    topCategory,
    focusCategory,
    balanceScore,
    insightMessage,
  };
};

/**
 * Generic Arabic counting helper with singular, dual, plural, and over-ten forms.
 */
export const formatArabicCount = (
  count: number,
  singular: string,
  dual: string,
  plural: string,
  overTenUnit?: string
): string => {
  const safe = Math.max(0, Math.floor(count || 0));
  const fallbackUnit = overTenUnit || singular;
  if (safe === 0) return `٠ ${fallbackUnit}`;
  if (safe === 1) return singular;
  if (safe === 2) return dual;
  if (safe >= 3 && safe <= 10) return `${toArabicNumerals(safe)} ${plural}`;
  return `${toArabicNumerals(safe)} ${fallbackUnit}`;
};

/**
 * Escapes a cell value according to RFC 4180 CSV standard.
 */
export const escapeCsvCell = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Exports all checkins and daily reflection notes to standard CSV format.
 * Prepends UTF-8 BOM (\uFEFF) to ensure Arabic text displays correctly in Excel.
 */
export const exportCheckinsToCsv = (
  habits: Habit[],
  checkins: HabitCheckin[]
): string => {
  const habitMap = new Map<string, Habit>();
  habits.forEach((h) => habitMap.set(h.id, h));

  const headers = [
    'تاريخ الإنجاز',
    'اسم العادة',
    'القسم',
    'الحالة',
    'العدد المنجز',
    'الهدف اليومي',
    'الوحدة',
    'الملاحظات والخواطر',
    'تاريخ التوثيق',
  ];

  const sortedCheckins = [...checkins].sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    const hA = habitMap.get(a.habitId)?.name || '';
    const hB = habitMap.get(b.habitId)?.name || '';
    return hA.localeCompare(hB);
  });

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  for (const c of sortedCheckins) {
    const habit = habitMap.get(c.habitId);
    const habitName = habit?.name || c.habitId;
    const category = getHabitCategory(habit?.icon);
    const statusText = c.completed ? 'مكتمل' : 'قيد الإنجاز';
    const targetCount = habit?.targetCount ?? 1;
    const unit = habit?.unit ?? 'مرة';
    const note = c.note || '';
    const updatedAt = c.updatedAt || '';

    rows.push(
      [
        c.date,
        habitName,
        category,
        statusText,
        c.count,
        targetCount,
        unit,
        note,
        updatedAt,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return '\uFEFF' + rows.join('\r\n');
};

/**
 * Exports a summary of all habits with streak metrics and adherence to CSV.
 */
export const exportHabitsSummaryToCsv = (
  habits: Habit[],
  checkins: HabitCheckin[]
): string => {
  const headers = [
    'اسم العادة',
    'القسم',
    'نوع التكرار',
    'الهدف اليومي',
    'الوحدة',
    'السلسلة الحالية',
    'أعلى سلسلة',
    'إجمالي الإنجازات',
    'نسبة الالتزام %',
    'الحالة',
    'وقت التذكير',
    'مثبتة',
    'تاريخ الإنشاء',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  for (const habit of habits) {
    const stats = calculateHabitStats(habit, checkins);
    const category = getHabitCategory(habit.icon);
    const freqLabel = formatHabitFrequencyLabel(habit);
    const statusLabel = habit.archivedAt ? 'مؤرشفة' : habit.isActive ? 'نشطة' : 'متوقفة';
    const isPinnedLabel = habit.isPinned ? 'نعم' : 'لا';
    const reminderLabel = habit.reminderTime || 'بدون تذكير';

    rows.push(
      [
        habit.name,
        category,
        freqLabel,
        habit.targetCount,
        habit.unit,
        stats.currentStreak,
        stats.bestStreak,
        stats.totalCompletions,
        `${stats.completionRate}%`,
        statusLabel,
        reminderLabel,
        isPinnedLabel,
        habit.createdAt,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return '\uFEFF' + rows.join('\r\n');
};

/**
 * Exports a comprehensive report containing both habits summary and detailed checkin records.
 */
export const exportFullReportToCsv = (
  habits: Habit[],
  checkins: HabitCheckin[]
): string => {
  const habitsCsv = exportHabitsSummaryToCsv(habits, checkins).replace(/^\uFEFF/, '');
  const checkinsCsv = exportCheckinsToCsv(habits, checkins).replace(/^\uFEFF/, '');

  return (
    '\uFEFF' +
    '# ملخص أداء العادات' +
    '\r\n' +
    habitsCsv +
    '\r\n\r\n' +
    '# سجلات الإنجاز والملاحظات اليومية' +
    '\r\n' +
    checkinsCsv
  );
};

/**
 * Exports a detailed CSV record for a single habit including its stats and all chronological checkins.
 */
export const exportSingleHabitToCsv = (
  habit: Habit,
  allCheckins: HabitCheckin[]
): string => {
  const stats = calculateHabitStats(habit, allCheckins);
  const habitCheckins = allCheckins
    .filter((c) => c.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const summaryHeaders = [
    'اسم العادة',
    'القسم',
    'الهدف اليومي',
    'الوحدة',
    'السلسلة الحالية',
    'أعلى سلسلة',
    'إجمالي الإنجازات',
    'نسبة الالتزام %',
    'الحالة',
    'تاريخ الإنشاء',
  ];

  const category = getHabitCategory(habit.icon);
  const statusLabel = habit.archivedAt ? 'مؤرشفة' : habit.isActive ? 'نشطة' : 'متوقفة';

  const summaryRow = [
    habit.name,
    category,
    habit.targetCount,
    habit.unit,
    stats.currentStreak,
    stats.bestStreak,
    stats.totalCompletions,
    `${stats.completionRate}%`,
    statusLabel,
    habit.createdAt,
  ];

  const checkinHeaders = [
    'التاريخ',
    'حالة الإنجاز',
    'الكمية المنجزة',
    'الهدف اليومي',
    'الوحدة',
    'الملاحظة / الخاطرة',
    'وقت التوثيق',
  ];

  const checkinRows = habitCheckins.map((c) =>
    [
      c.date,
      c.completed ? 'مكتمل' : 'قيد الإنجاز',
      c.count,
      habit.targetCount,
      habit.unit,
      c.note || '',
      c.updatedAt || '',
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return (
    '\uFEFF' +
    '# بطاقة ملخص العادة' +
    '\r\n' +
    summaryHeaders.map(escapeCsvCell).join(',') +
    '\r\n' +
    summaryRow.map(escapeCsvCell).join(',') +
    '\r\n\r\n' +
    '# سجل التاريخ والملاحظات اليومية' +
    '\r\n' +
    checkinHeaders.map(escapeCsvCell).join(',') +
    (checkinRows.length > 0 ? '\r\n' + checkinRows.join('\r\n') : '')
  );
};



