import { create } from 'zustand';
import { Vibration, Linking } from 'react-native';
import { appAlert } from '../services/alertService';
import dayjs from 'dayjs';

/**
 * Modern non-blocking idle execution helper compatible with React 19 / RN 0.86+
 * (replaces deprecated InteractionManager)
 */
const runWhenIdle = (callback: () => void) => {
  if (typeof (globalThis as any).requestIdleCallback === 'function') {
    (globalThis as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 50);
  }
};
import { Habit, HabitCheckin, HabitSortOption } from '../types/habit';
import {
  initDatabase,
  fetchAllHabits,
  fetchAllCheckins,
  fetchRecentCheckins,
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
  batchInsertLoopData,
  batchSaveHabits,
  batchSaveCheckinRecords,
  compactDatabase as dbCompactDatabase,
  cleanEmptyCheckins as dbCleanEmptyCheckins,
  deleteImportedLoopHabitsRecord,
  fetchStorageMetrics,
  StorageMetrics,
  updateHabitsOrder,
} from '../services/database';
import type { ConvertedLoopData } from '../services/loopImportService';
import {
  scheduleHabitReminder,
  cancelHabitReminders,
  rescheduleAllHabitReminders,
  requestNotificationPermissions,
  scheduleEveningReviewReminder,
  cancelEveningReviewReminder,
} from '../services/notificationService';
import {
  BackupPayload,
  createBackupPayload,
  mergeBackupData,
} from '../services/backupService';
import { ThemeMode } from '../theme/ThemeContext';
import { isHabitDueOnDate, reorderArray } from '../utils/habitUtils';
import {
  syncWithNeon,
  pushHabitChangeAsync,
  pushHabitDeletionAsync,
  pushCheckinChangeAsync,
  pushMetaChangeAsync,
  getLastSyncTime,
  SyncState,
} from '../services/syncService';
import { playCompletionSound, initSound } from '../services/soundService';

interface HabitState {
  habits: Habit[];
  checkins: HabitCheckin[];
  selectedDate: string;
  isLoading: boolean;
  isRefreshing: boolean;
  filter: 'all' | 'pending' | 'completed';
  sortOption: HabitSortOption;
  themeMode: ThemeMode;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;

  // Cloud Sync State
  cloudSyncState: SyncState;
  lastCloudSyncTime: string | null;
  cloudSyncMessage?: string;
  syncWithCloud: () => Promise<boolean>;

