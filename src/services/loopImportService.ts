import type { Habit, HabitCheckin, HabitFrequency } from '../types/habit.ts';
import { HABIT_PALETTES } from '../theme/colors.ts';

export interface LoopBackupInspection {
  fileName: string;
  totalHabits: number;
  activeHabitsCount: number;
  archivedHabitsCount: number;
  totalCheckinsCount: number;
  notesCount: number;
  oldestRecordDate?: string;
  newestRecordDate?: string;
  habitsPreview: Array<{
    name: string;
    icon: string;
    color: string;
    isArchived: boolean;
    type: 'boolean' | 'numerical';
    unit: string;
    targetCount: number;
  }>;
}

export interface ConvertedLoopData {
  habits: Habit[];
  checkins: HabitCheckin[];
  inspection: LoopBackupInspection;
}

export interface RawLoopHabit {
  id: number;
  archived: number;
  color: number;
  description: string | null;
  freq_den: number;
  freq_num: number;
  highlight: number;
  name: string;
  position: number;
  reminder_hour: number | null;
  reminder_min: number | null;
  reminder_days: number;
  type: number; // 0: yes/no, 1: numerical
  target_type: number; // 0: at least, 1: at most
  target_value: number;
  unit: string;
  question: string | null;
  uuid: string | null;
}

export interface RawLoopRepetition {
  id: number;
  habit: number;
  timestamp: number; // Unix epoch ms
  value: number;
  notes: string | null;
}

/**
 * Maps Loop Habit Tracker color integers (0..19) to Enjaz refined palette colors.
 */
export const mapLoopColor = (colorIndex: number): string => {
  const loopColorMap: Record<number, string> = {
    0: '#991B1B', // Red -> burgundy/crimson
    1: '#9F1239', // Pink -> rose
    2: '#6D28D9', // Purple -> violet
    3: '#581C87', // Deep Purple -> plum
    4: '#4338CA', // Indigo -> indigo
    5: '#1E3A8A', // Blue -> navy
    6: '#0284C7', // Light Blue -> sky
    7: '#0E7490', // Cyan -> teal
    8: '#0F766E', // Teal -> emerald
    9: '#15803D', // Green -> mint
    10: '#2A4B3A', // Light Green -> sage
    11: '#3F6212', // Lime -> moss
    12: '#854D0E', // Yellow -> ochre
    13: '#B45309', // Amber -> amber
    14: '#C2410C', // Orange -> copper
    15: '#9A3412', // Deep Orange -> terracotta
    16: '#78350F', // Brown -> sand
    17: '#475569', // Grey -> steel
    18: '#334155', // Blue Grey -> slate
    19: '#1C1917', // Black -> charcoal
  };

  if (colorIndex in loopColorMap) {
    return loopColorMap[colorIndex];
  }
  const fallbackIndex = Math.abs(colorIndex) % HABIT_PALETTES.length;
  return HABIT_PALETTES[fallbackIndex]?.hex || '#2A4B3A';
};

/**
 * Intelligent icon detection that combines emojis and keywords from habit names.
 * Ensures habits like "حذف الصور" map directly to "images-outline", "قص الاظافر" to "cut-outline", etc.
 */
