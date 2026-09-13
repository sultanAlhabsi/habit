import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import {
  isHabitDueOnDate,
  calculateHabitStats,
  calculateOverallStats,
  calculateWeekAdherence,
  hasEverHadPerfectDay,
  getHabitsForDate,
  formatArabicDate,
  formatWeekRangeArabic,
  filterHabitsByQuery,
  calculateCheckinProgress,
  getNextProgressCount,
  formatDailySummaryForShare,
  formatOverallStatsForShare,
  normalizeArabicNumerals,
  getHabitCategory,
  getHabitStreakStatus,
  sortHabits,
  calculateMonthAdherence,
  formatMonthlySummaryForShare,
  calculateStreakMilestone,
  calculateHabitConsistencyPattern,
  formatHabitStatsForShare,
  getHabitCheckinNotes,
  formatHabitNotesForShare,
  STREAK_MILESTONES,
  normalizeArabicText,
  formatArabicDaysCount,
  formatArabicStreakDays,
  formatArabicCount,
  toArabicNumerals,
  escapeCsvCell,
  exportCheckinsToCsv,
  exportHabitsSummaryToCsv,
  exportFullReportToCsv,
  exportSingleHabitToCsv,
  CATEGORY_CONFIG,
  calculateCategoryAnalytics,
  isStreakAtRisk,
} from '../src/utils/habitUtils.ts';
import type { Habit, HabitCheckin } from '../src/types/habit.ts';

const createMockHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'test-habit-1',
  name: 'قراءة الكتب',
  icon: 'book-outline',
  color: '#2A4B3A',
  frequency: 'daily',
  frequencyDays: [0, 1, 2, 3, 4, 5, 6],
  targetCount: 1,
  unit: 'مرة',
  isActive: true,
  createdAt: dayjs().subtract(30, 'day').toISOString(),
  ...overrides,
});

test('isHabitDueOnDate: daily habit is due every day after creation', () => {
  const habit = createMockHabit({ frequency: 'daily' });
  const today = dayjs().format('YYYY-MM-DD');
  assert.equal(isHabitDueOnDate(habit, today), true);

  // Date before creation should be false
  const pastDate = dayjs(habit.createdAt).subtract(2, 'day').format('YYYY-MM-DD');
  assert.equal(isHabitDueOnDate(habit, pastDate), false);
});

test('isHabitDueOnDate: specific days habit is only due on scheduled days', () => {
  // Only Sunday (0) and Tuesday (2)
  const habit = createMockHabit({
    frequency: 'specific_days',
    frequencyDays: [0, 2],
  });

  const sunday = dayjs().startOf('week'); // 0
  const wednesday = sunday.add(3, 'day'); // 3

  assert.equal(isHabitDueOnDate(habit, sunday.format('YYYY-MM-DD')), true);
  assert.equal(isHabitDueOnDate(habit, wednesday.format('YYYY-MM-DD')), false);
});

test('isHabitDueOnDate: inactive habit respects requireActive parameter', () => {
  const habit = createMockHabit({ isActive: false });
  const today = dayjs().format('YYYY-MM-DD');

  // When requireActive is true (default), inactive habit is NOT due today
  assert.equal(isHabitDueOnDate(habit, today, true), false);

  // When requireActive is false (for historical statistics), returns schedule status
  assert.equal(isHabitDueOnDate(habit, today, false), true);
});

test('isHabitDueOnDate: archived habit is not due after archive date', () => {
  const tenDaysAgo = dayjs().subtract(10, 'day').toISOString();
  const habit = createMockHabit({
    archivedAt: tenDaysAgo,
    isActive: false,
  });

  const today = dayjs().format('YYYY-MM-DD');
  const twentyDaysAgo = dayjs().subtract(20, 'day').format('YYYY-MM-DD');

  // After archiving, habit is not due even if requireActive is false
  assert.equal(isHabitDueOnDate(habit, today, false), false);

  // Before archiving, habit was due when checking historical schedule
  assert.equal(isHabitDueOnDate(habit, twentyDaysAgo, false), true);
});

test('calculateHabitStats: preserves streak if today is not yet completed', () => {
  const habit = createMockHabit();
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const twoDaysAgo = dayjs().subtract(2, 'day').format('YYYY-MM-DD');

  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: habit.id,
      date: yesterday,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'c2',
      habitId: habit.id,
      date: twoDaysAgo,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];

  const stats = calculateHabitStats(habit, checkins);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.bestStreak, 2);
  assert.equal(stats.totalCompletions, 2);
});

test('calculateHabitStats: increments streak when today is completed', () => {
  const habit = createMockHabit();
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: habit.id,
      date: today,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'c2',
      habitId: habit.id,
      date: yesterday,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];

  const stats = calculateHabitStats(habit, checkins);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.totalCompletions, 2);
});

test('calculateHabitStats: ignores future date checkins and calculates capped completion rate', () => {
  const habit = createMockHabit();
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');

  const checkins: HabitCheckin[] = [
    {
      id: 'c-future',
      habitId: habit.id,
      date: tomorrow,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'c-today',
      habitId: habit.id,
      date: today,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];

  const stats = calculateHabitStats(habit, checkins);
  // Tomorrow's checkin must be ignored
  assert.equal(stats.totalCompletions, 1);
  assert.equal(stats.currentStreak, 1);
  assert.ok(stats.completionRate <= 100);
});

test('calculateHabitStats: paused habit retains historical stats', () => {
  const habit = createMockHabit({ isActive: false });
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: habit.id,
      date: today,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'c2',
      habitId: habit.id,
      date: yesterday,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];

  const stats = calculateHabitStats(habit, checkins);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.totalCompletions, 2);
  assert.ok(stats.totalDueDays > 0);
  assert.ok(stats.completionRate > 0);
});

test('getHabitsForDate: returns active due habits and preserved completed paused habits', () => {
  const activeHabit = createMockHabit({ id: 'h-active', isActive: true });
  const pausedHabit = createMockHabit({ id: 'h-paused', isActive: false });
  const pastDate = dayjs().subtract(3, 'day').format('YYYY-MM-DD');

  const checkins: HabitCheckin[] = [
    {
      id: 'c-paused',
      habitId: 'h-paused',
      date: pastDate,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];

  // For pastDate: both activeHabit (due) and pausedHabit (was completed on that day) must be returned
  const results = getHabitsForDate([activeHabit, pausedHabit], checkins, pastDate);
  assert.equal(results.length, 2);
  assert.ok(results.some((h) => h.id === 'h-active'));
  assert.ok(results.some((h) => h.id === 'h-paused'));

  // For today (where pausedHabit has no checkin): pausedHabit must NOT be returned
  const today = dayjs().format('YYYY-MM-DD');
  const todayResults = getHabitsForDate([activeHabit, pausedHabit], checkins, today);
  assert.equal(todayResults.length, 1);
  assert.equal(todayResults[0].id, 'h-active');
});

test('calculateWeekAdherence: identifies future days, today, and adherence rates', () => {
  const habit = createMockHabit({ frequency: 'daily' });
  const today = dayjs();
  const todayStr = today.format('YYYY-MM-DD');

  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: habit.id,
      date: todayStr,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];

  const week = calculateWeekAdherence([habit], checkins, todayStr);
  assert.equal(week.length, 7);

  const todayItem = week.find((d) => d.date === todayStr);
  assert.ok(todayItem);
  assert.equal(todayItem.isToday, true);
  assert.equal(todayItem.isFuture, false);
  assert.equal(todayItem.completedCount, 1);
  assert.equal(todayItem.rate, 100);

  // Check future days
  const futureItems = week.filter((d) => dayjs(d.date).isAfter(today.startOf('day')));
  futureItems.forEach((item) => {
    assert.equal(item.isFuture, true);
    assert.equal(item.rate, 0);
  });
});

