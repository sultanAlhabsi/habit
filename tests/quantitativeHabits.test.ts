import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCheckinProgress,
  calculateTotalLoggedUnits,
  calculateHabitStats,
  isQuantitativeHabit,
} from '../src/utils/habitUtils.ts';
import { generateDemoCheckins } from '../src/services/mockData.ts';
import dayjs from 'dayjs';
import type { Habit, HabitCheckin } from '../src/types/habit.ts';

const createMockHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'mock-reading-habit',
  name: 'قراءة الكتب',
  icon: 'book-outline',
  color: '#2A4B3A',
  frequency: 'daily',
  frequencyDays: [0, 1, 2, 3, 4, 5, 6],
  targetCount: 10,
  unit: 'صفحة',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

test('calculateCheckinProgress: 0 count is not completed', () => {
  const habit = createMockHabit({ targetCount: 10 });
  const checkin: HabitCheckin = {
    id: 'chk_1',
    habitId: habit.id,
    date: '2026-06-15',
    count: 0,
    completed: false,
    updatedAt: '2026-06-15T10:00:00.000Z',
  };

  const progress = calculateCheckinProgress(habit, checkin);
  assert.equal(progress.count, 0);
  assert.equal(progress.targetCount, 10);
  assert.equal(progress.isCompleted, false);
  assert.equal(progress.progressRatio, 0);
  assert.equal(progress.progressPercent, 0);
});

test('calculateCheckinProgress: count below minimum threshold (e.g. 5 of 10) is not completed', () => {
  const habit = createMockHabit({ targetCount: 10 });
  const checkin: HabitCheckin = {
    id: 'chk_2',
    habitId: habit.id,
    date: '2026-06-15',
    count: 5,
    completed: false,
    updatedAt: '2026-06-15T10:00:00.000Z',
  };

  const progress = calculateCheckinProgress(habit, checkin);
  assert.equal(progress.count, 5);
  assert.equal(progress.targetCount, 10);
  assert.equal(progress.isCompleted, false);
  assert.equal(progress.progressRatio, 0.5);
  assert.equal(progress.progressPercent, 50);
});

test('calculateCheckinProgress: count equal to minimum threshold (e.g. 10 of 10) is completed', () => {
  const habit = createMockHabit({ targetCount: 10 });
  const checkin: HabitCheckin = {
    id: 'chk_3',
    habitId: habit.id,
    date: '2026-06-15',
    count: 10,
    completed: true,
    updatedAt: '2026-06-15T10:00:00.000Z',
  };

  const progress = calculateCheckinProgress(habit, checkin);
  assert.equal(progress.count, 10);
  assert.equal(progress.targetCount, 10);
  assert.equal(progress.isCompleted, true);
  assert.equal(progress.progressRatio, 1);
  assert.equal(progress.progressPercent, 100);
});

test('calculateCheckinProgress: count exceeding minimum threshold (e.g. 20 of 10) is completed and uncapped', () => {
  const habit = createMockHabit({ targetCount: 10 });
  const checkin: HabitCheckin = {
    id: 'chk_4',
    habitId: habit.id,
    date: '2026-06-15',
    count: 20,
    completed: true,
    updatedAt: '2026-06-15T10:00:00.000Z',
  };

  const progress = calculateCheckinProgress(habit, checkin);
  assert.equal(progress.count, 20);
  assert.equal(progress.targetCount, 10);
  assert.equal(progress.isCompleted, true);
  assert.equal(progress.progressRatio, 1);
  assert.equal(progress.progressPercent, 100);
  assert.equal(progress.rawRatio, 2);
  assert.equal(progress.rawPercent, 200);
});

test('calculateTotalLoggedUnits: sums exact quantities across dates accurately', () => {
  const habit = createMockHabit({ targetCount: 10 });
  const checkins: HabitCheckin[] = [
    { id: '1', habitId: habit.id, date: '2026-06-10', count: 15, completed: true, updatedAt: '' },
    { id: '2', habitId: habit.id, date: '2026-06-11', count: 25, completed: true, updatedAt: '' },
    { id: '3', habitId: habit.id, date: '2026-06-12', count: 5, completed: false, updatedAt: '' },
    { id: '4', habitId: 'another-habit', date: '2026-06-12', count: 100, completed: true, updatedAt: '' },
  ];

  const total = calculateTotalLoggedUnits(habit.id, checkins);
  assert.equal(total, 45); // 15 + 25 + 5
});

test('calculateHabitStats: streaks require minimum threshold to be met', () => {
  const habit = createMockHabit({ targetCount: 10 });
  const checkins: HabitCheckin[] = [
    // Day 1: met (15 pages)
    { id: '1', habitId: habit.id, date: '2026-06-14', count: 15, completed: true, updatedAt: '' },
    // Day 2: met (10 pages)
    { id: '2', habitId: habit.id, date: '2026-06-15', count: 10, completed: true, updatedAt: '' },
    // Day 3: not met (5 pages) -> completed: false
    { id: '3', habitId: habit.id, date: '2026-06-16', count: 5, completed: false, updatedAt: '' },
    // Day 4: met (20 pages)
    { id: '4', habitId: habit.id, date: '2026-06-17', count: 20, completed: true, updatedAt: '' },
  ];

  const stats = calculateHabitStats(habit, checkins, '2026-06-17');
  assert.equal(stats.totalCompletions, 3); // Days 1, 2, and 4
  assert.equal(stats.currentStreak, 1); // Streak broken on Day 3, restarted on Day 4
});

test('isQuantitativeHabit: correctly classifies quantitative habits vs boolean habits', () => {
  // Target count > 1 is always quantitative
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 5, unit: 'مرة' })), true);
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 2, unit: 'لتر' })), true);

  // Target count = 1 with specific unit is quantitative (e.g., 1 liter, 1 hour, 1 chapter)
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 1, unit: 'لتر' })), true);
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 1, unit: 'كوب' })), true);
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 1, unit: 'ساعة' })), true);

  // Target count = 1 with generic binary unit is not quantitative
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 1, unit: 'مرة' })), false);
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 1, unit: 'يوم' })), false);
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 1, unit: '' })), false);
  assert.equal(isQuantitativeHabit(createMockHabit({ targetCount: 0, unit: 'مرة' })), false);
});

test('generateDemoCheckins: leaves today clean/pending at count 0', () => {
  const demoCheckins = generateDemoCheckins();
  const todayStr = dayjs().format('YYYY-MM-DD');

  // Verify that no demo checkin is pre-generated for today
  const todayCheckins = demoCheckins.filter((c) => c.date === todayStr);
  assert.equal(todayCheckins.length, 0);

  // Verify that past checkins are generated
  assert.ok(demoCheckins.length > 0);
  const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const yesterdayCheckins = demoCheckins.filter((c) => c.date === yesterdayStr);
  assert.ok(yesterdayCheckins.length > 0);
});