export const detectHabitIcon = (name: string): string => {
  const trimmed = (name || '').trim();
  const lower = trimmed.toLowerCase();

  // High-priority exact keyword rules
  if (lower.includes('حذف الصور') || lower.includes('تنظيف الصور') || lower.includes('الصور') || lower.includes('صور')) {
    return 'images-outline';
  }
  if (lower.includes('قص الاظافر') || lower.includes('قص الأظافر') || lower.includes('أظافر') || lower.includes('اظافر')) {
    return 'cut-outline';
  }
  if (lower.includes('هاتف') || lower.includes('جوال') || lower.includes('شاشة') || lower.includes('موبايل')) {
    return 'phone-portrait-outline';
  }
  if (lower.includes('استغفار') || lower.includes('أستغفار') || lower.includes('سحاب') || lower.includes('oci')) {
    return 'cloud-outline';
  }
  if (lower.includes('ألعاب الذكاء') || lower.includes('العاب الذكاء') || lower.includes('ذكاء')) {
    return 'game-controller-outline';
  }
  if (lower.includes('بلغوا عني') || lower.includes('نشر') || lower.includes('مشاركة')) {
    return 'repeat-outline';
  }
  if (lower.includes('سواك') || lower.includes('السواك') || lower.includes('فرشاة') || lower.includes('أسنان')) {
    return 'brush-outline';
  }
  if (lower.includes('عصافير') || lower.includes('طيور') || lower.includes('حيوان') || lower.includes('قطط')) {
    return 'paw-outline';
  }
  if (lower.includes('صدقة') || lower.includes('تبرع') || lower.includes('زكاة') || lower.includes('إحسان')) {
    return 'gift-outline';
  }
  if (lower.includes('قرآن') || lower.includes('القرآن') || lower.includes('قران') || lower.includes('مصحف')) {
    return 'book-outline';
  }
  if (lower.includes('كتابة') || lower.includes('تدوين') || lower.includes('يوميات') || lower.includes('مذكرات')) {
    return 'pencil-outline';
  }
  if (lower.includes('شرب الماء') || lower.includes('ماء') || lower.includes('الماء') || lower.includes('سوائل')) {
    return 'water-outline';
  }
  if (lower.includes('سورة') || lower.includes('جزء عم') || lower.includes('الكهف') || lower.includes('الفرقان')) {
    return 'star-outline';
  }
  if (lower.includes('تداول') || lower.includes('أسهم') || lower.includes('استثمار') || lower.includes('بورصة')) {
    return 'trending-up-outline';
  }
  if (lower.includes('صيام') || lower.includes('صوم') || lower.includes('إفطار')) {
    return 'restaurant-outline';
  }
  if (lower.includes('مشي') || lower.includes('خطوة') || lower.includes('خطوات')) {
    return 'walk-outline';
  }
  if (lower.includes('ركض') || lower.includes('جري') || lower.includes('هرولة')) {
    return 'footsteps-outline';
  }
  if (lower.includes('بلانك') || lower.includes('ضغط') || lower.includes('حديد') || lower.includes('أثقال') || lower.includes('تمارين') || lower.includes('رياضة')) {
    return 'fitness-outline';
  }
  if (lower.includes('صباح') || lower.includes('ضحى') || lower.includes('شروق')) {
    return 'sunny-outline';
  }
  if (lower.includes('مساء') || lower.includes('ليل') || lower.includes('نوم') || lower.includes('فجر') || lower.includes('وتر')) {
    return 'moon-outline';
  }
  if (lower.includes('تنفس') || lower.includes('يوغا') || lower.includes('استرخاء') || lower.includes('جولاين')) {
    return 'body-outline';
  }
  if (lower.includes('تعب') || lower.includes('إرهاق') || lower.includes('راحة')) {
    return 'bed-outline';
  }
  if (lower.includes('تطوير') || lower.includes('أفكار')) {
    return 'bulb-outline';
  }
  if (lower.includes('أسبوعية') || lower.includes('اسبوعية') || lower.includes('جدول')) {
    return 'calendar-outline';
  }
  if (lower.includes('تسعين') || lower.includes('تحدي')) {
    return 'hourglass-outline';
  }

  // Emoji based lookup
  const emojiMap: Record<string, string> = {
    '📷': 'images-outline',
    '📸': 'images-outline',
    '🤚': 'cut-outline',
    '✋': 'cut-outline',
    '📵': 'phone-portrait-outline',
    '📱': 'phone-portrait-outline',
    '☁️': 'cloud-outline',
    '⛅': 'cloud-outline',
    '🧠': 'game-controller-outline',
    '🎮': 'game-controller-outline',
    '⭐️': 'star-outline',
    '✨️': 'star-outline',
    '🌟': 'star-outline',
    '🕊': 'paw-outline',
    '🪥': 'brush-outline',
    '✏️': 'pencil-outline',
    '📝': 'pencil-outline',
    '🚿': 'water-outline',
    '🍱': 'restaurant-outline',
    '🧎': 'sparkles-outline',
    '💧': 'water-outline',
    '📚': 'book-outline',
    '📖': 'book-outline',
    '💪': 'barbell-outline',
    '🏋': 'barbell-outline',
    '📊': 'trending-up-outline',
    '🌻': 'flower-outline',
    '🌸': 'flower-outline',
    '🪻': 'flower-outline',
    '🌙': 'moon-outline',
    '☀️': 'sunny-outline',
    '🌤': 'sunny-outline',
    '🚶': 'walk-outline',
    '🏃': 'footsteps-outline',
    '🤸': 'fitness-outline',
    '🔁': 'repeat-outline',
    '🤲': 'sparkles-outline',
    '🧘': 'body-outline',
    '🤍': 'gift-outline',
    '💛': 'gift-outline',
    '🧖': 'water-outline',
    '😮': 'bed-outline',
    '🏅': 'trophy-outline',
    '🏆': 'trophy-outline',
    '👽': 'body-outline',
    '🏌': 'fitness-outline',
    '💤': 'moon-outline',
    '💮': 'heart-half-outline',
    '🧴': 'sparkles-outline',
  };

  for (const [emoji, icon] of Object.entries(emojiMap)) {
    if (trimmed.includes(emoji)) {
      return icon;
    }
  }

  return 'sparkles-outline';
};

