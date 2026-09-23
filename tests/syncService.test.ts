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

test('sync reconciliation: prevents duplicate habits across devices by matching normalized name', () => {
  const remoteHabit: Habit = {
    id: 'h_remote_phone1',
    name: 'القراءة 📚',
    icon: 'book',
    color: '#0D9488',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-18T10:00:00.000Z',
  };

  const localHabitOnPhone2: Habit = {
    id: 'h_local_phone2',
    name: ' القراءة 📚 ', // Note whitespace difference
    icon: 'book',
    color: '#0D9488',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-19T12:00:00.000Z',
  };

  const remoteHabitsMap = new Map<string, Habit>([[remoteHabit.id, remoteHabit]]);
  const remoteHabitsByName = new Map<string, Habit>();
  for (const rh of remoteHabitsMap.values()) {
    remoteHabitsByName.set(rh.name.trim().toLowerCase(), rh);
  }

  // Check whether Phone 2 should push a new habit or merge into Phone 1's habit
  const nameKey = localHabitOnPhone2.name.trim().toLowerCase();
  const existingRemote = remoteHabitsByName.get(nameKey);

  assert.ok(existingRemote !== undefined, 'Should detect existing remote habit with same name');
  assert.equal(existingRemote!.id, 'h_remote_phone1', 'Should resolve to Phone 1 canonical ID');

  // Checkin remapping simulation
  const localCheckin: HabitCheckin = {
    id: `chk_${localHabitOnPhone2.id}_2026-09-19`,
    habitId: localHabitOnPhone2.id,
    date: '2026-09-19',
    count: 1,
    completed: true,
    updatedAt: '2026-09-19T14:00:00.000Z',
  };

  const remappedCheckin: HabitCheckin = {
    ...localCheckin,
    id: `chk_${existingRemote!.id}_${localCheckin.date}`,
    habitId: existingRemote!.id,
  };

  assert.equal(remappedCheckin.habitId, 'h_remote_phone1');
  assert.equal(remappedCheckin.id, 'chk_h_remote_phone1_2026-09-19');
});

test('neon serialization: habit parameters use boolean primitives and preserve multi-target fields', async () => {
  const { serializeNeonHabitParams } = await import('../src/services/neonService.ts');

  const habit: Habit = {
    id: 'habit_multi_1',
    name: 'تمرين السباحة',
    description: 'تمارين أسبوعية في المسبح',
    icon: 'water',
    color: '#06B6D4',
    frequency: 'weekly',
    frequencyDays: [1, 3, 5],
    targetCount: 1,
    weeklyTargetCount: 3,
    monthlyTargetCount: 12,
    monthlyDay: 15,
    unit: 'مرة',
    isActive: true,
    reminderTime: '08:00',
    isPinned: true,
    order: 4,
    createdAt: '2026-09-20T08:00:00.000Z',
    archivedAt: null,
  };

  const params = serializeNeonHabitParams(habit);

  // [id, name, description, icon, color, frequency, frequency_days,
  //  target_count, weekly_target_count, monthly_target_count, monthly_day,
  //  unit, is_active, reminder_time, is_pinned, order_index, created_at, archived_at]
  assert.equal(params[0], 'habit_multi_1');
  assert.equal(params[1], 'تمرين السباحة');
  assert.equal(params[7], 1); // target_count
  assert.equal(params[8], 3); // weekly_target_count
  assert.equal(params[9], 12); // monthly_target_count
  assert.equal(params[10], 15); // monthly_day
  assert.equal(typeof params[12], 'boolean', 'is_active must be a boolean primitive for PostgreSQL');
  assert.equal(params[12], true);
  assert.equal(typeof params[14], 'boolean', 'is_pinned must be a boolean primitive for PostgreSQL');
  assert.equal(params[14], true);
  assert.equal(params[15], 4); // order_index
});

test('neon serialization: checkin parameters use boolean primitives for completed', async () => {
  const { serializeNeonCheckinParams } = await import('../src/services/neonService.ts');

  const checkin: HabitCheckin = {
    id: 'chk_h1_2026-09-24',
    habitId: 'habit_1',
    date: '2026-09-24',
    count: 2,
    completed: true,
    updatedAt: '2026-09-24T00:00:00.000Z',
    note: 'إنجاز ممتاز',
  };

  const params = serializeNeonCheckinParams(checkin);

  // [id, habit_id, date, count, completed, updated_at, note]
  assert.equal(params[0], 'chk_h1_2026-09-24');
  assert.equal(params[3], 2);
  assert.equal(typeof params[4], 'boolean', 'completed must be a boolean primitive for PostgreSQL');
  assert.equal(params[4], true);
});

test('sync reconciliation: timestamp-aware habit pull and push prevents stale overwrites', () => {
  const localHabitOlder: Habit = {
    id: 'h_shared_1',
    name: 'رياضة الصباح',
    icon: 'barbell',
    color: '#2A4B3A',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
  };

  const remoteHabitNewer: Habit = {
    id: 'h_shared_1',
    name: 'رياضة الصباح والمساء', // Renamed on remote device
    icon: 'barbell',
    color: '#059669',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 2,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-23T15:00:00.000Z',
  };

  // Remote habit is newer: local should pull it and NOT overwrite remote with localHabitOlder
  const remoteTime = new Date(remoteHabitNewer.updatedAt!).getTime();
  const localTime = new Date(localHabitOlder.updatedAt!).getTime();
  const shouldPull = remoteTime > localTime;
  const shouldPush = localTime > remoteTime;

  assert.equal(shouldPull, true, 'Remote newer habit must be pulled');
  assert.equal(shouldPush, false, 'Stale local habit must not overwrite remote');
});

test('sync reconciliation: remote habit archival propagates to local habit', () => {
  const localHabitActive: Habit = {
    id: 'h_archive_test',
    name: 'عادة قديمة',
    icon: 'book',
    color: '#3B82F6',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    archivedAt: null,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
  };

  const remoteHabitArchived: Habit = {
    id: 'h_archive_test',
    name: 'عادة قديمة',
    icon: 'book',
    color: '#3B82F6',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: false,
    archivedAt: '2026-09-23T12:00:00.000Z',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-23T12:00:00.000Z',
  };

  const remoteTime = new Date(remoteHabitArchived.updatedAt!).getTime();
  const localTime = new Date(localHabitActive.updatedAt!).getTime();
  const isRemoteArchivalNewer =
    Boolean(remoteHabitArchived.archivedAt) && !localHabitActive.archivedAt && remoteTime >= localTime;

  assert.equal(isRemoteArchivalNewer, true, 'Remote archival must be recognized as newer and pulled');
});

