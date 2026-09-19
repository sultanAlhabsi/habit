import dayjs from 'dayjs';
import type { Habit, HabitCheckin } from '../types/habit';

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  appName: 'enjaz-habits';
  habits: Habit[];
  checkins: HabitCheckin[];
  metadata?: {
    theme_mode?: string;
    haptics_enabled?: string;
    sound_enabled?: string;
    notifications_enabled?: string;
  };
}

export interface ValidationSuccess {
  valid: true;
  data: BackupPayload;
}

export interface ValidationFailure {
  valid: false;
  error: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Creates a structured JSON backup object with metadata.
 */
export const createBackupPayload = (
  habits: Habit[],
  checkins: HabitCheckin[],
  metadata: Record<string, string> = {}
): BackupPayload => {
  return {
    version: 1,
    exportedAt: dayjs().toISOString(),
    appName: 'enjaz-habits',
    habits,
    checkins,
    metadata: {
      theme_mode: metadata.theme_mode || 'system',
      haptics_enabled: metadata.haptics_enabled || 'true',
      sound_enabled: metadata.sound_enabled || 'true',
      notifications_enabled: metadata.notifications_enabled || 'true',
    },
  };
};

/**
 * Validates a raw JSON string to ensure it satisfies backup schema requirements.
 */
export const validateBackupJson = (rawJson: string): ValidationResult => {
  if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
    return { valid: false, error: 'النص المدخل فارغ' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { valid: false, error: 'صيغة JSON غير صالحة' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, error: 'هيكل البيانات غير صالح' };
  }

  if (parsed.appName !== 'enjaz-habits') {
    return { valid: false, error: 'الملف لا يتبع تطبيق إنجاز' };
  }

  if (!Array.isArray(parsed.habits)) {
    return { valid: false, error: 'قائمة العادات غير موجودة أو تالفة' };
  }

  if (!Array.isArray(parsed.checkins)) {
    return { valid: false, error: 'سجلات الإنجاز غير موجودة أو تالفة' };
  }

  // Validate each habit
  for (let i = 0; i < parsed.habits.length; i++) {
    const h = parsed.habits[i];
    if (
      !h ||
      typeof h.id !== 'string' ||
      typeof h.name !== 'string' ||
      typeof h.frequency !== 'string' ||
      typeof h.createdAt !== 'string' ||
      (h.isPinned !== undefined && typeof h.isPinned !== 'boolean')
    ) {
      return { valid: false, error: `العادة رقم ${i + 1} تحتوي على حقول مفقودة أو غير صالحة` };
    }
  }

  // Validate each checkin
  for (let j = 0; j < parsed.checkins.length; j++) {
    const c = parsed.checkins[j];
    if (
      !c ||
      typeof c.id !== 'string' ||
      typeof c.habitId !== 'string' ||
      typeof c.date !== 'string' ||
      typeof c.completed !== 'boolean' ||
      (c.note !== undefined && typeof c.note !== 'string')
    ) {
      return { valid: false, error: `سجل الإنجاز رقم ${j + 1} يحتوي على بيانات تالفة` };
    }
  }

  return {
    valid: true,
    data: parsed as BackupPayload,
  };
};

/**
 * Merges backup habits and checkins with existing items without duplicates.
 */
export const mergeBackupData = (
  currentHabits: Habit[],
  currentCheckins: HabitCheckin[],
  backup: BackupPayload
): { habits: Habit[]; checkins: HabitCheckin[] } => {
  const habitMap = new Map<string, Habit>();
  // Start with existing habits
  currentHabits.forEach((h) => habitMap.set(h.id, h));
  // Add backup habits if not present, or preserve existing
  backup.habits.forEach((h) => {
    if (!habitMap.has(h.id)) {
      habitMap.set(h.id, h);
    }
  });

  const checkinMap = new Map<string, HabitCheckin>();
  // Key checkins by habitId:date
  currentCheckins.forEach((c) => checkinMap.set(`${c.habitId}:${c.date}`, c));
  backup.checkins.forEach((c) => {
    const key = `${c.habitId}:${c.date}`;
    if (!checkinMap.has(key)) {
      checkinMap.set(key, c);
    } else {
      // If already present, keep the one with newer updatedAt
      const existing = checkinMap.get(key)!;
      if (dayjs(c.updatedAt).isAfter(dayjs(existing.updatedAt))) {
        checkinMap.set(key, c);
      }
    }
  });

  return {
    habits: Array.from(habitMap.values()),
    checkins: Array.from(checkinMap.values()),
  };
};

