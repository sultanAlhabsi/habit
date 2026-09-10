import dayjs from 'dayjs';
import type {
  Habit,
  HabitCheckin,
  HabitStats,
  OverallStats,
  DayAdherence,
  HabitSortOption,
  MonthAdherenceStats,
} from '../types/habit';

export const HABIT_CATEGORIES = ['الكل', 'صحة', 'إنتاجية', 'روتين', 'روحانية', 'تطوير'] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

const ICON_CATEGORY_MAP: Record<string, string> = {
  'book-outline': 'تطوير',
  'journal-outline': 'تطوير',
  'water-outline': 'صحة',
  'fitness-outline': 'صحة',
  'moon-outline': 'صحة',
  'heart-outline': 'صحة',
  'walk-outline': 'صحة',
  'bicycle-outline': 'صحة',
  'barbell-outline': 'صحة',
  'bed-outline': 'صحة',
  'pulse-outline': 'صحة',
  'sunny-outline': 'روتين',
  'alarm-outline': 'روتين',
  'cafe-outline': 'روتين',
  'sparkles-outline': 'روحانية',
  'leaf-outline': 'روحانية',
  'laptop-outline': 'إنتاجية',
  'trophy-outline': 'إنتاجية',
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

  const targetDate = dayjs(dateStr).startOf('day');
  const createdDate = dayjs(habit.createdAt).startOf('day');

  // If date is before habit creation, it wasn't due then
  if (targetDate.isBefore(createdDate)) return false;

  // If habit was archived, it was not due on dates after archive date
  if (habit.archivedAt && targetDate.isAfter(dayjs(habit.archivedAt).startOf('day'))) {
    return false;
  }

  if (habit.frequency === 'daily') {
    return true;
  }

  if (habit.frequency === 'specific_days') {
    const dayOfWeek = targetDate.day(); // 0 is Sunday, 6 is Saturday
    return Array.isArray(habit.frequencyDays) && habit.frequencyDays.includes(dayOfWeek);
  }

  // weekly target is generally due any day
  return true;
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

  // Filter valid completed checkins up to today (ignore any accidental future dates)
  const habitCheckins = allCheckins.filter(
    (c) => c.habitId === habit.id && c.completed && !dayjs(c.date).startOf('day').isAfter(today)
  );

  const completedDates = new Set(habitCheckins.map((c) => c.date));
  const totalCompletions = completedDates.size;
  const createdDate = dayjs(habit.createdAt).startOf('day');

  // Find earliest relevant date (created date or earliest checkin)
  let earliestDate = createdDate;
  completedDates.forEach((dStr) => {
    const d = dayjs(dStr).startOf('day');
    if (d.isBefore(earliestDate)) {
      earliestDate = d;
    }
  });

  // Calculate current streak
  let currentStreak = 0;
  const isTodayDue = isHabitDueOnDate(habit, todayStr, false);
  const isTodayCompleted = completedDates.has(todayStr);

  let checkDate = today;
  if (isTodayCompleted) {
    currentStreak = 1;
    checkDate = today.subtract(1, 'day');
  } else {
    // If not completed today, start counting from yesterday (streak not broken until today ends)
    checkDate = today.subtract(1, 'day');
  }

  const maxBackwardDays = Math.min(365, today.diff(earliestDate, 'day') + 1);
  for (let i = 0; i < maxBackwardDays; i++) {
    if (checkDate.isBefore(earliestDate)) break;
    const dateStr = checkDate.format('YYYY-MM-DD');
    const isDue = isHabitDueOnDate(habit, dateStr, false);
    const isCompleted = completedDates.has(dateStr);

    if (isDue) {
      if (isCompleted) {
        currentStreak++;
      } else {
        // Streak is broken
        break;
      }
    } else if (isCompleted) {
      // Completed on an off day, still counts towards streak
      currentStreak++;
    }

    checkDate = checkDate.subtract(1, 'day');
  }

  // Calculate best streak and total due days chronologically
  let bestStreak = currentStreak;
  let runningStreak = 0;
  let totalDueDays = 0;

  const totalHistoryDays = Math.max(1, today.diff(earliestDate, 'day') + 1);
  for (let i = 0; i < totalHistoryDays; i++) {
    const curDate = earliestDate.add(i, 'day');
    const curStr = curDate.format('YYYY-MM-DD');
    const isDue = isHabitDueOnDate(habit, curStr, false);
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
    const wasCompletedOnDate = allCheckins.some(
      (c) => c.habitId === h.id && c.date === dateStr && c.completed
    );

    return wasCompletedOnDate;
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
  const completedCheckins = allCheckins.filter((c) => c.completed);

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
    const completed = dueHabits.filter((h) =>
      completedCheckins.some((c) => c.habitId === h.id && c.date === dStr)
    ).length;

    const rate =
      isFuture || dueHabits.length === 0
        ? 0
        : Math.round((completed / dueHabits.length) * 100);

    weeklyAdherence.push({
      dayName: dayNamesArabic[dayIdx],
      dayShort: dayShortArabic[dayIdx],
      date: dStr,
      dayIndex: dayIdx,
      completedCount: completed,
      totalCount: dueHabits.length,
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
  const distinctDates = Array.from(new Set(completedCheckins.map((c) => c.date)));

  for (const dateStr of distinctDates) {
    const dueHabits = habits.filter((h) => isHabitDueOnDate(h, dateStr, false));
    if (dueHabits.length > 0) {
      const allCompleted = dueHabits.every((h) =>
        completedCheckins.some((c) => c.habitId === h.id && c.date === dateStr)
      );
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
  selectedDate: string
): OverallStats => {
  const activeHabits = habits.filter((h) => h.isActive && !h.archivedAt);
  const completedCheckins = allCheckins.filter((c) => c.completed);

  // Relevant habits for the selected date
  const relevantHabits = getHabitsForDate(habits, allCheckins, selectedDate);
  const todayCompletedCount = relevantHabits.filter((h) =>
    completedCheckins.some((c) => c.habitId === h.id && c.date === selectedDate)
  ).length;

  const todayTotalCount = relevantHabits.length;
  const todayCompletionRate =
    todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  // Best streak across all habits
  let bestOverallStreak = 0;
  habits.forEach((h) => {
    const stats = calculateHabitStats(h, allCheckins);
    if (stats.bestStreak > bestOverallStreak) {
      bestOverallStreak = stats.bestStreak;
    }
  });

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

  return `${dayName}، ${dayNum} ${monthName}`;
};

/**
 * Format week date range in Arabic
 * e.g. "10 - 16 سبتمبر 2026"
 */
export const formatWeekRangeArabic = (referenceDate: string | dayjs.Dayjs): string => {
  const ref = dayjs(referenceDate);
  const start = ref.startOf('week');
  const end = ref.endOf('week');

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  if (start.month() === end.month()) {
    return `${start.date()} - ${end.date()} ${arabicMonths[start.month()]} ${start.year()}`;
  } else {
    return `${start.date()} ${arabicMonths[start.month()]} - ${end.date()} ${arabicMonths[end.month()]} ${start.year()}`;
  }
};

/**
 * Filter habits by search query matching name or description
 */
export const filterHabitsByQuery = (habits: Habit[], query: string): Habit[] => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return habits;

  return habits.filter(
    (h) =>
      h.name.toLowerCase().includes(trimmed) ||
      (h.description && h.description.toLowerCase().includes(trimmed))
  );
};

export interface CheckinProgress {
  count: number;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
  progressRatio: number;
  progressPercent: number;
}

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

  return {
    count,
    currentCount: count,
    targetCount,
    isCompleted,
    progressRatio,
    progressPercent,
  };
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
      message: 'تم إنجاز العادة بنجاح! سلسلتك في استمرار وتألق 🔥',
      iconName: 'checkmark-circle-outline',
    };
  }

  if (!isDue) {
    return {
      status: 'rest_day',
      message: 'اليوم يوم استراحة مجدول لهذه العادة (السلسلة محفوظة) ☕',
      iconName: 'cafe-outline',
    };
  }

  return {
    status: 'pending',
    message: 'بانتظار إنجازك اليوم للحفاظ على استمرارية سلسلتك ⏳',
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
    if (h.targetCount > 1) {
      text += ` (${count}/${h.targetCount} ${h.unit})`;
    }

    if (isCompleted) {
      completedList.push(`✅ ${text}`);
    } else {
      pendingList.push(`⏳ ${text}`);
    }
  });

  const completionRate = Math.round((completedList.length / dueHabits.length) * 100);

  const sections = [
    `📊 تقرير إنجاز (${dateFormatted})`,
    `نسبة الالتزام: ${completionRate}% (${completedList.length} من ${dueHabits.length} مكتملة)`,
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

  sections.push('تم التوثيق عبر تطبيق إنجاز 🎯');

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
  return [
    '🏆 إحصائياتي في تطبيق إنجاز:',
    `• نسبة إنجاز اليوم: ${overall.todayCompletionRate}%`,
    `• أعلى سلسلة متتالية: ${overall.bestOverallStreak} يوم 🔥`,
    `• إجمالي الإنجازات: ${overall.totalCheckinsEver} إنجاز 🎯`,
    `• العادات النشطة: ${overall.activeHabits} عادات`,
    '',
    'تطبيق إنجاز للالتزام وبناء العادات ✨',
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
  if (sortOption === 'default' || habits.length <= 1) {
    return [...habits];
  }

  const completedSet = new Set(
    allCheckins
      .filter((c) => c.date === selectedDate && c.completed)
      .map((c) => c.habitId)
  );

  return [...habits].sort((a, b) => {
    if (sortOption === 'pending_first') {
      const aDone = completedSet.has(a.id) ? 1 : 0;
      const bDone = completedSet.has(b.id) ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
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

    if (sortOption === 'streak') {
      const aStreak = calculateHabitStats(a, allCheckins, selectedDate).currentStreak;
      const bStreak = calculateHabitStats(b, allCheckins, selectedDate).currentStreak;
      if (bStreak !== aStreak) {
        return bStreak - aStreak;
      }
      return 0;
    }

    return 0;
  });
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

  for (let day = 1; day <= daysToEvaluate; day++) {
    const curDate = targetMonth.date(day);
    const dateStr = curDate.format('YYYY-MM-DD');

    const dueOnDate = habits.filter((h) => isHabitDueOnDate(h, dateStr, false));
    const dayCheckins = allCheckins.filter((c) => c.date === dateStr && c.completed);

    const completedCountOnDay = dayCheckins.length;
    totalDueOpportunities += dueOnDate.length;
    totalCompletions += completedCountOnDay;

    if (dueOnDate.length > 0) {
      const allDueCompleted = dueOnDate.every((h) =>
        dayCheckins.some((c) => c.habitId === h.id)
      );
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
    `📅 ملخص إنجازات شهر ${stats.monthLabel}:`,
    `• نسبة الالتزام الشهرية: ${stats.completionRate}%`,
    `• إجمالي الإنجازات: ${stats.totalCompletions} إنجاز 🎯`,
    `• الأيام المكتملة 100%: ${stats.perfectDaysCount} ${stats.perfectDaysCount === 1 ? 'يوم' : 'أيام'} 🌟`,
    `• العادات النشطة: ${stats.activeHabitsCount}`,
    '',
    'تطبيق إنجاز لبناء العادات وتتبع الأهداف ✨',
  ].join('\n');
};

