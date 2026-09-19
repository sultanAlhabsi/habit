import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import {
  detectHabitIcon,
  mapLoopColor,
  convertLoopRawRecords,
} from '../src/services/loopImportService.ts';
import type {
  RawLoopHabit,
  RawLoopRepetition,
} from '../src/services/loopImportService.ts';

test('Loop Habits import - detectHabitIcon smart mapping', () => {
  assert.equal(detectHabitIcon('حذف الصور 📷'), 'images-outline');
  assert.equal(detectHabitIcon('تنظيف صور الاستوديو'), 'images-outline');
  assert.equal(detectHabitIcon('قص الاظافر 🤚'), 'cut-outline');
  assert.equal(detectHabitIcon('قص الأظافر'), 'cut-outline');
  assert.equal(detectHabitIcon('التقليل من الهاتف 📵'), 'phone-portrait-outline');
  assert.equal(detectHabitIcon('الأستغفار ☁️'), 'cloud-outline');
  assert.equal(detectHabitIcon('دورة OCI ☁️'), 'cloud-outline');
  assert.equal(detectHabitIcon('ألعاب الذكاء🧠'), 'game-controller-outline');
  assert.equal(detectHabitIcon('بلغوا عني 🔁'), 'repeat-outline');
  assert.equal(detectHabitIcon('السواك 🪥'), 'brush-outline');
  assert.equal(detectHabitIcon('حب للعصافير 🕊'), 'paw-outline');
  assert.equal(detectHabitIcon('شرب الماء 💧'), 'water-outline');
  assert.equal(detectHabitIcon('المشي 🚶‍♂️'), 'walk-outline');
  assert.equal(detectHabitIcon('القراءة 📚'), 'book-outline');
  assert.equal(detectHabitIcon('تمرين البلانك 💪'), 'fitness-outline');
  assert.equal(detectHabitIcon('دورة التداول 📊'), 'trending-up-outline');
  assert.equal(detectHabitIcon('سورة الكهف ✨️'), 'star-outline');
  assert.equal(detectHabitIcon('صيام ٣ أيام 🍱'), 'restaurant-outline');
});

test('Loop Habits import - mapLoopColor maps all indices to valid hex', () => {
  for (let i = 0; i < 20; i++) {
    const hex = mapLoopColor(i);
    assert.match(hex, /^#[0-9A-Fa-f]{6}$/, `Color for index ${i} should be a valid hex code`);
  }
});

test('Loop Habits import - Full end-to-end conversion on Loop Habits Backup file', () => {
  const dbPath = path.resolve(process.cwd(), 'Loop Habits Backup 2026-09-13 082711.db');
  assert.ok(fs.existsSync(dbPath), 'Database file must exist in project root');

  const db = new DatabaseSync(dbPath);
  const rawHabits = db.prepare('SELECT * FROM Habits ORDER BY position, id').all() as unknown as RawLoopHabit[];
  const rawReps = db.prepare('SELECT * FROM Repetitions ORDER BY timestamp ASC').all() as unknown as RawLoopRepetition[];

  assert.equal(rawHabits.length, 51, 'Should have 51 habits in the sample database');
  assert.equal(rawReps.length, 8591, 'Should have 8591 repetitions in the sample database');

  const result = convertLoopRawRecords(rawHabits, rawReps, 'Loop Habits Backup 2026-09-13 082711.db');

  // Verify habits count
  assert.equal(result.habits.length, 51);
  assert.equal(result.inspection.totalHabits, 51);
  assert.equal(result.inspection.activeHabitsCount, 24);
  assert.equal(result.inspection.archivedHabitsCount, 27);

  // Verify specific habits
  const photoHabit = result.habits.find((h) => h.name.includes('حذف الصور'));
  assert.ok(photoHabit, 'Should have "حذف الصور" habit');
  assert.equal(photoHabit.icon, 'images-outline');
  assert.equal(photoHabit.isActive, true);

  const nailsHabit = result.habits.find((h) => h.name.includes('قص الاظافر'));
  assert.ok(nailsHabit, 'Should have "قص الاظافر" habit');
  assert.equal(nailsHabit.icon, 'cut-outline');

  const walkingHabit = result.habits.find((h) => h.name.includes('المشي'));
  assert.ok(walkingHabit, 'Should have "المشي" habit');
  assert.equal(walkingHabit.targetCount, 7000);
  assert.equal(walkingHabit.unit, 'خطوة');
  assert.equal(walkingHabit.isActive, false); // In backup it is archived (archived = 1)
  assert.ok(walkingHabit.archivedAt);

  const waterHabit = result.habits.find((h) => h.name.includes('شرب الماء'));
  assert.ok(waterHabit, 'Should have "شرب الماء" habit');
  assert.equal(waterHabit.targetCount, 1500);
  assert.equal(waterHabit.unit, 'مل');

  // Verify checkins
  assert.ok(result.checkins.length > 5000, `Should have converted checkins (got ${result.checkins.length})`);
  assert.equal(result.inspection.notesCount, 58, 'Should preserve all 58 user reflection notes');

  // Verify notes are indeed present in checkins
  const checkinsWithNotes = result.checkins.filter((c) => Boolean(c.note && c.note.trim()));
  assert.equal(checkinsWithNotes.length, 58);

  const toothNote = checkinsWithNotes.find((c) => c.note?.includes('تسوكت الصباح'));
  assert.ok(toothNote, 'Should preserve the note "تسوكت الصباح"');

  const rainNote = checkinsWithNotes.find((c) => c.note?.includes('أمطار'));
  assert.ok(rainNote, 'Should preserve rain note for birds');

  // Verify all checkin dates match YYYY-MM-DD
  for (const checkin of result.checkins) {
    assert.match(checkin.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(checkin.count >= 0);
  }
});
