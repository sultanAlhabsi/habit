/**
 * Neon PostgreSQL Serverless Cloud Service
 * Communicates directly with Neon's HTTP SQL endpoint over HTTPS.
 * Fully compatible with React Native / Hermes (Zero Node native binary dependencies).
 *
 * SECURITY: The DATABASE_URL is never hardcoded here.
 * It is injected at build time from EAS Secrets via app.config.js → expo.extra.databaseUrl.
 * Manage the secret with: `eas env:set --scope project --name DATABASE_URL --visibility secret`
 */

let _expoConstants: any = undefined;
const getExpoConstants = () => {
  if (_expoConstants !== undefined) return _expoConstants;
  try {
    const mod = require('expo-constants');
    _expoConstants = mod?.default ?? mod;
  } catch {
    _expoConstants = null;
  }
  return _expoConstants;
};

import type { Habit, HabitCheckin } from '../types/habit';

/**
 * Reads the Neon PostgreSQL connection string from EAS Secrets (injected at build time).
 * Returns null if not configured — cloud sync will be silently disabled.
 */
export const getNeonConnectionString = (): string | null => {
  const constants = getExpoConstants();
  return (constants?.expoConfig?.extra?.databaseUrl as string | undefined) ?? null;
};

export const NEON_CONNECTION_STRING: string | null = getNeonConnectionString();

const _getHost = (connStr: string | null): string | null => {
  if (!connStr) return null;
  try {
    const url = new URL(connStr);
    return url.hostname;
  } catch {
    return null;
  }
};

export interface NeonQueryResult<T = any> {
  rows?: T[];
  fields?: Array<{ name: string; dataTypeID: number }>;
  command?: string;
  rowCount?: number;
}

/**
 * Execute a parameterized query against the Neon PostgreSQL HTTP endpoint.
 * Throws immediately if DATABASE_URL was not provided via EAS Secrets.
 */
export const runNeonQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const connString = getNeonConnectionString() || NEON_CONNECTION_STRING;
  const host = _getHost(connString);
  const endpoint = host ? `https://${host}/sql` : null;

  if (!endpoint || !connString) {
    throw new Error('[NeonService] DATABASE_URL is not configured. Cloud sync is unavailable.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': connString,
      },
      body: JSON.stringify({ query, params }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Neon HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const data: NeonQueryResult<T> = await response.json();
    return data.rows || [];
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Neon request timed out (12s)');
    }
    throw error;
  }
};

/**
 * Check if the remote Neon database is reachable.
 */
export const checkNeonConnection = async (): Promise<boolean> => {
  try {
    const res = await runNeonQuery<{ now: string }>('SELECT NOW() as now;');
    return Array.isArray(res) && res.length > 0;
  } catch (error) {
    return false;
  }
};

let _schemaInitialized = false;

