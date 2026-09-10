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
} from '../services/database';
import { ThemeMode } from '../theme/ThemeContext';

interface HabitState {
  habits: Habit[];
  checkins: HabitCheckin[];
  selectedDate: string;
  isLoading: boolean;
  filter: 'all' | 'pending' | 'completed';
  themeMode: ThemeMode;
  hapticsEnabled: boolean;

  // Actions
  init: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setFilter: (filter: 'all' | 'pending' | 'completed') => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleHaptics: () => void;
  addHabit: (data: Omit<Habit, 'id' | 'createdAt'>) => Promise<Habit>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabitActive: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string, archive?: boolean) => Promise<void>;
  toggleCheckin: (habitId: string, date?: string) => Promise<boolean>;
  seedData: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  checkins: [],
  selectedDate: dayjs().format('YYYY-MM-DD'),
  isLoading: true,
  filter: 'all',
  themeMode: 'system',
  hapticsEnabled: true,

  init: async () => {
    try {
      set({ isLoading: true });
      await initDatabase();
      const [habits, checkins, hapticsPref] = await Promise.all([
        fetchAllHabits(),
        fetchAllCheckins(),
        getPreference('haptics_enabled', 'true'),
      ]);
      set({
        habits,
        checkins,
        hapticsEnabled: hapticsPref !== 'false',
        isLoading: false,
      });
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

  addHabit: async (data) => {
    const newHabit: Habit = {
      ...data,
      id: `habit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: dayjs().toISOString(),
    };

    // Optimistic store update
    set((state) => ({ habits: [...state.habits, newHabit] }));
    await saveHabitRecord(newHabit);
    return newHabit;
  },

  updateHabit: async (habit: Habit) => {
    set((state) => ({
      habits: state.habits.map((h) => (h.id === habit.id ? habit : h)),
    }));
    await saveHabitRecord(habit);
  },

  deleteHabit: async (habitId: string) => {
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
      checkins: state.checkins.filter((c) => c.habitId !== habitId),
    }));
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
  },

  toggleCheckin: async (habitId: string, targetDate?: string) => {
    const date = targetDate || get().selectedDate;
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
      // Add checkin
      const habit = get().habits.find((h) => h.id === habitId);
      const newCheckin: HabitCheckin = {
        id: `chk_${habitId}_${date}`,
        habitId,
        date,
        count: habit ? habit.targetCount : 1,
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
          Vibration.vibrate(12);
        } catch (_) {}
      }
      return true; // Became checked
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
  },

  resetAllData: async () => {
    set({ isLoading: true });
    await resetDatabase();
    set({ habits: [], checkins: [], isLoading: false });
  },
}));
