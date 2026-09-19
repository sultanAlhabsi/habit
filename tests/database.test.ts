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
  deleteImportedLoopHabitsRecord,
  batchSaveHabits,
  batchSaveCheckinRecords,
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

test('database: deleteImportedLoopHabitsRecord purges only loop habits and checkins', async () => {
  await resetDatabase();
  const normalHabit: Habit = {
    id: 'h_normal_1',
    name: 'عادة أصلية',
    icon: 'water-outline',
    color: '#0369A1',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  };
  const loopHabit: Habit = {
    id: 'loop_42_123456789',
    name: 'عادة مستوردة',
    icon: 'book-outline',
    color: '#E11D48',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  await saveHabitRecord(normalHabit);
  await saveHabitRecord(loopHabit);

  const normalCheckin: HabitCheckin = {
    id: 'c_norm',
    habitId: 'h_normal_1',
    date: '2026-09-18',
    count: 1,
    completed: true,
    updatedAt: '2026-09-18T10:00:00.000Z',
  };
  const loopCheckin: HabitCheckin = {
    id: 'c_loop',
    habitId: 'loop_42_123456789',
    date: '2026-09-18',
    count: 1,
    completed: true,
    updatedAt: '2026-09-18T10:00:00.000Z',
  };
  await saveCheckinRecord(normalCheckin);
  await saveCheckinRecord(loopCheckin);

  const res = await deleteImportedLoopHabitsRecord();
  assert.equal(res.deletedHabitsCount, 1);
  assert.equal(res.deletedCheckinsCount, 1);

  const remainingHabits = await fetchAllHabits();
  assert.equal(remainingHabits.length, 1);
  assert.equal(remainingHabits[0].id, 'h_normal_1');

  const remainingCheckins = await fetchAllCheckins();
  assert.equal(remainingCheckins.length, 1);
  assert.equal(remainingCheckins[0].id, 'c_norm');
});

test('database: batchSaveHabits creates multiple fresh habits without checkins', async () => {
  await resetDatabase();
  const h1: Habit = {
    id: 'h_fresh_1',
    name: 'أذكار الصباح ☀️',
    icon: 'sunny-outline',
    color: '#0E7490',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const h2: Habit = {
    id: 'h_fresh_2',
    name: 'صلاة الضحى 🌤',
    icon: 'sunny-outline',
    color: '#9A3412',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await batchSaveHabits([h1, h2]);

  const habits = await fetchAllHabits();
  assert.equal(habits.length, 2);
  assert.ok(habits.some((h) => h.id === 'h_fresh_1'));
  assert.ok(habits.some((h) => h.id === 'h_fresh_2'));

  const checkins = await fetchAllCheckins();
  assert.equal(checkins.length, 0, 'No checkins should be created');
});

test('database: batchSaveCheckinRecords saves and updates multiple checkin records atomically', async () => {
  await resetDatabase();

  // 1. Empty checkins array should complete safely without errors
  await batchSaveCheckinRecords([]);
  let checkins = await fetchAllCheckins();
  assert.equal(checkins.length, 0);

  // 2. Insert multiple checkin records
  const c1: HabitCheckin = {
    id: 'chk_b1',
    habitId: 'habit_1',
    date: '2026-09-18',
    count: 1,
    completed: true,
    updatedAt: '2026-09-18T10:00:00.000Z',
  };
  const c2: HabitCheckin = {
    id: 'chk_b2',
    habitId: 'habit_2',
    date: '2026-09-18',
    count: 3,
    completed: true,
    updatedAt: '2026-09-18T10:05:00.000Z',
    note: 'إنجاز ممتاز',
  };
  const c3: HabitCheckin = {
    id: 'chk_b3',
    habitId: 'habit_1',
    date: '2026-09-19',
    count: 2,
    completed: true,
    updatedAt: '2026-09-19T08:00:00.000Z',
  };

  await batchSaveCheckinRecords([c1, c2, c3]);

  checkins = await fetchAllCheckins();
  assert.equal(checkins.length, 3);
  assert.ok(checkins.some((c) => c.id === 'chk_b1' && c.completed));
  assert.ok(checkins.some((c) => c.id === 'chk_b2' && c.note === 'إنجاز ممتاز'));
  assert.ok(checkins.some((c) => c.id === 'chk_b3' && c.count === 2));

  // 3. Batch update existing records and insert a new one simultaneously
  const updatedC1: HabitCheckin = {
    ...c1,
    count: 5,
    note: 'تم التحديث الدفعي',
    updatedAt: '2026-09-18T11:00:00.000Z',
  };
  const c4: HabitCheckin = {
    id: 'chk_b4',
    habitId: 'habit_3',
    date: '2026-09-19',
    count: 1,
    completed: true,
    updatedAt: '2026-09-19T09:00:00.000Z',
  };

  await batchSaveCheckinRecords([updatedC1, c4]);

  checkins = await fetchAllCheckins();
  assert.equal(checkins.length, 4);
  const foundUpdatedC1 = checkins.find((c) => c.id === 'chk_b1');
  assert.equal(foundUpdatedC1?.count, 5);
  assert.equal(foundUpdatedC1?.note, 'تم التحديث الدفعي');
  assert.ok(checkins.some((c) => c.id === 'chk_b4'));
});

test('database: importDatabaseRecords atomic batch import with checkins', async () => {
  await resetDatabase();

  const habitAlpha: Habit = {
    id: 'h_alpha',
    name: 'القراءة اليومية',
    icon: 'book-outline',
    color: '#2A4B3A',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  const checkinAlpha: HabitCheckin = {
    id: 'c_alpha',
    habitId: 'h_alpha',
    date: '2026-09-01',
    count: 1,
    completed: true,
    updatedAt: '2026-09-01T08:00:00.000Z',
  };

  // 1. Initial save
  await saveHabitRecord(habitAlpha);
  await saveCheckinRecord(checkinAlpha);

  // 2. Replace with a batch containing habitBeta and 2 checkins
  const habitBeta: Habit = {
    id: 'h_beta',
    name: 'المشي الصباحي',
    icon: 'walk-outline',
    color: '#0E7490',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-10T00:00:00.000Z',
  };

  const checkinsBeta: HabitCheckin[] = [
    {
      id: 'c_beta_1',
      habitId: 'h_beta',
      date: '2026-09-10',
      count: 1,
      completed: true,
      updatedAt: '2026-09-10T07:00:00.000Z',
    },
    {
      id: 'c_beta_2',
      habitId: 'h_beta',
      date: '2026-09-11',
      count: 1,
      completed: true,
      updatedAt: '2026-09-11T07:00:00.000Z',
      note: 'مشي 5 كم',
    },
  ];

  await importDatabaseRecords([habitBeta], checkinsBeta, 'replace');

  const habitsAfterReplace = await fetchAllHabits();
  assert.equal(habitsAfterReplace.length, 1);
  assert.equal(habitsAfterReplace[0].id, 'h_beta');

  const checkinsAfterReplace = await fetchAllCheckins();
  assert.equal(checkinsAfterReplace.length, 2);
  assert.ok(checkinsAfterReplace.some((c) => c.id === 'c_beta_1'));
  assert.ok(checkinsAfterReplace.some((c) => c.id === 'c_beta_2' && c.note === 'مشي 5 كم'));

  // 3. Merge mode with another habit and checkin
  const habitGamma: Habit = {
    id: 'h_gamma',
    name: 'كتابة اليوميات',
    icon: 'create-outline',
    color: '#9A3412',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    createdAt: '2026-09-12T00:00:00.000Z',
  };
  const checkinGamma: HabitCheckin = {
    id: 'c_gamma_1',
    habitId: 'h_gamma',
    date: '2026-09-12',
    count: 1,
    completed: true,
    updatedAt: '2026-09-12T21:00:00.000Z',
  };

  await importDatabaseRecords([habitGamma], [checkinGamma], 'merge');

  const habitsAfterMerge = await fetchAllHabits();
  assert.equal(habitsAfterMerge.length, 2);

  const checkinsAfterMerge = await fetchAllCheckins();
  assert.equal(checkinsAfterMerge.length, 3);
  assert.ok(checkinsAfterMerge.some((c) => c.id === 'c_gamma_1'));
});



