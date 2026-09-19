import test from 'node:test';
import assert from 'node:assert/strict';
import type { Habit } from '../src/types/habit.ts';
import { reorderArray, sortHabits } from '../src/utils/habitUtils.ts';

const createMockHabit = (id: string, name: string, isPinned = false, order?: number): Habit => ({
  id,
  name,
  icon: 'book-outline',
  color: '#2A4B3A',
  frequency: 'daily',
  frequencyDays: [0, 1, 2, 3, 4, 5, 6],
  targetCount: 1,
  unit: 'مرة',
  isActive: true,
  isPinned,
  order,
  createdAt: '2026-06-01T10:00:00.000Z',
});

test('reorderArray: moves items forward, backward, and handles edge cases safely', () => {
  const list = ['A', 'B', 'C', 'D', 'E'];

  // Move A from index 0 to index 2 -> ['B', 'C', 'A', 'D', 'E']
  const movedForward = reorderArray(list, 0, 2);
  assert.deepEqual(movedForward, ['B', 'C', 'A', 'D', 'E']);

  // Move E from index 4 to index 1 -> ['A', 'E', 'B', 'C', 'D']
  const movedBackward = reorderArray(list, 4, 1);
  assert.deepEqual(movedBackward, ['A', 'E', 'B', 'C', 'D']);

  // Same index
  assert.deepEqual(reorderArray(list, 2, 2), list);

  // Out of bounds
  assert.deepEqual(reorderArray(list, -1, 2), list);
  assert.deepEqual(reorderArray(list, 0, 10), list);
});

test('sortHabits: respects custom order when sortOption is default', () => {
  const habits: Habit[] = [
    createMockHabit('h1', 'عادة 1', false, 2),
    createMockHabit('h2', 'عادة 2', false, 0),
    createMockHabit('h3', 'عادة 3', false, 1),
  ];

  const sorted = sortHabits(habits, 'default', [], '2026-06-15');
  assert.deepEqual(
    sorted.map((h) => h.id),
    ['h2', 'h3', 'h1']
  );
});

test('sortHabits: preserves pinned habits at top while ordering each section by custom order', () => {
  const habits: Habit[] = [
    createMockHabit('h1', 'عادية 1', false, 1),
    createMockHabit('p1', 'مثبتة 1', true, 1),
    createMockHabit('h2', 'عادية 2', false, 0),
    createMockHabit('p2', 'مثبتة 2', true, 0),
  ];

  const sorted = sortHabits(habits, 'default', [], '2026-06-15');
  assert.deepEqual(
    sorted.map((h) => h.id),
    ['p2', 'p1', 'h2', 'h1']
  );
});

test('reorderHabits logic: assigns sequential orders and preserves unlisted habits', () => {
  const allHabits: Habit[] = [
    createMockHabit('h1', 'عادة 1', false, 0),
    createMockHabit('h2', 'عادة 2', false, 1),
    createMockHabit('h3', 'عادة 3', false, 2),
    createMockHabit('h4_archived', 'عادة مؤرشفة', false, 3),
  ];

  // User drags h3 to top: [h3, h1, h2]
  const userReordered = [allHabits[2], allHabits[0], allHabits[1]];
  const updatedReordered = userReordered.map((h, idx) => ({
    ...h,
    order: idx,
  }));

  const reorderedIdSet = new Set(updatedReordered.map((h) => h.id));
  const otherHabits = allHabits.filter((h) => !reorderedIdSet.has(h.id));
  const finalMerged = [...updatedReordered, ...otherHabits];

  assert.equal(finalMerged[0].id, 'h3');
  assert.equal(finalMerged[0].order, 0);
  assert.equal(finalMerged[1].id, 'h1');
  assert.equal(finalMerged[1].order, 1);
  assert.equal(finalMerged[2].id, 'h2');
  assert.equal(finalMerged[2].order, 2);
  assert.equal(finalMerged[3].id, 'h4_archived');
  assert.equal(finalMerged[3].order, 3);
});

test('moveHabit logic: shifts a habit up or down in array', () => {
  const habits: Habit[] = [
    createMockHabit('item-1', 'أول', false, 0),
    createMockHabit('item-2', 'ثاني', false, 1),
    createMockHabit('item-3', 'ثالث', false, 2),
  ];

  // Move item-2 UP
  const index = habits.findIndex((h) => h.id === 'item-2');
  const movedUp = reorderArray(habits, index, index - 1);
  assert.equal(movedUp[0].id, 'item-2');
  assert.equal(movedUp[1].id, 'item-1');
  assert.equal(movedUp[2].id, 'item-3');

  // Move item-2 DOWN
  const movedDown = reorderArray(habits, index, index + 1);
  assert.equal(movedDown[0].id, 'item-1');
  assert.equal(movedDown[1].id, 'item-3');
  assert.equal(movedDown[2].id, 'item-2');
});