  // Actions
  init: () => Promise<void>;
  refreshHabits: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setFilter: (filter: 'all' | 'pending' | 'completed') => void;
  setSortOption: (option: HabitSortOption) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleHaptics: () => void;
  toggleSound: () => void;
  toggleNotifications: () => Promise<void>;
  setEveningReminder: (enabled: boolean, time?: string) => Promise<void>;
  addHabit: (data: Omit<Habit, 'id' | 'createdAt'>) => Promise<Habit>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabitActive: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string, archive?: boolean) => Promise<void>;
  restoreHabit: (habitId: string) => Promise<void>;
  togglePinHabit: (habitId: string) => Promise<void>;
  reorderHabits: (reorderedHabits: Habit[]) => Promise<void>;
  moveHabit: (habitId: string, direction: 'up' | 'down') => Promise<void>;
  toggleCheckin: (habitId: string, date?: string) => Promise<boolean>;
  completeAllDueHabits: (date?: string) => Promise<number>;
  incrementCheckin: (habitId: string, date?: string, step?: number) => Promise<void>;
  decrementCheckin: (habitId: string, date?: string, step?: number) => Promise<void>;
  setHabitCount: (habitId: string, count: number, date?: string) => Promise<void>;
  updateCheckinNote: (habitId: string, date: string, note: string) => Promise<void>;
  deleteCheckinNote: (habitId: string, date: string) => Promise<void>;
  seedData: () => Promise<void>;
  resetAllData: () => Promise<void>;
  exportBackup: () => Promise<BackupPayload>;
  importBackup: (backup: BackupPayload, mode: 'replace' | 'merge') => Promise<void>;
  importLoopData: (data: ConvertedLoopData, habitsOnly?: boolean) => Promise<void>;
  compactDatabase: () => Promise<boolean>;
  cleanEmptyCheckins: () => Promise<number>;
  getStorageMetrics: () => Promise<StorageMetrics>;
  loadAllCheckins: () => Promise<void>;
  deleteImportedLoopHabits: () => Promise<{ deletedHabitsCount: number; deletedCheckinsCount: number }>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  checkins: [],
  selectedDate: dayjs().format('YYYY-MM-DD'),
  isLoading: true,
  isRefreshing: false,
  filter: 'all',
  sortOption: 'default',
  themeMode: 'system',
  hapticsEnabled: true,
  soundEnabled: true,
  notificationsEnabled: true,
  eveningReminderEnabled: false,
  eveningReminderTime: '21:00',
  cloudSyncState: 'idle',
  lastCloudSyncTime: null,

  init: async () => {
    try {
      set({ isLoading: true });
      await initDatabase();

      // Parallelized data fetching with windowed checkins for lightning startup
      const [habits, checkins, allPrefs, lastSync] = await Promise.all([
        fetchAllHabits(),
        fetchRecentCheckins(180),
        getAllPreferences(),
        getLastSyncTime().catch(() => null),
      ]);

      const hapticsPref = allPrefs['haptics_enabled'] ?? 'true';
      const soundPref = allPrefs['sound_enabled'] ?? 'true';
      const notifPref = allPrefs['notifications_enabled'] ?? 'true';
      const sortPref = allPrefs['habit_sort_preference'] ?? 'default';
      const eveningNotifPref = allPrefs['evening_reminder_enabled'] ?? 'false';
      const eveningTimePref = allPrefs['evening_reminder_time'] ?? '21:00';

      const notificationsEnabled = notifPref !== 'false';
      const eveningReminderEnabled = eveningNotifPref === 'true';
      const eveningReminderTime = eveningTimePref;

      const validSortOptions: HabitSortOption[] = [
        'default',
        'pending_first',
        'alphabetical',
        'reminder_time',
        'streak',
      ];
      const sortOption: HabitSortOption = validSortOptions.includes(sortPref as HabitSortOption)
        ? (sortPref as HabitSortOption)
        : 'default';

      // User requested one-time purge of imported Loop habits
      let activeHabits = habits;
      let activeCheckins = checkins;
      const loopPurgedOnce = allPrefs['loop_habits_purged_v1'] === 'true';
      if (!loopPurgedOnce) {
        const hasLoop = habits.some((h) => h.id.startsWith('loop_'));
        if (hasLoop) {
          activeHabits = habits.filter((h) => !h.id.startsWith('loop_'));
          activeCheckins = checkins.filter((c) => !c.habitId.startsWith('loop_'));
          deleteImportedLoopHabitsRecord().catch((err) =>
            console.warn('[Store] Background loop purge error:', err)
          );
        }
        setPreference('loop_habits_purged_v1', 'true').catch(() => {});
      }

      // User requested recreating all Loop habits freshly without past checkin history
      const freshLoopCreated = allPrefs['fresh_loop_habits_created_v1'] === 'true';
      if (!freshLoopCreated) {
        try {
          const preloaded = require('../services/loopBackupPreloaded.json');
          const nowStr = new Date().toISOString();
          const existingNames = new Set(activeHabits.map((h) => h.name.trim()));

          const loopHabitsFresh: Habit[] = (preloaded.habits || [])
            .filter((h: any) => !existingNames.has((h.name || '').trim()))
            .map((h: any, idx: number) => ({
              id: `h_fresh_${idx + 1}_${Date.now()}`,
              name: h.name,
              icon: h.icon || 'sparkles-outline',
              color: h.color || '#0D9488',
              frequency: h.frequency || 'daily',
              frequencyDays: Array.isArray(h.frequencyDays) ? h.frequencyDays : [0, 1, 2, 3, 4, 5, 6],
              targetCount: Math.max(1, h.targetCount || 1),
              unit: (h.unit || '').trim() || 'مرة',
              isActive: h.isActive !== false,
              archivedAt: h.archivedAt ? nowStr : null,
              reminderTime: h.reminderTime || null,
              isPinned: false,
              createdAt: nowStr,
            }));

          if (loopHabitsFresh.length > 0) {
            activeHabits = [...activeHabits, ...loopHabitsFresh];
            batchSaveHabits(loopHabitsFresh).catch((err) =>
              console.warn('[Store] Background fresh habits batchSave error:', err)
            );
          }
          setPreference('fresh_loop_habits_created_v1', 'true').catch(() => {});
        } catch (err) {
          console.warn('[Store] Error seeding fresh loop habits:', err);
        }
      }

      // Purge any stale demo checkins generated for today (from previous mock data versions)
      const todayStr = dayjs().format('YYYY-MM-DD');
      const isDemoTodayCheckin = (c: HabitCheckin) =>
        c.date === todayStr && c.id.startsWith('checkin_');

      if (activeCheckins.some(isDemoTodayCheckin)) {
        const staleTodayDemoCheckins = activeCheckins.filter(isDemoTodayCheckin);
        activeCheckins = activeCheckins.filter((c) => !isDemoTodayCheckin(c));
        for (const dc of staleTodayDemoCheckins) {
          removeCheckinRecord(dc.habitId, dc.date).catch(() => {});
        }
      }

      // Update state and dismiss loading spinner immediately so the UI is interactive
      set({
        habits: activeHabits,
        checkins: activeCheckins,
        hapticsEnabled: hapticsPref !== 'false',
        soundEnabled: soundPref !== 'false',
        notificationsEnabled,
        eveningReminderEnabled,
        eveningReminderTime,
        sortOption,
        isLoading: false,
        lastCloudSyncTime: lastSync,
      });

      // Defer non-critical background jobs until after initial animations/interactions finish
      runWhenIdle(() => {
        // Preload sound player ahead of time
        initSound().catch(() => {});
        // Synchronize notifications with system schedule in background
        rescheduleAllHabitReminders(
          activeHabits,
          notificationsEnabled,
          eveningReminderEnabled,
          eveningReminderTime
        ).catch((err) => console.warn('[Store] Deferred notification reschedule error:', err));

        // Load full historical checkins in the background without blocking the UI
        fetchAllCheckins()
          .then((full) => {
            let filteredFull = allPrefs['loop_habits_purged_v1'] === 'true' || !loopPurgedOnce
              ? full.filter((c) => !c.habitId.startsWith('loop_'))
              : full;
            filteredFull = filteredFull.filter((c) => !isDemoTodayCheckin(c));
            if (filteredFull.length > activeCheckins.length) {
              set({ checkins: filteredFull });
            }
          })
          .catch(() => {});

        // Trigger automatic background sync with Cloud
        get().syncWithCloud().catch(() => {});

        // Periodic automatic database optimization (every 7 days) in background without user intervention
        const lastMaintenance = allPrefs['last_auto_db_maintenance'];
        const now = Date.now();
        if (!lastMaintenance || now - Number(lastMaintenance) > 7 * 24 * 60 * 60 * 1000) {
          dbCompactDatabase().catch(() => {});
          setPreference('last_auto_db_maintenance', String(now)).catch(() => {});
        }
      });
    } catch (err) {
      console.error('[Store] Init error:', err);
      set({ isLoading: false });
    }
  },

  loadAllCheckins: async () => {
    try {
      const full = await fetchAllCheckins();
      const todayStr = dayjs().format('YYYY-MM-DD');
      set({
        checkins: full.filter((c) => !(c.date === todayStr && c.id.startsWith('checkin_'))),
      });
    } catch (err) {
      console.warn('[Store] loadAllCheckins error:', err);
    }
  },

  syncWithCloud: async () => {
    set({ cloudSyncState: 'syncing' });
    const res = await syncWithNeon();
    if (res.success) {
      const habits = await fetchAllHabits();
      const checkins = await fetchAllCheckins();
      set({
        habits,
        checkins,
        cloudSyncState: res.state,
        lastCloudSyncTime: res.lastSyncTime || dayjs().toISOString(),
        cloudSyncMessage: undefined,
      });
      return true;
    } else {
      set({
        cloudSyncState: res.state,
        cloudSyncMessage: res.errorMessage,
      });
      return false;
    }
  },

  refreshHabits: async () => {
    try {
      set({ isRefreshing: true });
      // 1. Fetch latest local SQLite records in parallel immediately
      const [habits, checkins] = await Promise.all([
        fetchAllHabits(),
        fetchAllCheckins(),
      ]);
      set({ habits, checkins, isRefreshing: false });

      // 2. Run cloud sync in background non-blockingly
      get().syncWithCloud().catch(() => {});
    } catch (error) {
      console.warn('[Store] refreshHabits error:', error);
      set({ isRefreshing: false });
    }
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  setFilter: (filter: 'all' | 'pending' | 'completed') => {
    set({ filter });
  },

  setSortOption: (sortOption: HabitSortOption) => {
    set({ sortOption });
    setPreference('habit_sort_preference', sortOption);
    pushMetaChangeAsync('habit_sort_preference', sortOption);
  },

  setThemeMode: (themeMode: ThemeMode) => {
    set({ themeMode });
    pushMetaChangeAsync('theme_mode', themeMode);
  },

  toggleHaptics: () => {
    const nextVal = !get().hapticsEnabled;
    set({ hapticsEnabled: nextVal });
    setPreference('haptics_enabled', String(nextVal));
    pushMetaChangeAsync('haptics_enabled', String(nextVal));
  },

  toggleSound: () => {
    const nextVal = !get().soundEnabled;
    set({ soundEnabled: nextVal });
    setPreference('sound_enabled', String(nextVal));
    pushMetaChangeAsync('sound_enabled', String(nextVal));
  },

  toggleNotifications: async () => {
    const current = get().notificationsEnabled;
    if (!current) {
      const isGranted = await requestNotificationPermissions();
      if (!isGranted) {
        appAlert(
          'إذن الإشعارات معطل',
          'لتصلك تذكيرات عاداتك اليومية في وقتها المحدد، يرجى تفعيل إذن الإشعارات لتطبيق إنجاز من إعدادات الهاتف.',
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'فتح إعدادات الهاتف', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }
    const nextVal = !current;
    set({ notificationsEnabled: nextVal });
    await setPreference('notifications_enabled', String(nextVal));
    pushMetaChangeAsync('notifications_enabled', String(nextVal));
    await rescheduleAllHabitReminders(
      get().habits,
      nextVal,
      get().eveningReminderEnabled,
      get().eveningReminderTime
    );
  },

  setEveningReminder: async (enabled: boolean, time?: string) => {
    const newTime = time || get().eveningReminderTime;
    if (enabled) {
      const isGranted = await requestNotificationPermissions();
      if (!isGranted) {
        appAlert(
          'إذن الإشعارات معطل',
          'لتصلك تذكيرات المراجعة المسائية، يرجى تفعيل إذن الإشعارات لتطبيق إنجاز من إعدادات الهاتف.',
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'فتح إعدادات الهاتف', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      if (get().notificationsEnabled) {
        await scheduleEveningReviewReminder(newTime, true);
      }
    } else {
      await cancelEveningReviewReminder();
    }
    set({ eveningReminderEnabled: enabled, eveningReminderTime: newTime });
    await setPreference('evening_reminder_enabled', String(enabled));
    await setPreference('evening_reminder_time', newTime);
    pushMetaChangeAsync('evening_reminder_enabled', String(enabled));
    pushMetaChangeAsync('evening_reminder_time', newTime);
  },

  addHabit: async (data) => {
    const currentHabits = get().habits;
    const maxOrder = currentHabits.reduce((max, h) => Math.max(max, h.order ?? 0), -1);
    const newHabit: Habit = {
      ...data,
      id: `habit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      order: maxOrder + 1,
      createdAt: dayjs().toISOString(),
    };

    // Optimistic store update
    set((state) => ({ habits: [...state.habits, newHabit] }));
    await saveHabitRecord(newHabit);
    pushHabitChangeAsync(newHabit);

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
    pushHabitChangeAsync(habit);

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
    pushHabitDeletionAsync(habitId);
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
    pushHabitChangeAsync(updated);

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
    pushHabitChangeAsync(updated);

    if (archive) {
      await cancelHabitReminders(habitId);
    } else if (get().notificationsEnabled && updated.reminderTime) {
      await scheduleHabitReminder(updated);
    }
  },

  restoreHabit: async (habitId: string) => {
    await get().archiveHabit(habitId, false);
  },

  togglePinHabit: async (habitId: string) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const updated: Habit = {
      ...habit,
      isPinned: !habit.isPinned,
    };

    set((state) => ({
      habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
    }));
    await saveHabitRecord(updated);
    pushHabitChangeAsync(updated);
  },

  reorderHabits: async (reorderedHabits: Habit[]) => {
    // 1. Assign sequential orders to preserve user's intended sequence
    const updatedReordered = reorderedHabits.map((h, idx) => ({
      ...h,
      order: idx,
    }));

    // 2. Merge with any habits that might not be in the reordered list (e.g. archived)
    const reorderedIdSet = new Set(updatedReordered.map((h) => h.id));
    const otherHabits = get().habits.filter((h) => !reorderedIdSet.has(h.id));
    const allUpdated = [...updatedReordered, ...otherHabits];

    // 3. Optimistic store update + switch to 'default' sort if not already
    set({
      habits: allUpdated,
      sortOption: 'default',
    });

    if (get().hapticsEnabled) {
      Vibration.vibrate(30);
    }

    // 4. Persist order to database asynchronously
    const orderedIds = updatedReordered.map((h) => h.id);
    await updateHabitsOrder(orderedIds);
    setPreference('habit_sort_preference', 'default');
    pushMetaChangeAsync('habit_sort_preference', 'default');
  },

  moveHabit: async (habitId: string, direction: 'up' | 'down') => {
    const currentHabits = [...get().habits].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const index = currentHabits.findIndex((h) => h.id === habitId);
    if (index < 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentHabits.length) return;

    const reordered = reorderArray(currentHabits, index, targetIndex);
    await get().reorderHabits(reordered);
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
      (c) => c.habitId === habitId && c.date === date
    );

    if (existingCheckin && existingCheckin.completed) {
      if (get().hapticsEnabled) {
        try {
          Vibration.vibrate(10);
        } catch (_) {}
      }
      // Untoggle: Preserve record with count 0 and completed false so cloud sync never resurrects old completion
      const updatedCheckin: HabitCheckin = {
        ...existingCheckin,
        count: 0,
        completed: false,
        updatedAt: dayjs().toISOString(),
        note: existingCheckin.note,
      };
      set((state) => {
        const idx = state.checkins.findIndex(
          (c) => c.habitId === habitId && c.date === date
        );
        if (idx >= 0) {
          const next = [...state.checkins];
          next[idx] = updatedCheckin;
          return { checkins: next };
        }
        return { checkins: [...state.checkins, updatedCheckin] };
      });
      await saveCheckinRecord(updatedCheckin);
      pushCheckinChangeAsync(updatedCheckin);
      return false; // Became unchecked
    } else {
      if (get().hapticsEnabled) {
        try {
          Vibration.vibrate(18);
        } catch (_) {}
      }
      if (get().soundEnabled) {
        playCompletionSound();
      }
      // Add or complete checkin (full completion with targetCount, preserving any note)
      const targetCount = Math.max(1, habit.targetCount || 1);
      const newCheckin: HabitCheckin = {
        id: existingCheckin ? existingCheckin.id : `chk_${habitId}_${date}`,
        habitId,
        date,
        count: targetCount,
        completed: true,
        updatedAt: dayjs().toISOString(),
        note: existingCheckin?.note,
      };

      set((state) => {
        const idx = state.checkins.findIndex(
          (c) => c.habitId === habitId && c.date === date
        );
        if (idx >= 0) {
          const next = [...state.checkins];
          next[idx] = newCheckin;
          return { checkins: next };
        }
        return { checkins: [...state.checkins, newCheckin] };
      });
      await saveCheckinRecord(newCheckin);
      pushCheckinChangeAsync(newCheckin);
      return true; // Became checked
    }
  },

  completeAllDueHabits: async (targetDate?: string) => {
    const date = targetDate || get().selectedDate;
    const today = dayjs().startOf('day');
    const targetDay = dayjs(date).startOf('day');
    // Cannot complete future dates
    if (targetDay.isAfter(today)) return 0;

    const { habits, checkins } = get();
    // Only active, non-archived habits scheduled on this date
    const dueHabits = habits.filter(
      (h) => h.isActive && !h.archivedAt && isHabitDueOnDate(h, date, true)
    );

    // Filter to those not completed yet
    const pendingHabits = dueHabits.filter(
      (h) => !checkins.some((c) => c.habitId === h.id && c.date === date && c.completed)
    );

    if (pendingHabits.length === 0) return 0;

    const now = dayjs().toISOString();
    const newOrUpdatedCheckins: HabitCheckin[] = pendingHabits.map((habit) => {
      const existing = checkins.find((c) => c.habitId === habit.id && c.date === date);
      const targetCount = Math.max(1, habit.targetCount || 1);
      return {
        id: existing ? existing.id : `chk_${habit.id}_${date}`,
        habitId: habit.id,
        date,
        count: targetCount,
        completed: true,
        updatedAt: now,
        note: existing?.note,
      };
    });

    // Save all checkins atomically within a single SQLite transaction
    await batchSaveCheckinRecords(newOrUpdatedCheckins);
    newOrUpdatedCheckins.forEach((c) => pushCheckinChangeAsync(c));

    set((state) => {
      const pendingIds = new Set(pendingHabits.map((h) => h.id));
      const retained = state.checkins.filter(
        (c) => !(c.date === date && pendingIds.has(c.habitId))
      );
      return {
        checkins: [...retained, ...newOrUpdatedCheckins],
      };
    });

    if (get().hapticsEnabled) {
      try {
        Vibration.vibrate(25);
      } catch (_) {}
    }
    if (pendingHabits.length > 0 && get().soundEnabled) {
      playCompletionSound();
    }

    return pendingHabits.length;
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
    const newCount = currentCount + Math.max(1, step);
    const isCompleted = newCount >= targetCount;

    const updatedCheckin: HabitCheckin = {
      id: existing ? existing.id : `chk_${habitId}_${date}`,
      habitId,
      date,
      count: newCount,
      completed: isCompleted,
      updatedAt: dayjs().toISOString(),
      note: existing?.note,
    };

    set((state) => {
      const idx = state.checkins.findIndex(
        (c) => c.habitId === habitId && c.date === date
      );
      if (idx >= 0) {
        const next = [...state.checkins];
        next[idx] = updatedCheckin;
        return { checkins: next };
      }
      return { checkins: [...state.checkins, updatedCheckin] };
    });
    await saveCheckinRecord(updatedCheckin);
    pushCheckinChangeAsync(updatedCheckin);

    if (get().hapticsEnabled) {
      try {
        Vibration.vibrate(isCompleted ? 16 : 8);
      } catch (_) {}
    }
    if (isCompleted && !existing?.completed && get().soundEnabled) {
      playCompletionSound();
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
      // Preserve record with count 0 and completed false so cloud sync never resurrects old completion
      const updatedCheckin: HabitCheckin = {
        ...existing,
        count: 0,
        completed: false,
        updatedAt: dayjs().toISOString(),
        note: existing.note,
      };
      set((state) => {
        const idx = state.checkins.findIndex(
          (c) => c.habitId === habitId && c.date === date
        );
        if (idx >= 0) {
          const next = [...state.checkins];
          next[idx] = updatedCheckin;
          return { checkins: next };
        }
        return { checkins: [...state.checkins, updatedCheckin] };
      });
      await saveCheckinRecord(updatedCheckin);
      pushCheckinChangeAsync(updatedCheckin);
    } else {
      const targetCount = Math.max(1, habit.targetCount || 1);
      const updatedCheckin: HabitCheckin = {
        ...existing,
        count: newCount,
        completed: newCount >= targetCount,
        updatedAt: dayjs().toISOString(),
      };
      set((state) => {
        const idx = state.checkins.findIndex(
          (c) => c.habitId === habitId && c.date === date
        );
        if (idx >= 0) {
          const next = [...state.checkins];
          next[idx] = updatedCheckin;
          return { checkins: next };
        }
        return { checkins: [...state.checkins, updatedCheckin] };
      });
      await saveCheckinRecord(updatedCheckin);
      pushCheckinChangeAsync(updatedCheckin);
    }

    if (get().hapticsEnabled) {
      try {
        Vibration.vibrate(8);
      } catch (_) {}
    }
  },

  setHabitCount: async (habitId: string, count: number, targetDate?: string) => {
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

    const safeCount = Math.max(0, Math.floor(count || 0));
    const targetCount = Math.max(1, habit.targetCount || 1);
    const isCompleted = safeCount >= targetCount;

    const existing = get().checkins.find(
      (c) => c.habitId === habitId && c.date === date
    );


    const updatedCheckin: HabitCheckin = {
      id: existing ? existing.id : `chk_${habitId}_${date}`,
      habitId,
      date,
      count: safeCount,
      completed: isCompleted,
      updatedAt: dayjs().toISOString(),
      note: existing?.note,
    };

    set((state) => {
      const idx = state.checkins.findIndex(
        (c) => c.habitId === habitId && c.date === date
      );
      if (idx >= 0) {
        const next = [...state.checkins];
        next[idx] = updatedCheckin;
        return { checkins: next };
      }
      return { checkins: [...state.checkins, updatedCheckin] };
    });
    await saveCheckinRecord(updatedCheckin);
    pushCheckinChangeAsync(updatedCheckin);

    if (get().hapticsEnabled) {
      try {
        Vibration.vibrate(isCompleted ? 16 : 8);
      } catch (_) {}
    }
    if (isCompleted && !existing?.completed && get().soundEnabled) {
      playCompletionSound();
    }
  },

  updateCheckinNote: async (habitId: string, date: string, note: string) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      await get().deleteCheckinNote(habitId, date);
      return;
    }

    const existing = get().checkins.find(
      (c) => c.habitId === habitId && c.date === date
    );

    const updatedCheckin: HabitCheckin = {
      id: existing ? existing.id : `chk_${habitId}_${date}`,
      habitId,
      date,
      count: existing ? existing.count : 0,
      completed: existing ? existing.completed : false,
      updatedAt: dayjs().toISOString(),
      note: trimmedNote,
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
    pushCheckinChangeAsync(updatedCheckin);
  },

  deleteCheckinNote: async (habitId: string, date: string) => {
    const existing = get().checkins.find(
      (c) => c.habitId === habitId && c.date === date
    );
    if (!existing) return;

    // Clear note, update timestamp, save and sync with cloud
    const updatedCheckin: HabitCheckin = {
      ...existing,
      note: undefined,
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
    pushCheckinChangeAsync(updatedCheckin);
  },

  seedData: async () => {
    set({ isLoading: true });
    await seedDatabase();
    const habits = await fetchAllHabits();
    const checkins = await fetchAllCheckins();
    set({ habits, checkins, isLoading: false });
    await rescheduleAllHabitReminders(
      habits,
      get().notificationsEnabled,
      get().eveningReminderEnabled,
      get().eveningReminderTime
    );
  },

  resetAllData: async () => {
    set({ isLoading: true });
    await resetDatabase();
    set({ habits: [], checkins: [], isLoading: false });
    await rescheduleAllHabitReminders([], false, false);
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

    await rescheduleAllHabitReminders(
      nextHabits,
      get().notificationsEnabled,
      get().eveningReminderEnabled,
      get().eveningReminderTime
    );
  },

  importLoopData: async (data: ConvertedLoopData, habitsOnly = false) => {
    set({ isLoading: true });

    const currentHabits = get().habits;
    const currentCheckins = get().checkins;

    let habitsToInsert = data.habits;
    if (habitsOnly) {
      const nowStr = new Date().toISOString();
      habitsToInsert = data.habits.map((h, idx) => ({
        ...h,
        id: `h_fresh_${idx + 1}_${Date.now()}`,
        createdAt: nowStr,
      }));
    }

    // Merge only: add new loop habits
    const nextHabits = [...currentHabits, ...habitsToInsert];

    let nextCheckins = currentCheckins;
    if (!habitsOnly && data.checkins.length > 0) {
      // Merge checkins, ensuring uniqueness by habitId:date
      const checkinMap = new Map<string, HabitCheckin>();
      currentCheckins.forEach((c) => checkinMap.set(`${c.habitId}:${c.date}`, c));
      data.checkins.forEach((c) => checkinMap.set(`${c.habitId}:${c.date}`, c));
      nextCheckins = Array.from(checkinMap.values());
      await batchInsertLoopData(habitsToInsert, data.checkins);
    } else {
      await batchSaveHabits(habitsToInsert);
    }

    set({
      habits: nextHabits,
      checkins: nextCheckins,
      isLoading: false,
    });

    await rescheduleAllHabitReminders(
      nextHabits,
      get().notificationsEnabled,
      get().eveningReminderEnabled,
      get().eveningReminderTime
    );
  },

  compactDatabase: async () => {
    const res = await dbCompactDatabase();
    return res.success;
  },

  cleanEmptyCheckins: async () => {
    const removedCount = await dbCleanEmptyCheckins();
    if (removedCount > 0) {
      const updatedCheckins = await fetchAllCheckins();
      set({ checkins: updatedCheckins });
    }
    return removedCount;
  },

  getStorageMetrics: async () => {
    return await fetchStorageMetrics();
  },

  deleteImportedLoopHabits: async () => {
    const loopHabits = get().habits.filter((h) => h.id.startsWith('loop_'));
    const loopHabitIds = loopHabits.map((h) => h.id);

    // Cancel reminders and push deletion tombstones
    for (const id of loopHabitIds) {
      await cancelHabitReminders(id);
      pushHabitDeletionAsync(id);
    }

    // Update state immediately
    set((state) => ({
      habits: state.habits.filter((h) => !h.id.startsWith('loop_')),
      checkins: state.checkins.filter((c) => !c.habitId.startsWith('loop_')),
    }));

    await setPreference('loop_habits_purged_v1', 'true').catch(() => {});

    // Delete records from SQLite database
    const result = await deleteImportedLoopHabitsRecord();
    return result;
  },
}));

