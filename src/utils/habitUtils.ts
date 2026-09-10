import dayjs from 'dayjs';
import type { Habit, HabitCheckin, HabitStats, OverallStats, DayAdherence } from '../types/habit';

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
  allCheckins: HabitCheckin[]
): HabitStats => {
  const habitCheckins = allCheckins.filter(
    (c) => c.habitId === habit.id && c.completed
  );

  const completedDates = new Set(habitCheckins.map((c) => c.date));
  const totalCompletions = completedDates.size;

  const today = dayjs().startOf('day');
  const todayStr = today.format('YYYY-MM-DD');
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

  const completionRate =
    totalDueDays > 0 ? Math.round((totalCompletions / totalDueDays) * 100) : 0;

  return {
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRate: Math.min(100, Math.max(0, completionRate)),
    totalDueDays,
  };
};

/**
 * Calculate overall progress for Home & Statistics screens
 */
export const calculateOverallStats = (
  habits: Habit[],
  allCheckins: HabitCheckin[],
  selectedDate: string
): OverallStats => {
  const activeHabits = habits.filter((h) => h.isActive);
  const completedCheckins = allCheckins.filter((c) => c.completed);

  // Checkins for the selected date
  const dueTodayHabits = activeHabits.filter((h) => isHabitDueOnDate(h, selectedDate, true));
  const todayCompletedCount = dueTodayHabits.filter((h) =>
    completedCheckins.some((c) => c.habitId === h.id && c.date === selectedDate)
  ).length;

  const todayTotalCount = dueTodayHabits.length;
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

  // Calculate 7-day adherence for current week
  const dayNamesArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayShortArabic = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  const today = dayjs();
  const startOfWeek = today.startOf('week'); // Sunday
  const weeklyAdherence: DayAdherence[] = [];

  for (let i = 0; i < 7; i++) {
    const day = startOfWeek.add(i, 'day');
    const dStr = day.format('YYYY-MM-DD');
    const dayIdx = day.day();

    const dueHabits = habits.filter((h) => isHabitDueOnDate(h, dStr, false));
    const completed = dueHabits.filter((h) =>
      completedCheckins.some((c) => c.habitId === h.id && c.date === dStr)
    ).length;

    const rate = dueHabits.length > 0 ? Math.round((completed / dueHabits.length) * 100) : 0;

    weeklyAdherence.push({
      dayName: dayNamesArabic[dayIdx],
      dayShort: dayShortArabic[dayIdx],
      date: dStr,
      dayIndex: dayIdx,
      completedCount: completed,
      totalCount: dueHabits.length,
      rate,
    });
  }

  return {
    totalHabits: habits.length,
    activeHabits: activeHabits.length,
    todayCompletionRate,
    todayCompletedCount,
    todayTotalCount,
    bestOverallStreak,
    totalCheckinsEver: completedCheckins.length,
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

