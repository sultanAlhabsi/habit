import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isHabitDueOnDate,
  isPeriodicFlexibleHabit,
  getWeeklyTargetProgress,
  getMonthlyTargetProgress,
  calculateWeeklyStreak,
  calculateMonthlyStreak,
  calculateHabitStats,
  formatHabitStreakArabic,
  formatHabitFrequencyLabel,
  formatHabitStatsForShare,
  calculateStreakMilestone,
} from '../src/utils/habitUtils.ts';
import type { Habit, HabitCheckin } from '../src/types/habit.ts';

const createMockHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'mock-freq-habit',
  name: 'قراءة دورية',
  icon: 'book-outline',
  color: '#2A4B3A',
  frequency: 'daily',
  frequencyDays: [0, 1, 2, 3, 4, 5, 6],
  targetCount: 1,
  unit: 'مرة',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

test('isHabitDueOnDate: monthly_day habit is due on designated day of month', () => {
  const habit = createMockHabit({
    frequency: 'monthly_day',
    monthlyDay: 15,
  });

  assert.equal(isHabitDueOnDate(habit, '2026-06-15'), true);
  assert.equal(isHabitDueOnDate(habit, '2026-06-14'), false);
  assert.equal(isHabitDueOnDate(habit, '2026-06-16'), false);
  assert.equal(isHabitDueOnDate(habit, '2026-07-15'), true);

  // Before creation date
  assert.equal(isHabitDueOnDate(habit, '2025-12-15'), false);
});

test('isHabitDueOnDate: monthly_day handles short months clamped to last day', () => {
  const habit = createMockHabit({
    frequency: 'monthly_day',
    monthlyDay: 31,
  });

  // February 2026 has 28 days -> clamped to 28th
  assert.equal(isHabitDueOnDate(habit, '2026-02-28'), true);
  assert.equal(isHabitDueOnDate(habit, '2026-02-27'), false);

  // April 2026 has 30 days -> clamped to 30th
  assert.equal(isHabitDueOnDate(habit, '2026-04-30'), true);
  assert.equal(isHabitDueOnDate(habit, '2026-04-29'), false);

  // May 2026 has 31 days
  assert.equal(isHabitDueOnDate(habit, '2026-05-31'), true);
  assert.equal(isHabitDueOnDate(habit, '2026-05-30'), false);
});

test('isPeriodicFlexibleHabit: identifies weekly_target and monthly_target', () => {
  assert.equal(isPeriodicFlexibleHabit('weekly_target'), true);
  assert.equal(isPeriodicFlexibleHabit('monthly_target'), true);
  assert.equal(isPeriodicFlexibleHabit('daily'), false);
  assert.equal(isPeriodicFlexibleHabit('specific_days'), false);
  assert.equal(isPeriodicFlexibleHabit('monthly_day'), false);
});

test('getWeeklyTargetProgress: counts completed checkins within the same calendar week', () => {
  const habit = createMockHabit({
    frequency: 'weekly_target',
    weeklyTargetCount: 3,
  });

  // Week of Sunday 2026-06-14 to Saturday 2026-06-20
  const completedDates = new Set(['2026-06-14', '2026-06-16', '2026-06-21']); // 21st is next week Sunday

  const progress = getWeeklyTargetProgress(habit, completedDates, '2026-06-17');
  assert.equal(progress.targetCount, 3);
  assert.equal(progress.completedCount, 2);
  assert.equal(progress.isCompleted, false);

  // Add third completion in the same week
  completedDates.add('2026-06-18');
  const progressMet = getWeeklyTargetProgress(habit, completedDates, '2026-06-18');
  assert.equal(progressMet.completedCount, 3);
  assert.equal(progressMet.isCompleted, true);
});

