import { create } from 'zustand';
import { Vibration } from 'react-native';
import dayjs from 'dayjs';
import { Habit, HabitCheckin } from '../types/habit';
import {
  initDatabase,
  fetchAllHabits,
  fetchAllCheckins,
  saveHabitRecord,
  deleteHabitRecord,
  saveCheckinRecord,
  removeCheckinRecord,
  resetDatabase,
  seedDatabase,
  getPreference,
  setPreference,
  archiveHabitRecord,
  getAllPreferences,
  importDatabaseRecords,
} from '../services/database';
import {
  scheduleHabitReminder,
  cancelHabitReminders,
  rescheduleAllHabitReminders,
  requestNotificationPermissions,
} from '../services/notificationService';
import {
  BackupPayload,
  createBackupPayload,
  mergeBackupData,
} from '../services/backupService';
import { ThemeMode } from '../theme/ThemeContext';

interface HabitState {
  habits: Habit[];
  checkins: HabitCheckin[];
  selectedDate: string;
  isLoading: boolean;
  filter: 'all' | 'pending' | 'completed';
  themeMode: ThemeMode;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;

  // Actions
  init: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setFilter: (filter: 'all' | 'pending' | 'completed') => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleHaptics: () => void;
  toggleNotifications: () => Promise<void>;
  addHabit: (data: Omit<Habit, 'id' | 'createdAt'>) => Promise<Habit>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabitActive: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string, archive?: boolean) => Promise<void>;
  restoreHabit: (habitId: string) => Promise<void>;
  toggleCheckin: (habitId: string, date?: string) => Promise<boolean>;
  incrementCheckin: (habitId: string, date?: string, step?: number) => Promise<void>;
  decrementCheckin: (habitId: string, date?: string, step?: number) => Promise<void>;
  seedData: () => Promise<void>;
  resetAllData: () => Promise<void>;
  exportBackup: () => Promise<BackupPayload>;
  importBackup: (backup: BackupPayload, mode: 'replace' | 'merge') => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  checkins: [],
  selectedDate: dayjs().format('YYYY-MM-DD'),
  isLoading: true,
  filter: 'all',
  themeMode: 'system',
  hapticsEnabled: true,
  notificationsEnabled: true,

  init: async () => {
    try {
      set({ isLoading: true });
      await initDatabase();
      const [habits, checkins, hapticsPref, notifPref] = await Promise.all([
        fetchAllHabits(),
        fetchAllCheckins(),
        getPreference('haptics_enabled', 'true'),
        getPreference('notifications_enabled', 'true'),
      ]);

      const notificationsEnabled = notifPref !== 'false';

      set({
        habits,
        checkins,
        hapticsEnabled: hapticsPref !== 'false',
        notificationsEnabled,
        isLoading: false,
      });

      // Synchronize notifications with system schedule
      await rescheduleAllHabitReminders(habits, notificationsEnabled);
    } catch (err) {
      console.error('[Store] Init error:', err);
      set({ isLoading: false });
    }
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  setFilter: (filter: 'all' | 'pending' | 'completed') => {
    set({ filter });
  },

  setThemeMode: (themeMode: ThemeMode) => {
    set({ themeMode });
  },

  toggleHaptics: () => {
    const nextVal = !get().hapticsEnabled;
    set({ hapticsEnabled: nextVal });
    setPreference('haptics_enabled', String(nextVal));
  },

  toggleNotifications: async () => {
    const nextVal = !get().notificationsEnabled;
    if (nextVal) {
      await requestNotificationPermissions();
    }
    set({ notificationsEnabled: nextVal });
    await setPreference('notifications_enabled', String(nextVal));
    await rescheduleAllHabitReminders(get().habits, nextVal);
  },

  addHabit: async (data) => {
    const newHabit: Habit = {
      ...data,
      id: `habit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: dayjs().toISOString(),
    };

    // Optimistic store update
    set((state) => ({ habits: [...state.habits, newHabit] }));
    await saveHabitRecord(newHabit);

    if (get().notificationsEnabled && newHabit.reminderTime) {
      await scheduleHabitReminder(newHabit);
    }

    return newHabit;
  },

  updateHabit: async (habit: Habit) => {
    set((state) => ({
      habits: state.habits.map((h) => (h.id === habit.id ? habit : h)),
    }));
    await saveHabitRecord(habit);

    if (get().notificationsEnabled && habit.isActive && !habit.archivedAt && habit.reminderTime) {
      await scheduleHabitReminder(habit);
    } else {
      await cancelHabitReminders(habit.id);
    }
  },

  deleteHabit: async (habitId: string) => {
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
      checkins: state.checkins.filter((c) => c.habitId !== habitId),
    }));
    await cancelHabitReminders(habitId);
    await deleteHabitRecord(habitId);
  },

  toggleHabitActive: async (habitId: string) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const updated: Habit = {
      ...habit,
      isActive: !habit.isActive,
    };

    set((state) => ({
      habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
    }));
    await saveHabitRecord(updated);

    if (get().notificationsEnabled && updated.isActive && !updated.archivedAt && updated.reminderTime) {
      await scheduleHabitReminder(updated);
    } else {
      await cancelHabitReminders(habitId);
    }
  },

  archiveHabit: async (habitId: string, archive = true) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const updated: Habit = {
      ...habit,
      isActive: !archive,
      archivedAt: archive ? dayjs().toISOString() : null,
    };

    set((state) => ({
      habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
    }));
    await archiveHabitRecord(habitId, archive);

    if (archive) {
      await cancelHabitReminders(habitId);
    } else if (get().notificationsEnabled && updated.reminderTime) {
      await scheduleHabitReminder(updated);
    }
  },

  restoreHabit: async (habitId: string) => {
    await get().archiveHabit(habitId, false);
  },

  toggleCheckin: async (habitId: string, targetDate?: string) => {
    const date = targetDate || get().selectedDate;
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return false;

    // Disallow checkins for future dates or dates before habit creation
    const targetDay = dayjs(date).startOf('day');
    const today = dayjs().startOf('day');
    const createdDay = dayjs(habit.createdAt).startOf('day');
    if (targetDay.isAfter(today) || targetDay.isBefore(createdDay)) {
      return false;
    }

    const existingCheckin = get().checkins.find(
      (c) => c.habitId === habitId && c.date === date && c.completed
    );

    if (existingCheckin) {
      // Remove checkin
      set((state) => ({
        checkins: state.checkins.filter(
          (c) => !(c.habitId === habitId && c.date === date)
        ),
      }));
      await removeCheckinRecord(habitId, date);
      return false; // Became unchecked
    } else {
      // Add checkin (full completion with targetCount)
      const targetCount = Math.max(1, habit.targetCount || 1);
      const newCheckin: HabitCheckin = {
        id: `chk_${habitId}_${date}`,
        habitId,
        date,
        count: targetCount,
        completed: true,
        updatedAt: dayjs().toISOString(),
      };

      set((state) => ({
        checkins: [
          ...state.checkins.filter(
            (c) => !(c.habitId === habitId && c.date === date)
          ),
          newCheckin,
        ],
      }));
      await saveCheckinRecord(newCheckin);
      if (get().hapticsEnabled) {
        try {
          Vibration.vibrate(14);
        } catch (_) {}
      }
      return true; // Became checked
    }
  },

  incrementCheckin: async (habitId: string, targetDate?: string, step = 1) => {
    const date = targetDate || get().selectedDate;
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    // Disallow checkins for future dates or dates before habit creation
    const targetDay = dayjs(date).startOf('day');
    const today = dayjs().startOf('day');
    const createdDay = dayjs(habit.createdAt).startOf('day');
    if (targetDay.isAfter(today) || targetDay.isBefore(createdDay)) {
      return;
    }

    const existing = get().checkins.find(
      (c) => c.habitId === habitId && c.date === date
    );
    const targetCount = Math.max(1, habit.targetCount || 1);
    const currentCount = existing ? existing.count : 0;
    const newCount = Math.min(targetCount, currentCount + Math.max(1, step));
    const isCompleted = newCount >= targetCount;

    const updatedCheckin: HabitCheckin = {
      id: existing ? existing.id : `chk_${habitId}_${date}`,
      habitId,
      date,
      count: newCount,
      completed: isCompleted,
      updatedAt: dayjs().toISOString(),
    };

    set((state) => ({
      checkins: [
        ...state.checkins.filter(
          (c) => !(c.habitId === habitId && c.date === date)
        ),
        updatedCheckin,
      ],
    }));
    await saveCheckinRecord(updatedCheckin);

    if (get().hapticsEnabled) {
      try {
        Vibration.vibrate(isCompleted ? 16 : 8);
      } catch (_) {}
    }
  },

  decrementCheckin: async (habitId: string, targetDate?: string, step = 1) => {
    const date = targetDate || get().selectedDate;
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const existing = get().checkins.find(
      (c) => c.habitId === habitId && c.date === date
    );
    if (!existing || existing.count <= 0) return;

    const newCount = existing.count - Math.max(1, step);

    if (newCount <= 0) {
      set((state) => ({
        checkins: state.checkins.filter(
          (c) => !(c.habitId === habitId && c.date === date)
        ),
      }));
      await removeCheckinRecord(habitId, date);
    } else {
      const targetCount = Math.max(1, habit.targetCount || 1);
      const updatedCheckin: HabitCheckin = {
        ...existing,
        count: newCount,
        completed: newCount >= targetCount,
        updatedAt: dayjs().toISOString(),
      };
      set((state) => ({
        checkins: [
          ...state.checkins.filter(
            (c) => !(c.habitId === habitId && c.date === date)
          ),
          updatedCheckin,
        ],
      }));
      await saveCheckinRecord(updatedCheckin);
    }

    if (get().hapticsEnabled) {
      try {
        Vibration.vibrate(8);
      } catch (_) {}
    }
  },

  seedData: async () => {
    set({ isLoading: true });
    await seedDatabase();
    const [habits, checkins] = await Promise.all([
      fetchAllHabits(),
      fetchAllCheckins(),
    ]);
    set({ habits, checkins, isLoading: false });
    await rescheduleAllHabitReminders(habits, get().notificationsEnabled);
  },

  resetAllData: async () => {
    set({ isLoading: true });
    await resetDatabase();
    set({ habits: [], checkins: [], isLoading: false });
    await rescheduleAllHabitReminders([], false);
  },

  exportBackup: async () => {
    const meta = await getAllPreferences();
    return createBackupPayload(get().habits, get().checkins, meta);
  },

  importBackup: async (backup: BackupPayload, mode: 'replace' | 'merge') => {
    set({ isLoading: true });

    let nextHabits: Habit[] = [];
    let nextCheckins: HabitCheckin[] = [];

    if (mode === 'replace') {
      nextHabits = [...backup.habits];
      nextCheckins = [...backup.checkins];
    } else {
      const merged = mergeBackupData(get().habits, get().checkins, backup);
      nextHabits = merged.habits;
      nextCheckins = merged.checkins;
    }

    await importDatabaseRecords(nextHabits, nextCheckins, mode);

    set({
      habits: nextHabits,
      checkins: nextCheckins,
      isLoading: false,
    });

    await rescheduleAllHabitReminders(nextHabits, get().notificationsEnabled);
  },
}));
