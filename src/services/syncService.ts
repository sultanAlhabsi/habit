/**
 * Multi-device Cloud Sync Service
 * Orchestrates bidirectional synchronization between local SQLite and Neon PostgreSQL.
 * Ensures offline resilience with instant cloud propagation whenever connected.
 */

import {
  checkNeonConnection,
  initNeonSchema,
  fetchNeonHabits,
  fetchNeonCheckins,
  fetchNeonMeta,
  upsertNeonHabit,
  upsertNeonCheckin,
  setNeonMeta,
  deleteNeonHabit,
  fetchNeonDeletedHabits,
  deleteNeonCheckin,
} from './neonService';
import {
  fetchAllHabits,
  fetchAllCheckins,
  getAllPreferences,
  saveHabitRecord,
  saveCheckinRecord,
  batchSaveCheckinRecords,
  deleteHabitRecord,
  setPreference,
  getPreference,
  fetchDeletedHabitIds,
  markHabitDeletedLocally,
  deduplicateLocalHabits,
} from './database';
import type { Habit, HabitCheckin } from '../types/habit';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncResult {
  success: boolean;
  state: SyncState;
  pulledHabits: number;
  pushedHabits: number;
  lastSyncTime?: string;
  errorMessage?: string;
}

let currentSyncPromise: Promise<SyncResult> | null = null;

// Cache the last connection check result to avoid redundant network calls
// Each push function was independently calling checkNeonConnection() = 3 extra network requests per checkin toggle
let _connectionCache: { isOnline: boolean; ts: number } | null = null;
const CONNECTION_CACHE_MS = 30_000; // 30 seconds

const getCachedConnection = async (): Promise<boolean> => {
  const now = Date.now();
  if (_connectionCache && now - _connectionCache.ts < CONNECTION_CACHE_MS) {
    return _connectionCache.isOnline;
  }
  const isOnline = await checkNeonConnection();
  _connectionCache = { isOnline, ts: now };
  return isOnline;
};

// Invalidate connection cache (called when a sync fails or succeeds)
const invalidateConnectionCache = () => {
  _connectionCache = null;
};

/**
 * Perform a full two-way sync between local storage and Neon PostgreSQL.
 */
