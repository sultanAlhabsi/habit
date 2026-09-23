import { getPreference, setPreference, deletePreference } from './database.ts';

const DRAFT_PREFIX = 'draft_note_';

export const getNoteDraftKey = (habitId: string, date: string): string => {
  return `${DRAFT_PREFIX}${habitId}_${date}`;
};

/**
 * Retrieve an unsaved thought draft for a specific habit and date.
 * Returns null if no draft exists.
 */
export const getNoteDraft = async (
  habitId: string,
  date: string
): Promise<string | null> => {
  if (!habitId || !date) return null;
  const key = getNoteDraftKey(habitId, date);
  const draft = await getPreference(key, '');
  return draft && draft.length > 0 ? draft : null;
};

/**
 * Persist an unsaved thought draft.
 * If draft is completely empty, it removes the draft entry.
 */
export const saveNoteDraft = async (
  habitId: string,
  date: string,
  draft: string
): Promise<void> => {
  if (!habitId || !date) return;
  const key = getNoteDraftKey(habitId, date);
  if (!draft || draft.trim().length === 0) {
    await deletePreference(key);
    return;
  }
  await setPreference(key, draft);
};

/**
 * Delete a draft when officially saved or explicitly discarded.
 */
export const deleteNoteDraft = async (
  habitId: string,
  date: string
): Promise<void> => {
  if (!habitId || !date) return;
  const key = getNoteDraftKey(habitId, date);
  await deletePreference(key);
};

/**
 * Check if an unsaved draft exists for a specific habit and date.
 */
export const hasNoteDraft = async (
  habitId: string,
  date: string
): Promise<boolean> => {
  const draft = await getNoteDraft(habitId, date);
  return draft !== null && draft.length > 0;
};

/* ==========================================================================
   Habit Creation / Edit Form Draft Persistence
   ========================================================================== */

const HABIT_DRAFT_PREFIX = 'draft_habit_';

export interface HabitFormDraft {
  name: string;
  description?: string;
  selectedIcon?: string;
  selectedColor?: string;
  freqTab?: 'daily' | 'weekly' | 'monthly';
  weeklyMode?: 'target' | 'specific_days';
  monthlyMode?: 'day' | 'target';
  weeklyTargetCount?: string;
  monthlyTargetCount?: string;
  monthlyDay?: string;
  frequency?: any;
  frequencyDays?: number[];
  targetCount?: string;
  unit?: string;
  reminderTime?: string;
  hasReminder?: boolean;
  isPinned?: boolean;
  savedAt?: string;
}

export const getHabitDraftKey = (draftId = 'new'): string => {
  return `${HABIT_DRAFT_PREFIX}${draftId}`;
};

/**
 * Retrieve an unsaved habit form draft.
 */
export const getHabitDraft = async (
  draftId = 'new'
): Promise<HabitFormDraft | null> => {
  const key = getHabitDraftKey(draftId);
  const raw = await getPreference(key, '');
  if (!raw || raw.trim().length === 0) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as HabitFormDraft;
    }
  } catch (_) {}
  return null;
};

/**
 * Persist an unsaved habit form draft.
 * If draft name and description are completely empty, deletes draft.
 */
export const saveHabitDraft = async (
  draft: HabitFormDraft,
  draftId = 'new'
): Promise<void> => {
  const key = getHabitDraftKey(draftId);
  if (!draft || (!draft.name?.trim() && !draft.description?.trim())) {
    await deletePreference(key);
    return;
  }
  const payload: HabitFormDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  };
  await setPreference(key, JSON.stringify(payload));
};

/**
 * Purge an unsaved habit draft.
 */
export const deleteHabitDraft = async (draftId = 'new'): Promise<void> => {
  const key = getHabitDraftKey(draftId);
  await deletePreference(key);
};

/**
 * Check if a valid unsaved habit form draft exists.
 */
export const hasHabitDraft = async (draftId = 'new'): Promise<boolean> => {
  const draft = await getHabitDraft(draftId);
  return draft !== null && Boolean(draft.name?.trim() || draft.description?.trim());
};

