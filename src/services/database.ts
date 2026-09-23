import type * as SQLite from 'expo-sqlite';
import dayjs from 'dayjs';
import type { Habit, HabitCheckin } from '../types/habit';
import { INITIAL_HABITS, generateDemoCheckins } from './mockData.ts';

let SQLiteModule: typeof import('expo-sqlite') | null = null;
let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Fallback in-memory store in case native SQLite is unavailable or encounters errors
let memoryHabits: Habit[] = [];
let memoryCheckins: HabitCheckin[] = [];
let memoryDeletedHabitIds: string[] = [];
let memoryMeta: Record<string, string> = {
  theme_mode: 'system',
  haptics_enabled: 'true',
  sound_enabled: 'true',
  evening_reminder_enabled: 'false',
  evening_reminder_time: '21:00',
  habit_sort_preference: 'default',
  notifications_enabled: 'true',
  has_completed_onboarding: 'false',
};

// Sequential query queue to eliminate concurrent execution race conditions on Android
let dbQueue: Promise<any> = Promise.resolve();

const handleDatabaseError = (err: any) => {
  const errMsg = err?.message || String(err);
  if (
    errMsg.includes('NullPointerException') ||
    errMsg.includes('closed') ||
    errMsg.includes('rejected')
  ) {
    dbInstance = null;
    isInitialized = false;
    initPromise = null;
  }
};