test('hasEverHadPerfectDay: correctly detects past 100% completion days', () => {
  const habit1 = createMockHabit({ id: 'h1' });
  const habit2 = createMockHabit({ id: 'h2' });
  const pastDate = dayjs().subtract(5, 'day').format('YYYY-MM-DD');

  // Only habit 1 completed: not perfect
  const partialCheckins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: 'h1',
      date: pastDate,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];
  assert.equal(hasEverHadPerfectDay([habit1, habit2], partialCheckins), false);

  // Both completed: perfect day!
  const fullCheckins: HabitCheckin[] = [
    ...partialCheckins,
    {
      id: 'c2',
      habitId: 'h2',
      date: pastDate,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];
  assert.equal(hasEverHadPerfectDay([habit1, habit2], fullCheckins), true);
});

test('calculateOverallStats: computes accurate rates, permanent perfect day, and weekly adherence', () => {
  const habit1 = createMockHabit({ id: 'h1' });
  const habit2 = createMockHabit({ id: 'h2' });
  const today = dayjs().format('YYYY-MM-DD');
  const pastDate = dayjs().subtract(4, 'day').format('YYYY-MM-DD');

  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: 'h1',
      date: today,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
    // Past perfect day
    {
      id: 'c2',
      habitId: 'h1',
      date: pastDate,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'c3',
      habitId: 'h2',
      date: pastDate,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];

  const overall = calculateOverallStats([habit1, habit2], checkins, today);
  assert.equal(overall.totalHabits, 2);
  assert.equal(overall.activeHabits, 2);
  assert.equal(overall.todayTotalCount, 2);
  assert.equal(overall.todayCompletedCount, 1);
  assert.equal(overall.todayCompletionRate, 50);
  assert.equal(overall.hasEverHadPerfectDay, true);
  assert.equal(overall.weeklyAdherence.length, 7);
});

test('formatArabicDate: formats correctly in Arabic', () => {
  const formatted = formatArabicDate('2026-09-10');
  assert.ok(formatted.includes('10'));
  assert.ok(formatted.includes('سبتمبر'));
});

test('formatWeekRangeArabic: formats range with Arabic month and year', () => {
  const range = formatWeekRangeArabic('2026-09-10');
  assert.ok(range.includes('سبتمبر'));
  assert.ok(range.includes('2026'));
  assert.ok(range.includes('-'));
});

test('filterHabitsByQuery: matches Arabic habit names and descriptions correctly', () => {
  const h1 = createMockHabit({ id: '1', name: 'شرب الماء', description: 'لترين يومياً' });
  const h2 = createMockHabit({ id: '2', name: 'قراءة القرآن', description: 'جزء كامل' });
  const h3 = createMockHabit({ id: '3', name: 'المشي الصباحي', description: '30 دقيقة' });
  const list = [h1, h2, h3];

  // Empty or spaces query returns all
  assert.equal(filterHabitsByQuery(list, '').length, 3);
  assert.equal(filterHabitsByQuery(list, '   ').length, 3);

  // Match by name
  const waterMatch = filterHabitsByQuery(list, 'ماء');
  assert.equal(waterMatch.length, 1);
  assert.equal(waterMatch[0].id, '1');

  // Match by description
  const quranMatch = filterHabitsByQuery(list, 'جزء');
  assert.equal(quranMatch.length, 1);
  assert.equal(quranMatch[0].id, '2');

  // Case-insensitive / partial match
  const walkMatch = filterHabitsByQuery(list, 'المشي');
  assert.equal(walkMatch.length, 1);
  assert.equal(walkMatch[0].id, '3');

  // No match
  const noMatch = filterHabitsByQuery(list, 'سباحة');
  assert.equal(noMatch.length, 0);
});

test('calculateWeekAdherence: handles 0% completion rate without negative or false values', () => {
  const habit = createMockHabit({ frequency: 'daily' });
  const pastMonday = dayjs().startOf('week').add(1, 'day'); // Monday

  // No checkins at all for this habit
  const week = calculateWeekAdherence([habit], [], pastMonday.format('YYYY-MM-DD'));
  const mondayItem = week.find((d) => d.date === pastMonday.format('YYYY-MM-DD'));

  assert.ok(mondayItem);
  assert.equal(mondayItem.completedCount, 0);
  assert.equal(mondayItem.rate, 0);
});

test('calculateCheckinProgress: calculates progress, percentage, and completion status accurately', () => {
  const habit = createMockHabit({ targetCount: 5, unit: 'أكواب' });

  // 1. Undefined checkin (0 progress)
  const p0 = calculateCheckinProgress(habit, undefined);
  assert.equal(p0.currentCount, 0);
  assert.equal(p0.targetCount, 5);
  assert.equal(p0.progressRatio, 0);
  assert.equal(p0.progressPercent, 0);
  assert.equal(p0.isCompleted, false);

  // 2. Partial checkin (3 out of 5)
  const pPartial = calculateCheckinProgress(habit, {
    id: 'c1',
    habitId: habit.id,
    date: '2026-06-15',
    completed: false,
    count: 3,
    createdAt: '2026-06-15T08:00:00.000Z',
  });
  assert.equal(pPartial.currentCount, 3);
  assert.equal(pPartial.targetCount, 5);
  assert.equal(pPartial.progressRatio, 0.6);
  assert.equal(pPartial.progressPercent, 60);
  assert.equal(pPartial.isCompleted, false);

  // 3. Fully completed checkin (5 out of 5)
  const pFull = calculateCheckinProgress(habit, {
    id: 'c2',
    habitId: habit.id,
    date: '2026-06-15',
    completed: true,
    count: 5,
    createdAt: '2026-06-15T12:00:00.000Z',
  });
  assert.equal(pFull.currentCount, 5);
  assert.equal(pFull.progressRatio, 1);
  assert.equal(pFull.progressPercent, 100);
  assert.equal(pFull.isCompleted, true);

  // 4. Overachieved checkin (7 out of 5)
  const pOver = calculateCheckinProgress(habit, {
    id: 'c3',
    habitId: habit.id,
    date: '2026-06-15',
    completed: true,
    count: 7,
    createdAt: '2026-06-15T14:00:00.000Z',
  });
  assert.equal(pOver.currentCount, 7);
  assert.equal(pOver.progressRatio, 1); // Capped at 1
  assert.equal(pOver.progressPercent, 100);
  assert.equal(pOver.isCompleted, true);
});

test('getNextProgressCount: clamps increment and decrement safely within [0, targetCount]', () => {
  // Increment
  assert.equal(getNextProgressCount(0, 5, 'increment', 1), 1);
  assert.equal(getNextProgressCount(4, 5, 'increment', 1), 5);
  assert.equal(getNextProgressCount(5, 5, 'increment', 1), 5); // Clamped at target

  // Custom step increment
  assert.equal(getNextProgressCount(0, 10, 'increment', 4), 4);
  assert.equal(getNextProgressCount(8, 10, 'increment', 4), 10); // Clamped at 10

  // Decrement
  assert.equal(getNextProgressCount(5, 5, 'decrement', 1), 4);
  assert.equal(getNextProgressCount(1, 5, 'decrement', 1), 0);
  assert.equal(getNextProgressCount(0, 5, 'decrement', 1), 0); // Clamped at 0
});

