import * as SQLite from 'expo-sqlite';
import dayjs from 'dayjs';
import { Habit, HabitCheckin } from '../types/habit';
import { INITIAL_HABITS, generateDemoCheckins } from './mockData';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

// Fallback in-memory store in case native SQLite is unavailable
let memoryHabits: Habit[] = [...INITIAL_HABITS];
let memoryCheckins: HabitCheckin[] = generateDemoCheckins();
let memoryMeta: Record<string, string> = {
  theme_mode: 'system',
  haptics_enabled: 'true',
};

const getDB = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await SQLite.openDatabaseAsync('enjaz_habits.db');
    return dbInstance;
  } catch (error) {
    console.warn('[Database] Native SQLite not available, falling back to memory store:', error);
    return null;
  }
};

export const initDatabase = async (): Promise<void> => {
  if (isInitialized) return;

  const db = await getDB();
  if (!db) {
    isInitialized = true;
    return;
  }

  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
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
        created_at TEXT NOT NULL,
        archived_at TEXT
      );

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

      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    // Safe migration: Add note column if upgrading from earlier version
    try {
      await db.execAsync('ALTER TABLE checkins ADD COLUMN note TEXT;');
    } catch {
      // Column already exists or already migrated
    }

    // Check if initial seed is needed
    const countResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits');
    if (!countResult || countResult.count === 0) {
      console.log('[Database] Seeding initial habits and history...');
      await seedDatabaseInternal(db);
    }

    isInitialized = true;
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    isInitialized = true;
  }
};

const seedDatabaseInternal = async (db: SQLite.SQLiteDatabase) => {
  for (const habit of INITIAL_HABITS) {
    await db.runAsync(
      `INSERT OR REPLACE INTO habits (
        id, name, description, icon, color, frequency, frequency_days,
        target_count, unit, is_active, reminder_time, created_at, archived_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        habit.createdAt,
        habit.archivedAt || null,
      ]
    );
  }

  const demoCheckins = generateDemoCheckins();
  for (const checkin of demoCheckins) {
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
  }
};

export const fetchAllHabits = async (): Promise<Habit[]> => {
  const db = await getDB();
  if (!db) return memoryHabits;

  try {
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
      createdAt: r.created_at,
      archivedAt: r.archived_at,
    }));
  } catch (error) {
    console.error('[Database] Failed to fetch habits:', error);
    return memoryHabits;
  }
};

export const saveHabitRecord = async (habit: Habit): Promise<void> => {
  const db = await getDB();
  if (!db) {
    const index = memoryHabits.findIndex((h) => h.id === habit.id);
    if (index >= 0) {
      memoryHabits[index] = habit;
    } else {
      memoryHabits.push(habit);
    }
    return;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO habits (
      id, name, description, icon, color, frequency, frequency_days,
      target_count, unit, is_active, reminder_time, created_at, archived_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      habit.createdAt,
      habit.archivedAt || null,
    ]
  );
};

export const deleteHabitRecord = async (habitId: string): Promise<void> => {
  const db = await getDB();
  if (!db) {
    memoryHabits = memoryHabits.filter((h) => h.id !== habitId);
    memoryCheckins = memoryCheckins.filter((c) => c.habitId !== habitId);
    return;
  }

  await db.runAsync('DELETE FROM habits WHERE id = ?', [habitId]);
  await db.runAsync('DELETE FROM checkins WHERE habit_id = ?', [habitId]);
};

export const fetchAllCheckins = async (): Promise<HabitCheckin[]> => {
  const db = await getDB();
  if (!db) return memoryCheckins;

  try {
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
  } catch (error) {
    console.error('[Database] Failed to fetch checkins:', error);
    return memoryCheckins;
  }
};

export const saveCheckinRecord = async (checkin: HabitCheckin): Promise<void> => {
  const db = await getDB();
  if (!db) {
    const idx = memoryCheckins.findIndex((c) => c.habitId === checkin.habitId && c.date === checkin.date);
    if (idx >= 0) {
      memoryCheckins[idx] = checkin;
    } else {
      memoryCheckins.push(checkin);
    }
    return;
  }

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

export const removeCheckinRecord = async (habitId: string, date: string): Promise<void> => {
  const db = await getDB();
  if (!db) {
    memoryCheckins = memoryCheckins.filter((c) => !(c.habitId === habitId && c.date === date));
    return;
  }

  await db.runAsync('DELETE FROM checkins WHERE habit_id = ? AND date = ?', [habitId, date]);
};

export const resetDatabase = async (): Promise<void> => {
  const db = await getDB();
  if (!db) {
    memoryHabits = [];
    memoryCheckins = [];
    return;
  }

  await db.execAsync(`
    DELETE FROM checkins;
    DELETE FROM habits;
  `);
};

export const seedDatabase = async (): Promise<void> => {
  const db = await getDB();
  if (!db) {
    memoryHabits = [...INITIAL_HABITS];
    memoryCheckins = generateDemoCheckins();
    return;
  }

  await db.execAsync(`
    DELETE FROM checkins;
    DELETE FROM habits;
  `);
  await seedDatabaseInternal(db);
};

export const getPreference = async (key: string, defaultValue = ''): Promise<string> => {
  const db = await getDB();
  if (!db) {
    return memoryMeta[key] ?? defaultValue;
  }
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      [key]
    );
    return row ? row.value : defaultValue;
  } catch (err) {
    console.warn(`[Database] Error getting preference ${key}:`, err);
    return defaultValue;
  }
};

export const setPreference = async (key: string, value: string): Promise<void> => {
  const db = await getDB();
  if (!db) {
    memoryMeta[key] = value;
    return;
  }
  try {
    await db.runAsync(
      'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
      [key, value]
    );
  } catch (err) {
    console.warn(`[Database] Error saving preference ${key}:`, err);
  }
};

export const archiveHabitRecord = async (habitId: string, archive: boolean): Promise<void> => {
  const db = await getDB();
  const archivedAt = archive ? dayjs().toISOString() : null;
  const isActive = archive ? 0 : 1;

  if (!db) {
    const idx = memoryHabits.findIndex((h) => h.id === habitId);
    if (idx >= 0) {
      memoryHabits[idx] = {
        ...memoryHabits[idx],
        archivedAt,
        isActive: !archive,
      };
    }
    return;
  }

  await db.runAsync(
    'UPDATE habits SET archived_at = ?, is_active = ? WHERE id = ?',
    [archivedAt, isActive, habitId]
  );
};

export const getAllPreferences = async (): Promise<Record<string, string>> => {
  const db = await getDB();
  if (!db) {
    return { ...memoryMeta };
  }
  try {
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM meta');
    const result: Record<string, string> = {};
    rows.forEach((r) => {
      result[r.key] = r.value;
    });
    return result;
  } catch (err) {
    console.warn('[Database] Error getting all preferences:', err);
    return { ...memoryMeta };
  }
};

export const importDatabaseRecords = async (
  habits: Habit[],
  checkins: HabitCheckin[],
  mode: 'replace' | 'merge'
): Promise<void> => {
  const db = await getDB();
  if (!db) {
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
        const idx = memoryCheckins.findIndex((x) => x.habitId === c.habitId && x.date === c.date);
        if (idx >= 0) memoryCheckins[idx] = c;
        else memoryCheckins.push(c);
      });
    }
    return;
  }

  if (mode === 'replace') {
    await db.execAsync(`
      DELETE FROM checkins;
      DELETE FROM habits;
    `);
  }

  for (const habit of habits) {
    await saveHabitRecord(habit);
  }

  for (const checkin of checkins) {
    await saveCheckinRecord(checkin);
  }
};


