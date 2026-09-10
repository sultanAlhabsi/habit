import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import {
  isHabitDueOnDate,
  calculateHabitStats,
  calculateOverallStats,
  formatArabicDate,
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

test('calculateOverallStats: computes accurate rates and weekly adherence', () => {
  const habit1 = createMockHabit({ id: 'h1' });
  const habit2 = createMockHabit({ id: 'h2' });
  const today = dayjs().format('YYYY-MM-DD');

  const checkins: HabitCheckin[] = [
    {
      id: 'c1',
      habitId: 'h1',
      date: today,
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
  assert.equal(overall.weeklyAdherence.length, 7);
});

test('formatArabicDate: formats correctly in Arabic', () => {
  const formatted = formatArabicDate('2026-09-10');
  assert.ok(formatted.includes('10'));
  assert.ok(formatted.includes('سبتمبر'));
});
