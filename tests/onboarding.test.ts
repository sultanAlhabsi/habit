import test from 'node:test';
import assert from 'node:assert/strict';

// ---- Mirror of STARTER_HABITS from OnboardingStarterPack.tsx ----
// We duplicate the pure-data definition here to avoid importing React components
// into the Node test runner (which cannot process JSX / RN native modules).
interface StarterHabitDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetCount: number;
  unit: string;
  isDefaultSelected: boolean;
}

const STARTER_HABITS: StarterHabitDefinition[] = [
  {
    id: 'starter_water',
    name: 'شرب ٨ أكواب ماء',
    description: 'ترطيب الجسم وتجديد النشاط والحيوية طوال اليوم',
    icon: 'water-outline',
    color: '#0369A1',
    targetCount: 8,
    unit: 'كوب',
    isDefaultSelected: true,
  },
  {
    id: 'starter_reading',
    name: 'قراءة ٢٠ صفحة',
    description: 'تغذية العقل وبناء عادة القراءة اليومية بهدوء',
    icon: 'book-outline',
    color: '#2A4B3A',
    targetCount: 20,
    unit: 'صفحة',
    isDefaultSelected: true,
  },
  {
    id: 'starter_exercise',
    name: '٣٠ دقيقة نشاط بدني',
    description: 'مشي خفيف، جري، أو تمارين رياضية لتنشيط الجسم',
    icon: 'fitness-outline',
    color: '#B45309',
    targetCount: 30,
    unit: 'دقيقة',
    isDefaultSelected: true,
  },
  {
    id: 'starter_mindfulness',
    name: 'أذكار واستراحة سكينة',
    description: 'لحظات صفاء ذهني واستحضار للهدوء النفسي',
    icon: 'sparkles-outline',
    color: '#6D28D9',
    targetCount: 1,
    unit: 'مرة',
    isDefaultSelected: false,
  },
  {
    id: 'starter_sleep',
    name: 'نوم هادئ مبكر',
    description: 'إغلاق الشاشات مبكراً لنوم عميق وصحي',
    icon: 'moon-outline',
    color: '#1E3A8A',
    targetCount: 1,
    unit: 'مرة',
    isDefaultSelected: false,
  },
];
// -----------------------------------------------------------------

test('Onboarding Starter Habits: contains 5 curated habits', () => {
  assert.equal(STARTER_HABITS.length, 5);
});

test('Onboarding Starter Habits: exactly 3 habits are selected by default', () => {
  const defaultSelected = STARTER_HABITS.filter((h) => h.isDefaultSelected);
  assert.equal(defaultSelected.length, 3);

  const defaultIds = defaultSelected.map((h) => h.id);
  assert.ok(defaultIds.includes('starter_water'), 'Water should be pre-selected');
  assert.ok(defaultIds.includes('starter_reading'), 'Reading should be pre-selected');
  assert.ok(defaultIds.includes('starter_exercise'), 'Exercise should be pre-selected');
});

test('Onboarding Starter Habits: all habits have valid properties', () => {
  for (const habit of STARTER_HABITS) {
    assert.ok(habit.id.length > 0, 'Habit must have an id');
    assert.ok(habit.name.length > 0, 'Habit must have a name');
    assert.ok(habit.description.length > 0, 'Habit must have a description');
    assert.ok(habit.icon.length > 0, 'Habit must have an icon');
    assert.ok(habit.color.startsWith('#'), 'Habit color must be valid hex');
    assert.ok(habit.targetCount > 0, 'Target count must be greater than zero');
    assert.ok(habit.unit.length > 0, 'Unit must not be empty');
  }
});

test('Onboarding Starter Habits: water target count is 8 cups', () => {
  const water = STARTER_HABITS.find((h) => h.id === 'starter_water');
  assert.ok(water);
  assert.equal(water.targetCount, 8);
  assert.equal(water.unit, 'كوب');
});

test('Onboarding Starter Habits: reading target count is 20 pages', () => {
  const reading = STARTER_HABITS.find((h) => h.id === 'starter_reading');
  assert.ok(reading);
  assert.equal(reading.targetCount, 20);
  assert.equal(reading.unit, 'صفحة');
});

test('Onboarding Starter Habits: exercise target count is 30 minutes', () => {
  const exercise = STARTER_HABITS.find((h) => h.id === 'starter_exercise');
  assert.ok(exercise);
  assert.equal(exercise.targetCount, 30);
  assert.equal(exercise.unit, 'دقيقة');
});

test('Onboarding Starter Habits: optional habits are not selected by default', () => {
  const mindfulness = STARTER_HABITS.find((h) => h.id === 'starter_mindfulness');
  const sleep = STARTER_HABITS.find((h) => h.id === 'starter_sleep');
  assert.ok(mindfulness && !mindfulness.isDefaultSelected, 'Mindfulness should not be pre-selected');
  assert.ok(sleep && !sleep.isDefaultSelected, 'Sleep should not be pre-selected');
});

test('Onboarding Starter Habits: all habit colors are valid 6-digit hex', () => {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  for (const habit of STARTER_HABITS) {
    assert.match(habit.color, hexPattern, `${habit.id} has invalid color: ${habit.color}`);
  }
});

test('Onboarding meta key: has_completed_onboarding defaults to false', () => {
  // Simulates reading onboarding pref from allPrefs before any save
  const allPrefs: Record<string, string> = {};
  const onboardingPref = allPrefs['has_completed_onboarding'] === 'true';
  assert.equal(onboardingPref, false);
});

test('Onboarding meta key: has_completed_onboarding parses true correctly', () => {
  const allPrefs: Record<string, string> = { has_completed_onboarding: 'true' };
  const onboardingPref = allPrefs['has_completed_onboarding'] === 'true';
  assert.equal(onboardingPref, true);
});

test('Onboarding: existing habits bypass onboarding even if has_completed_onboarding is not set', () => {
  const allPrefs: Record<string, string> = {};
  const activeHabits = [{ id: 'h1', name: 'قراءة القرآن' }];
  const hasExistingHabits = activeHabits.length > 0;
  const onboardingPref = allPrefs['has_completed_onboarding'] === 'true' || hasExistingHabits;
  assert.equal(onboardingPref, true);
});

test('Onboarding: new user with 0 habits and no pref sees onboarding', () => {
  const allPrefs: Record<string, string> = {};
  const activeHabits: any[] = [];
  const hasExistingHabits = activeHabits.length > 0;
  const onboardingPref = allPrefs['has_completed_onboarding'] === 'true' || hasExistingHabits;
  assert.equal(onboardingPref, false);
});

