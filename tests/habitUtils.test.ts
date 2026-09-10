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