test('formatDailySummaryForShare: generates formatted Arabic summary for native sharing', () => {
  const h1 = createMockHabit({
    id: 'h1',
    name: 'شرب الماء',
    targetCount: 4,
    unit: 'أكواب',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  const h2 = createMockHabit({
    id: 'h2',
    name: 'قراءة القرآن',
    targetCount: 1,
    unit: 'صفحة',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: 'h1',
      date: '2026-06-15',
      completed: true,
      count: 4,
      createdAt: '2026-06-15T10:00:00.000Z',
    },
  ];

  const summary = formatDailySummaryForShare('2026-06-15', [h1, h2], checkins);

  assert.ok(summary.includes('تقرير إنجاز'));
  assert.ok(summary.includes('العادات المنجزة:'));
  assert.ok(summary.includes('شرب الماء'));
  assert.ok(summary.includes('4/4 أكواب'));
  assert.ok(summary.includes('العادات المتبقية:'));
  assert.ok(summary.includes('قراءة القرآن'));
  assert.ok(summary.includes('50%'));
  assert.ok(summary.includes('تطبيق إنجاز'));
});

test('formatDailySummaryForShare: handles day with no due habits gracefully', () => {
  const summary = formatDailySummaryForShare('2026-06-15', [], []);
  assert.ok(summary.includes('لا توجد عادات مجدولة لهذا اليوم'));
});

test('formatOverallStatsForShare: generates clean Arabic overall milestones report', () => {
  const h1 = createMockHabit({
    id: 'h1',
    name: 'رياضة',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: 'h1',
      date: '2026-06-14',
      completed: true,
      count: 1,
      createdAt: '2026-06-14T10:00:00.000Z',
    },
    {
      id: 'c2',
      habitId: 'h1',
      date: '2026-06-15',
      completed: true,
      count: 1,
      createdAt: '2026-06-15T10:00:00.000Z',
    },
  ];

  const overallText = formatOverallStatsForShare([h1], checkins, '2026-06-15');

  assert.ok(overallText.includes('إحصائياتي في تطبيق إنجاز'));
  assert.ok(overallText.includes('أعلى سلسلة'));
  assert.ok(overallText.includes('إجمالي الإنجازات: 2'));
  assert.ok(overallText.includes('تطبيق إنجاز'));
});

test('normalizeArabicNumerals: converts Eastern Arabic and Persian numerals to Western digits', () => {
  // Eastern Arabic numerals (٠-٩)
  assert.equal(normalizeArabicNumerals('٠١٢٣٤٥٦٧٨٩'), '0123456789');
  assert.equal(normalizeArabicNumerals('٥'), '5');
  assert.equal(normalizeArabicNumerals('١٢:٣٠'), '12:30');

  // Persian numerals (۰-۹)
  assert.equal(normalizeArabicNumerals('۰۱۲۳۴۵۶۷۸۹'), '0123456789');
  assert.equal(normalizeArabicNumerals('۷'), '7');
  assert.equal(normalizeArabicNumerals('۰۸:۴۵'), '08:45');

  // Mixed and standard
  assert.equal(normalizeArabicNumerals('12:30'), '12:30');
  assert.equal(normalizeArabicNumerals('نص مع أرقام: ٣ اكواب'), 'نص مع أرقام: 3 اكواب');
  assert.equal(normalizeArabicNumerals(''), '');
});

test('getHabitCategory: accurately maps icons to categories', () => {
  assert.equal(getHabitCategory('water-outline'), 'صحة');
  assert.equal(getHabitCategory('barbell-outline'), 'صحة');
  assert.equal(getHabitCategory('fitness-outline'), 'صحة');
  assert.equal(getHabitCategory('bed-outline'), 'صحة');
  assert.equal(getHabitCategory('walk-outline'), 'صحة');

  assert.equal(getHabitCategory('laptop-outline'), 'إنتاجية');
  assert.equal(getHabitCategory('trophy-outline'), 'إنتاجية');

  assert.equal(getHabitCategory('sunny-outline'), 'روتين');
  assert.equal(getHabitCategory('alarm-outline'), 'روتين');
  assert.equal(getHabitCategory('cafe-outline'), 'روتين');

  assert.equal(getHabitCategory('sparkles-outline'), 'روحانية');
  assert.equal(getHabitCategory('leaf-outline'), 'روحانية');

  assert.equal(getHabitCategory('book-outline'), 'تطوير');
  assert.equal(getHabitCategory('journal-outline'), 'تطوير');

  // Unknown icon fallback
  assert.equal(getHabitCategory('unknown-icon-name'), 'تطوير');
});

test('getHabitStreakStatus: determines correct streak status on completed, rest, and pending days', () => {
  const habit = createMockHabit({
    id: 'h-streak-1',
    frequency: 'specific_days',
    frequencyDays: [1, 3, 5], // Mon, Wed, Fri
    createdAt: '2026-06-01T00:00:00.000Z',
  });

  // Monday 2026-06-15 is a due day (weekday 1)
  const mondayStr = '2026-06-15';
  // Tuesday 2026-06-16 is a rest day (weekday 2)
  const tuesdayStr = '2026-06-16';

  // 1. Pending on due day
  const pendingStatus = getHabitStreakStatus(habit, [], mondayStr);
  assert.equal(pendingStatus.status, 'pending');
  assert.ok(pendingStatus.message.includes('بانتظار إنجازك اليوم'));
  assert.equal(pendingStatus.iconName, 'time-outline');

  // 2. Completed on due day
  const completedCheckin: HabitCheckin = {
    id: 'c-mon',
    habitId: 'h-streak-1',
    date: mondayStr,
    completed: true,
    count: 1,
    createdAt: '2026-06-15T08:00:00.000Z',
  };
  const completedStatus = getHabitStreakStatus(habit, [completedCheckin], mondayStr);
  assert.equal(completedStatus.status, 'completed');
  assert.ok(completedStatus.message.includes('سلسلتك في استمرار'));
  assert.equal(completedStatus.iconName, 'checkmark-circle-outline');

  // 3. Rest day
  const restStatus = getHabitStreakStatus(habit, [completedCheckin], tuesdayStr);
  assert.equal(restStatus.status, 'rest_day');
  assert.ok(restStatus.message.includes('يوم استراحة مجدول'));
  assert.equal(restStatus.iconName, 'cafe-outline');
});

test('sortHabits: sorts habits according to pending_first, reminder_time, streak, and default', () => {
  const h1 = createMockHabit({
    id: 'h1',
    name: 'صلاة الفجر',
    reminderTime: '05:00',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  const h2 = createMockHabit({
    id: 'h2',
    name: 'قراءة الكتب',
    reminderTime: '20:00',
    createdAt: '2026-01-02T00:00:00.000Z',
  });
  const h3 = createMockHabit({
    id: 'h3',
    name: 'شرب الماء',
    reminderTime: undefined,
    createdAt: '2026-01-03T00:00:00.000Z',
  });

  const habits = [h1, h2, h3];
  const dateStr = '2026-06-15';

  // Checkins: h1 is completed, h2 and h3 are pending
  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: 'h1',
      date: dateStr,
      completed: true,
      count: 1,
      createdAt: '2026-06-15T05:30:00.000Z',
    },
    // h2 has a 3-day streak in the past
    {
      id: 'c2_prev1',
      habitId: 'h2',
      date: '2026-06-14',
      completed: true,
      count: 1,
      createdAt: '2026-06-14T10:00:00.000Z',
    },
    {
      id: 'c2_prev2',
      habitId: 'h2',
      date: '2026-06-13',
      completed: true,
      count: 1,
      createdAt: '2026-06-13T10:00:00.000Z',
    },
  ];

  // 1. Default order: preserves original array
  const defaultSorted = sortHabits(habits, 'default', checkins, dateStr);
  assert.deepEqual(
    defaultSorted.map((h) => h.id),
    ['h1', 'h2', 'h3']
  );

  // 2. Pending first: h2 and h3 come before completed h1
  const pendingSorted = sortHabits(habits, 'pending_first', checkins, dateStr);
  assert.equal(pendingSorted[2].id, 'h1');
  assert.ok(['h2', 'h3'].includes(pendingSorted[0].id));
  assert.ok(['h2', 'h3'].includes(pendingSorted[1].id));

  // 3. Reminder time: 05:00 (h1) -> 20:00 (h2) -> undefined (h3)
  const reminderSorted = sortHabits(habits, 'reminder_time', checkins, dateStr);
  assert.deepEqual(
    reminderSorted.map((h) => h.id),
    ['h1', 'h2', 'h3']
  );

  // 4. Streak order: h2 has streak 2 (active yesterday), h1 has streak 1 (completed today), h3 has 0
  const streakSorted = sortHabits(habits, 'streak', checkins, dateStr);
  assert.equal(streakSorted[0].id, 'h2');
});

test('calculateMonthAdherence: computes correct metrics for a full month', () => {
  const habit1 = createMockHabit({
    id: 'm-h1',
    frequency: 'daily',
    createdAt: '2026-05-01T00:00:00.000Z',
  });
  const habit2 = createMockHabit({
    id: 'm-h2',
    frequency: 'daily',
    createdAt: '2026-05-01T00:00:00.000Z',
  });

  // Reference date: past month June 2026 (30 days total)
  const refDate = dayjs('2026-06-15');

  // Let's create 10 completed days for habit1 and 5 for habit2, with 3 perfect days where both were done
  const checkins: HabitCheckin[] = [];
  for (let day = 1; day <= 10; day++) {
    const dStr = `2026-06-${day.toString().padStart(2, '0')}`;
    checkins.push({
      id: `c-h1-${day}`,
      habitId: 'm-h1',
      date: dStr,
      completed: true,
      count: 1,
      createdAt: `${dStr}T10:00:00.000Z`,
    });
    if (day <= 3) {
      checkins.push({
        id: `c-h2-${day}`,
        habitId: 'm-h2',
        date: dStr,
        completed: true,
        count: 1,
        createdAt: `${dStr}T11:00:00.000Z`,
      });
    }
  }

  const stats = calculateMonthAdherence([habit1, habit2], checkins, refDate);

  assert.equal(stats.totalDaysInMonth, 30);
  assert.equal(stats.daysPassedInMonth, 30); // Past month is fully evaluated
  assert.equal(stats.totalDueOpportunities, 60); // 30 days * 2 habits
  assert.equal(stats.totalCompletions, 13); // 10 from h1 + 3 from h2
  assert.equal(stats.completionRate, Math.round((13 / 60) * 100)); // ~22%
  assert.equal(stats.perfectDaysCount, 3); // Days 1, 2, 3
  assert.ok(stats.monthLabel.includes('2026'));
});

test('calculateMonthAdherence: handles empty habits list safely without NaN or division by zero', () => {
  const stats = calculateMonthAdherence([], [], dayjs('2026-06-15'));
  assert.equal(stats.totalDueOpportunities, 0);
  assert.equal(stats.totalCompletions, 0);
  assert.equal(stats.completionRate, 0);
  assert.equal(stats.perfectDaysCount, 0);
});

test('formatMonthlySummaryForShare: formats month summary correctly for native sharing', () => {
  const stats = {
    monthKey: '2026-06',
    monthLabel: 'يونيو 2026',
    totalDaysInMonth: 30,
    daysPassedInMonth: 30,
    totalDueOpportunities: 60,
    totalCompletions: 48,
    completionRate: 80,
    perfectDaysCount: 18,
  };

  const message = formatMonthlySummaryForShare(stats);
  assert.ok(message.includes('يونيو 2026'));
  assert.ok(message.includes('80%'));
  assert.ok(message.includes('48'));
  assert.ok(message.includes('18'));
  assert.ok(message.includes('تطبيق إنجاز'));
});

test('calculateStreakMilestone: computes correct tier and remaining days for streak progression', () => {
  // 0 days streak (starting out)
  const m0 = calculateStreakMilestone(0);
  assert.equal(m0.currentTier.id, 'tier_0');
  assert.equal(m0.currentTier.name, 'بداية الرحلة');
  assert.equal(m0.nextMilestone?.tier.id, 'tier_3');
  assert.equal(m0.nextMilestone?.remainingDays, 3);
  assert.equal(m0.progressPercent, 0);
  assert.equal(m0.isTopTier, false);

  // 5 days streak (between 3 and 7: 5 - 3 = 2 out of 4 days = 50%)
  const m5 = calculateStreakMilestone(5);
  assert.equal(m5.currentTier.id, 'tier_3');
  assert.equal(m5.currentTier.name, 'انطلاقة واعدة');
  assert.equal(m5.nextMilestone?.tier.id, 'tier_7');
  assert.equal(m5.nextMilestone?.remainingDays, 2);
  assert.equal(m5.progressPercent, 50);

  // 21 days streak (exact milestone hit)
  const m21 = calculateStreakMilestone(21);
  assert.equal(m21.currentTier.id, 'tier_21');
  assert.equal(m21.currentTier.name, 'بناء العادة');
  assert.equal(m21.nextMilestone?.tier.id, 'tier_30');
  assert.equal(m21.nextMilestone?.remainingDays, 9);
  assert.equal(m21.progressPercent, 0);

  // 66 days streak (automaticity)
  const m66 = calculateStreakMilestone(66);
  assert.equal(m66.currentTier.id, 'tier_66');
  assert.equal(m66.currentTier.name, 'العادة التلقائية');
  assert.equal(m66.nextMilestone?.tier.id, 'tier_100');
  assert.equal(m66.nextMilestone?.remainingDays, 34);

  // 120 days streak (tier_100 with next milestone tier_365)
  const m120 = calculateStreakMilestone(120);
  assert.equal(m120.currentTier.id, 'tier_100');
  assert.equal(m120.currentTier.name, 'احتراف وإتقان');
  assert.equal(m120.nextMilestone?.tier.id, 'tier_365');
  assert.equal(m120.nextMilestone?.remainingDays, 245);
  assert.equal(m120.isTopTier, false);

  // 400 days streak (top tier: 365+ year legend)
  const m400 = calculateStreakMilestone(400);
  assert.equal(m400.currentTier.id, 'tier_365');
  assert.equal(m400.currentTier.name, 'سنة التميز والأسطورة');
  assert.equal(m400.nextMilestone, null);
  assert.equal(m400.progressPercent, 100);
  assert.equal(m400.isTopTier, true);
});

test('calculateHabitConsistencyPattern: calculates adherence distribution across all 7 days of the week', () => {
  const habit = createMockHabit({
    id: 'habit-dist',
    frequency: 'daily',
    createdAt: '2026-05-01T00:00:00.000Z',
  });

  // Checkins for May 2026: May 3 (Sunday), May 4 (Monday), May 10 (Sunday), May 11 (Monday)
  // Let's create specific checkins
  const checkins: HabitCheckin[] = [
    { id: 'c1', habitId: 'habit-dist', date: '2026-05-03', count: 1, completed: true, updatedAt: '' }, // Sunday (day 0)
    { id: 'c2', habitId: 'habit-dist', date: '2026-05-10', count: 1, completed: true, updatedAt: '' }, // Sunday (day 0)
    { id: 'c3', habitId: 'habit-dist', date: '2026-05-04', count: 1, completed: true, updatedAt: '' }, // Monday (day 1)
  ];

  // Evaluate up to May 14, 2026
  const pattern = calculateHabitConsistencyPattern(habit, checkins, '2026-05-14');

  assert.equal(pattern.days.length, 7);
  // Sunday is index 0
  const sun = pattern.days.find((d) => d.dayIndex === 0);
  assert.ok(sun);
  assert.equal(sun.completedCount, 2);
  assert.ok(sun.dueCount >= 2);

  // Monday is index 1
  const mon = pattern.days.find((d) => d.dayIndex === 1);
  assert.ok(mon);
  assert.equal(mon.completedCount, 1);

  // Best day should be identified
  assert.ok(pattern.bestDay);
  assert.ok(pattern.insightMessage.length > 0);
});

test('calculateHabitConsistencyPattern: handles new habit with no completions gracefully', () => {
  const habit = createMockHabit({
    id: 'habit-empty-dist',
    frequency: 'daily',
    createdAt: '2026-06-01T00:00:00.000Z',
  });

  const pattern = calculateHabitConsistencyPattern(habit, [], '2026-06-01');
  assert.equal(pattern.days.length, 7);
  assert.equal(pattern.bestDay, null);
  assert.ok(pattern.insightMessage.includes('سجل إنجازاتك'));
});

test('formatHabitStatsForShare: creates detailed Arabic share text for a specific habit', () => {
  const habit = createMockHabit({ name: 'المشي الصباحي', unit: 'خطوة' });
  const stats = {
    currentStreak: 12,
    bestStreak: 25,
    totalCompletions: 40,
    completionRate: 85,
    totalDueDays: 47,
  };
  const milestone = calculateStreakMilestone(12);

  const text = formatHabitStatsForShare(habit, stats, milestone);
  assert.ok(text.includes('المشي الصباحي'));
  assert.ok(text.includes('12 يوم متتالية'));
  assert.ok(text.includes('25 يوم'));
  assert.ok(text.includes('أسبوع متواصل'));
  assert.ok(text.includes('40 خطوة'));
  assert.ok(text.includes('85%'));
  assert.ok(text.includes('تطبيق إنجاز'));

  // Test optional latest note
  const textWithNote = formatHabitStatsForShare(habit, stats, milestone, 'شعور ممتاز بعد جولة المشي في الحديقة');
  assert.ok(textWithNote.includes('آخر خاطرة: "شعور ممتاز بعد جولة المشي في الحديقة"'));
});

test('getHabitCheckinNotes: extracts non-empty notes sorted descending by date', () => {
  const checkins: HabitCheckin[] = [
    { id: 'c1', habitId: 'h1', date: '2026-06-01', count: 1, completed: true, updatedAt: '', note: 'تدوينة أولى' },
    { id: 'c2', habitId: 'h1', date: '2026-06-03', count: 1, completed: true, updatedAt: '', note: 'تدوينة أحدث' },
    { id: 'c3', habitId: 'h1', date: '2026-06-02', count: 1, completed: true, updatedAt: '', note: '   ' }, // empty whitespace
    { id: 'c4', habitId: 'h1', date: '2026-06-04', count: 1, completed: true, updatedAt: '' }, // undefined note
    { id: 'c5', habitId: 'h2', date: '2026-06-05', count: 1, completed: true, updatedAt: '', note: 'عادة أخرى' }, // other habit
  ];

  const notes = getHabitCheckinNotes(checkins, 'h1');
  assert.equal(notes.length, 2);
  assert.equal(notes[0].date, '2026-06-03');
  assert.equal(notes[0].note, 'تدوينة أحدث');
  assert.equal(notes[1].date, '2026-06-01');
  assert.equal(notes[1].note, 'تدوينة أولى');
});

test('formatHabitNotesForShare: formats Arabic reflection diary summary correctly', () => {
  const habit = createMockHabit({ name: 'القراءة اليومية' });
  const checkins: HabitCheckin[] = [
    { id: 'c1', habitId: habit.id, date: '2026-06-01', count: 1, completed: true, updatedAt: '', note: 'أنهيت الفصل الخامس من الكتاب' },
    { id: 'c2', habitId: habit.id, date: '2026-06-02', count: 1, completed: true, updatedAt: '', note: 'فكرة ملهمة حول الانضباط الذاتي' },
  ];

  const shareText = formatHabitNotesForShare(habit, checkins);
  assert.ok(shareText.includes('مذكرات إنجازي في عادة: القراءة اليومية'));
  assert.ok(shareText.includes('إجمالي الخواطر والتدوينات: 2'));
  assert.ok(shareText.includes('أنهيت الفصل الخامس'));
  assert.ok(shareText.includes('فكرة ملهمة حول الانضباط الذاتي'));
  assert.ok(shareText.includes('تطبيق إنجاز'));

  // Test empty notes list
  const emptyText = formatHabitNotesForShare(habit, []);
  assert.ok(emptyText.includes('لا توجد ملاحظات مسجلة بعد'));
});

test('normalizeArabicText: normalizes Arabic orthography, letters and strips diacritics', () => {
  // Alef variants
  assert.equal(normalizeArabicText('أذكار'), 'اذكار');
  assert.equal(normalizeArabicText('إحسان'), 'احسان');
  assert.equal(normalizeArabicText('آيات'), 'ايات');
  assert.equal(normalizeArabicText('ٱستغفار'), 'استغفار');

  // Taa Marbuta
  assert.equal(normalizeArabicText('قراءة'), 'قراءه');
  assert.equal(normalizeArabicText('صلاة'), 'صلاه');

  // Alif Maqsura
  assert.equal(normalizeArabicText('مشى'), 'مشي');

  // Tashkeel / Harakat
  assert.equal(normalizeArabicText('الرِّيَاضَةُ'), 'الرياضه');
  assert.equal(normalizeArabicText('قُرْآنٌ'), 'قران');

  // Empty or whitespace
  assert.equal(normalizeArabicText('   '), '');
  assert.equal(normalizeArabicText(''), '');
});

test('filterHabitsByQuery: matches Arabic queries regardless of Alef forms, Taa Marbuta, or Tashkeel', () => {
  const habits: Habit[] = [
    createMockHabit({ id: 'h1', name: 'أذكار الصباح والمساء', description: 'ورد يومي مبارك' }),
    createMockHabit({ id: 'h2', name: 'القراءة اليومية', description: 'قراءة ٣٠ صفحة' }),
    createMockHabit({ id: 'h3', name: 'الرياضة والنشاط', description: 'تمارين رياضية خفيفة' }),
  ];

  // User types with plain Alef without Hamza
  const match1 = filterHabitsByQuery(habits, 'اذكار');
  assert.equal(match1.length, 1);
  assert.equal(match1[0].id, 'h1');

  // User types with Haa instead of Taa Marbuta
  const match2 = filterHabitsByQuery(habits, 'قراءه');
  assert.equal(match2.length, 1);
  assert.equal(match2[0].id, 'h2');

  // User types with Tashkeel
  const match3 = filterHabitsByQuery(habits, 'رِيَاضَة');
  assert.equal(match3.length, 1);
  assert.equal(match3[0].id, 'h3');

  // Search in description with variant
  const match4 = filterHabitsByQuery(habits, 'تمارين رياضيه');
  assert.equal(match4.length, 1);
  assert.equal(match4[0].id, 'h3');
});

test('sortHabits: prioritizes pinned habits at the top across all sort modes', () => {
  const hUnpinned1 = createMockHabit({ id: 'h1', name: 'عادة عادية 1', reminderTime: '10:00', isPinned: false });
  const hPinned1 = createMockHabit({ id: 'h2', name: 'عادة مثبتة 1', reminderTime: '12:00', isPinned: true });
  const hUnpinned2 = createMockHabit({ id: 'h3', name: 'عادة عادية 2', reminderTime: '08:00', isPinned: false });
  const hPinned2 = createMockHabit({ id: 'h4', name: 'عادة مثبتة 2', reminderTime: '06:00', isPinned: true });

  const all = [hUnpinned1, hPinned1, hUnpinned2, hPinned2];

  // 1. Default mode: pinned habits appear at the top in their relative order
  const defaultSorted = sortHabits(all, 'default', [], '2026-06-15');
  assert.equal(defaultSorted[0].id, 'h2');
  assert.equal(defaultSorted[1].id, 'h4');
  assert.equal(defaultSorted[2].id, 'h1');
  assert.equal(defaultSorted[3].id, 'h3');

  // 2. Reminder time mode: pinned habits sorted by reminder time, then unpinned by reminder time
  const timeSorted = sortHabits(all, 'reminder_time', [], '2026-06-15');
  assert.equal(timeSorted[0].id, 'h4'); // 06:00 (pinned)
  assert.equal(timeSorted[1].id, 'h2'); // 12:00 (pinned)
  assert.equal(timeSorted[2].id, 'h3'); // 08:00 (unpinned)
  assert.equal(timeSorted[3].id, 'h1'); // 10:00 (unpinned)

  // 3. Pending first mode with completions
  const checkins: HabitCheckin[] = [
    { id: 'c1', habitId: 'h4', date: '2026-06-15', completed: true, count: 1, updatedAt: '' },
    { id: 'c2', habitId: 'h3', date: '2026-06-15', completed: true, count: 1, updatedAt: '' },
  ];
  // Pinned pending (h2) -> Pinned completed (h4) -> Unpinned pending (h1) -> Unpinned completed (h3)
  const pendingSorted = sortHabits(all, 'pending_first', checkins, '2026-06-15');
  assert.equal(pendingSorted[0].id, 'h2'); // pinned & pending
  assert.equal(pendingSorted[1].id, 'h4'); // pinned & completed
  assert.equal(pendingSorted[2].id, 'h1'); // unpinned & pending
  assert.equal(pendingSorted[3].id, 'h3'); // unpinned & completed
});

test('calculateStreakMilestone: recognizes tier_365 for year-long streaks and beyond', () => {
  const milestone100 = calculateStreakMilestone(100);
  assert.equal(milestone100.currentTier.id, 'tier_100');
  assert.equal(milestone100.nextMilestone?.tier.id, 'tier_365');
  assert.equal(milestone100.isTopTier, false);

  const milestone365 = calculateStreakMilestone(365);
  assert.equal(milestone365.currentTier.id, 'tier_365');
  assert.equal(milestone365.currentTier.name, 'سنة التميز والأسطورة');
  assert.equal(milestone365.isTopTier, true);
  assert.equal(milestone365.progressPercent, 100);

  const milestone400 = calculateStreakMilestone(400);
  assert.equal(milestone400.currentTier.id, 'tier_365');
  assert.equal(milestone400.isTopTier, true);
});

test('calculateHabitStats: computes streaks beyond 365 days without artificial truncation', () => {
  const habit = createMockHabit({
    id: 'h-super-streak',
    frequency: 'daily',
    createdAt: dayjs('2026-06-15').subtract(400, 'day').toISOString(),
  });

  const checkins: HabitCheckin[] = [];
  for (let i = 0; i <= 390; i++) {
    const d = dayjs('2026-06-15').subtract(i, 'day').format('YYYY-MM-DD');
    checkins.push({
      id: `chk_${i}`,
      habitId: habit.id,
      date: d,
      count: 1,
      completed: true,
      updatedAt: dayjs('2026-06-15').toISOString(),
    });
  }

  const stats = calculateHabitStats(habit, checkins, '2026-06-15');
  assert.ok(stats.currentStreak >= 390, `Current streak should be at least 391, got ${stats.currentStreak}`);
  assert.ok(stats.bestStreak >= 390, `Best streak should be at least 391, got ${stats.bestStreak}`);
});

test('formatArabicDaysCount: adheres strictly to Arabic grammar rules', () => {
  assert.equal(formatArabicDaysCount(0), '0 يوم');
  assert.equal(formatArabicDaysCount(1), 'يوم واحد');
  assert.equal(formatArabicDaysCount(2), 'يومان');
  assert.equal(formatArabicDaysCount(3), '3 أيام');
  assert.equal(formatArabicDaysCount(5), '5 أيام');
  assert.equal(formatArabicDaysCount(10), '10 أيام');
  assert.equal(formatArabicDaysCount(11), '11 يوم');
  assert.equal(formatArabicDaysCount(21), '21 يوم');
  assert.equal(formatArabicDaysCount(66), '66 يوم');
  assert.equal(formatArabicDaysCount(100), '100 يوم');
  assert.equal(formatArabicDaysCount(365), '365 يوم');
});

test('formatArabicCount: formats generic count forms accurately', () => {
  const result = formatArabicCount(5, 'عادة واحدة', 'عادتان', 'عادات', 'عادة');
  assert.equal(result, '5 عادات');
  const single = formatArabicCount(1, 'عادة واحدة', 'عادتان', 'عادات', 'عادة');
  assert.equal(single, 'عادة واحدة');
  const dual = formatArabicCount(2, 'عادة واحدة', 'عادتان', 'عادات', 'عادة');
  assert.equal(dual, 'عادتان');
  const overTen = formatArabicCount(15, 'عادة واحدة', 'عادتان', 'عادات', 'عادة');
  assert.equal(overTen, '15 عادة');
});

test('toArabicNumerals: converts numbers to Eastern Arabic numerals correctly', () => {
  assert.equal(toArabicNumerals(0), '٠');
  assert.equal(toArabicNumerals(1), '١');
  assert.equal(toArabicNumerals(123), '١٢٣');
  assert.equal(toArabicNumerals('50/100'), '٥٠/١٠٠');
  assert.equal(toArabicNumerals(null), '');
  assert.equal(toArabicNumerals(undefined), '');
});

test('escapeCsvCell: handles regular text, commas, quotes, and newlines', () => {
  assert.equal(escapeCsvCell('قراءة كتاب'), 'قراءة كتاب');
  assert.equal(escapeCsvCell(42), '42');
  assert.equal(escapeCsvCell('نص يحتوي على , فاصلة'), '"نص يحتوي على , فاصلة"');
  assert.equal(escapeCsvCell('قال: "مرحبا"'), '"قال: ""مرحبا"""');
  assert.equal(escapeCsvCell('سطر أول\nسطر ثان'), '"سطر أول\nسطر ثان"');
  assert.equal(escapeCsvCell(null), '');
  assert.equal(escapeCsvCell(undefined), '');
});

test('exportCheckinsToCsv: outputs valid CSV with UTF-8 BOM and correct checkin headers', () => {
  const habit = createMockHabit({ id: 'h1', name: 'قراءة القرآن' });
  const checkin: HabitCheckin = {
    id: 'c1',
    habitId: 'h1',
    date: '2026-09-01',
    count: 1,
    completed: true,
    note: 'ملاحظة مع "اقتباس", وفاصلة',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const csv = exportCheckinsToCsv([habit], [checkin]);

  // Must start with UTF-8 BOM for Excel Arabic compatibility
  assert.ok(csv.startsWith('\uFEFF'));
  // Headers check
  assert.ok(csv.includes('تاريخ الإنجاز,اسم العادة,القسم,الحالة,العدد المنجز,الهدف اليومي,الوحدة,الملاحظات والخواطر,تاريخ التوثيق'));
  // Habit name check
  assert.ok(csv.includes('قراءة القرآن'));
  assert.ok(csv.includes('2026-09-01'));
  assert.ok(csv.includes('مكتمل'));
  // Quoted note check
  assert.ok(csv.includes('""اقتباس""'));
});

test('exportHabitsSummaryToCsv: outputs summary metrics for each habit', () => {
  const habit1 = createMockHabit({ id: 'h1', name: 'قراءة القرآن' });
  const habit2 = createMockHabit({ id: 'h2', name: 'ممارسة الرياضة' });
  const checkin: HabitCheckin = {
    id: 'c1',
    habitId: 'h1',
    date: '2026-09-01',
    count: 1,
    completed: true,
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const csv = exportHabitsSummaryToCsv([habit1, habit2], [checkin]);

  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('اسم العادة,القسم,نوع التكرار,الهدف اليومي,الوحدة,السلسلة الحالية,أعلى سلسلة,إجمالي الإنجازات,نسبة الالتزام %,الحالة,وقت التذكير,مثبتة,تاريخ الإنشاء'));
  assert.ok(csv.includes('قراءة القرآن'));
  assert.ok(csv.includes('ممارسة الرياضة'));
  assert.ok(csv.includes('نشطة'));
});

test('exportFullReportToCsv: generates combined spreadsheet report with sections', () => {
  const habit1 = createMockHabit({ id: 'h1', name: 'قراءة القرآن' });
  const habit2 = createMockHabit({ id: 'h2', name: 'ممارسة الرياضة' });
  const checkin: HabitCheckin = {
    id: 'c1',
    habitId: 'h1',
    date: '2026-09-01',
    count: 1,
    completed: true,
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const csv = exportFullReportToCsv([habit1, habit2], [checkin]);

  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('# ملخص أداء العادات'));
  assert.ok(csv.includes('# سجلات الإنجاز والملاحظات اليومية'));
  assert.ok(csv.includes('قراءة القرآن'));
});

test('formatArabicStreakDays: adheres strictly to Arabic consecutive day grammar rules', () => {
  assert.equal(formatArabicStreakDays(0), '0 يوم');
  assert.equal(formatArabicStreakDays(1), 'يوم واحد');
  assert.equal(formatArabicStreakDays(2), 'يومان متتاليان');
  assert.equal(formatArabicStreakDays(3), '3 أيام متتالية');
  assert.equal(formatArabicStreakDays(5), '5 أيام متتالية');
  assert.equal(formatArabicStreakDays(10), '10 أيام متتالية');
  assert.equal(formatArabicStreakDays(11), '11 يوم متتالية');
  assert.equal(formatArabicStreakDays(21), '21 يوم متتالية');
  assert.equal(formatArabicStreakDays(66), '66 يوم متتالية');
  assert.equal(formatArabicStreakDays(100), '100 يوم متتالية');
  assert.equal(formatArabicStreakDays(365), '365 يوم متتالية');
});

test('calculateCategoryAnalytics: handles empty habits list safely', () => {
  const result = calculateCategoryAnalytics([], []);

  assert.equal(result.categories.length, 5);
  assert.equal(result.topCategory, null);
  assert.equal(result.focusCategory, null);
  assert.equal(result.balanceScore, 0);
  assert.ok(result.insightMessage.includes('أضف عاداتك الأولى'));
});

test('calculateCategoryAnalytics: accurately computes category metrics and balance score', () => {
  const todayStr = dayjs().format('YYYY-MM-DD');

  // Health habit (100% complete)
  const hHealth = createMockHabit({
    id: 'h-health',
    name: 'تمارين رياضية',
    icon: 'fitness-outline', // Category: صحة
    createdAt: todayStr,
  });

  // Productivity habit (0% complete)
  const hProd = createMockHabit({
    id: 'h-prod',
    name: 'برمجة موقع',
    icon: 'laptop-outline', // Category: إنتاجية
    createdAt: todayStr,
  });

  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: 'h-health',
      date: todayStr,
      completed: true,
      count: 1,
      updatedAt: todayStr,
    },
  ];

  const result = calculateCategoryAnalytics([hHealth, hProd], checkins);

  const healthCat = result.categories.find((c) => c.category === 'صحة');
  const prodCat = result.categories.find((c) => c.category === 'إنتاجية');
  const routineCat = result.categories.find((c) => c.category === 'روتين');

  assert.ok(healthCat);
  assert.equal(healthCat.activeHabits, 1);
  assert.equal(healthCat.completionRate, 100);
  assert.equal(healthCat.totalCheckins, 1);

  assert.ok(prodCat);
  assert.equal(prodCat.activeHabits, 1);
  assert.equal(prodCat.completionRate, 0);
  assert.equal(prodCat.totalCheckins, 0);

  assert.ok(routineCat);
  assert.equal(routineCat.activeHabits, 0);
  assert.equal(routineCat.completionRate, 0);

  // Top category is health, focus is productivity
  assert.equal(result.topCategory?.category, 'صحة');
  assert.equal(result.focusCategory?.category, 'إنتاجية');

  // Balance score considers 2 active categories (2/5 coverage) and average 50% rate
  assert.ok(result.balanceScore > 0 && result.balanceScore <= 100);

  // Coaching insight addresses both
  assert.ok(result.insightMessage.includes('صحة'));
  assert.ok(result.insightMessage.includes('إنتاجية'));
});

test('sortHabits: alphabetical mode correctly sorts Arabic habit names and prioritizes pinned habits', () => {
  const hReading = createMockHabit({ id: 'h1', name: 'قراءة الكتب', isPinned: false });
  const hWater = createMockHabit({ id: 'h2', name: 'شرب الماء', isPinned: false });
  const hWalk = createMockHabit({ id: 'h3', name: 'المشي المسائي', isPinned: false });
  const hMorningPrayer = createMockHabit({ id: 'h4', name: 'أذكار الصباح', isPinned: false });
  const hWorkoutPinned = createMockHabit({ id: 'h5', name: 'تمارين رياضية', isPinned: true });

  const habits = [hReading, hWater, hWalk, hMorningPrayer, hWorkoutPinned];
  const sorted = sortHabits(habits, 'alphabetical', [], '2026-06-15');

  // Pinned habit always comes first
  assert.equal(sorted[0].id, 'h5'); // تمارين رياضية (pinned)

  // Remaining habits sorted alphabetically:
  // 'أذكار الصباح' -> 'المشي المسائي' -> 'شرب الماء' -> 'قراءة الكتب'
  assert.equal(sorted[1].id, 'h4'); // أذكار الصباح
  assert.equal(sorted[2].id, 'h3'); // المشي المسائي
  assert.equal(sorted[3].id, 'h2'); // شرب الماء
  assert.equal(sorted[4].id, 'h1'); // قراءة الكتب
});

test('formatArabicCount: handles active habits singular, dual, and plural rules', () => {
  const formatHabits = (count: number) =>
    formatArabicCount(
      count,
      'عادة نشطة واحدة',
      'عادتان نشطتان',
      'عادات نشطة',
      'عادة نشطة'
    );

  assert.equal(formatHabits(0), '0 عادة نشطة');
  assert.equal(formatHabits(1), 'عادة نشطة واحدة');
  assert.equal(formatHabits(2), 'عادتان نشطتان');
  assert.equal(formatHabits(3), '3 عادات نشطة');
  assert.equal(formatHabits(4), '4 عادات نشطة');
  assert.equal(formatHabits(10), '10 عادات نشطة');
  assert.equal(formatHabits(11), '11 عادة نشطة');
  assert.equal(formatHabits(25), '25 عادة نشطة');
});

test('formatArabicCount: handles archived habits singular, dual, and plural rules', () => {
  const formatArchived = (count: number) =>
    formatArabicCount(
      count,
      'عادة مؤرشفة واحدة',
      'عادتان مؤرشفتان',
      'عادات مؤرشفة',
      'عادة مؤرشفة'
    );

  assert.equal(formatArchived(0), '0 عادة مؤرشفة');
  assert.equal(formatArchived(1), 'عادة مؤرشفة واحدة');
  assert.equal(formatArchived(2), 'عادتان مؤرشفتان');
  assert.equal(formatArchived(3), '3 عادات مؤرشفة');
  assert.equal(formatArchived(10), '10 عادات مؤرشفة');
  assert.equal(formatArchived(12), '12 عادة مؤرشفة');
});

test('filterHabitsByQuery: successfully filters archived habits by name and description', () => {
  const archivedHabits: Habit[] = [
    createMockHabit({ id: 'a1', name: 'الاستيقاظ مبكراً', description: 'الساعة السادسة صباحاً', archivedAt: '2026-01-01' }),
    createMockHabit({ id: 'a2', name: 'جلسة تأمل', description: 'تنفس واسترخاء', archivedAt: '2026-01-02' }),
    createMockHabit({ id: 'a3', name: 'تعلم لغة جديدة', description: 'تطبيق دولينجو', archivedAt: '2026-01-03' }),
  ];

  const res1 = filterHabitsByQuery(archivedHabits, 'تأمل');
  assert.equal(res1.length, 1);
  assert.equal(res1[0].id, 'a2');

  const res2 = filterHabitsByQuery(archivedHabits, 'صباحا'); // normalized without tashkeel / tanween
  assert.equal(res2.length, 1);
  assert.equal(res2[0].id, 'a1');

  const res3 = filterHabitsByQuery(archivedHabits, 'دولينجو');
  assert.equal(res3.length, 1);
  assert.equal(res3[0].id, 'a3');

  const resEmpty = filterHabitsByQuery(archivedHabits, 'غير موجود');
  assert.equal(resEmpty.length, 0);
});

test('calculateWeekAdherence: rewards completed off-schedule habits without penalizing uncompleted ones', () => {
  const pastMonday = dayjs().subtract(1, 'week').startOf('week').add(1, 'day'); // Monday of previous week
  const mondayStr = pastMonday.format('YYYY-MM-DD');

  // Habit scheduled only for Friday (day index 5)
  const fridayHabit = createMockHabit({
    id: 'fri_habit',
    frequency: 'specific_days',
    frequencyDays: [5],
  });

  // Habit scheduled daily
  const dailyHabit = createMockHabit({
    id: 'daily_habit',
    frequency: 'daily',
  });

  // User completed BOTH daily habit AND the off-schedule fridayHabit on Monday!
  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: dailyHabit.id,
      date: mondayStr,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'c2',
      habitId: fridayHabit.id,
      date: mondayStr,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];

  const week = calculateWeekAdherence([dailyHabit, fridayHabit], checkins, mondayStr);
  const mondayAdherence = week.find((d) => d.date === mondayStr);

  assert.ok(mondayAdherence);
  // Both the due daily habit and the completed off-schedule habit are counted!
  assert.equal(mondayAdherence?.completedCount, 2);
  assert.equal(mondayAdherence?.totalCount, 2);
  assert.equal(mondayAdherence?.rate, 100);

  // Check Sunday (day index 0) where daily habit was due but NOT completed, and fridayHabit was NOT due and NOT completed
  const sundayStr = dayjs(pastMonday).startOf('week').format('YYYY-MM-DD');
  const sundayAdherence = week.find((d) => d.date === sundayStr);
  assert.ok(sundayAdherence);
  // Only dailyHabit was due; fridayHabit was NOT due and wasn't completed, so totalCount is 1, not 2
  assert.equal(sundayAdherence?.totalCount, 1);
  assert.equal(sundayAdherence?.completedCount, 0);
  assert.equal(sundayAdherence?.rate, 0);
});

