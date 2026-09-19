import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '../types/habit';
import {
  generateHabitReminderTriggers,
  generateEveningReviewTrigger,
  EVENING_REVIEW_REMINDER_ID,
} from '../utils/notificationUtils';

let isNotificationsConfigured = false;

/**
 * Configure global foreground notification behavior and Android channels.
 */
export const initNotifications = async (): Promise<void> => {
  if (isNotificationsConfigured) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('habit-reminders', {
          name: 'تذكيرات العادات',
          description: 'تنبيهات يومية وأسبوعية لتذكيرك بإنجاز عاداتك',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2A4B3A',
        });
      } catch (channelError) {
        // Channel provider is null in Expo Go Android SDK 57
        console.warn('[NotificationService] Notification channel creation skipped in Expo Go:', channelError);
      }
    }

    isNotificationsConfigured = true;
  } catch (error) {
    console.warn('[NotificationService] Initialization error:', error);
  }
};

/**
 * Request notification permissions from the user.
 * Returns true if granted.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }

    const request = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return (
      request.granted ||
      request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('[NotificationService] Request permissions error:', error);
    return false;
  }
};

/**
 * Cancel all scheduled notifications associated with a habit.
 */
export const cancelHabitReminders = async (habitId: string): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const habitNotifications = scheduled.filter(
      (item) =>
        item.identifier.startsWith(`habit_${habitId}`) ||
        (item.content?.data && (item.content.data as any).habitId === habitId)
    );

    for (const notification of habitNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.warn(`[NotificationService] Error cancelling reminders for habit ${habitId}:`, error);
  }
};

/**
 * Schedule reminders for a single habit based on its configuration.
 */
export const scheduleHabitReminder = async (
  habit: Habit,
  options?: { skipCancel?: boolean }
): Promise<void> => {
  try {
    await initNotifications();

    // Cancel existing scheduled notifications for this habit first unless already wiped globally
    if (!options?.skipCancel) {
      await cancelHabitReminders(habit.id);
    }

    // If habit is inactive, archived, or lacks reminderTime, do not schedule
    if (!habit.isActive || habit.archivedAt || !habit.reminderTime) {
      return;
    }

    const triggers = generateHabitReminderTriggers(habit);
    for (const triggerDesc of triggers) {
      if (triggerDesc.type === 'daily') {
        await Notifications.scheduleNotificationAsync({
          identifier: triggerDesc.identifier,
          content: {
            title: `تذكير: ${habit.name}`,
            body: habit.description || `حان وقت إنجاز عادتك اليومية (${habit.name})`,
            sound: true,
            data: { habitId: habit.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            channelId: 'habit-reminders',
            hour: triggerDesc.hour,
            minute: triggerDesc.minute,
          },
        });
      } else if (triggerDesc.type === 'weekly' && triggerDesc.weekday) {
        await Notifications.scheduleNotificationAsync({
          identifier: triggerDesc.identifier,
          content: {
            title: `تذكير: ${habit.name}`,
            body: habit.description || `موعد عادتك اليوم (${habit.name})`,
            sound: true,
            data: { habitId: habit.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId: 'habit-reminders',
            weekday: triggerDesc.weekday,
            hour: triggerDesc.hour,
            minute: triggerDesc.minute,
          },
        });
      } else if (triggerDesc.type === 'monthly' && triggerDesc.day) {
        await Notifications.scheduleNotificationAsync({
          identifier: triggerDesc.identifier,
          content: {
            title: `تذكير: ${habit.name}`,
            body: habit.description || `موعد عادتك الشهرية اليوم (${habit.name})`,
            sound: true,
            data: { habitId: habit.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            channelId: 'habit-reminders',
            day: triggerDesc.day,
            hour: triggerDesc.hour,
            minute: triggerDesc.minute,
          },
        });
      }
    }
  } catch (error) {
    console.warn(`[NotificationService] Error scheduling reminders for habit ${habit.name}:`, error);
  }
};

/**
 * Cancel the scheduled evening review reminder.
 */
export const cancelEveningReviewReminder = async (): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(EVENING_REVIEW_REMINDER_ID);
  } catch (error) {
    console.warn('[NotificationService] Error cancelling evening review reminder:', error);
  }
};

/**
 * Schedule or update the daily evening reflection reminder.
 */
export const scheduleEveningReviewReminder = async (
  timeStr: string,
  notificationsEnabled: boolean
): Promise<void> => {
  try {
    await initNotifications();
    await cancelEveningReviewReminder();

    if (!notificationsEnabled) return;

    const triggerDesc = generateEveningReviewTrigger(timeStr);
    if (!triggerDesc) return;

    await Notifications.scheduleNotificationAsync({
      identifier: triggerDesc.identifier,
      content: {
        title: 'المراجعة المسائية • إنجاز',
        body: 'كيف كان يومك اليوم؟ تفقد عاداتك وسجل إنجازاتك وخاطرتك اليومية.',
        sound: true,
        data: { type: 'evening_review' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: 'habit-reminders',
        hour: triggerDesc.hour,
        minute: triggerDesc.minute,
      },
    });
  } catch (error) {
    console.warn('[NotificationService] Error scheduling evening review reminder:', error);
  }
};

/**
 * Reschedule all habit reminders based on global preference.
 */
export const rescheduleAllHabitReminders = async (
  habits: Habit[],
  notificationsEnabled: boolean,
  eveningReminderEnabled = false,
  eveningReminderTime = '21:00'
): Promise<void> => {
  try {
    await initNotifications();

    if (!notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    // Cancel all current and schedule active unarchived habits with reminder times
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const habit of habits) {
      if (habit.isActive && !habit.archivedAt && habit.reminderTime) {
        await scheduleHabitReminder(habit, { skipCancel: true });
      }
    }

    if (eveningReminderEnabled) {
      await scheduleEveningReviewReminder(eveningReminderTime, true);
    }
  } catch (error) {
    console.warn('[NotificationService] Error rescheduling all reminders:', error);
  }
};

/**
 * Schedule an immediate test notification (2-second delay) to verify system works.
 */
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    await initNotifications();
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'إنجاز • تذكير تجريبي',
        body: 'الإشعارات تعمل بنجاح! ستصلك تذكيرات عاداتك بدقة في مواعيدها.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false,
      },
    });

    return true;
  } catch (error) {
    console.warn('[NotificationService] Error sending test notification:', error);
    return false;
  }
};
