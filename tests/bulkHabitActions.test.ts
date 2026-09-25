import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initDatabase,
  resetDatabase,
  saveHabitRecord,
  fetchAllCheckins,
  batchSaveCheckinRecords,
} from '../src/services/database.ts';
import {
  getPendingDueHabitsForDate,
  getCompletedDueHabitsForDate,
  buildBatchCheckinPayloadForCompletion,
  buildBatchCheckinPayloadForReset,
} from '../src/utils/habitUtils.ts';
import type { Habit, HabitCheckin } from '../src/types/habit.ts';
import dayjs from 'dayjs';

test('bulkHabitActions: getPendingDueHabitsForDate correctly filters active pending habits', async () => {
  const todayStr = dayjs().format('YYYY-MM-DD');

  const habits: Habit[] = [
    {
      id: 'h1',
      name: 'قراءة',
      icon: 'book-outline',
      color: '#059669',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 10,
      unit: 'صفحة',
      isActive: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'h2',
      name: 'شرب ماء',
      icon: 'water-outline',
      color: '#0284C7',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 8,
      unit: 'كوب',
      isActive: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'h3_archived',
      name: 'مؤرشفة',
      icon: 'close-outline',
      color: '#9CA3AF',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 1,
      unit: 'مرة',
      isActive: false,
      archivedAt: '2026-09-02T00:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  const checkins: HabitCheckin[] = [
    {
      id: `chk_h2_${todayStr}`,
      habitId: 'h2',
      date: todayStr,
      count: 8,
      completed: true,
      updatedAt: '2026-09-24T08:00:00.000Z',
    },
  ];

  const pending = getPendingDueHabitsForDate(habits, checkins, todayStr);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, 'h1');

  // Disallow future date
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const pendingFuture = getPendingDueHabitsForDate(habits, checkins, tomorrow);
  assert.equal(pendingFuture.length, 0);
});

test('bulkHabitActions: buildBatchCheckinPayloadForCompletion builds correct payload and preserves notes', async () => {
  const todayStr = dayjs().format('YYYY-MM-DD');

  const habits: Habit[] = [
    {
      id: 'h1',
      name: 'تمرين رياضي',
      icon: 'fitness-outline',
      color: '#DC2626',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 30,
      unit: 'دقيقة',
      isActive: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  const existingCheckin: HabitCheckin = {
    id: `chk_custom_id`,
    habitId: 'h1',
    date: todayStr,
    count: 10,
    completed: false,
    updatedAt: '2026-09-24T06:00:00.000Z',
    note: 'ملاحظة مهمة مسجلة مسبقاً',
  };

  const payload = buildBatchCheckinPayloadForCompletion(habits, [existingCheckin], todayStr);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].id, 'chk_custom_id'); // preserves id
  assert.equal(payload[0].completed, true);
  assert.equal(payload[0].count, 30); // sets to targetCount
  assert.equal(payload[0].note, 'ملاحظة مهمة مسجلة مسبقاً'); // preserves note
});

test('bulkHabitActions: getCompletedDueHabitsForDate and buildBatchCheckinPayloadForReset', async () => {
  const todayStr = dayjs().format('YYYY-MM-DD');

  const habits: Habit[] = [
    {
      id: 'h1',
      name: 'أذكار',
      icon: 'sunny-outline',
      color: '#F59E0B',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 1,
      unit: 'مرة',
      isActive: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'h2',
      name: 'مشي',
      icon: 'walk-outline',
      color: '#10B981',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 5000,
      unit: 'خطوة',
      isActive: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  const checkins: HabitCheckin[] = [
    {
      id: `chk_h1_${todayStr}`,
      habitId: 'h1',
      date: todayStr,
      count: 1,
      completed: true,
      updatedAt: '2026-09-24T07:00:00.000Z',
      note: 'صباح مشرق',
    },
    {
      id: `chk_h2_${todayStr}`,
      habitId: 'h2',
      date: todayStr,
      count: 1000,
      completed: false, // not completed
      updatedAt: '2026-09-24T07:30:00.000Z',
    },
  ];

  const completed = getCompletedDueHabitsForDate(habits, checkins, todayStr);
  assert.equal(completed.length, 1);
  assert.equal(completed[0].id, 'h1');

  const resetPayload = buildBatchCheckinPayloadForReset(completed, checkins, todayStr);
  assert.equal(resetPayload.length, 1);
  assert.equal(resetPayload[0].id, `chk_h1_${todayStr}`);
  assert.equal(resetPayload[0].completed, false);
  assert.equal(resetPayload[0].count, 0);
  assert.equal(resetPayload[0].note, 'صباح مشرق');
});

test('bulkHabitActions: batchSaveCheckinRecords persists bulk operations atomically in SQLite', async () => {
  await initDatabase();
  await resetDatabase();

  const todayStr = dayjs().format('YYYY-MM-DD');

  const habit: Habit = {
    id: 'habit_db_bulk',
    name: 'تأمل مسائي',
    icon: 'moon-outline',
    color: '#6366F1',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 15,
    unit: 'دقيقة',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  await saveHabitRecord(habit);

  // 1. Complete in bulk
  const pending = getPendingDueHabitsForDate([habit], [], todayStr);
  const completionPayload = buildBatchCheckinPayloadForCompletion(pending, [], todayStr);
  await batchSaveCheckinRecords(completionPayload);

  let stored = await fetchAllCheckins();
  let chk = stored.find((c) => c.habitId === 'habit_db_bulk' && c.date === todayStr);
  assert.ok(chk);
  assert.equal(chk?.completed, true);
  assert.equal(chk?.count, 15);

  // 2. Reset in bulk
  const completed = getCompletedDueHabitsForDate([habit], stored, todayStr);
  const resetPayload = buildBatchCheckinPayloadForReset(completed, stored, todayStr);
  await batchSaveCheckinRecords(resetPayload);

  stored = await fetchAllCheckins();
  chk = stored.find((c) => c.habitId === 'habit_db_bulk' && c.date === todayStr);
  assert.ok(chk);
  assert.equal(chk?.completed, false);
  assert.equal(chk?.count, 0);
});
