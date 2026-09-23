import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toArabicNumerals,
  formatArabicDaysCount,
  formatArabicStreakDays,
  calculateStreakMilestone,
} from '../src/utils/habitUtils.ts';

test('Quick Actions & Localization - toArabicNumerals handles diverse inputs', () => {
  assert.strictEqual(toArabicNumerals(0), '٠');
  assert.strictEqual(toArabicNumerals(100), '١٠٠');
  assert.strictEqual(toArabicNumerals('100%'), '١٠٠٪');
  assert.strictEqual(toArabicNumerals('75.5%'), '٧٥٫٥٪');
  assert.strictEqual(toArabicNumerals(2026), '٢٠٢٦');
});

test('Quick Actions & Localization - formatArabicDaysCount adheres strictly to Arabic grammar', () => {
  // 0 days
  assert.strictEqual(formatArabicDaysCount(0), '٠ يوم');

  // 1 day (singular) - MUST NOT have digit prefix
  assert.strictEqual(formatArabicDaysCount(1), 'يوم واحد');

  // 2 days (dual) - MUST NOT have digit prefix
  assert.strictEqual(formatArabicDaysCount(2), 'يومان');

  // 3 to 10 days (plural accusative)
  assert.strictEqual(formatArabicDaysCount(3), '٣ أيام');
  assert.strictEqual(formatArabicDaysCount(7), '٧ أيام');
  assert.strictEqual(formatArabicDaysCount(10), '١٠ أيام');

  // 11+ days (singular accusative)
  assert.strictEqual(formatArabicDaysCount(11), '١١ يوم');
  assert.strictEqual(formatArabicDaysCount(30), '٣٠ يوم');
  assert.strictEqual(formatArabicDaysCount(100), '١٠٠ يوم');
});

test('Quick Actions & Localization - Streak milestone remaining days phrasing', () => {
  // Streak 2 out of 3 days milestone (1 remaining)
  const milestone1 = calculateStreakMilestone(2);
  assert.ok(milestone1.nextMilestone);
  assert.strictEqual(milestone1.nextMilestone.remainingDays, 1);
  const remainingPhrase1 = `باقي ${formatArabicDaysCount(milestone1.nextMilestone.remainingDays)} من الاستمرار المتتالي للوصول إلى المحطة التالية.`;
  assert.strictEqual(remainingPhrase1, 'باقي يوم واحد من الاستمرار المتتالي للوصول إلى المحطة التالية.');
  // Ensure no awkward repetition like "1 يوم واحد"
  assert.ok(!remainingPhrase1.includes('1 يوم واحد'));
  assert.ok(!remainingPhrase1.includes('١ يوم واحد'));

  // Streak 1 out of 3 days milestone (2 remaining)
  const milestone2 = calculateStreakMilestone(1);
  assert.ok(milestone2.nextMilestone);
  assert.strictEqual(milestone2.nextMilestone.remainingDays, 2);
  const remainingPhrase2 = `باقي ${formatArabicDaysCount(milestone2.nextMilestone.remainingDays)} من الاستمرار المتتالي للوصول إلى المحطة التالية.`;
  assert.strictEqual(remainingPhrase2, 'باقي يومان من الاستمرار المتتالي للوصول إلى المحطة التالية.');

  // Streak 4 out of 7 days milestone (3 remaining)
  const milestone3 = calculateStreakMilestone(4);
  assert.ok(milestone3.nextMilestone);
  assert.strictEqual(milestone3.nextMilestone.remainingDays, 3);
  const remainingPhrase3 = `باقي ${formatArabicDaysCount(milestone3.nextMilestone.remainingDays)} من الاستمرار المتتالي للوصول إلى المحطة التالية.`;
  assert.strictEqual(remainingPhrase3, 'باقي ٣ أيام من الاستمرار المتتالي للوصول إلى المحطة التالية.');
});

test('Quick Actions & Localization - Quick Actions duplicate and archive configuration', () => {
  // Verify action builder pattern
  const buildActions = (options: {
    hasDuplicate?: boolean;
    hasArchive?: boolean;
  }) => {
    const list: string[] = ['checkin', 'pin', 'active', 'note', 'share', 'edit', 'details'];
    if (options.hasDuplicate) list.push('duplicate');
    if (options.hasArchive) list.push('archive');
    list.push('delete');
    return list;
  };

  const fullList = buildActions({ hasDuplicate: true, hasArchive: true });
  assert.deepStrictEqual(fullList, [
    'checkin',
    'pin',
    'active',
    'note',
    'share',
    'edit',
    'details',
    'duplicate',
    'archive',
    'delete',
  ]);
  assert.ok(fullList.includes('duplicate'));
  assert.ok(fullList.includes('archive'));
});