test('getMonthlyTargetProgress: counts completed checkins within the same month', () => {
  const habit = createMockHabit({
    frequency: 'monthly_target',
    monthlyTargetCount: 2,
  });

  const completedDates = new Set(['2026-06-05', '2026-06-20', '2026-07-01']);
  const progressJune = getMonthlyTargetProgress(habit, completedDates, '2026-06-22');
  assert.equal(progressJune.targetCount, 2);
  assert.equal(progressJune.completedCount, 2);
  assert.equal(progressJune.isCompleted, true);

  const progressJuly = getMonthlyTargetProgress(habit, completedDates, '2026-07-02');
  assert.equal(progressJuly.completedCount, 1);
  assert.equal(progressJuly.isCompleted, false);
});

test('calculateWeeklyStreak: accurately calculates consecutive weeks achieving weekly target', () => {
  const habit = createMockHabit({
    frequency: 'weekly_target',
    weeklyTargetCount: 2,
  });

  // Reference week: 2026-06-21 (Sunday)
  // Previous week 1: 2026-06-14 to 2026-06-20 (2 completions: met)
  // Previous week 2: 2026-06-07 to 2026-06-13 (2 completions: met)
  // Previous week 3: 2026-05-31 to 2026-06-06 (1 completion: not met)
  const completedDates = new Set([
    '2026-06-08', '2026-06-10', // week 2: 2
    '2026-06-15', '2026-06-17', // week 1: 2
    '2026-06-21',               // current week: 1 (not met yet, but week is in progress)
  ]);

  const streak = calculateWeeklyStreak(habit, completedDates, '2026-06-22');
  // Current week not completed yet, but past 2 consecutive weeks are completed -> streak is 2
  assert.equal(streak, 2);

  // If current week also met the target
  completedDates.add('2026-06-23');
  const streakWithCurrent = calculateWeeklyStreak(habit, completedDates, '2026-06-24');
  assert.equal(streakWithCurrent, 3);
});

test('calculateMonthlyStreak: accurately calculates consecutive months achieving monthly target', () => {
  const habit = createMockHabit({
    frequency: 'monthly_target',
    monthlyTargetCount: 2,
  });

  // Month 1 (April 2026): 2 completions
  // Month 2 (May 2026): 2 completions
  // Month 3 (June 2026): 2 completions
  const completedDates = new Set([
    '2026-04-05', '2026-04-12',
    '2026-05-10', '2026-05-20',
    '2026-06-02', '2026-06-15',
  ]);

  const streak = calculateMonthlyStreak(habit, completedDates, '2026-06-20');
  assert.equal(streak, 3);
});

test('calculateHabitStats: integrates weekly and monthly streaks into habit stats', () => {
  const habit = createMockHabit({
    id: 'weekly-stats-habit',
    frequency: 'weekly_target',
    weeklyTargetCount: 2,
  });

  const checkins: HabitCheckin[] = [
    { id: '1', habitId: habit.id, date: '2026-06-08', count: 1, completed: true },
    { id: '2', habitId: habit.id, date: '2026-06-10', count: 1, completed: true },
    { id: '3', habitId: habit.id, date: '2026-06-15', count: 1, completed: true },
    { id: '4', habitId: habit.id, date: '2026-06-17', count: 1, completed: true },
  ];

  const stats = calculateHabitStats(habit, checkins, '2026-06-18');
  assert.equal(stats.totalCompletions, 4);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.bestStreak, 2);
});

test('formatHabitStreakArabic: formats days, weeks, and months according to Arabic grammar', () => {
  // Daily / specific_days / monthly_day (days)
  assert.equal(formatHabitStreakArabic(0, 'daily'), '٠ يوم');
  assert.equal(formatHabitStreakArabic(1, 'daily'), 'يوم واحد');
  assert.equal(formatHabitStreakArabic(2, 'daily'), 'يومان متتاليان');
  assert.equal(formatHabitStreakArabic(5, 'daily'), '٥ أيام متتالية');
  assert.equal(formatHabitStreakArabic(15, 'daily'), '١٥ يوم متتالية');

  // Weekly target (weeks)
  assert.equal(formatHabitStreakArabic(0, 'weekly_target'), '٠ أسبوع');
  assert.equal(formatHabitStreakArabic(1, 'weekly_target'), 'أسبوع واحد');
  assert.equal(formatHabitStreakArabic(2, 'weekly_target'), 'أسبوعان متتاليان');
  assert.equal(formatHabitStreakArabic(4, 'weekly_target'), '٤ أسابيع متتالية');
  assert.equal(formatHabitStreakArabic(12, 'weekly_target'), '١٢ أسبوعاً متتالياً');

  // Monthly target (months)
  assert.equal(formatHabitStreakArabic(0, 'monthly_target'), '٠ شهر');
  assert.equal(formatHabitStreakArabic(1, 'monthly_target'), 'شهر واحد');
  assert.equal(formatHabitStreakArabic(2, 'monthly_target'), 'شهران متتاليان');
  assert.equal(formatHabitStreakArabic(6, 'monthly_target'), '٦ أشهر متتالية');
  assert.equal(formatHabitStreakArabic(20, 'monthly_target'), '٢٠ شهراً متتالياً');
});

