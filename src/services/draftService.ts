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