const getDB = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (dbInstance) return dbInstance;
  try {
    if (!SQLiteModule) {
      try {
        SQLiteModule = require('expo-sqlite');
      } catch {
        SQLiteModule = await import('expo-sqlite');
      }
    }
    if (!SQLiteModule) return null;
    dbInstance = await SQLiteModule.openDatabaseAsync('enjaz_habits.db', {
      useNewConnection: true,
    });
    return dbInstance;
  } catch (error) {
    dbInstance = null;
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
          handleDatabaseError(err);
          console.warn('[Database] Query execution error, using memory fallback:', err);
          resolve(fallback());
        }
      })
      .catch((err) => {
        handleDatabaseError(err);
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
            await db.execAsync('PRAGMA synchronous = NORMAL;');
            await db.execAsync('PRAGMA cache_size = -8000;'); // 8MB cache
            await db.execAsync('PRAGMA temp_store = MEMORY;');

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
                weekly_target_count INTEGER,
                monthly_target_count INTEGER,
                monthly_day INTEGER,
                unit TEXT NOT NULL DEFAULT 'مرة',
                is_active INTEGER NOT NULL DEFAULT 1,
                reminder_time TEXT,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                archived_at TEXT,
                updated_at TEXT
              );
            `);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS checkins (
                id TEXT PRIMARY KEY NOT NULL,
                habit_id TEXT NOT NULL,
                date TEXT NOT NULL,
                count INTEGER NOT NULL DEFAULT 0,
                completed INTEGER NOT NULL DEFAULT 0,
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

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS deleted_habits (
                id TEXT PRIMARY KEY NOT NULL,
                deleted_at TEXT NOT NULL
              );
            `);

            try {
              await db.execAsync('ALTER TABLE checkins ADD COLUMN note TEXT;');
            } catch {}

            try {
              await db.execAsync('ALTER TABLE habits ADD COLUMN is_pinned INTEGER DEFAULT 0;');
            } catch {}

            try {
              await db.execAsync('ALTER TABLE habits ADD COLUMN order_index INTEGER DEFAULT 0;');
            } catch {}

            try {
              await db.execAsync('ALTER TABLE habits ADD COLUMN weekly_target_count INTEGER;');
            } catch {}

            try {
              await db.execAsync('ALTER TABLE habits ADD COLUMN monthly_target_count INTEGER;');
            } catch {}

            try {
              await db.execAsync('ALTER TABLE habits ADD COLUMN monthly_day INTEGER;');
            } catch {}

            try {
              await db.execAsync('ALTER TABLE habits ADD COLUMN updated_at TEXT;');
            } catch {}

            // Add indexes for frequently queried columns
            // These significantly speed up habit_id and date lookups
            try {
              await db.execAsync(
                'CREATE INDEX IF NOT EXISTS idx_checkins_habit_id ON checkins (habit_id);'
              );
              await db.execAsync(
                'CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins (date);'
              );
              await db.execAsync(
                'CREATE INDEX IF NOT EXISTS idx_checkins_habit_date ON checkins (habit_id, date);'
              );
              await db.execAsync(
                'CREATE INDEX IF NOT EXISTS idx_habits_archived_at ON habits (archived_at);'
              );
            } catch {}

            // Schema initialized cleanly without inserting unprompted demo records.
            // Explicit seeding is handled on-demand via seedDatabase() in Settings.
          } catch (error) {
            handleDatabaseError(error);
            console.warn('[Database] Error in schema initialization:', error);
          } finally {
            if (dbInstance) {
              isInitialized = true;
            }
            resolve();
          }
        })
        .catch((err) => {
          handleDatabaseError(err);
          console.warn('[Database] Schema queue error:', err);
          if (dbInstance) {
            isInitialized = true;
          }
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
      target_count, weekly_target_count, monthly_target_count, monthly_day,
      unit, is_active, reminder_time, is_pinned, order_index, created_at, archived_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.name,
      habit.description || '',
      habit.icon,
      habit.color,
      habit.frequency,
      JSON.stringify(habit.frequencyDays),
      habit.targetCount,
      habit.weeklyTargetCount ?? null,
      habit.monthlyTargetCount ?? null,
      habit.monthlyDay ?? null,
      habit.unit,
      habit.isActive ? 1 : 0,
      habit.reminderTime || null,
      habit.isPinned ? 1 : 0,
      habit.order ?? 0,
      habit.createdAt,
      habit.archivedAt || null,
      habit.updatedAt || habit.createdAt || new Date().toISOString(),
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

const saveCheckinRecordsChunkedInternal = async (
  db: SQLite.SQLiteDatabase,
  checkins: HabitCheckin[]
): Promise<void> => {
  const CHUNK_SIZE = 150;
  for (let i = 0; i < checkins.length; i += CHUNK_SIZE) {
    const chunk = checkins.slice(i, i + CHUNK_SIZE);
    if (chunk.length === 0) continue;
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const params: any[] = [];
    for (const c of chunk) {
      params.push(
        c.id,
        c.habitId,
        c.date,
        c.count,
        c.completed ? 1 : 0,
        c.updatedAt,
        c.note || null
      );
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO checkins (id, habit_id, date, count, completed, updated_at, note) VALUES ${placeholders}`,
      params
    );
  }
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
    ['sound_enabled', 'true'],
    ['notifications_enabled', 'true'],
    ['habit_sort_preference', 'default'],
    ['evening_reminder_enabled', 'false'],
    ['evening_reminder_time', '21:00'],
    ['has_completed_onboarding', 'false'],
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
        weekly_target_count?: number | null;
        monthly_target_count?: number | null;
        monthly_day?: number | null;
        unit: string;
        is_active: number;
        reminder_time: string | null;
        is_pinned?: number;
        order_index?: number | null;
        created_at: string;
        archived_at: string | null;
        updated_at?: string | null;
      }>('SELECT * FROM habits ORDER BY order_index ASC, created_at ASC');

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || undefined,
        icon: r.icon,
        color: r.color,
        frequency: r.frequency,
        frequencyDays: JSON.parse(r.frequency_days || '[0,1,2,3,4,5,6]'),
        targetCount: r.target_count,
        weeklyTargetCount: r.weekly_target_count ?? undefined,
        monthlyTargetCount: r.monthly_target_count ?? undefined,
        monthlyDay: r.monthly_day ?? undefined,
        unit: r.unit,
        isActive: r.is_active === 1,
        reminderTime: r.reminder_time,
        isPinned: r.is_pinned === 1,
        order: r.order_index ?? 0,
        createdAt: r.created_at,
        archivedAt: r.archived_at,
        updatedAt: r.updated_at || r.created_at,
      }));
    },
    () => [...memoryHabits]
  );
};

export const updateHabitsOrder = async (orderedHabitIds: string[]): Promise<void> => {
  orderedHabitIds.forEach((id, index) => {
    const h = memoryHabits.find((item) => item.id === id);
    if (h) h.order = index;
  });

  await runSerialized(
    async (db) => {
      await db.withTransactionAsync(async () => {
        for (let i = 0; i < orderedHabitIds.length; i++) {
          await db.runAsync('UPDATE habits SET order_index = ? WHERE id = ?;', [
            i,
            orderedHabitIds[i],
          ]);
        }
      });
    },
    () => {}
  );
};

export const saveHabitRecord = async (habit: Habit): Promise<void> => {
  const habitWithUpdated: Habit = {
    ...habit,
    updatedAt: habit.updatedAt || new Date().toISOString(),
  };
  const index = memoryHabits.findIndex((h) => h.id === habit.id);
  if (index >= 0) {
    memoryHabits[index] = habitWithUpdated;
  } else {
    memoryHabits.push(habitWithUpdated);
  }
  memoryDeletedHabitIds = memoryDeletedHabitIds.filter((id) => id !== habit.id);

  await runSerialized(
    async (db) => {
      await saveHabitRecordInternal(db, habitWithUpdated);
      await db.runAsync('DELETE FROM deleted_habits WHERE id = ?;', [habit.id]);
    },
    () => {}
  );
};

export const deleteHabitRecord = async (habitId: string): Promise<void> => {
  memoryHabits = memoryHabits.filter((h) => h.id !== habitId);
  memoryCheckins = memoryCheckins.filter((c) => c.habitId !== habitId);
  if (!memoryDeletedHabitIds.includes(habitId)) {
    memoryDeletedHabitIds.push(habitId);
  }

  await runSerialized(
    async (db) => {
      await db.runAsync('DELETE FROM habits WHERE id = ?;', [habitId]);
      await db.runAsync('DELETE FROM checkins WHERE habit_id = ?;', [habitId]);
      await db.runAsync(
        'INSERT OR REPLACE INTO deleted_habits (id, deleted_at) VALUES (?, ?);',
        [habitId, new Date().toISOString()]
      );
    },
    () => {}
  );
};

export const deleteImportedLoopHabitsRecord = async (): Promise<{
  deletedHabitsCount: number;
  deletedCheckinsCount: number;
}> => {
  const deletedHabitIds = memoryHabits.filter((h) => h.id.startsWith('loop_')).map((h) => h.id);
  const deletedCheckinCount = memoryCheckins.filter((c) => c.habitId.startsWith('loop_')).length;

  for (const id of deletedHabitIds) {
    if (!memoryDeletedHabitIds.includes(id)) {
      memoryDeletedHabitIds.push(id);
    }
  }

  memoryHabits = memoryHabits.filter((h) => !h.id.startsWith('loop_'));
  memoryCheckins = memoryCheckins.filter((c) => !c.habitId.startsWith('loop_'));

  return runSerialized(
    async (db) => {
      const habitRows = await db.getAllAsync<{ id: string }>(
        "SELECT id FROM habits WHERE id LIKE 'loop_%';"
      );
      const habitIds = habitRows.map((r) => r.id);

      const checkinCountResult = await db.getFirstAsync<{ count: number }>(
        "SELECT count(*) as count FROM checkins WHERE habit_id LIKE 'loop_%';"
      );
      const checkinCount = checkinCountResult?.count || 0;

      await db.runAsync("DELETE FROM checkins WHERE habit_id LIKE 'loop_%';");
      await db.runAsync("DELETE FROM habits WHERE id LIKE 'loop_%';");

      const now = new Date().toISOString();
      for (const id of habitIds) {
        await db.runAsync(
          'INSERT OR REPLACE INTO deleted_habits (id, deleted_at) VALUES (?, ?);',
          [id, now]
        );
      }

      return { deletedHabitsCount: habitIds.length, deletedCheckinsCount: checkinCount };
    },
    () => ({ deletedHabitsCount: deletedHabitIds.length, deletedCheckinsCount: deletedCheckinCount })
  );
};

export const fetchDeletedHabitIds = async (): Promise<string[]> => {
  return runSerialized(
    async (db) => {
      const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM deleted_habits;');
      return rows.map((r) => r.id);
    },
    () => [...memoryDeletedHabitIds]
  );
};

export const markHabitDeletedLocally = async (habitId: string): Promise<void> => {
  if (!memoryDeletedHabitIds.includes(habitId)) {
    memoryDeletedHabitIds.push(habitId);
  }
  memoryHabits = memoryHabits.filter((h) => h.id !== habitId);
  memoryCheckins = memoryCheckins.filter((c) => c.habitId !== habitId);

  await runSerialized(
    async (db) => {
      await db.runAsync('DELETE FROM habits WHERE id = ?;', [habitId]);
      await db.runAsync('DELETE FROM checkins WHERE habit_id = ?;', [habitId]);
      await db.runAsync(
        'INSERT OR REPLACE INTO deleted_habits (id, deleted_at) VALUES (?, ?);',
        [habitId, new Date().toISOString()]
      );
    },
    () => {}
  );
};
/**
 * Fetch checkins for the last N days (default: 180 days) using the indexed date column.
 * Significantly improves cold-start execution and memory footprint.
 */
export const fetchRecentCheckins = async (days = 180): Promise<HabitCheckin[]> => {
  const cutoffDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
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
      }>(
        'SELECT * FROM checkins WHERE date >= ? ORDER BY date DESC',
        [cutoffDate]
      );

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
    () => memoryCheckins.filter((c) => c.date >= cutoffDate)
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
  memoryDeletedHabitIds = [];

  await runSerialized(
    async (db) => {
      await db.execAsync(`
        DELETE FROM checkins;
        DELETE FROM habits;
        DELETE FROM deleted_habits;
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
    sound_enabled: 'true',
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

export const deletePreference = async (key: string): Promise<void> => {
  delete memoryMeta[key];

  await runSerialized(
    async (db) => {
      await db.runAsync('DELETE FROM meta WHERE key = ?', [key]);
    },
    () => {}
  );
};

export const archiveHabitRecord = async (habitId: string, archive: boolean): Promise<void> => {
  const now = dayjs().toISOString();
  const archivedAt = archive ? now : null;
  const isActive = archive ? 0 : 1;

  const idx = memoryHabits.findIndex((h) => h.id === habitId);
  if (idx >= 0) {
    memoryHabits[idx] = {
      ...memoryHabits[idx],
      archivedAt,
      isActive: !archive,
      updatedAt: now,
    };
  }

  await runSerialized(
    async (db) => {
      await db.runAsync(
        'UPDATE habits SET archived_at = ?, is_active = ?, updated_at = ? WHERE id = ?',
        [archivedAt, isActive, now, habitId]
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

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  const val = await getPreference('has_completed_onboarding', 'false');
  return val === 'true';
};

export const setCompletedOnboarding = async (completed: boolean): Promise<void> => {
  await setPreference('has_completed_onboarding', completed ? 'true' : 'false');
};

export const importDatabaseRecords = async (
  habits: Habit[],
  checkins: HabitCheckin[],
  mode: 'replace' | 'merge'
): Promise<void> => {
  const prevHabits = [...memoryHabits];
  const prevCheckins = [...memoryCheckins];

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
      try {
        await db.withTransactionAsync(async () => {
          if (mode === 'replace') {
            await db.execAsync(`
              DELETE FROM checkins;
              DELETE FROM habits;
            `);
          }

          for (const habit of habits) {
            await saveHabitRecordInternal(db, habit);
          }

          await saveCheckinRecordsChunkedInternal(db, checkins);
        });
      } catch (err) {
        // Rollback memory cache if native SQLite transaction fails
        memoryHabits = prevHabits;
        memoryCheckins = prevCheckins;
        throw err;
      }
    },
    () => {}
  );
};

/**
 * High-performance batch insertion for large datasets (e.g. Loop Habits backup with 8500+ records).
 * Uses SQLite transaction with batched multi-row INSERTs to complete in milliseconds.
 */
export const batchInsertLoopData = async (
  habits: Habit[],
  checkins: HabitCheckin[]
): Promise<void> => {
  // Update memory fallbacks
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

  await runSerialized(
    async (db) => {
      await db.withTransactionAsync(async () => {
        // Save habits
        for (const habit of habits) {
          await saveHabitRecordInternal(db, habit);
        }

        // Save checkins in chunks of 150
        await saveCheckinRecordsChunkedInternal(db, checkins);
      });
    },
    () => {}
  );
};

export const batchSaveHabits = async (habits: Habit[]): Promise<void> => {
  const now = new Date().toISOString();
  const normalizedHabits = habits.map((h) => ({
    ...h,
    updatedAt: h.updatedAt || now,
  }));

  normalizedHabits.forEach((h) => {
    const idx = memoryHabits.findIndex((x) => x.id === h.id);
    if (idx >= 0) memoryHabits[idx] = h;
    else memoryHabits.push(h);
  });

  await runSerialized(
    async (db) => {
      await db.withTransactionAsync(async () => {
        for (const habit of normalizedHabits) {
          await saveHabitRecordInternal(db, habit);
        }
      });
    },
    () => {}
  );
};

/**
 * Saves multiple checkin records atomically within a single SQLite transaction.
 * Significantly faster than sequential individual writes.
 */
export const batchSaveCheckinRecords = async (checkins: HabitCheckin[]): Promise<void> => {
  if (checkins.length === 0) return;

  const prevCheckins = [...memoryCheckins];

  // Update memory fallbacks
  checkins.forEach((c) => {
    const idx = memoryCheckins.findIndex(
      (x) => x.habitId === c.habitId && x.date === c.date
    );
    if (idx >= 0) memoryCheckins[idx] = c;
    else memoryCheckins.push(c);
  });

  await runSerialized(
    async (db) => {
      try {
        await db.withTransactionAsync(async () => {
          await saveCheckinRecordsChunkedInternal(db, checkins);
        });
      } catch (err) {
        memoryCheckins = prevCheckins;
        throw err;
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
        await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE); PRAGMA optimize; VACUUM;');
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

export interface DeduplicateResult {
  mergedHabitsCount: number;
  migratedCheckinsCount: number;
}

/**
 * Deduplicate local habits with identical names.
 * Consolidates duplicate records into the canonical habit (the one with checkins or oldest),
 * re-assigns checkins without loss, merges note/counts on conflicting dates,
 * registers tombstones in deleted_habits, and purges the duplicate records.
 */
export const deduplicateLocalHabits = async (): Promise<DeduplicateResult> => {
  return runSerialized(
    async (db) => {
      let mergedHabitsCount = 0;
      let migratedCheckinsCount = 0;

      const habitRows = await db.getAllAsync<{
        id: string;
        name: string;
        created_at: string;
      }>('SELECT id, name, created_at FROM habits ORDER BY created_at ASC;');

      const byName = new Map<string, { id: string; name: string; created_at: string }[]>();
      for (const h of habitRows) {
        const key = h.name.trim().toLowerCase();
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key)!.push(h);
      }

      await db.withTransactionAsync(async () => {
        for (const [, group] of byName.entries()) {
          if (group.length <= 1) continue;

          // Find checkin counts for each habit in group
          const checkinCounts = new Map<string, number>();
          for (const h of group) {
            const row = await db.getFirstAsync<{ count: number }>(
              'SELECT count(*) as count FROM checkins WHERE habit_id = ?;',
              [h.id]
            );
            checkinCounts.set(h.id, row?.count || 0);
          }

          group.sort((a, b) => {
            const ca = checkinCounts.get(a.id) || 0;
            const cb = checkinCounts.get(b.id) || 0;
            if (cb !== ca) return cb - ca;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          const canonical = group[0];
          const duplicates = group.slice(1);

          for (const dup of duplicates) {
            const dupCheckins = await db.getAllAsync<{
              id: string;
              date: string;
              count: number;
              completed: number;
              note: string | null;
              updated_at: string;
            }>('SELECT * FROM checkins WHERE habit_id = ?;', [dup.id]);

            for (const dc of dupCheckins) {
              const canonicalCheckin = await db.getFirstAsync<{
                id: string;
                count: number;
                completed: number;
                note: string | null;
                updated_at: string;
              }>('SELECT * FROM checkins WHERE habit_id = ? AND date = ?;', [
                canonical.id,
                dc.date,
              ]);

              if (canonicalCheckin) {
                const mergedCompleted = canonicalCheckin.completed === 1 || dc.completed === 1 ? 1 : 0;
                const mergedCount = Math.max(canonicalCheckin.count, dc.count);
                let mergedNote = canonicalCheckin.note;
                if (!mergedNote && dc.note) {
                  mergedNote = dc.note;
                } else if (mergedNote && dc.note && mergedNote !== dc.note) {
                  mergedNote = `${mergedNote} | ${dc.note}`;
                }
                await db.runAsync(
                  'UPDATE checkins SET completed = ?, count = ?, note = ? WHERE id = ?;',
                  [mergedCompleted, mergedCount, mergedNote, canonicalCheckin.id]
                );
                await db.runAsync('DELETE FROM checkins WHERE id = ?;', [dc.id]);
              } else {
                await db.runAsync(
                  'UPDATE checkins SET habit_id = ? WHERE id = ?;',
                  [canonical.id, dc.id]
                );
                migratedCheckinsCount++;
              }
            }

            // Record tombstone so sync propagates deletion
            await db.runAsync(
              'INSERT OR REPLACE INTO deleted_habits (id, deleted_at) VALUES (?, ?);',
              [dup.id, new Date().toISOString()]
            );

            // Delete duplicate habit
            await db.runAsync('DELETE FROM habits WHERE id = ?;', [dup.id]);
            mergedHabitsCount++;
          }
        }
      });

      if (mergedHabitsCount > 0) {
        const remainingHabits = await fetchAllHabits();
        const remainingCheckins = await fetchAllCheckins();
        memoryHabits = remainingHabits;
        memoryCheckins = remainingCheckins;
      }

      return { mergedHabitsCount, migratedCheckinsCount };
    },
    () => {
      let mergedHabitsCount = 0;
      let migratedCheckinsCount = 0;
      const byName = new Map<string, Habit[]>();
      for (const h of memoryHabits) {
        const key = h.name.trim().toLowerCase();
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key)!.push(h);
      }

      for (const [, group] of byName.entries()) {
        if (group.length <= 1) continue;
        const canonical = group[0];
        const duplicates = group.slice(1);
        for (const dup of duplicates) {
          memoryCheckins.forEach((c) => {
            if (c.habitId === dup.id) {
              c.habitId = canonical.id;
              migratedCheckinsCount++;
            }
          });
          memoryHabits = memoryHabits.filter((h) => h.id !== dup.id);
          if (!memoryDeletedHabitIds.includes(dup.id)) {
            memoryDeletedHabitIds.push(dup.id);
          }
          mergedHabitsCount++;
        }
      }
      return { mergedHabitsCount, migratedCheckinsCount };
    }
  );
};


