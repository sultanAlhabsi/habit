import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBackupPayload,
  validateBackupJson,
  mergeBackupData,
} from '../src/utils/backupUtils.ts';
import type { BackupPayload } from '../src/utils/backupUtils.ts';
import type { Habit, HabitCheckin } from '../src/types/habit.ts';


const mockHabit1: Habit = {
  id: 'h1',
  name: 'قراءة القرآن',
  icon: 'book-outline',
  color: '#2A4B3A',
  frequency: 'daily',
  frequencyDays: [0, 1, 2, 3, 4, 5, 6],
  targetCount: 1,
  unit: 'صفحة',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockHabit2: Habit = {
  id: 'h2',
  name: 'ممارسة الرياضة',
  icon: 'fitness-outline',
  color: '#C47B2B',
  frequency: 'daily',
  frequencyDays: [0, 1, 2, 3, 4, 5, 6],
  targetCount: 30,
  unit: 'دقيقة',
  isActive: true,
  createdAt: '2026-01-05T00:00:00.000Z',
};

const mockCheckin1: HabitCheckin = {
  id: 'c1',
  habitId: 'h1',
  date: '2026-09-01',
  count: 1,
  completed: true,
  updatedAt: '2026-09-01T10:00:00.000Z',
};

test('createBackupPayload: constructs standard schema envelope', () => {
  const payload = createBackupPayload(
    [mockHabit1],
    [mockCheckin1],
    { theme_mode: 'dark', haptics_enabled: 'true' }
  );

  assert.equal(payload.version, 1);
  assert.equal(payload.appName, 'enjaz-habits');
  assert.ok(payload.exportedAt);
  assert.equal(payload.habits.length, 1);
  assert.equal(payload.checkins.length, 1);
  assert.equal(payload.metadata?.theme_mode, 'dark');
});

test('validateBackupJson: validates well-formed JSON string', () => {
  const payload = createBackupPayload([mockHabit1], [mockCheckin1]);
  const jsonStr = JSON.stringify(payload);

  const result = validateBackupJson(jsonStr);
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.habits[0].name, 'قراءة القرآن');
    assert.equal(result.data.checkins[0].date, '2026-09-01');
  }
});

test('validateBackupJson: rejects malformed or invalid backups', () => {
  // Empty
  assert.equal(validateBackupJson('').valid, false);

  // Malformed JSON
  assert.equal(validateBackupJson('{ invalid json }').valid, false);

  // Not enjaz app
  assert.equal(
    validateBackupJson(JSON.stringify({ appName: 'other-app', habits: [], checkins: [] })).valid,
    false
  );

  // Missing habits array
  assert.equal(
    validateBackupJson(JSON.stringify({ appName: 'enjaz-habits', checkins: [] })).valid,
    false
  );

  // Corrupted habit item
  const badHabitsPayload = {
    appName: 'enjaz-habits',
    habits: [{ invalidField: 123 }],
    checkins: [],
  };
  assert.equal(validateBackupJson(JSON.stringify(badHabitsPayload)).valid, false);
});

test('mergeBackupData: deduplicates habits and preserves existing ones', () => {
  const existingHabits = [mockHabit1];
  const backupPayload: BackupPayload = {
    version: 1,
    appName: 'enjaz-habits',
    exportedAt: '2026-09-10T00:00:00.000Z',
    habits: [
      { ...mockHabit1, name: 'قراءة القرآن المعدلة' },
      mockHabit2,
    ],
    checkins: [],
  };

  const merged = mergeBackupData(existingHabits, [], backupPayload);
  assert.equal(merged.habits.length, 2);
  // Existing habit is preserved (not overwritten by backup with same id)
  const h1 = merged.habits.find((h) => h.id === 'h1');
  assert.equal(h1?.name, 'قراءة القرآن');
});

test('mergeBackupData: merges checkins updating to newer timestamps', () => {
  const existingCheckins = [mockCheckin1];
  const newerCheckin1: HabitCheckin = {
    ...mockCheckin1,
    count: 2,
    updatedAt: '2026-09-01T15:00:00.000Z', // newer
  };
  const newCheckin2: HabitCheckin = {
    id: 'c2',
    habitId: 'h2',
    date: '2026-09-02',
    count: 1,
    completed: true,
    updatedAt: '2026-09-02T10:00:00.000Z',
  };

  const backupPayload: BackupPayload = {
    version: 1,
    appName: 'enjaz-habits',
    exportedAt: '2026-09-10T00:00:00.000Z',
    habits: [],
    checkins: [newerCheckin1, newCheckin2],
  };

  const merged = mergeBackupData([], existingCheckins, backupPayload);
  assert.equal(merged.checkins.length, 2);

  const updatedC1 = merged.checkins.find((c) => c.habitId === 'h1' && c.date === '2026-09-01');
  assert.equal(updatedC1?.count, 2);
});

test('validateBackupJson: correctly validates and preserves checkin note field', () => {
  const checkinWithNote: HabitCheckin = {
    id: 'c_note_1',
    habitId: 'h1',
    date: '2026-09-05',
    count: 1,
    completed: true,
    updatedAt: '2026-09-05T08:00:00.000Z',
    note: 'شعور ممتاز بعد إتمام الورد اليومي',
  };

  const payload = createBackupPayload([mockHabit1], [checkinWithNote]);
  const validation = validateBackupJson(JSON.stringify(payload));
  assert.equal(validation.valid, true);
  if (validation.valid) {
    assert.equal(validation.data.checkins[0].note, 'شعور ممتاز بعد إتمام الورد اليومي');
  }

  // Reject corrupted checkin note (e.g. number instead of string)
  const badPayload = {
    appName: 'enjaz-habits',
    version: 1,
    habits: [mockHabit1],
    checkins: [
      {
        id: 'c_bad_note',
        habitId: 'h1',
        date: '2026-09-05',
        count: 1,
        completed: true,
        note: 12345, // invalid type
      },
    ],
  };
  const badValidation = validateBackupJson(JSON.stringify(badPayload));
  assert.equal(badValidation.valid, false);
});

test('validateBackupJson: correctly validates and preserves habit isPinned field', () => {
  const habitWithPin: Habit = {
    ...mockHabit1,
    id: 'h_pinned',
    isPinned: true,
  };

  const payload = createBackupPayload([habitWithPin], []);
  const validation = validateBackupJson(JSON.stringify(payload));
  assert.equal(validation.valid, true);
  if (validation.valid) {
    assert.equal(validation.data.habits[0].isPinned, true);
  }

  // Reject if isPinned is not a boolean
  const badPayload = {
    appName: 'enjaz-habits',
    version: 1,
    habits: [{ ...mockHabit1, isPinned: 'not_a_boolean' }],
    checkins: [],
  };
  assert.equal(validateBackupJson(JSON.stringify(badPayload)).valid, false);
});