export const syncWithNeon = async (): Promise<SyncResult> => {
  if (currentSyncPromise) {
    return currentSyncPromise;
  }

  currentSyncPromise = (async () => {
    try {
      const isOnline = await checkNeonConnection();
      if (!isOnline) {
        return {
          success: false,
          state: 'offline',
          pulledHabits: 0,
          pushedHabits: 0,
          errorMessage: 'تعذر الاتصال بقاعدة البيانات السحابية (غير متصل)',
        };
      }

      // Ensure remote tables exist
      await initNeonSchema();

      // Ensure local data has no lingering internal duplicates before syncing
      await deduplicateLocalHabits();

      // 1 & 2. Fetch Remote and Local Data concurrently
      const [
        [remoteHabits, remoteCheckins, remoteMeta, remoteDeletedHabitIds],
        [localHabits, localCheckins, localMeta, localDeletedHabitIds],
      ] = await Promise.all([
        Promise.all([
          fetchNeonHabits(),
          fetchNeonCheckins(),
          fetchNeonMeta(),
          fetchNeonDeletedHabits(),
        ]),
        Promise.all([
          fetchAllHabits(),
          fetchAllCheckins(),
          getAllPreferences(),
          fetchDeletedHabitIds(),
        ]),
      ]);

      // Combine deleted tombstones across both devices/sources
      const allDeletedHabitIds = new Set<string>([
        ...remoteDeletedHabitIds,
        ...localDeletedHabitIds,
      ]);

      // Propagate local deletions to remote Neon in parallel
      await Promise.all(
        localDeletedHabitIds
          .filter((delId) => !remoteDeletedHabitIds.includes(delId))
          .map((delId) => deleteNeonHabit(delId))
      );

      // Propagate remote deletions to local SQLite in parallel
      await Promise.all(
        remoteDeletedHabitIds
          .filter((delId) => !localDeletedHabitIds.includes(delId))
          .map((delId) => markHabitDeletedLocally(delId))
      );

      // Eradicate any deleted habits that still exist in remote or local
      await Promise.all(
        Array.from(allDeletedHabitIds).map(async (delId) => {
          const promises: Promise<void>[] = [];
          if (remoteHabits.some((h) => h.id === delId)) {
            promises.push(deleteNeonHabit(delId));
          }
          if (localHabits.some((h) => h.id === delId)) {
            promises.push(deleteHabitRecord(delId));
          }
          await Promise.all(promises);
        })
      );

      let pulledHabitsCount = 0;
      let pushedHabitsCount = 0;

      // 3. Reconcile Habits (skipping any deleted habits)
      const remoteHabitsMap = new Map<string, Habit>(
        remoteHabits.filter((h) => !allDeletedHabitIds.has(h.id)).map((h) => [h.id, h])
      );
      const localHabitsMap = new Map<string, Habit>(
        localHabits.filter((h) => !allDeletedHabitIds.has(h.id)).map((h) => [h.id, h])
      );

      // Index remote habits by normalized name to guard against duplicate generation
      const remoteHabitsByName = new Map<string, Habit>();
      for (const rh of remoteHabitsMap.values()) {
        const nameKey = rh.name.trim().toLowerCase();
        if (!remoteHabitsByName.has(nameKey)) {
          remoteHabitsByName.set(nameKey, rh);
        }
      }

      // Merge remote habits to local in parallel with timestamp-aware reconciliation
      const pullHabitPromises: Promise<void>[] = [];
      for (const [rId, rHabit] of remoteHabitsMap) {
        const lHabit = localHabitsMap.get(rId);
        if (!lHabit) {
          pulledHabitsCount++;
          pullHabitPromises.push(saveHabitRecord(rHabit));
        } else {
          const remoteTime = rHabit.updatedAt ? new Date(rHabit.updatedAt).getTime() : 0;
          const localTime = lHabit.updatedAt ? new Date(lHabit.updatedAt).getTime() : 0;
          const isRemoteNewer = remoteTime > localTime;
          const isRemoteArchivalNewer =
            Boolean(rHabit.archivedAt) && !lHabit.archivedAt && remoteTime >= localTime;
          if (isRemoteNewer || isRemoteArchivalNewer) {
            pulledHabitsCount++;
            pullHabitPromises.push(saveHabitRecord(rHabit));
          }
        }
      }
      await Promise.all(pullHabitPromises);

      // Push local habits to remote with cross-device duplicate name guard
      const pushHabitPromises: Promise<void>[] = [];
      for (const lHabit of localHabitsMap.values()) {
        const rHabit = remoteHabitsMap.get(lHabit.id);
        if (rHabit) {
          const remoteTime = rHabit.updatedAt ? new Date(rHabit.updatedAt).getTime() : 0;
          const localTime = lHabit.updatedAt ? new Date(lHabit.updatedAt).getTime() : 0;
          const isLocalNewer = localTime > remoteTime;
          const isLocalArchivalNewer =
            Boolean(lHabit.archivedAt) && !rHabit.archivedAt && localTime >= remoteTime;
          if (isLocalNewer || isLocalArchivalNewer) {
            pushedHabitsCount++;
            pushHabitPromises.push(upsertNeonHabit(lHabit));
          }
        } else {
          // Check if remote already has a habit with the same name under a different ID
          const nameKey = lHabit.name.trim().toLowerCase();
          const existingRemote = remoteHabitsByName.get(nameKey);
          if (existingRemote) {
            // Re-point any local checkins to the remote canonical habit
            const localCheckinsForDup = localCheckins.filter((c) => c.habitId === lHabit.id);
            for (const c of localCheckinsForDup) {
              const remapped: HabitCheckin = {
                ...c,
                id: `chk_${existingRemote.id}_${c.date}`,
                habitId: existingRemote.id,
              };
              await saveCheckinRecord(remapped);
            }
            await markHabitDeletedLocally(lHabit.id);
          } else {
            pushedHabitsCount++;
            pushHabitPromises.push(upsertNeonHabit(lHabit));
            remoteHabitsByName.set(nameKey, lHabit);
          }
        }
      }
      await Promise.all(pushHabitPromises);

      // 4. Reconcile Checkins (skipping checkins belonging to deleted habits)
      const remoteCheckinsKeyMap = new Map<string, HabitCheckin>();
      for (const rc of remoteCheckins) {
        if (!allDeletedHabitIds.has(rc.habitId)) {
          remoteCheckinsKeyMap.set(`${rc.habitId}_${rc.date}`, rc);
        }
      }

      const localCheckinsKeyMap = new Map<string, HabitCheckin>();
      for (const lc of localCheckins) {
        if (!allDeletedHabitIds.has(lc.habitId)) {
          localCheckinsKeyMap.set(`${lc.habitId}_${lc.date}`, lc);
        }
      }

      // Merge remote checkins into local atomically
      const checkinsToSave: HabitCheckin[] = [];
      for (const [key, rCheckin] of remoteCheckinsKeyMap) {
        const lCheckin = localCheckinsKeyMap.get(key);
        if (!lCheckin || new Date(rCheckin.updatedAt) > new Date(lCheckin.updatedAt)) {
          checkinsToSave.push(rCheckin);
        }
      }
      if (checkinsToSave.length > 0) {
        await batchSaveCheckinRecords(checkinsToSave);
      }

      // Push local checkins to remote in parallel
      const pushCheckinPromises: Promise<void>[] = [];
      for (const [key, lCheckin] of localCheckinsKeyMap) {
        const rCheckin = remoteCheckinsKeyMap.get(key);
        if (!rCheckin || new Date(lCheckin.updatedAt) > new Date(rCheckin.updatedAt)) {
          pushCheckinPromises.push(upsertNeonCheckin(lCheckin));
        }
      }
      await Promise.all(pushCheckinPromises);

      // 5. Reconcile Preferences (Meta)
      for (const [key, val] of Object.entries(remoteMeta)) {
        if (localMeta[key] === undefined) {
          await setPreference(key, val);
        }
      }
      for (const [key, val] of Object.entries(localMeta)) {
        await setNeonMeta(key, val);
      }

      const syncTimestamp = new Date().toISOString();
      await setPreference('last_neon_sync_time', syncTimestamp);

      return {
        success: true,
        state: 'synced',
        pulledHabits: pulledHabitsCount,
        pushedHabits: pushedHabitsCount,
        lastSyncTime: syncTimestamp,
      };
    } catch (error: any) {
      console.warn('[SyncService] Sync error:', error);
      return {
        success: false,
        state: 'error',
        pulledHabits: 0,
        pushedHabits: 0,
        errorMessage: error?.message || 'حدث خطأ أثناء المزامنة السحابية',
      };
    } finally {
      currentSyncPromise = null;
    }
  })();

  return currentSyncPromise;
};

