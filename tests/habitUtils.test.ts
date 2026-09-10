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

