import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HABIT_TEMPLATES,
  HABIT_TEMPLATE_CATEGORIES,
  getHabitTemplates,
  getHabitTemplateById,
  searchHabitTemplates,
} from '../src/utils/habitTemplates.ts';
import { AVAILABLE_ICONS, HABIT_CATEGORIES } from '../src/types/habit.ts';
import { HABIT_PALETTES } from '../src/theme/colors.ts';
import { isValidReminderTime } from '../src/utils/notificationUtils.ts';

test('habitTemplates: HABIT_TEMPLATES collection integrity and data validity', () => {
  assert.ok(HABIT_TEMPLATES.length >= 20, 'Should have at least 20 curated templates');

  const validIconNames = new Set(AVAILABLE_ICONS.map((i) => i.name));
  const validPaletteHexes = new Set(HABIT_PALETTES.map((p) => p.hex.toLowerCase()));
  const validCategories = new Set(HABIT_CATEGORIES.filter((c) => c !== 'الكل'));
  const templateIds = new Set<string>();

  for (const t of HABIT_TEMPLATES) {
    // Unique ID
    assert.ok(t.id && t.id.startsWith('template_'), `Template id must start with template_: ${t.id}`);
    assert.equal(templateIds.has(t.id), false, `Template id must be unique: ${t.id}`);
    templateIds.add(t.id);

    // Name & description
    assert.ok(t.name && t.name.trim().length > 0, `Template name required: ${t.id}`);
    assert.ok(t.description && t.description.trim().length > 0, `Template description required: ${t.id}`);

    // Category
    assert.ok(validCategories.has(t.category), `Template category must be valid: ${t.category} in ${t.id}`);

    // Icon
    assert.ok(validIconNames.has(t.icon), `Template icon must exist in AVAILABLE_ICONS: ${t.icon} in ${t.id}`);

    // Color
    assert.ok(
      validPaletteHexes.has(t.color.toLowerCase()),
      `Template color must exist in HABIT_PALETTES: ${t.color} in ${t.id}`
    );

    // Target count and unit
    assert.ok(t.targetCount >= 1, `targetCount must be >= 1 in ${t.id}`);
    assert.ok(t.unit && t.unit.trim().length > 0, `unit required in ${t.id}`);

    // Frequency and days
    assert.ok(t.frequency === 'daily' || t.frequency === 'specific_days');
    assert.ok(Array.isArray(t.frequencyDays) && t.frequencyDays.length > 0);
    t.frequencyDays.forEach((d) => {
      assert.ok(d >= 0 && d <= 6, `Invalid day index ${d} in ${t.id}`);
    });

    // Reminder time validation
    if (t.reminderTime) {
      assert.ok(isValidReminderTime(t.reminderTime), `Valid reminder time required: ${t.reminderTime} in ${t.id}`);
    }

    // Tags
    assert.ok(Array.isArray(t.tags) && t.tags.length > 0, `Tags array required: ${t.id}`);
  }
});

test('habitTemplates: category filtering and coverage', () => {
  const categories = ['صحة', 'روحانية', 'تطوير', 'إنتاجية', 'روتين'] as const;

  for (const cat of categories) {
    const templatesInCat = getHabitTemplates(cat);
    assert.ok(templatesInCat.length >= 3, `Category ${cat} should have at least 3 templates`);
    templatesInCat.forEach((t) => {
      assert.equal(t.category, cat);
    });
  }

  // 'الكل' and empty returns all templates
  assert.equal(getHabitTemplates('الكل').length, HABIT_TEMPLATES.length);
  assert.equal(getHabitTemplates().length, HABIT_TEMPLATES.length);
});

test('habitTemplates: getHabitTemplateById retrieves specific templates', () => {
  const water = getHabitTemplateById('template_water');
  assert.ok(water);
  assert.equal(water?.name, 'شرب 2 لتر ماء');
  assert.equal(water?.category, 'صحة');
  assert.equal(water?.targetCount, 8);
  assert.equal(water?.unit, 'كوب');

  const quran = getHabitTemplateById('template_quran');
  assert.ok(quran);
  assert.equal(quran?.name, 'ورد القرآن الكريم');
  assert.equal(quran?.category, 'روحانية');

  const unknown = getHabitTemplateById('template_non_existent');
  assert.equal(unknown, undefined);
});

test('habitTemplates: searchHabitTemplates matches keywords and handles Arabic normalization', () => {
  // Search by name
  const waterResults = searchHabitTemplates('ماء');
  assert.ok(waterResults.some((t) => t.id === 'template_water'));

  // Search by description or keyword
  const bookResults = searchHabitTemplates('كتاب');
  assert.ok(bookResults.some((t) => t.id === 'template_reading'));

  // Search with Arabic normalization (Hamza variations)
  const charityResultsWithHamza = searchHabitTemplates('إحسان');
  const charityResultsWithoutHamza = searchHabitTemplates('احسان');
  assert.ok(charityResultsWithHamza.some((t) => t.id === 'template_charity'));
  assert.ok(charityResultsWithoutHamza.some((t) => t.id === 'template_charity'));

  // Search scoped to category
  const filteredSearch = searchHabitTemplates('ماء', 'صحة');
  assert.ok(filteredSearch.some((t) => t.id === 'template_water'));

  // Search scoped to mismatched category returns empty
  const mismatchedSearch = searchHabitTemplates('ماء', 'روتين');
  assert.equal(mismatchedSearch.length, 0);

  // Empty query returns all items in category
  const emptyQueryResults = searchHabitTemplates('', 'تطوير');
  assert.equal(emptyQueryResults.length, getHabitTemplates('تطوير').length);
});
