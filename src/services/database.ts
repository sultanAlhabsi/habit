import type * as SQLite from 'expo-sqlite';
import dayjs from 'dayjs';
import type { Habit, HabitCheckin } from '../types/habit';
import { INITIAL_HABITS, generateDemoCheckins } from './mockData.ts';

let SQLiteModule: typeof import('expo-sqlite') | null = null;
let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Fallback in-memory store in case native SQLite is unavailable or encounters errors
let memoryHabits: Habit[] = [...INITIAL_HABITS];
let memoryCheckins: HabitCheckin[] = generateDemoCheckins();
let memoryMeta: Record<string, string> = {
  theme_mode: 'system',
  haptics_enabled: 'true',
  evening_reminder_enabled: 'false',
  evening_reminder_time: '21:00',
  habit_sort_preference: 'default',
  notifications_enabled: 'true',
};

// Sequential query queue to eliminate concurrent execution race conditions on Android
let dbQueue: Promise<any> = Promise.resolve();

const getDB = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (dbInstance) return dbInstance;
  try {
    if (!SQLiteModule) {
      SQLiteModule = await import('expo-sqlite');
    }
    dbInstance = await SQLiteModule.openDatabaseAsync('enjaz_habits.db');
    return dbInstance;
  } catch (error) {
    return null;
  }
};

/**
 * Execute database operations sequentially to ensure safety across Android and iOS native drivers.
 */
const runSerialized = async <T>(
  operation: (db: SQLite.SQLiteDatabase) => Promise<T>,
  fallback: () => T
): Promise<T> => {
  if (!isInitialized && !initPromise) {
    initDatabase();
  }

  const db = await getDB();
  if (!db) return fallback();

  return new Promise<T>((resolve) => {
    dbQueue = dbQueue
      .then(async () => {
        try {
          const res = await operation(db);
          resolve(res);
        } catch (err) {
          console.warn('[Database] Query execution error, using memory fallback:', err);
          resolve(fallback());
        }
      })
      .catch((err) => {
        console.warn('[Database] Queue error, using memory fallback:', err);
        resolve(fallback());
      });
  });
};

