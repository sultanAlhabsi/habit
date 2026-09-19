import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseReminderTime,
  isValidReminderTime,
  formatReminderTimeArabic,
  mapDayIndexToExpoWeekday,
  generateHabitReminderTriggers,
  generateEveningReviewTrigger,
  EVENING_REVIEW_REMINDER_ID,
} from '../src/utils/notificationUtils.ts';
import type { Habit } from '../src/types/habit.ts';

const createTestHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-test-notif',
  name: 'صلاة الفجر',
  icon: 'alarm-outline',
  color: '#4B6B94',
  frequency: 'daily',
  frequencyDays: [0, 1, 2, 3, 4, 5, 6],
  targetCount: 1,
  unit: 'مرة',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  reminderTime: '05:30',
  ...overrides,
});

test('isValidReminderTime: accurately validates 24-hour time format', () => {
  assert.equal(isValidReminderTime('05:30'), true);
  assert.equal(isValidReminderTime('00:00'), true);
  assert.equal(isValidReminderTime('23:59'), true);
  assert.equal(isValidReminderTime('8:15'), true);
  assert.equal(isValidReminderTime('12:00'), true);

  assert.equal(isValidReminderTime('24:00'), false);
  assert.equal(isValidReminderTime('12:60'), false);
  assert.equal(isValidReminderTime(''), false);
  assert.equal(isValidReminderTime(null), false);
  assert.equal(isValidReminderTime(undefined), false);
  assert.equal(isValidReminderTime('invalid'), false);
  assert.equal(isValidReminderTime('12:0'), false);
});

test('parseReminderTime: correctly extracts numeric hour and minute', () => {
  assert.deepEqual(parseReminderTime('08:45'), { hour: 8, minute: 45 });
  assert.deepEqual(parseReminderTime('00:00'), { hour: 0, minute: 0 });
  assert.deepEqual(parseReminderTime('23:59'), { hour: 23, minute: 59 });
  assert.equal(parseReminderTime('99:99'), null);
  assert.equal(parseReminderTime(''), null);
});

test('formatReminderTimeArabic: formats 12-hour AM/PM in Arabic', () => {
  assert.equal(formatReminderTimeArabic('08:00'), '٠٨:٠٠ ص');
  assert.equal(formatReminderTimeArabic('13:30'), '٠١:٣٠ م');
  assert.equal(formatReminderTimeArabic('00:00'), '١٢:٠٠ ص');
  assert.equal(formatReminderTimeArabic('12:15'), '١٢:١٥ م');
  assert.equal(formatReminderTimeArabic(null), '');
});

test('mapDayIndexToExpoWeekday: converts Sunday=0 to Expo Sunday=1', () => {
  assert.equal(mapDayIndexToExpoWeekday(0), 1); // Sunday
  assert.equal(mapDayIndexToExpoWeekday(1), 2); // Monday
  assert.equal(mapDayIndexToExpoWeekday(5), 6); // Friday
  assert.equal(mapDayIndexToExpoWeekday(6), 7); // Saturday
});

test('generateHabitReminderTriggers: returns daily trigger for daily habit', () => {
  const habit = createTestHabit({ frequency: 'daily', reminderTime: '07:00' });
  const triggers = generateHabitReminderTriggers(habit);

  assert.equal(triggers.length, 1);
  assert.equal(triggers[0].type, 'daily');
  assert.equal(triggers[0].hour, 7);
  assert.equal(triggers[0].minute, 0);
});


test('generateHabitReminderTriggers: returns weekly triggers for specific days', () => {
  const habit = createTestHabit({
    frequency: 'specific_days',
    frequencyDays: [1, 3, 5], // Mon, Wed, Fri -> Expo 2, 4, 6
    reminderTime: '17:45',
  });
  const triggers = generateHabitReminderTriggers(habit);

  assert.equal(triggers.length, 3);
  assert.equal(triggers[0].type, 'weekly');
  assert.equal(triggers[0].weekday, 2);
  assert.equal(triggers[1].weekday, 4);
  assert.equal(triggers[2].weekday, 6);
  assert.equal(triggers[0].hour, 17);
  assert.equal(triggers[0].minute, 45);
});