test('formatArabicCount: accurately applies Arabic grammatical rules for milestones and opportunities', () => {
  const formatMilestones = (count: number) =>
    formatArabicCount(count, 'محطة', 'محطتان', 'محطات', 'محطة');

  assert.equal(formatMilestones(1), 'محطة');
  assert.equal(formatMilestones(2), 'محطتان');
  assert.equal(formatMilestones(5), '5 محطات');
  assert.equal(formatMilestones(10), '10 محطات');
  assert.equal(formatMilestones(11), '11 محطة');
  assert.equal(formatMilestones(15), '15 محطة');
  assert.equal(formatMilestones(24), '24 محطة');

  const formatOpps = (count: number) =>
    formatArabicCount(count, 'فرصة', 'فرصتان', 'فرص', 'فرصة');

  assert.equal(formatOpps(1), 'فرصة');
  assert.equal(formatOpps(2), 'فرصتان');
  assert.equal(formatOpps(7), '7 فرص');
  assert.equal(formatOpps(30), '30 فرصة');
});

test('formatHabitStatsForShare: correctly outputs Arabic singular and dual streak phrasing', () => {
  const habit = createMockHabit({ name: 'التأمل' });
  const milestone = calculateStreakMilestone(1);

  // 1-day current streak, 2-day best streak
  const stats1 = {
    currentStreak: 1,
    bestStreak: 2,
    totalCompletions: 3,
    completionRate: 50,
    totalDueDays: 6,
  };
  const text1 = formatHabitStatsForShare(habit, stats1, milestone);
  assert.ok(text1.includes('السلسلة الحالية: يوم واحد'));
  assert.ok(text1.includes('أطول سلسلة: يومان'));

  // 2-day current streak
  const stats2 = {
    currentStreak: 2,
    bestStreak: 2,
    totalCompletions: 2,
    completionRate: 100,
    totalDueDays: 2,
  };
  const text2 = formatHabitStatsForShare(habit, stats2, milestone);
  assert.ok(text2.includes('السلسلة الحالية: يومان متتاليان'));
});