/**
 * Converts raw Loop Habits and Repetitions into Enjaz Habit and HabitCheckin models.
 */
export const convertLoopRawRecords = (
  rawHabits: RawLoopHabit[],
  rawReps: RawLoopRepetition[],
  fileName = 'Loop Habits Backup.db'
): ConvertedLoopData => {
  // Sort repetitions chronologically
  rawReps.sort((a, b) => a.timestamp - b.timestamp);

  // Map habits by their original Loop ID
  const loopHabitMap = new Map<number, RawLoopHabit>();
  rawHabits.forEach((h) => loopHabitMap.set(h.id, h));

  // Find earliest and latest repetition timestamp per habit and overall
  const habitMinTimestamp = new Map<number, number>();
  let overallMinTimestamp = Infinity;
  let overallMaxTimestamp = 0;

  for (const rep of rawReps) {
    if (!habitMinTimestamp.has(rep.habit) || rep.timestamp < habitMinTimestamp.get(rep.habit)!) {
      habitMinTimestamp.set(rep.habit, rep.timestamp);
    }
    if (rep.timestamp < overallMinTimestamp) overallMinTimestamp = rep.timestamp;
    if (rep.timestamp > overallMaxTimestamp) overallMaxTimestamp = rep.timestamp;
  }

  const enjazHabits: Habit[] = [];
  const habitIdMap = new Map<number, string>(); // loopId -> enjazId
  const timestampNow = Date.now();

  let activeCount = 0;
  let archivedCount = 0;

  const habitsPreview: LoopBackupInspection['habitsPreview'] = [];

  for (const h of rawHabits) {
    const isArchived = h.archived === 1;
    if (isArchived) archivedCount++;
    else activeCount++;

    const enjazId = `loop_${h.id}_${timestampNow}`;
    habitIdMap.set(h.id, enjazId);

    const icon = detectHabitIcon(h.name);
    const color = mapLoopColor(h.color);

    // Map frequency
    let frequency: HabitFrequency;
    let frequencyDays: number[];

    if (h.freq_num === 1 && h.freq_den === 1) {
      frequency = 'daily';
      frequencyDays = [0, 1, 2, 3, 4, 5, 6];
    } else {
      frequency = 'weekly_target';
      // For weekly target, set days to all days
      frequencyDays = [0, 1, 2, 3, 4, 5, 6];
    }

    // Map target count & unit
    let targetCount: number;
    let unit: string;

    if (h.type === 1) {
      // Numerical habit
      targetCount = Math.max(1, Math.round(h.target_value));
      unit = (h.unit || '').trim() || 'مرة';
    } else {
      // Boolean habit
      targetCount = 1;
      unit = 'مرة';
    }

    // Map reminder time
    let reminderTime: string | null = null;
    if (
      h.reminder_hour !== null &&
      h.reminder_min !== null &&
      h.reminder_hour >= 0 &&
      h.reminder_min >= 0
    ) {
      const hh = String(h.reminder_hour).padStart(2, '0');
      const mm = String(h.reminder_min).padStart(2, '0');
      reminderTime = `${hh}:${mm}`;
    }

    // Determine created date based on earliest repetition
    const earliestTs = habitMinTimestamp.get(h.id);
    const createdAt = earliestTs
      ? new Date(earliestTs).toISOString()
      : new Date().toISOString();

    const archivedAt = isArchived ? new Date().toISOString() : null;

    const habit: Habit = {
      id: enjazId,
      name: h.name.trim(),
      description: h.description?.trim() || undefined,
      icon,
      color,
      frequency,
      frequencyDays,
      targetCount,
      unit,
      isActive: !isArchived,
      reminderTime,
      isPinned: false,
      createdAt,
      archivedAt,
    };

    enjazHabits.push(habit);

    habitsPreview.push({
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      isArchived,
      type: h.type === 1 ? 'numerical' : 'boolean',
      unit: habit.unit,
      targetCount: habit.targetCount,
    });
  }

  // Convert Repetitions into HabitCheckins
  const enjazCheckins: HabitCheckin[] = [];
  let notesCount = 0;

  for (const rep of rawReps) {
    const originalHabit = loopHabitMap.get(rep.habit);
    const enjazHabitId = habitIdMap.get(rep.habit);
    if (!originalHabit || !enjazHabitId) continue;

    // In Loop Habits, timestamps are stored at exact UTC midnight
    const dateStr = new Date(rep.timestamp).toISOString().split('T')[0];
    const hasNote = Boolean(rep.notes && rep.notes.trim());
    if (hasNote) notesCount++;

    let completed = false;
    let count = 0;

    if (originalHabit.type === 0) {
      // Boolean habit: 2 = completed, 0/3/-1 = uncompleted
      if (rep.value === 2) {
        completed = true;
        count = 1;
      } else if (hasNote) {
        completed = false;
        count = 0;
      } else {
        // Skip uncompleted empty entries
        continue;
      }
    } else {
      // Numerical habit: Loop stores repetition value multiplied by 1000
      const actualVal = rep.value / 1000.0;
      count = Math.max(0, Math.round(actualVal));

      if (originalHabit.target_type === 1) {
        // At most (e.g. less phone time)
        completed = actualVal <= originalHabit.target_value && actualVal > 0;
      } else {
        // At least
        completed = actualVal >= originalHabit.target_value;
      }

      if (count <= 0 && !completed && !hasNote) {
        // Skip empty uncompleted entry
        continue;
      }
    }

    const checkinId = `chk_${enjazHabitId}_${dateStr}`;
    const checkinUpdatedAt = new Date(rep.timestamp + 12 * 3600 * 1000).toISOString();

    enjazCheckins.push({
      id: checkinId,
      habitId: enjazHabitId,
      date: dateStr,
      count,
      completed,
      updatedAt: checkinUpdatedAt,
      note: hasNote ? rep.notes!.trim() : undefined,
    });
  }

  const oldestDate =
    overallMinTimestamp !== Infinity
      ? new Date(overallMinTimestamp).toISOString().split('T')[0]
      : undefined;
  const newestDate =
    overallMaxTimestamp > 0
      ? new Date(overallMaxTimestamp).toISOString().split('T')[0]
      : undefined;

  const inspection: LoopBackupInspection = {
    fileName,
    totalHabits: rawHabits.length,
    activeHabitsCount: activeCount,
    archivedHabitsCount: archivedCount,
    totalCheckinsCount: enjazCheckins.length,
    notesCount,
    oldestRecordDate: oldestDate,
    newestRecordDate: newestDate,
    habitsPreview,
  };

  return {
    habits: enjazHabits,
    checkins: enjazCheckins,
    inspection,
  };
};

