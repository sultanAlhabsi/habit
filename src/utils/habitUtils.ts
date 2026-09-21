import dayjs from 'dayjs';
import type {
  Habit,
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
 * Converts standard ASCII digits (0-9) to Eastern Arabic numerals (٠-٩).
 */
export const toArabicNumerals = (input: number | string | null | undefined): string => {
  if (input === null || input === undefined) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(input).replace(/[0-9]/g, (w) => arabicDigits[Number(w)]);
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

  // Performance Optimization (Bolt ⚡): Use string comparison for YYYY-MM-DD formats
  // instead of dayjs parsing. This is called heavily in loops and significantly reduces CPU overhead.
  // Note: We use dayjs().format('YYYY-MM-DD') for createdAt/archivedAt because the raw ISO string
  // is in UTC, which might be a different calendar date than the user's local timezone.
  // We format once and compare strings rather than calling .isBefore/.isAfter multiple times.
  const habitCreatedAtDate = dayjs(habit.createdAt).format('YYYY-MM-DD');
  if (dateStr < habitCreatedAtDate) return false;

  if (habit.archivedAt) {
    const archivedAtDate = dayjs(habit.archivedAt).format('YYYY-MM-DD');
    if (dateStr > archivedAtDate) return false;
  }

  if (habit.frequency === 'daily') {
    return true;
  }

  if (habit.frequency === 'specific_days') {
    // Only parse dayjs if we really need to know the day of the week
    const dayOfWeek = dayjs(dateStr).day(); // 0 is Sunday, 6 is Saturday
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

  const maxBackwardDays = Math.min(3650, Math.max(1, today.diff(earliestDate, 'day') + 1));
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
    const completedOffScheduleHabits = habits.filter(
      (h) =>
        !dueHabits.some((dh) => dh.id === h.id) &&
        completedCheckins.some((c) => c.habitId === h.id && c.date === dStr)
    );

    const completedDueCount = dueHabits.filter((h) =>
      completedCheckins.some((c) => c.habitId === h.id && c.date === dStr)
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
    if (h.targetCount > 1) {
      text += ` (${count}/${h.targetCount} ${h.unit})`;
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
    `• نسبة إنجاز اليوم: ${overall.todayCompletionRate}%`,
    `• أعلى سلسلة متتالية: ${streakText}`,
    `• إجمالي الإنجازات: ${overall.totalCheckinsEver} إنجاز`,
    `• العادات النشطة: ${overall.activeHabits} عادات`,
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
    habits.forEach((h) => {
      streakCache!.set(
        h.id,
        calculateHabitStats(h, allCheckins, selectedDate).currentStreak
      );
    });
  }

  return [...habits].sort((a, b) => {
    // 1. Pinned habits always come first
    const aPinned = a.isPinned ? 1 : 0;
    const bPinned = b.isPinned ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }

    // 2. Secondary sort according to sortOption
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
    `ملخص إنجازات شهر ${stats.monthLabel}:`,
    `• نسبة الالتزام الشهرية: ${stats.completionRate}%`,
    `• إجمالي الإنجازات: ${stats.totalCompletions} إنجاز`,
    `• الأيام المكتملة 100%: ${stats.perfectDaysCount} ${stats.perfectDaysCount === 1 ? 'يوم' : 'أيام'}`,
    `• العادات النشطة: ${stats.activeHabitsCount}`,
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
    description: 'إتمام 7 أيام متتالية وبناء الزخم الإيجابي',
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
    insightMessage = 'ما شاء الله! التزام ممتاز ومثالي بنسبة 100% في جميع الأيام المجدولة.';
  } else if (bestDay && weakestDay) {
    insightMessage = `أفضل أيام التزامك هو يوم ${bestDay.dayName} بنسبة (${bestDay.rate}%)، بينما يقل الإنجاز في يوم ${weakestDay.dayName} (${weakestDay.rate}%).`;
  } else if (bestDay) {
    insightMessage = `يوم ${bestDay.dayName} هو أكثر أيامك التزامًا بهذه العادة بنسبة (${bestDay.rate}%).`;
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
  const currentStreakText = formatArabicStreakDays(stats.currentStreak);
  const bestStreakText = formatArabicDaysCount(stats.bestStreak);

  const lines = [
    `إنجازي في عادة: ${habit.name}`,
    `• السلسلة الحالية: ${currentStreakText}`,
    `• أطول سلسلة: ${bestStreakText}`,
    `• مرحلة الالتزام: ${milestone.currentTier.name} (${milestone.currentTier.days} يوم)`,
    `• إجمالي الإنجازات: ${stats.totalCompletions} ${habit.unit}`,
    `• نسبة الالتزام: ${stats.completionRate}%`,
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
 * Format habit reflection diary notes for native sharing
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
    `إجمالي الخواطر والتدوينات: ${notes.length}`,
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
  if (safe === 0) return '0 يوم';
  if (safe === 1) return 'يوم واحد';
  if (safe === 2) return 'يومان';
  if (safe >= 3 && safe <= 10) return `${safe} أيام`;
  return `${safe} يوم`;
};

/**
 * Formats streak count into authentic Arabic phrasing with 'متتالية':
 * 0 -> '0 يوم'
 * 1 -> 'يوم واحد'
 * 2 -> 'يومان متتاليان'
 * 3..10 -> 'X أيام متتالية'
 * 11+ -> 'X يوم متتالية'
 */
export const formatArabicStreakDays = (count: number): string => {
  const safe = Math.max(0, Math.floor(count || 0));
  if (safe === 0) return '0 يوم';
  if (safe === 1) return 'يوم واحد';
  if (safe === 2) return 'يومان متتاليان';
  if (safe >= 3 && safe <= 10) return `${safe} أيام متتالية`;
  return `${safe} يوم متتالية`;
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

  const habitMap = new Map<string, Habit>();
  habits.forEach((h) => habitMap.set(h.id, h));

  const categories: CategoryPerformanceItem[] = CATEGORY_CONFIG.map((cfg) => {
    const catHabits = habits.filter(
      (h) => getHabitCategory(h.icon) === cfg.category
    );
    const catActiveHabits = activeHabits.filter(
      (h) => getHabitCategory(h.icon) === cfg.category
    );

    const catCheckins = completedCheckins.filter((c) => {
      const h = habitMap.get(c.habitId);
      return h && getHabitCategory(h.icon) === cfg.category;
    });

    let completionRate = 0;
    if (catActiveHabits.length > 0) {
      const sumRates = catActiveHabits.reduce((acc, h) => {
        const stats = calculateHabitStats(h, allCheckins);
        return acc + stats.completionRate;
      }, 0);
      completionRate = Math.round(sumRates / catActiveHabits.length);
    }

    return {
      category: cfg.category,
      iconName: cfg.iconName,
      color: cfg.color,
      totalHabits: catHabits.length,
      activeHabits: catActiveHabits.length,
      totalCheckins: catCheckins.length,
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
    insightMessage = 'توازن استثنائي! التزام تام في جميع مجالات حياتك بنسبة 100%';
  } else if (topCategory && focusCategory) {
    insightMessage = `أداؤك متميز في مجال ${topCategory.category} بنسبة (${topCategory.completionRate}%)، وركّز أكثر على ${focusCategory.category} (${focusCategory.completionRate}%) لتحقيق التوازن الشامل.`;
  } else if (topCategory) {
    insightMessage = `استمرارية رائعة في مجال ${topCategory.category} بنسبة (${topCategory.completionRate}%)، وسّع نطاق عاداتك لتشمل مجالات جديدة`;
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
  if (safe === 0) return `0 ${fallbackUnit}`;
  if (safe === 1) return singular;
  if (safe === 2) return dual;
  if (safe >= 3 && safe <= 10) return `${safe} ${plural}`;
  return `${safe} ${fallbackUnit}`;
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
    const freqLabel = habit.frequency === 'daily' ? 'يومي' : 'أيام محددة';
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