/**
 * Push an immediate habit mutation to Neon in the background.
 */
export const pushHabitChangeAsync = async (habit: Habit): Promise<void> => {
  try {
    const isOnline = await getCachedConnection();
    if (isOnline) {
      await upsertNeonHabit(habit);
    }
  } catch (err) {
    // Gracefully catch background sync errors; full sync will reconcile later
  }
};

/**
 * Push an immediate habit deletion to Neon in the background.
 */
export const pushHabitDeletionAsync = async (habitId: string): Promise<void> => {
  try {
    const isOnline = await getCachedConnection();
    if (isOnline) {
      await deleteNeonHabit(habitId);
    }
  } catch (err) {
    // Gracefully catch background sync errors; full sync will reconcile later
  }
};

/**
 * Push an immediate checkin mutation to Neon in the background.
 */
export const pushCheckinChangeAsync = async (checkin: HabitCheckin): Promise<void> => {
  try {
    const isOnline = await getCachedConnection();
    if (isOnline) {
      await upsertNeonCheckin(checkin);
    }
  } catch (err) {
    // Gracefully catch background sync errors; full sync will reconcile later
  }
};

/**
 * Push an immediate checkin deletion to Neon in the background.
 */
export const pushCheckinDeletionAsync = async (habitId: string, date: string): Promise<void> => {
  try {
    const isOnline = await getCachedConnection();
    if (isOnline) {
      await deleteNeonCheckin(habitId, date);
    }
  } catch (err) {
    // Gracefully catch background sync errors; full sync will reconcile later
  }
};

/**
 * Push an immediate preference change to Neon in the background.
 */
export const pushMetaChangeAsync = async (key: string, value: string): Promise<void> => {
  try {
    const isOnline = await getCachedConnection();
    if (isOnline) {
      await setNeonMeta(key, value);
    }
  } catch (err) {
    // Gracefully catch background sync errors
  }
};

/**
 * Get the last recorded sync time from local preferences.
 */
export const getLastSyncTime = async (): Promise<string | null> => {
  const time = await getPreference('last_neon_sync_time', '');
  return time || null;
};