/**
 * Inspects a Loop Habits SQLite database on device via expo-sqlite and expo-file-system.
 */
export const inspectAndParseLoopDatabase = async (
  pickedUri: string,
  fileName = 'Loop Habits Backup.db'
): Promise<ConvertedLoopData> => {
  let SQLite: typeof import('expo-sqlite');
  let FileSystem: typeof import('expo-file-system/legacy');

  try {
    SQLite = require('expo-sqlite');
    FileSystem = require('expo-file-system/legacy');
  } catch (err) {
    throw new Error('تعذر تحميل مكتبات النظام لقراءة قاعدة البيانات.');
  }

  const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
  }

  const tempDbName = `temp_loop_import_${Date.now()}.db`;
  const tempDbPath = `${sqliteDir}/${tempDbName}`;

  try {
    // Copy the picked file to SQLite folder so expo-sqlite can open it directly
    await FileSystem.copyAsync({ from: pickedUri, to: tempDbPath });

    const loopDb = await SQLite.openDatabaseAsync(tempDbName, {
      useNewConnection: true,
    });

    // Verify required tables exist
    const tables = await loopDb.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Habits', 'Repetitions');`
    );
    const tableNames = tables.map((t) => t.name.toLowerCase());
    if (!tableNames.includes('habits') || !tableNames.includes('repetitions')) {
      await loopDb.closeAsync();
      throw new Error('الملف المختار ليس قاعدة بيانات صالحة لتطبيق Loop Habit Tracker.');
    }

    const rawHabits = await loopDb.getAllAsync<RawLoopHabit>(
      'SELECT * FROM Habits ORDER BY position, id;'
    );
    const rawReps = await loopDb.getAllAsync<RawLoopRepetition>(
      'SELECT * FROM Repetitions ORDER BY timestamp ASC;'
    );

    await loopDb.closeAsync();

    return convertLoopRawRecords(rawHabits, rawReps, fileName);
  } finally {
    // Clean up temporary database file
    try {
      await FileSystem.deleteAsync(tempDbPath, { idempotent: true });
    } catch {}
  }
};
