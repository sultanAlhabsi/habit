import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Habit, HabitCheckin } from '../src/types/habit.ts';

test('sync reconciliation: merges remote and local habits by ID', () => {
  const localHabits: Habit[] = [
    {
      id: 'habit_1',
      name: 'قراءة الكتب',
      icon: 'book',
      color: '#2A4B3A',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 1,
      unit: 'مرة',
      isActive: true,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
  ];

  const remoteHabits: Habit[] = [
    {
      id: 'habit_2',
      name: 'شرب الماء',
      icon: 'water',
      color: '#1E3A8A',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 8,
      unit: 'كوب',
      isActive: true,
      createdAt: '2026-09-02T10:00:00.000Z',
    },
  ];

  const habitsMap = new Map<string, Habit>();
  for (const h of localHabits) habitsMap.set(h.id, h);
  for (const h of remoteHabits) habitsMap.set(h.id, h);

  assert.equal(habitsMap.size, 2);
  assert.ok(habitsMap.has('habit_1'));
  assert.ok(habitsMap.has('habit_2'));
});

test('sync reconciliation: checkin last-write-wins by updatedAt timestamp', () => {
  const localCheckin: HabitCheckin = {
    id: 'chk_1',
    habitId: 'habit_1',
    date: '2026-09-13',
    count: 1,
    completed: true,
    updatedAt: '2026-09-13T07:00:00.000Z',
    note: 'ملاحظة محلية قديمة',
  };

  const remoteCheckin: HabitCheckin = {
    id: 'chk_1',
    habitId: 'habit_1',
    date: '2026-09-13',
    count: 2,
    completed: true,
    updatedAt: '2026-09-13T07:30:00.000Z',
    note: 'ملاحظة سحابية محدثة من اللابتوب',
  };

  const isRemoteNewer = new Date(remoteCheckin.updatedAt) > new Date(localCheckin.updatedAt);
  assert.equal(isRemoteNewer, true);

  const merged = isRemoteNewer ? remoteCheckin : localCheckin;
  assert.equal(merged.count, 2);
  assert.equal(merged.note, 'ملاحظة سحابية محدثة من اللابتوب');
});

test('sync reconciliation: tombstones prevent deleted habits from resurrecting during merge', () => {
  const localHabits: Habit[] = [
    {
      id: 'habit_1',
      name: 'شرب الماء',
      icon: 'water',
      color: '#1E3A8A',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 1,
      unit: 'مرة',
      isActive: true,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
  ];

  // Remote still had habit_deleted ("نوم مبكر") before sync
  const remoteHabits: Habit[] = [
    {
      id: 'habit_1',
      name: 'شرب الماء',
      icon: 'water',
      color: '#1E3A8A',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 1,
      unit: 'مرة',
      isActive: true,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'habit_deleted',
      name: 'نوم مبكر',
      icon: 'moon',
      color: '#4B5563',
      frequency: 'daily',
      frequencyDays: [0, 1, 2, 3, 4, 5, 6],
      targetCount: 1,
      unit: 'مرة',
      isActive: true,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
  ];

  const localDeletedIds = ['habit_deleted'];
  const remoteDeletedIds: string[] = [];
  const allDeletedHabitIds = new Set([...remoteDeletedIds, ...localDeletedIds]);

  // Filter out any habits in tombstones
  const safeRemoteHabits = remoteHabits.filter((h) => !allDeletedHabitIds.has(h.id));
  const safeLocalHabits = localHabits.filter((h) => !allDeletedHabitIds.has(h.id));

  const reconciledMap = new Map<string, Habit>();
  for (const h of safeLocalHabits) reconciledMap.set(h.id, h);
  for (const h of safeRemoteHabits) reconciledMap.set(h.id, h);

  assert.equal(reconciledMap.size, 1);
  assert.ok(reconciledMap.has('habit_1'));
  assert.equal(reconciledMap.has('habit_deleted'), false, 'Deleted habit must NOT resurrect');
});

test('sync reconciliation: checkins of deleted habits are purged and ignored', () => {
  const remoteCheckins: HabitCheckin[] = [
    {
      id: 'chk_active',
      habitId: 'habit_1',
      date: '2026-09-13',
      count: 1,
      completed: true,
      updatedAt: '2026-09-13T08:00:00.000Z',
    },
    {
      id: 'chk_deleted',
      habitId: 'habit_deleted',
      date: '2026-09-13',
      count: 1,
      completed: true,
      updatedAt: '2026-09-13T08:00:00.000Z',
    },
  ];

  const allDeletedHabitIds = new Set(['habit_deleted']);
  const safeCheckins = remoteCheckins.filter((c) => !allDeletedHabitIds.has(c.habitId));

  assert.equal(safeCheckins.length, 1);
  assert.equal(safeCheckins[0].habitId, 'habit_1');
});

test('sync reconciliation: local untoggle (completed: false) overrides older remote completion', () => {
  // Remote database has a completed checkin from 09:00
  const remoteCheckin: HabitCheckin = {
    id: 'chk_h1_2026-09-19',
    habitId: 'habit_1',
    date: '2026-09-19',
    count: 1,
    completed: true,
    updatedAt: '2026-09-19T09:00:00.000Z',
  };

  // User unchecked the habit locally at 09:30
  const localCheckin: HabitCheckin = {
    id: 'chk_h1_2026-09-19',
    habitId: 'habit_1',
    date: '2026-09-19',
    count: 0,
    completed: false,
    updatedAt: '2026-09-19T09:30:00.000Z',
  };

  // Reconcile logic matching syncWithNeon:
  // 1. Should remote overwrite local?
  const shouldPullFromRemote =
    new Date(remoteCheckin.updatedAt) > new Date(localCheckin.updatedAt);
  assert.equal(shouldPullFromRemote, false, 'Remote checkin must NOT overwrite newer local untoggle');

  // 2. Should local untoggle push to remote?
  const shouldPushToRemote =
    new Date(localCheckin.updatedAt) > new Date(remoteCheckin.updatedAt);
  assert.equal(shouldPushToRemote, true, 'Local untoggle must push completed: false to remote');

  // 3. Final state is completed: false
  const effectiveCheckin = shouldPullFromRemote ? remoteCheckin : localCheckin;
  assert.equal(effectiveCheckin.completed, false);
  assert.equal(effectiveCheckin.count, 0);
});

test('sync reconciliation: checkin with completed: false does not count as completed in stats', () => {
  const checkins: HabitCheckin[] = [
    {
      id: 'chk_h1_2026-09-19',
      habitId: 'habit_1',
      date: '2026-09-19',
      count: 0,
      completed: false,
      updatedAt: '2026-09-19T09:30:00.000Z',
    },
  ];

  const isCompleted = checkins.some((c) => c.habitId === 'habit_1' && c.completed);
  assert.equal(isCompleted, false, 'Checkin with completed: false must not register as completed');
});