test('exportSingleHabitToCsv: creates formatted CSV with habit summary and chronological checkins', () => {
  const habit = createMockHabit({
    id: 'single_export_h1',
    name: 'حفظ القرآن الكريم',
    targetCount: 2,
    unit: 'صفحة',
    icon: 'book-outline',
  });

  const checkins: HabitCheckin[] = [
    {
      id: 'sc1',
      habitId: 'single_export_h1',
      date: '2026-09-01',
      count: 2,
      completed: true,
      note: 'تم مراجعة سورة يس وتثبيتها',
      updatedAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'sc2',
      habitId: 'single_export_h1',
      date: '2026-09-02',
      count: 1,
      completed: false,
      note: '',
      updatedAt: '2026-09-02T08:00:00.000Z',
    },
  ];

  const csv = exportSingleHabitToCsv(habit, checkins);
  assert.ok(csv.startsWith('\uFEFF')); // BOM present
  assert.ok(csv.includes('# بطاقة ملخص العادة'));
  assert.ok(csv.includes('حفظ القرآن الكريم'));
  assert.ok(csv.includes('# سجل التاريخ والملاحظات اليومية'));
  assert.ok(csv.includes('تم مراجعة سورة يس وتثبيتها'));
  assert.ok(csv.includes('2026-09-01'));
  assert.ok(csv.includes('2026-09-02'));
  assert.ok(csv.includes('مكتمل'));
  assert.ok(csv.includes('قيد الإنجاز'));
});