const NEON_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS habits (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    frequency_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_count INTEGER NOT NULL DEFAULT 1,
    weekly_target_count INTEGER,
    monthly_target_count INTEGER,
    monthly_day INTEGER,
    unit VARCHAR(50) NOT NULL DEFAULT 'مرة',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_time VARCHAR(20),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS checkins (
    id VARCHAR(255) PRIMARY KEY,
    habit_id VARCHAR(255) NOT NULL,
    date VARCHAR(20) NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT,
    CONSTRAINT unique_habit_date UNIQUE(habit_id, date)
  );`,
  `CREATE TABLE IF NOT EXISTS meta (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS deleted_habits (
    id VARCHAR(255) PRIMARY KEY,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS frequency_days JSONB NOT NULL DEFAULT '[]'::jsonb;`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_count INTEGER NOT NULL DEFAULT 1;`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS weekly_target_count INTEGER;`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS monthly_target_count INTEGER;`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS monthly_day INTEGER;`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NOT NULL DEFAULT 'مرة';`,
  `ALTER TABLE habits ADD COLUMN IF NOT EXISTS reminder_time VARCHAR(20);`,
  `ALTER TABLE checkins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE checkins ADD COLUMN IF NOT EXISTS note TEXT;`,
  `ALTER TABLE meta ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
];

/**
 * Initialize the required relational tables on Neon PostgreSQL.
 */
export const initNeonSchema = async (): Promise<void> => {
  if (_schemaInitialized) return;

  try {
    for (const statement of NEON_SCHEMA_STATEMENTS) {
      await runNeonQuery(statement);
    }
    _schemaInitialized = true;
  } catch (migErr) {
    console.warn('[NeonService] Non-fatal schema migration notice:', migErr);
  }
};

/**
 * Fetch all habits from Neon cloud.
 */
export const fetchNeonHabits = async (): Promise<Habit[]> => {
  const rows = await runNeonQuery<any>(
    'SELECT * FROM habits ORDER BY order_index ASC, created_at ASC;'
  );

  return rows.map((r) => {
    let frequencyDays: number[] = [0, 1, 2, 3, 4, 5, 6];
    if (typeof r.frequency_days === 'string') {
      try {
        frequencyDays = JSON.parse(r.frequency_days);
      } catch {}
    } else if (Array.isArray(r.frequency_days)) {
      frequencyDays = r.frequency_days;
    }

    return {
      id: String(r.id),
      name: String(r.name),
      description: r.description ? String(r.description) : undefined,
      icon: String(r.icon),
      color: String(r.color),
      frequency: r.frequency,
      frequencyDays,
      targetCount: Number(r.target_count || 1),
      weeklyTargetCount:
        r.weekly_target_count !== null && r.weekly_target_count !== undefined
          ? Number(r.weekly_target_count)
          : undefined,
      monthlyTargetCount:
        r.monthly_target_count !== null && r.monthly_target_count !== undefined
          ? Number(r.monthly_target_count)
          : undefined,
      monthlyDay:
        r.monthly_day !== null && r.monthly_day !== undefined
          ? Number(r.monthly_day)
          : undefined,
      unit: String(r.unit || 'مرة'),
      isActive: r.is_active === 1 || r.is_active === true || r.is_active === '1',
      reminderTime: r.reminder_time ? String(r.reminder_time) : undefined,
      isPinned: r.is_pinned === 1 || r.is_pinned === true || r.is_pinned === '1',
      order:
        r.order_index !== null && r.order_index !== undefined
          ? Number(r.order_index)
          : undefined,
      createdAt: new Date(r.created_at).toISOString(),
      archivedAt: r.archived_at ? new Date(r.archived_at).toISOString() : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    };
  });
};

/**
 * Serialize a Habit object into strongly-typed parameters for Neon PostgreSQL.
 * Ensures PostgreSQL boolean primitives (true/false) are used rather than integers (1/0).
 */
export const serializeNeonHabitParams = (habit: Habit): any[] => [
  habit.id,
  habit.name,
  habit.description || null,
  habit.icon,
  habit.color,
  habit.frequency,
  JSON.stringify(habit.frequencyDays || []),
  habit.targetCount,
  habit.weeklyTargetCount ?? null,
  habit.monthlyTargetCount ?? null,
  habit.monthlyDay ?? null,
  habit.unit,
  Boolean(habit.isActive),
  habit.reminderTime || null,
  Boolean(habit.isPinned),
  habit.order ?? 0,
  habit.createdAt,
  habit.archivedAt || null,
];

/**
 * Serialize a HabitCheckin object into strongly-typed parameters for Neon PostgreSQL.
 * Ensures PostgreSQL boolean primitives (true/false) are used rather than integers (1/0).
 */
export const serializeNeonCheckinParams = (checkin: HabitCheckin): any[] => [
  checkin.id,
  checkin.habitId,
  checkin.date,
  checkin.count,
  Boolean(checkin.completed),
  checkin.updatedAt || new Date().toISOString(),
  checkin.note || null,
];

/**
 * Upsert a single habit into Neon.
 */
export const upsertNeonHabit = async (habit: Habit): Promise<void> => {
  await runNeonQuery(
    `INSERT INTO habits (
      id, name, description, icon, color, frequency, frequency_days,
      target_count, weekly_target_count, monthly_target_count, monthly_day,
      unit, is_active, reminder_time, is_pinned, order_index, created_at, archived_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      icon = EXCLUDED.icon,
      color = EXCLUDED.color,
      frequency = EXCLUDED.frequency,
      frequency_days = EXCLUDED.frequency_days,
      target_count = EXCLUDED.target_count,
      weekly_target_count = EXCLUDED.weekly_target_count,
      monthly_target_count = EXCLUDED.monthly_target_count,
      monthly_day = EXCLUDED.monthly_day,
      unit = EXCLUDED.unit,
      is_active = EXCLUDED.is_active,
      reminder_time = EXCLUDED.reminder_time,
      is_pinned = EXCLUDED.is_pinned,
      order_index = EXCLUDED.order_index,
      archived_at = EXCLUDED.archived_at,
      updated_at = NOW();`,
    serializeNeonHabitParams(habit)
  );
};

/**
 * Fetch all checkins from Neon cloud.
 */
export const fetchNeonCheckins = async (): Promise<HabitCheckin[]> => {
  const rows = await runNeonQuery<any>(
    'SELECT * FROM checkins ORDER BY date DESC;'
  );

  return rows.map((r) => ({
    id: String(r.id),
    habitId: String(r.habit_id),
    date: String(r.date),
    count: r.count !== null && r.count !== undefined ? Number(r.count) : 0,
    completed: r.completed === 1 || r.completed === true || r.completed === '1',
    updatedAt: new Date(r.updated_at).toISOString(),
    note: r.note ? String(r.note) : undefined,
  }));
};

/**
 * Upsert a single checkin into Neon.
 */
export const upsertNeonCheckin = async (checkin: HabitCheckin): Promise<void> => {
  await runNeonQuery(
    `INSERT INTO checkins (
      id, habit_id, date, count, completed, updated_at, note
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (habit_id, date) DO UPDATE SET
      id = EXCLUDED.id,
      count = EXCLUDED.count,
      completed = EXCLUDED.completed,
      updated_at = EXCLUDED.updated_at,
      note = EXCLUDED.note;`,
    serializeNeonCheckinParams(checkin)
  );
};

/**
 * Fetch all meta preferences from Neon.
 */
export const fetchNeonMeta = async (): Promise<Record<string, string>> => {
  const rows = await runNeonQuery<{ key: string; value: string }>(
    'SELECT key, value FROM meta;'
  );
  const result: Record<string, string> = {};
  for (const r of rows) {
    result[r.key] = r.value;
  }
  return result;
};

/**
 * Set a single preference on Neon.
 */
export const setNeonMeta = async (key: string, value: string): Promise<void> => {
  await runNeonQuery(
    `INSERT INTO meta (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
    [key, value]
  );
};

/**
 * Permanently delete a habit and its checkins from Neon, and log in deleted_habits table.
 */
export const deleteNeonHabit = async (habitId: string): Promise<void> => {
  await runNeonQuery('DELETE FROM checkins WHERE habit_id = $1;', [habitId]);
  await runNeonQuery('DELETE FROM habits WHERE id = $1;', [habitId]);
  await runNeonQuery(
    `INSERT INTO deleted_habits (id, deleted_at) VALUES ($1, NOW())
     ON CONFLICT (id) DO UPDATE SET deleted_at = NOW();`,
    [habitId]
  );
};

/**
 * Fetch all deleted habit IDs from Neon tombstone table.
 */
export const fetchNeonDeletedHabits = async (): Promise<string[]> => {
  try {
    const rows = await runNeonQuery<{ id: string }>('SELECT id FROM deleted_habits;');
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
};

/**
 * Permanently delete a checkin for a habit on a specific date from Neon.
 */
export const deleteNeonCheckin = async (habitId: string, date: string): Promise<void> => {
  await runNeonQuery('DELETE FROM checkins WHERE habit_id = $1 AND date = $2;', [habitId, date]);
};

