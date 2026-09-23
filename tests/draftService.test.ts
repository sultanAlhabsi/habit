import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNoteDraftKey,
  getNoteDraft,
  saveNoteDraft,
  deleteNoteDraft,
  hasNoteDraft,
} from '../src/services/draftService.ts';
import { initDatabase, deletePreference, getPreference, setPreference } from '../src/services/database.ts';

test('draftService: initializes and generates correct key format', async () => {
  await initDatabase();
  const key = getNoteDraftKey('habit_123', '2026-09-21');
  assert.equal(key, 'draft_note_habit_123_2026-09-21');
});

test('draftService: returns null when no draft exists', async () => {
  await initDatabase();
  const draft = await getNoteDraft('habit_non_existent', '2026-09-21');
  assert.equal(draft, null);

  const exists = await hasNoteDraft('habit_non_existent', '2026-09-21');
  assert.equal(exists, false);
});

test('draftService: saves and retrieves drafts accurately', async () => {
  await initDatabase();
  const habitId = 'habit_gym_01';
  const date = '2026-09-21';
  const text = 'شعرت بنشاط كبير بعد التمرين الصباحي اليوم';

  await saveNoteDraft(habitId, date, text);

  const saved = await getNoteDraft(habitId, date);
  assert.equal(saved, text);

  const exists = await hasNoteDraft(habitId, date);
  assert.equal(exists, true);
});

test('draftService: isolates drafts across different habits and dates', async () => {
  await initDatabase();
  const habitA = 'habit_reading';
  const habitB = 'habit_running';
  const date1 = '2026-09-20';
  const date2 = '2026-09-21';

  await saveNoteDraft(habitA, date1, 'قراءة الفصل الخامس');
  await saveNoteDraft(habitA, date2, 'قراءة الفصل السادس');
  await saveNoteDraft(habitB, date1, 'جري مسافة 5 كم');

  assert.equal(await getNoteDraft(habitA, date1), 'قراءة الفصل الخامس');
  assert.equal(await getNoteDraft(habitA, date2), 'قراءة الفصل السادس');
  assert.equal(await getNoteDraft(habitB, date1), 'جري مسافة 5 كم');
  assert.equal(await getNoteDraft(habitB, date2), null);
});

test('draftService: empty or whitespace draft is removed automatically', async () => {
  await initDatabase();
  const habitId = 'habit_water';
  const date = '2026-09-21';

  await saveNoteDraft(habitId, date, 'شربت لترين ماء');
  assert.equal(await hasNoteDraft(habitId, date), true);

  // Saving empty string clears it
  await saveNoteDraft(habitId, date, '');
  assert.equal(await getNoteDraft(habitId, date), null);
  assert.equal(await hasNoteDraft(habitId, date), false);

  // Saving whitespace only clears it
  await saveNoteDraft(habitId, date, 'خاطرة مؤقتة');
  assert.equal(await hasNoteDraft(habitId, date), true);
  await saveNoteDraft(habitId, date, '   \n   ');
  assert.equal(await getNoteDraft(habitId, date), null);
  assert.equal(await hasNoteDraft(habitId, date), false);
});

test('draftService: explicit deleteNoteDraft purges stored draft', async () => {
  await initDatabase();
  const habitId = 'habit_meditation';
  const date = '2026-09-21';

  await saveNoteDraft(habitId, date, 'جلسة تأمل لمدة 10 دقائق');
  assert.equal(await getNoteDraft(habitId, date), 'جلسة تأمل لمدة 10 دقائق');

  await deleteNoteDraft(habitId, date);
  assert.equal(await getNoteDraft(habitId, date), null);
  assert.equal(await hasNoteDraft(habitId, date), false);
});

test('database: deletePreference removes keys from meta table and memory', async () => {
  await setPreference('test_key_to_delete', 'temporary_value');
  assert.equal(await getPreference('test_key_to_delete'), 'temporary_value');

  await deletePreference('test_key_to_delete');
  assert.equal(await getPreference('test_key_to_delete', 'default'), 'default');
});