test('isStreakAtRisk: identifies streaks at risk for today correctly', () => {
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const pastDate = dayjs().subtract(2, 'day').format('YYYY-MM-DD');
  const futureDate = dayjs().add(1, 'day').format('YYYY-MM-DD');

  const habit = createMockHabit({
    id: 'risk_h1',
    name: 'المشي اليومي',
    frequency: 'daily',
    targetCount: 1,
    isActive: true,
  });

  // 1. Not at risk if targetDate is future or past
  assert.equal(isStreakAtRisk(habit, [], futureDate), false);
  assert.equal(isStreakAtRisk(habit, [], pastDate), false);

  // 2. Not at risk if habit is inactive or archived
  const inactiveHabit = { ...habit, isActive: false };
  assert.equal(isStreakAtRisk(inactiveHabit, [], today), false);

  const archivedHabit = { ...habit, archivedAt: '2026-09-01T00:00:00Z' };
  assert.equal(isStreakAtRisk(archivedHabit, [], today), false);

  // 3. No streak at risk if there are no past checkins (streak is 0)
  assert.equal(isStreakAtRisk(habit, [], today), false);

  // 4. Streak at risk when habit has past consecutive checkin ending yesterday, due today, and not yet completed today
  const checkinsWithStreak: HabitCheckin[] = [
    {
      id: 'chk_y',
      habitId: 'risk_h1',
      date: yesterday,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];
  assert.equal(isStreakAtRisk(habit, checkinsWithStreak, today), true);

  // 5. Not at risk once completed today
  const checkinsCompletedToday: HabitCheckin[] = [
    ...checkinsWithStreak,
    {
      id: 'chk_t',
      habitId: 'risk_h1',
      date: today,
      count: 1,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
  ];
  assert.equal(isStreakAtRisk(habit, checkinsCompletedToday, today), false);

  // 6. Incomplete checkin today (e.g. count < targetCount) should still be at risk
  const multiCountHabit = createMockHabit({
    id: 'risk_multi',
    name: 'شرب الماء',
    frequency: 'daily',
    targetCount: 5,
    isActive: true,
  });
  const checkinsMultiIncomplete: HabitCheckin[] = [
    {
      id: 'chk_my',
      habitId: 'risk_multi',
      date: yesterday,
      count: 5,
      completed: true,
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'chk_mt',
      habitId: 'risk_multi',
      date: today,
      count: 2,
      completed: false,
      updatedAt: dayjs().toISOString(),
    },
  ];
  assert.equal(isStreakAtRisk(multiCountHabit, checkinsMultiIncomplete, today), true);

  // 7. Not at risk on a rest day (habit not due today)
  const currentDayOfWeek = dayjs().day();
  // Target a day other than today
  const otherDayOfWeek = (currentDayOfWeek + 3) % 7;
  const specificDaysHabit = createMockHabit({
    id: 'risk_specific',
    name: 'تمرين الجري',
    frequency: 'specific_days',
    targetDays: [otherDayOfWeek],
    isActive: true,
  });
  assert.equal(isStreakAtRisk(specificDaysHabit, checkinsWithStreak, today), false);
});