export const initDatabase = async (): Promise<void> => {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await getDB();
    if (!db) {
      isInitialized = true;
      return;
    }

    return new Promise<void>((resolve) => {
      dbQueue = dbQueue
        .then(async () => {
          try {
            await db.execAsync('PRAGMA journal_mode = WAL;');

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS habits (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                frequency TEXT NOT NULL,
                frequency_days TEXT NOT NULL,
                target_count INTEGER NOT NULL DEFAULT 1,
                unit TEXT NOT NULL DEFAULT 'مرة',
                is_active INTEGER NOT NULL DEFAULT 1,
                reminder_time TEXT,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                archived_at TEXT
              );
            `);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS checkins (
                id TEXT PRIMARY KEY NOT NULL,
                habit_id TEXT NOT NULL,
                date TEXT NOT NULL,
                count INTEGER NOT NULL DEFAULT 1,
                completed INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT NOT NULL,
                note TEXT,
                UNIQUE(habit_id, date)
              );
            `);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
              );
            `);

            try {
              await db.execAsync('ALTER TABLE checkins ADD COLUMN note TEXT;');
            } catch {}

            try {
              await db.execAsync('ALTER TABLE habits ADD COLUMN is_pinned INTEGER DEFAULT 0;');
            } catch {}

            const countResult = await db.getFirstAsync<{ count: number }>(
              'SELECT COUNT(*) as count FROM habits'
            );
            if (!countResult || countResult.count === 0) {
              await seedDatabaseInternal(db);
            }
          } catch (error) {
            console.warn('[Database] Error in schema initialization:', error);
          } finally {
            isInitialized = true;
            resolve();
          }
        })
        .catch((err) => {
          console.warn('[Database] Schema queue error:', err);
          isInitialized = true;
          resolve();
        });
    });
  })();

  return initPromise;
};

const saveHabitRecordInternal = async (
  db: SQLite.SQLiteDatabase,
  habit: Habit
): Promise<void> => {
  await db.runAsync(
    `INSERT OR REPLACE INTO habits (
      id, name, description, icon, color, frequency, frequency_days,
      target_count, unit, is_active, reminder_time, is_pinned, created_at, archived_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.name,
      habit.description || '',
      habit.icon,
      habit.color,
      habit.frequency,
      JSON.stringify(habit.frequencyDays),
      habit.targetCount,
      habit.unit,
      habit.isActive ? 1 : 0,
      habit.reminderTime || null,
      habit.isPinned ? 1 : 0,
      habit.createdAt,
      habit.archivedAt || null,
    ]
  );
};

const saveCheckinRecordInternal = async (
  db: SQLite.SQLiteDatabase,
  checkin: HabitCheckin
): Promise<void> => {
  await db.runAsync(
    `INSERT OR REPLACE INTO checkins (
      id, habit_id, date, count, completed, updated_at, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      checkin.id,
      checkin.habitId,
      checkin.date,
      checkin.count,
      checkin.completed ? 1 : 0,
      checkin.updatedAt,
      checkin.note || null,
    ]
  );
};

const seedDatabaseInternal = async (db: SQLite.SQLiteDatabase) => {
  for (const habit of INITIAL_HABITS) {
    await saveHabitRecordInternal(db, habit);
  }

  const demoCheckins = generateDemoCheckins();
  for (const checkin of demoCheckins) {
    await saveCheckinRecordInternal(db, checkin);
  }

  const defaultMetaEntries: [string, string][] = [
    ['theme_mode', 'system'],
    ['haptics_enabled', 'true'],
    ['notifications_enabled', 'true'],
    ['habit_sort_preference', 'default'],
    ['evening_reminder_enabled', 'false'],
    ['evening_reminder_time', '21:00'],
  ];
  for (const [key, val] of defaultMetaEntries) {
    try {
      await db.runAsync(
        'INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)',
        [key, val]
      );
    } catch {}
  }
};

export const fetchAllHabits = async (): Promise<Habit[]> => {
  return runSerialized(
    async (db) => {
      const rows = await db.getAllAsync<{
        id: string;
        name: string;
        description: string | null;
        icon: string;
        color: string;
        frequency: Habit['frequency'];
        frequency_days: string;
        target_count: number;
        unit: string;
        is_active: number;
        reminder_time: string | null;
        is_pinned?: number;
        created_at: string;
        archived_at: string | null;
      }>('SELECT * FROM habits ORDER BY created_at ASC');

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || undefined,
        icon: r.icon,
        color: r.color,
        frequency: r.frequency,
        frequencyDays: JSON.parse(r.frequency_days || '[0,1,2,3,4,5,6]'),
        targetCount: r.target_count,
        unit: r.unit,
        isActive: r.is_active === 1,
        reminderTime: r.reminder_time,
        isPinned: r.is_pinned === 1,
        createdAt: r.created_at,
        archivedAt: r.archived_at,
      }));
    },
    () => [...memoryHabits]
  );
};

export const saveHabitRecord = async (habit: Habit): Promise<void> => {
  const index = memoryHabits.findIndex((h) => h.id === habit.id);
  if (index >= 0) {
    memoryHabits[index] = habit;
  } else {
    memoryHabits.push(habit);
  }

  await runSerialized(
    (db) => saveHabitRecordInternal(db, habit),
    () => {}
  );
};

export const deleteHabitRecord = async (habitId: string): Promise<void> => {
  memoryHabits = memoryHabits.filter((h) => h.id !== habitId);
  memoryCheckins = memoryCheckins.filter((c) => c.habitId !== habitId);

  await runSerialized(
    async (db) => {
      await db.runAsync('DELETE FROM habits WHERE id = ?', [habitId]);
      await db.runAsync('DELETE FROM checkins WHERE habit_id = ?', [habitId]);
    },
    () => {}
  );
};

export const fetchAllCheckins = async (): Promise<HabitCheckin[]> => {
  return runSerialized(
    async (db) => {
      const rows = await db.getAllAsync<{
        id: string;
        habit_id: string;
        date: string;
        count: number;
        completed: number;
        updated_at: string;
        note?: string | null;
      }>('SELECT * FROM checkins ORDER BY date DESC');

      return rows.map((r) => ({
        id: r.id,
        habitId: r.habit_id,
        date: r.date,
        count: r.count,
        completed: r.completed === 1,
        updatedAt: r.updated_at,
        note: r.note || undefined,
      }));
    },
    () => [...memoryCheckins]
  );
};

export const saveCheckinRecord = async (checkin: HabitCheckin): Promise<void> => {
  const idx = memoryCheckins.findIndex(
    (c) => c.habitId === checkin.habitId && c.date === checkin.date
  );
  if (idx >= 0) {
    memoryCheckins[idx] = checkin;
  } else {
    memoryCheckins.push(checkin);
  }

  await runSerialized(
    (db) => saveCheckinRecordInternal(db, checkin),
    () => {}
  );
};

export const removeCheckinRecord = async (habitId: string, date: string): Promise<void> => {
  memoryCheckins = memoryCheckins.filter(
    (c) => !(c.habitId === habitId && c.date === date)
  );

  await runSerialized(
    async (db) => {
      await db.runAsync('DELETE FROM checkins WHERE habit_id = ? AND date = ?', [
        habitId,
        date,
      ]);
    },
    () => {}
  );
};

export const resetDatabase = async (): Promise<void> => {
  memoryHabits = [];
  memoryCheckins = [];

  await runSerialized(
    async (db) => {
      await db.execAsync(`
        DELETE FROM checkins;
        DELETE FROM habits;
      `);
    },
    () => {}
  );
};

export const seedDatabase = async (): Promise<void> => {
  memoryHabits = [...INITIAL_HABITS];
  memoryCheckins = generateDemoCheckins();
  memoryMeta = {
    theme_mode: 'system',
    haptics_enabled: 'true',
    evening_reminder_enabled: 'false',
    evening_reminder_time: '21:00',
    habit_sort_preference: 'default',
    notifications_enabled: 'true',
  };

  await runSerialized(
    async (db) => {
      await db.execAsync(`
        DELETE FROM checkins;
        DELETE FROM habits;
      `);
      await seedDatabaseInternal(db);
    },
    () => {}
  );
};

export const getPreference = async (key: string, defaultValue = ''): Promise<string> => {
  return runSerialized(
    async (db) => {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM meta WHERE key = ?',
        [key]
      );
      return row ? row.value : defaultValue;
    },
    () => memoryMeta[key] ?? defaultValue
  );
};

export const setPreference = async (key: string, value: string): Promise<void> => {
  memoryMeta[key] = value;

  await runSerialized(
    async (db) => {
      await db.runAsync(
        'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
        [key, value]
      );
    },
    () => {}
  );
};

export const archiveHabitRecord = async (habitId: string, archive: boolean): Promise<void> => {
  const archivedAt = archive ? dayjs().toISOString() : null;
  const isActive = archive ? 0 : 1;

  const idx = memoryHabits.findIndex((h) => h.id === habitId);
  if (idx >= 0) {
    memoryHabits[idx] = {
      ...memoryHabits[idx],
      archivedAt,
      isActive: !archive,
    };
  }

  await runSerialized(
    async (db) => {
      await db.runAsync(
        'UPDATE habits SET archived_at = ?, is_active = ? WHERE id = ?',
        [archivedAt, isActive, habitId]
      );
    },
    () => {}
  );
};

export const getAllPreferences = async (): Promise<Record<string, string>> => {
  return runSerialized(
    async (db) => {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM meta'
      );
      const result: Record<string, string> = {};
      rows.forEach((r) => {
        result[r.key] = r.value;
      });
      return result;
    },
    () => ({ ...memoryMeta })
  );
};

export const importDatabaseRecords = async (
  habits: Habit[],
  checkins: HabitCheckin[],
  mode: 'replace' | 'merge'
): Promise<void> => {
  if (mode === 'replace') {
    memoryHabits = [...habits];
    memoryCheckins = [...checkins];
  } else {
    habits.forEach((h) => {
      const idx = memoryHabits.findIndex((x) => x.id === h.id);
      if (idx >= 0) memoryHabits[idx] = h;
      else memoryHabits.push(h);
    });
    checkins.forEach((c) => {
      const idx = memoryCheckins.findIndex(
        (x) => x.habitId === c.habitId && x.date === c.date
      );
      if (idx >= 0) memoryCheckins[idx] = c;
      else memoryCheckins.push(c);
    });
  }

  await runSerialized(
    async (db) => {
      if (mode === 'replace') {
        await db.execAsync(`
          DELETE FROM checkins;
          DELETE FROM habits;
        `);
      }

      for (const habit of habits) {
        await saveHabitRecordInternal(db, habit);
      }

      for (const checkin of checkins) {
        await saveCheckinRecordInternal(db, checkin);
      }
    },
    () => {}
  );
};

export interface StorageMetrics {
  totalHabits: number;
  activeHabits: number;
  archivedHabits: number;
  totalCheckins: number;
  completedCheckins: number;
  reflectionNotesCount: number;
  oldestRecordDate?: string;
  newestRecordDate?: string;
}

export const fetchStorageMetrics = async (): Promise<StorageMetrics> => {
  return runSerialized(
    async (db) => {
      const habitsRes = await db.getFirstAsync<{
        total_habits: number;
        active_habits: number;
        archived_habits: number;
      }>(`
        SELECT
          COUNT(*) as total_habits,
          COALESCE(SUM(CASE WHEN is_active = 1 AND archived_at IS NULL THEN 1 ELSE 0 END), 0) as active_habits,
          COALESCE(SUM(CASE WHEN archived_at IS NOT NULL THEN 1 ELSE 0 END), 0) as archived_habits
        FROM habits
      `);

      const checkinsRes = await db.getFirstAsync<{
        total_checkins: number;
        completed_checkins: number;
        notes_count: number;
        oldest_date: string | null;
        newest_date: string | null;
      }>(`
        SELECT
          COUNT(*) as total_checkins,
          COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed_checkins,
          COALESCE(SUM(CASE WHEN note IS NOT NULL AND trim(note) != '' THEN 1 ELSE 0 END), 0) as notes_count,
          MIN(date) as oldest_date,
          MAX(date) as newest_date
        FROM checkins
      `);

      return {
        totalHabits: habitsRes?.total_habits ?? 0,
        activeHabits: habitsRes?.active_habits ?? 0,
        archivedHabits: habitsRes?.archived_habits ?? 0,
        totalCheckins: checkinsRes?.total_checkins ?? 0,
        completedCheckins: checkinsRes?.completed_checkins ?? 0,
        reflectionNotesCount: checkinsRes?.notes_count ?? 0,
        oldestRecordDate: checkinsRes?.oldest_date || undefined,
        newestRecordDate: checkinsRes?.newest_date || undefined,
      };
    },
    () => {
      const habits = memoryHabits;
      const checkins = memoryCheckins;
      const activeHabits = habits.filter((h) => h.isActive && !h.archivedAt).length;
      const archivedHabits = habits.filter((h) => Boolean(h.archivedAt)).length;
      const totalCheckins = checkins.length;
      const completedCheckins = checkins.filter((c) => c.completed).length;
      const reflectionNotesCount = checkins.filter(
        (c) => Boolean(c.note && c.note.trim().length > 0)
      ).length;

      let oldestRecordDate: string | undefined;
      let newestRecordDate: string | undefined;
      if (checkins.length > 0) {
        const sorted = [...checkins].map((c) => c.date).sort();
        oldestRecordDate = sorted[0];
        newestRecordDate = sorted[sorted.length - 1];
      }

      return {
        totalHabits: habits.length,
        activeHabits,
        archivedHabits,
        totalCheckins,
        completedCheckins,
        reflectionNotesCount,
        oldestRecordDate,
        newestRecordDate,
      };
    }
  );
};

export const compactDatabase = async (): Promise<{ success: boolean }> => {
  return runSerialized(
    async (db) => {
      try {
        await db.execAsync('PRAGMA optimize; VACUUM;');
        return { success: true };
      } catch (err) {
        console.warn('[Database] VACUUM error:', err);
        return { success: false };
      }
    },
    () => ({ success: true })
  );
};

export const cleanEmptyCheckins = async (): Promise<number> => {
  const prevLen = memoryCheckins.length;
  memoryCheckins = memoryCheckins.filter(
    (c) => c.completed || c.count > 0 || Boolean(c.note && c.note.trim().length > 0)
  );
  const memoryCleaned = prevLen - memoryCheckins.length;

  return runSerialized(
    async (db) => {
      const before = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM checkins WHERE completed = 0 AND (count <= 0 OR count IS NULL) AND (note IS NULL OR trim(note) = '')"
      );
      const countToDelete = before?.count || 0;
      if (countToDelete > 0) {
        await db.runAsync(
          "DELETE FROM checkins WHERE completed = 0 AND (count <= 0 OR count IS NULL) AND (note IS NULL OR trim(note) = '')"
        );
      }
      return countToDelete;
    },
    () => memoryCleaned
  );
};