test('formatHabitFrequencyLabel: formats schedule descriptions with authentic Arabic grammar', () => {
  // Daily
  assert.equal(formatHabitFrequencyLabel(createMockHabit({ frequency: 'daily' })), 'يوميًا');

  // Specific days
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'specific_days', frequencyDays: [5] })),
    'يوم واحد أسبوعيًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'specific_days', frequencyDays: [1, 4] })),
    'يومان أسبوعيًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'specific_days', frequencyDays: [0, 2, 4] })),
    '٣ أيام أسبوعيًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'specific_days', frequencyDays: [0, 1, 2, 3, 4, 5, 6] })),
    'يوميًا'
  );

  // Weekly target
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'weekly_target', weeklyTargetCount: 1 })),
    'مرة واحدة أسبوعيًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'weekly_target', weeklyTargetCount: 2 })),
    'مرتان أسبوعيًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'weekly_target', weeklyTargetCount: 3 })),
    '٣ مرات أسبوعيًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'weekly_target', weeklyTargetCount: 5 })),
    '٥ مرات أسبوعيًا'
  );

  // Monthly day
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'monthly_day', monthlyDay: 15 })),
    'يوم ١٥ من كل شهر'
  );

  // Monthly target
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'monthly_target', monthlyTargetCount: 1 })),
    'مرة واحدة شهريًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'monthly_target', monthlyTargetCount: 2 })),
    'مرتان شهريًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'monthly_target', monthlyTargetCount: 4 })),
    '٤ مرات شهريًا'
  );
  assert.equal(
    formatHabitFrequencyLabel(createMockHabit({ frequency: 'monthly_target', monthlyTargetCount: 12 })),
    '١٢ مرة شهريًا'
  );
});

test('formatHabitStatsForShare: correctly outputs weeks and months for periodic habits', () => {
  const weeklyHabit = createMockHabit({
    name: 'حفظ القرآن',
    frequency: 'weekly_target',
    weeklyTargetCount: 3,
  });
  const weeklyStats = {
    currentStreak: 4,
    bestStreak: 6,
    totalCompletions: 20,
    completionRate: 90,
    totalDueDays: 22,
  };
  const milestone = calculateStreakMilestone(4);
  const weeklyShareText = formatHabitStatsForShare(weeklyHabit, weeklyStats, milestone);
  assert.ok(weeklyShareText.includes('السلسلة الحالية: ٤ أسابيع متتالية'));
  assert.ok(weeklyShareText.includes('أطول سلسلة: ٦ أسابيع متتالية'));

  const monthlyHabit = createMockHabit({
    name: 'صيام التطوع',
    frequency: 'monthly_target',
    monthlyTargetCount: 3,
  });
  const monthlyStats = {
    currentStreak: 2,
    bestStreak: 3,
    totalCompletions: 9,
    completionRate: 100,
    totalDueDays: 9,
  };
  const monthlyShareText = formatHabitStatsForShare(monthlyHabit, monthlyStats, milestone);
  assert.ok(monthlyShareText.includes('السلسلة الحالية: شهران متتاليان'));
  assert.ok(monthlyShareText.includes('أطول سلسلة: ٣ أشهر متتالية'));
});
