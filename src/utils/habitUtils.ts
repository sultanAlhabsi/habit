import dayjs from 'dayjs';
import { Habit, HabitCheckin, HabitStats, OverallStats, DayAdherence } from '../types/habit';

/**
 * Check if a habit is scheduled to be done on a specific date (YYYY-MM-DD)
 */
export const isHabitDueOnDate = (habit: Habit, dateStr: string): boolean => {
  if (!habit.isActive) return false;

  const targetDate = dayjs(dateStr);
  const createdDate = dayjs(habit.createdAt).startOf('day');

  // If date is before habit creation, it wasn't due then
  if (targetDate.isBefore(createdDate)) return false;

  if (habit.frequency === 'daily') {
    return true;
  }

  if (habit.frequency === 'specific_days') {
    const dayOfWeek = targetDate.day(); // 0 is Sunday, 6 is Saturday
    return habit.frequencyDays.includes(dayOfWeek);
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

  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = dayjs();

  // If completed today, start counting from today
  // If not completed today, start counting from yesterday (streak not broken until today ends)
  if (!completedDates.has(today)) {
    if (completedDates.has(yesterday)) {
      checkDate = dayjs().subtract(1, 'day');
    } else {
      // Streak broken if neither today nor yesterday is completed
      checkDate = dayjs().subtract(1, 'day');
    }
  }

  while (true) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const isDue = isHabitDueOnDate(habit, dateStr);

    if (isDue) {
      if (completedDates.has(dateStr)) {
        currentStreak++;
      } else {
        // Streak is broken
        break;
      }
    }
    // If not due on that day (e.g. weekend off), skip without breaking streak
    checkDate = checkDate.subtract(1, 'day');

    // Cap search to 365 days
    if (dayjs().diff(checkDate, 'day') > 365) break;
  }

  // Calculate best streak historically
  let bestStreak = currentStreak;
  let tempStreak = 0;
  let cur = dayjs().startOf('day');
  const earliestDate = dayjs(habit.createdAt).startOf('day');
  const daysTotal = Math.max(1, dayjs().diff(earliestDate, 'day') + 1);

  let totalDueDays = 0;
  for (let i = 0; i < Math.min(daysTotal, 180); i++) {
    const d = cur.subtract(i, 'day');
    const dStr = d.format('YYYY-MM-DD');
    if (isHabitDueOnDate(habit, dStr)) {
      totalDueDays++;
      if (completedDates.has(dStr)) {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }
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
  const dueTodayHabits = activeHabits.filter((h) => isHabitDueOnDate(h, selectedDate));
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

    const dueHabits = activeHabits.filter((h) => isHabitDueOnDate(h, dStr));
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
