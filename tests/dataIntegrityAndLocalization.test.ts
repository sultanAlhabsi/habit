import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initDatabase,
  resetDatabase,
  saveHabitRecord,
  saveCheckinRecord,
  fetchAllHabits,
  fetchAllCheckins,
  fetchCheckinsForHabit,
  countAllCompletedCheckins,
  fetchRecentCheckins,
  getAllPreferences,
} from '../src/services/database.ts';
import {
  createBackupPayload,
} from '../src/utils/backupUtils.ts';
import {
  toArabicNumerals,
  formatArabicCount,
  exportFullReportToCsv,
  exportSingleHabitToCsv,
} from '../src/utils/habitUtils.ts';
import type { Habit, HabitCheckin } from '../src/types/habit.ts';
import dayjs from 'dayjs';

test('database: fetchCheckinsForHabit and countAllCompletedCheckins', async () => {
  await resetDatabase();
  await initDatabase();

  const habitA: Habit = {
    id: 'habit_a',
    name: 'تلاوة ورد القرآن',
    icon: 'star-outline',
    color: '#059669',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'جزء',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const habitB: Habit = {
    id: 'habit_b',
    name: 'المشي اليومي',
    icon: 'walk-outline',
    color: '#0284C7',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 5000,
    unit: 'خطوة',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  await saveHabitRecord(habitA);
  await saveHabitRecord(habitB);

  // Add checkins for habitA
  await saveCheckinRecord({
    id: 'chk_a_1',
    habitId: 'habit_a',
    date: '2026-01-01',
    count: 1,
    completed: true,
    updatedAt: '2026-01-01T10:00:00.000Z',
    note: 'بداية العام بتلاوة طيبة',
  });
  await saveCheckinRecord({
    id: 'chk_a_2',
    habitId: 'habit_a',
    date: '2026-01-02',
    count: 1,
    completed: true,
    updatedAt: '2026-01-02T10:00:00.000Z',
  });

  // Add checkins for habitB (one incomplete, one completed)
  await saveCheckinRecord({
    id: 'chk_b_1',
    habitId: 'habit_b',
    date: '2026-01-01',
    count: 3000,
    completed: false,
    updatedAt: '2026-01-01T10:00:00.000Z',
  });
  await saveCheckinRecord({
    id: 'chk_b_2',
    habitId: 'habit_b',
    date: '2026-01-02',
    count: 5000,
    completed: true,
    updatedAt: '2026-01-02T10:00:00.000Z',
  });

  // Test fetchCheckinsForHabit
  const checkinsA = await fetchCheckinsForHabit('habit_a');
  assert.equal(checkinsA.length, 2);
  assert.equal(checkinsA[0].date, '2026-01-02'); // Ordered by date DESC
  assert.equal(checkinsA[1].date, '2026-01-01');
  assert.equal(checkinsA[1].note, 'بداية العام بتلاوة طيبة');

  const checkinsB = await fetchCheckinsForHabit('habit_b');
  assert.equal(checkinsB.length, 2);

  // Test countAllCompletedCheckins: habit_a has 2 completed, habit_b has 1 completed => 3 total
  const completedCount = await countAllCompletedCheckins();
  assert.equal(completedCount, 3);
});

test('data integrity: lifetime checkins are preserved in backups and CSV beyond 90-day window (SEC-24-01)', async () => {
  await resetDatabase();
  await initDatabase();

  const habit: Habit = {
    id: 'habit_long_history',
    name: 'عادة قديمة',
    icon: 'book-outline',
    color: '#059669',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  };
  await saveHabitRecord(habit);

  // Save a recent checkin (5 days ago)
  const recentDate = dayjs().subtract(5, 'day').format('YYYY-MM-DD');
  await saveCheckinRecord({
    id: `chk_${recentDate}`,
    habitId: habit.id,
    date: recentDate,
    count: 1,
    completed: true,
    updatedAt: new Date().toISOString(),
  });

  // Save an ancient checkin (250 days ago - well outside the 90-day window)
  const ancientDate = dayjs().subtract(250, 'day').format('YYYY-MM-DD');
  await saveCheckinRecord({
    id: `chk_${ancientDate}`,
    habitId: habit.id,
    date: ancientDate,
    count: 1,
    completed: true,
    updatedAt: new Date().toISOString(),
    note: 'سجل إنجاز قديم جداً يجب ألا يضيع أبداً',
  });

  // fetchRecentCheckins(90) (the cold-start slice) only contains recentDate
  const recentCheckins = await fetchRecentCheckins(90);
  assert.equal(recentCheckins.length, 1);
  assert.equal(recentCheckins[0].date, recentDate);

  // fetchAllCheckins() contains both
  const allCheckins = await fetchAllCheckins();
  assert.equal(allCheckins.length, 2);

  // Backup payload built from allCheckins preserves 100% of historical data
  const meta = await getAllPreferences();
  const habits = await fetchAllHabits();
  const backup = createBackupPayload(habits, allCheckins, meta);
  const backupDates = backup.checkins.map((c) => c.date);
  assert.ok(backupDates.includes(recentDate), 'Backup contains recent checkin');
  assert.ok(backupDates.includes(ancientDate), 'Backup preserves 250-day-old checkin (SEC-24-01 fixed!)');
  assert.equal(backup.checkins.length, 2);

  // Full CSV report generated from allCheckins includes ancient record
  const fullCsv = exportFullReportToCsv(habits, allCheckins);
  assert.ok(fullCsv.includes(recentDate));
  assert.ok(fullCsv.includes(ancientDate));
  assert.ok(fullCsv.includes('سجل إنجاز قديم جداً يجب ألا يضيع أبداً'));

  // Single habit CSV export using fetchCheckinsForHabit includes ancient record
  const habitCheckins = await fetchCheckinsForHabit(habit.id);
  const singleCsv = exportSingleHabitToCsv(habit, habitCheckins);
  assert.ok(singleCsv.includes(recentDate));
  assert.ok(singleCsv.includes(ancientDate));
  assert.ok(singleCsv.includes('سجل إنجاز قديم جداً يجب ألا يضيع أبداً'));
});

test('localization: toArabicNumerals and formatArabicCount formatting', () => {
  assert.equal(toArabicNumerals(0), '٠');
  assert.equal(toArabicNumerals(123456789), '١٢٣٤٥٦٧٨٩');
  assert.equal(toArabicNumerals('10:30'), '١٠:٣٠');
  assert.equal(toArabicNumerals('الكل (5)'), 'الكل (٥)');

  assert.equal(formatArabicCount(0, 'عادة', 'عادتان', 'عادات', 'عادة'), '٠ عادة');
  assert.equal(formatArabicCount(1, 'عادة واحدة', 'عادتان', 'عادات', 'عادة'), 'عادة واحدة');
  assert.equal(formatArabicCount(2, 'عادة واحدة', 'عادتان', 'عادات', 'عادة'), 'عادتان');
  assert.equal(formatArabicCount(5, 'عادة واحدة', 'عادتان', 'عادات', 'عادة'), '٥ عادات');
  assert.equal(formatArabicCount(15, 'عادة واحدة', 'عادتان', 'عادات', 'عادة'), '١٥ عادة');
});