test('generateHabitReminderTriggers: returns empty array for paused or archived habits', () => {
  const pausedHabit = createTestHabit({ isActive: false });
  assert.deepEqual(generateHabitReminderTriggers(pausedHabit), []);

  const archivedHabit = createTestHabit({ archivedAt: '2026-03-01T00:00:00.000Z' });
  assert.deepEqual(generateHabitReminderTriggers(archivedHabit), []);

  const noReminderHabit = createTestHabit({ reminderTime: undefined });
  assert.deepEqual(generateHabitReminderTriggers(noReminderHabit), []);
});

test('parseReminderTime: supports Arabic-Indic and Persian numeral strings', () => {
  // Eastern Arabic numerals (٠-٩)
  assert.deepEqual(parseReminderTime('٠٨:٣٠'), { hour: 8, minute: 30 });
  assert.deepEqual(parseReminderTime('٢١:١٥'), { hour: 21, minute: 15 });

  // Persian numerals (۰-۹)
  assert.deepEqual(parseReminderTime('۰۵:۴۵'), { hour: 5, minute: 45 });
  assert.deepEqual(parseReminderTime('۱۴:۰۹'), { hour: 14, minute: 9 });
});

test('generateEveningReviewTrigger: generates daily trigger descriptor for evening reflection', () => {
  const trigger = generateEveningReviewTrigger('21:30');
  assert.notEqual(trigger, null);
  assert.equal(trigger?.identifier, EVENING_REVIEW_REMINDER_ID);
  assert.equal(trigger?.type, 'daily');
  assert.equal(trigger?.hour, 21);
  assert.equal(trigger?.minute, 30);

  // Supports Eastern Arabic numerals
  const arabicTrigger = generateEveningReviewTrigger('٢٠:١٥');
  assert.notEqual(arabicTrigger, null);
  assert.equal(arabicTrigger?.hour, 20);
  assert.equal(arabicTrigger?.minute, 15);

  // Returns null for invalid time format
  assert.equal(generateEveningReviewTrigger('invalid'), null);
  assert.equal(generateEveningReviewTrigger('25:00'), null);
});

test('generateHabitReminderTriggers: returns monthly trigger for monthly_day habit', () => {
  const habit = createTestHabit({
    frequency: 'monthly_day',
    monthlyDay: 15,
    reminderTime: '10:30',
  });
  const triggers = generateHabitReminderTriggers(habit);

  assert.equal(triggers.length, 1);
  assert.equal(triggers[0].type, 'monthly');
  assert.equal(triggers[0].day, 15);
  assert.equal(triggers[0].hour, 10);
  assert.equal(triggers[0].minute, 30);
  assert.equal(triggers[0].identifier, `habit_${habit.id}_monthly_15`);
});

test('generateHabitReminderTriggers: safely handles missing or invalid monthlyDay for monthly_day habit', () => {
  const habitMissingDay = createTestHabit({
    frequency: 'monthly_day',
    monthlyDay: undefined,
    reminderTime: '09:00',
  });
  const triggersMissing = generateHabitReminderTriggers(habitMissingDay);
  assert.equal(triggersMissing.length, 1);
  assert.equal(triggersMissing[0].type, 'monthly');
  assert.equal(triggersMissing[0].day, 1);

  const habitInvalidDay = createTestHabit({
    frequency: 'monthly_day',
    monthlyDay: 40,
    reminderTime: '09:00',
  });
  const triggersInvalid = generateHabitReminderTriggers(habitInvalidDay);
  assert.equal(triggersInvalid.length, 1);
  assert.equal(triggersInvalid[0].type, 'monthly');
  assert.equal(triggersInvalid[0].day, 1);
});


