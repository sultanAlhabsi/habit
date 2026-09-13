import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initDatabase,
  fetchAllHabits,
  saveHabitRecord,
  deleteHabitRecord,
  archiveHabitRecord,
  fetchAllCheckins,
  saveCheckinRecord,
  removeCheckinRecord,
  getPreference,
  setPreference,
  getAllPreferences,
  importDatabaseRecords,
  resetDatabase,
  seedDatabase,
  compactDatabase,
  cleanEmptyCheckins,
  fetchStorageMetrics,
} from '../src/services/database.ts';
import type { Habit, HabitCheckin } from '../src/types/habit.ts';

test('database: initialization is idempotent and succeeds without native SQLite', async () => {
  await initDatabase();
  await initDatabase();
  assert.ok(true);
});

test('database: habits CRUD and archiving', async () => {
  await resetDatabase();
  const emptyHabits = await fetchAllHabits();
  assert.equal(emptyHabits.length, 0);

  const testHabit: Habit = {
    id: 'habit_test_1',
    name: 'شرب الماء',
    icon: 'water-outline',
    color: '#0369A1',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 8,
    unit: 'كوب',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  // Save new
  await saveHabitRecord(testHabit);
  let habits = await fetchAllHabits();
  assert.equal(habits.length, 1);
  assert.equal(habits[0].id, 'habit_test_1');
  assert.equal(habits[0].targetCount, 8);

  // Update existing
  const updatedHabit = { ...testHabit, targetCount: 10, name: 'شرب الماء بوفرة' };
  await saveHabitRecord(updatedHabit);
  habits = await fetchAllHabits();
  assert.equal(habits.length, 1);
  assert.equal(habits[0].targetCount, 10);
  assert.equal(habits[0].name, 'شرب الماء بوفرة');

  // Archive
  await archiveHabitRecord('habit_test_1', true);
  habits = await fetchAllHabits();
  assert.equal(habits[0].isActive, false);
  assert.ok(habits[0].archivedAt);

  // Unarchive
  await archiveHabitRecord('habit_test_1', false);
  habits = await fetchAllHabits();
  assert.equal(habits[0].isActive, true);
  assert.equal(habits[0].archivedAt, null);

  // Delete
  await deleteHabitRecord('habit_test_1');
  habits = await fetchAllHabits();
  assert.equal(habits.length, 0);
});

test('database: checkins CRUD operations', async () => {
  await resetDatabase();

  const checkin1: HabitCheckin = {
    id: 'chk_1',
    habitId: 'habit_100',
    date: '2026-09-12',
    count: 1,
    completed: true,
    updatedAt: '2026-09-12T10:00:00.000Z',
    note: 'إنجاز رائع في الصباح',
  };

  await saveCheckinRecord(checkin1);
  let checkins = await fetchAllCheckins();
  assert.equal(checkins.length, 1);
  assert.equal(checkins[0].habitId, 'habit_100');
  assert.equal(checkins[0].note, 'إنجاز رائع في الصباح');

  // Update checkin
  const updatedCheckin = { ...checkin1, count: 3, note: 'ملاحظة محدثة' };
  await saveCheckinRecord(updatedCheckin);
  checkins = await fetchAllCheckins();
  assert.equal(checkins.length, 1);
  assert.equal(checkins[0].count, 3);
  assert.equal(checkins[0].note, 'ملاحظة محدثة');

  // Remove checkin
  await removeCheckinRecord('habit_100', '2026-09-12');
  checkins = await fetchAllCheckins();
  assert.equal(checkins.length, 0);
});

test('database: preferences handling', async () => {
  const defaultVal = await getPreference('non_existent_key', 'fallback');
  assert.equal(defaultVal, 'fallback');

  await setPreference('theme_mode', 'dark');
  const theme = await getPreference('theme_mode');
  assert.equal(theme, 'dark');

  const allPrefs = await getAllPreferences();
  assert.equal(allPrefs.theme_mode, 'dark');
});

test('database: import in replace and merge mode', async () => {
  await resetDatabase();

  const initialHabit: Habit = {
    id: 'h_seed',
    name: 'عادة أولى',
    icon: 'book-outline',
    color: '#2A4B3A',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  const initialCheckin: HabitCheckin = {
    id: 'c_seed',
    habitId: 'h_seed',
    date: '2026-09-01',
    count: 1,
    completed: true,
    updatedAt: '2026-09-01T08:00:00.000Z',
  };

  await saveHabitRecord(initialHabit);
  await saveCheckinRecord(initialCheckin);

  // Merge mode
  const newHabit: Habit = {
    id: 'h_new',
    name: 'عادة مدمجة',
    icon: 'fitness-outline',
    color: '#0E7490',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-02T00:00:00.000Z',
  };

  await importDatabaseRecords([newHabit], [], 'merge');
  let habits = await fetchAllHabits();
  assert.equal(habits.length, 2);

  // Replace mode
  await importDatabaseRecords([newHabit], [], 'replace');
  habits = await fetchAllHabits();
  assert.equal(habits.length, 1);
  assert.equal(habits[0].id, 'h_new');
});

test('database: seedDatabase restores demo data', async () => {
  await resetDatabase();
  let habits = await fetchAllHabits();
  assert.equal(habits.length, 0);

  await seedDatabase();
  habits = await fetchAllHabits();
  const checkins = await fetchAllCheckins();
  assert.ok(habits.length > 0);
  assert.ok(checkins.length > 0);
});

test('database: fetchStorageMetrics computes accurate metrics', async () => {
  await resetDatabase();
  const h1: Habit = {
    id: 'h_metric_1',
    name: 'قراءة',
    icon: 'book-outline',
    color: '#0D9488',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'صفحة',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  };
  const h2: Habit = {
    id: 'h_metric_2',
    name: 'رياضة قديمة',
    icon: 'barbell-outline',
    color: '#E11D48',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 30,
    unit: 'دقيقة',
    isActive: false,
    archivedAt: '2026-09-05T00:00:00.000Z',
    createdAt: '2026-08-20T00:00:00.000Z',
  };

  await saveHabitRecord(h1);
  await saveHabitRecord(h2);

  const c1: HabitCheckin = {
    id: 'c_m1',
    habitId: 'h_metric_1',
    date: '2026-09-02',
    count: 1,
    completed: true,
    note: 'أنهيت الفصل الأول بنجاح',
    updatedAt: '2026-09-02T08:00:00.000Z',
  };
  const c2: HabitCheckin = {
    id: 'c_m2',
    habitId: 'h_metric_1',
    date: '2026-09-03',
    count: 0,
    completed: false,
    updatedAt: '2026-09-03T08:00:00.000Z',
  };

  await saveCheckinRecord(c1);
  await saveCheckinRecord(c2);

  const metrics = await fetchStorageMetrics();
  assert.equal(metrics.totalHabits, 2);
  assert.equal(metrics.activeHabits, 1);
  assert.equal(metrics.archivedHabits, 1);
  assert.equal(metrics.totalCheckins, 2);
  assert.equal(metrics.completedCheckins, 1);
  assert.equal(metrics.reflectionNotesCount, 1);
  assert.equal(metrics.oldestRecordDate, '2026-09-02');
  assert.equal(metrics.newestRecordDate, '2026-09-03');
});

test('database: cleanEmptyCheckins cleans only orphan/empty checkins and preserves notes', async () => {
  await resetDatabase();
  const cEmpty: HabitCheckin = {
    id: 'c_empty',
    habitId: 'h_clean',
    date: '2026-09-01',
    count: 0,
    completed: false,
    note: '',
    updatedAt: '2026-09-01T08:00:00.000Z',
  };
  const cWithNote: HabitCheckin = {
    id: 'c_note',
    habitId: 'h_clean',
    date: '2026-09-02',
    count: 0,
    completed: false,
    note: 'لم أنجز ولكن دونت خاطرة مهمة',
    updatedAt: '2026-09-02T08:00:00.000Z',
  };
  const cDone: HabitCheckin = {
    id: 'c_done',
    habitId: 'h_clean',
    date: '2026-09-03',
    count: 1,
    completed: true,
    updatedAt: '2026-09-03T08:00:00.000Z',
  };

  await saveCheckinRecord(cEmpty);
  await saveCheckinRecord(cWithNote);
  await saveCheckinRecord(cDone);

  let all = await fetchAllCheckins();
  assert.equal(all.length, 3);

  const cleaned = await cleanEmptyCheckins();
  assert.equal(cleaned, 1);

  all = await fetchAllCheckins();
  assert.equal(all.length, 2);
  assert.ok(all.some((c) => c.id === 'c_note'));
  assert.ok(all.some((c) => c.id === 'c_done'));
  assert.ok(!all.some((c) => c.id === 'c_empty'));
});

test('database: compactDatabase executes successfully', async () => {
  const result = await compactDatabase();
  assert.equal(result.success, true);
});

test('database: seedDatabase seeds default habits, demo checkins, and default preferences', async () => {
  await seedDatabase();
  const habits = await fetchAllHabits();
  assert.ok(habits.length > 0);

  const checkins = await fetchAllCheckins();
  assert.ok(checkins.length > 0);

  const themeMode = await getPreference('theme_mode');
  assert.equal(themeMode, 'system');

  const haptics = await getPreference('haptics_enabled');
  assert.equal(haptics, 'true');

  const notifs = await getPreference('notifications_enabled');
  assert.equal(notifs, 'true');

  const sortPref = await getPreference('habit_sort_preference');
  assert.equal(sortPref, 'default');
});


