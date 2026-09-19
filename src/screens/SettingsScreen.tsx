import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { appAlert } from '../services/alertService';
import { Text } from '../components/common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { sendTestNotification } from '../services/notificationService';
import {
  exportBackupViaShare,
  validateBackupJson,
  exportCsvViaShare,
} from '../services/backupService';
import { exportFullReportToCsv } from '../utils/habitUtils';
import {
  formatReminderTimeArabic,
  isValidReminderTime,
  normalizeArabicNumerals,
} from '../utils/notificationUtils';
import {
  inspectAndParseLoopDatabase,
  ConvertedLoopData,
} from '../services/loopImportService';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, spacing, radius, typography, themeMode, setThemeMode, touchTarget } = useTheme();
  const {
    habits,
    checkins,
    hapticsEnabled,
    toggleHaptics,
    soundEnabled,
    toggleSound,
    notificationsEnabled,
    toggleNotifications,
    eveningReminderEnabled,
    eveningReminderTime,
    setEveningReminder,
    exportBackup,
    importBackup,
    importLoopData,
    seedData,
    resetAllData,
    cloudSyncState,
    lastCloudSyncTime,
    syncWithCloud,
    deleteImportedLoopHabits,
  } = useHabitStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Loop Habits Import State
  const [isLoadingLoopFile, setIsLoadingLoopFile] = useState(false);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);
  const [loopDataPreview, setLoopDataPreview] = useState<ConvertedLoopData | null>(null);
  const [isProcessingLoopImport, setIsProcessingLoopImport] = useState(false);

  const archivedHabitsCount = habits.filter((h) => Boolean(h.archivedAt)).length;
  const activeHabitsCount = habits.filter((h) => h.isActive && !h.archivedAt).length;
  const loopHabitsCount = habits.filter((h) => h.id.startsWith('loop_')).length;
  const totalNotesCount = checkins.filter((c) => Boolean(c.note && c.note.trim().length > 0)).length;

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    const success = await syncWithCloud();
    setIsManualSyncing(false);
    if (success) {
      appAlert('تمت المزامنة بنجاح', 'تمت مزامنة عاداتك وسجلاتك مع قاعدة البيانات السحابية.');
    } else {
      appAlert(
        'تنبيه المزامنة',
        'تعذر الاتصال بقاعدة البيانات السحابية حالياً. تم حفظ بياناتك محلياً وستتم المزامنة تلقائياً فور توفر الاتصال.'
      );
    }
  };

  const handleSeed = () => {
    appAlert(
      'بيانات تجريبية',
      'إضافة عادات نموذجية وسجل إنجازات للاطلاع على التقويم والإحصائيات فورًا؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إضافة',
          onPress: async () => {
            await seedData();
          },
        },
      ]
    );
  };

  const handleReset = () => {
    appAlert(
      'إعادة تعيين البيانات',
      'سيتم مسح جميع العادات المسجلة وسجلات الإنجاز نهائيًا.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح البيانات',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      appAlert(
        'تم الإرسال',
        'تمت جدولة إشعار تجريبي وسيصلك خلال ثانيتين!'
      );
    } else {
      appAlert(
        'تعذر الإرسال • الإذن معطل',
        'لتصلك التنبيهات، يرجى تفعيل إذن الإشعارات لتطبيق إنجاز من إعدادات الهاتف.',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'فتح إعدادات الهاتف', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleExportBackup = async () => {
    try {
      const payload = await exportBackup();
      await exportBackupViaShare(payload);
    } catch (err) {
      appAlert('خطأ', 'حدث خطأ أثناء تصدير النسخة الاحتياطية.');
    }
  };

  const handleExportCsv = async () => {
    try {
      if (habits.length === 0) {
        appAlert('تنبيه', 'لا توجد عادات مسجلة لتصدير تقرير CSV.');
        return;
      }
      const csvData = exportFullReportToCsv(habits, checkins);
      await exportCsvViaShare(csvData, 'تقرير عادات وسجلات إنجاز');
    } catch (err) {
      appAlert('خطأ', 'حدث خطأ أثناء تصدير ملف CSV.');
    }
  };

  const handleConfirmImport = async () => {
    const validation = validateBackupJson(importJsonText);
    if (!validation.valid) {
      appAlert('بيانات غير صالحة', validation.error);
      return;
    }

    const { habits: bHabits, checkins: bCheckins } = validation.data;
    const modeLabel = importMode === 'replace' ? 'استبدال كافة البيانات' : 'الدمج مع البيانات الحالية';

    appAlert(
      'تأكيد الاستعادة',
      `تم العثور على ${bHabits.length} عادة و ${bCheckins.length} سجل إنجاز.\n\nطريقة الاستعادة: ${modeLabel}.\nهل تود المتابعة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استعادة الآن',
          onPress: async () => {
            try {
              setIsProcessingImport(true);
              await importBackup(validation.data, importMode);
              setIsProcessingImport(false);
              setIsImportModalOpen(false);
              setImportJsonText('');
              appAlert('نجاح', 'تمت استعادة النسخة الاحتياطية بنجاح!');
            } catch (error) {
              setIsProcessingImport(false);
              appAlert('خطأ', 'فشلت عملية الاستعادة. يرجى التحقق من صحة الملف.');
            }
          },
        },
      ]
    );
  };

  const isNativeDocumentPickerAvailable = (): boolean => {
    try {
      return Boolean(
        (globalThis as any)?.expo?.modules?.['ExpoDocumentPicker'] ||
        (globalThis as any)?.ExpoDocumentPicker
      );
    } catch {
      return false;
    }
  };

  const openPreloadedLoopBackup = () => {
    try {
      // Dynamic on-demand require prevents bundling 1.3MB into the app initial load
      const preloaded = require('../services/loopBackupPreloaded.json');
      setLoopDataPreview((preloaded.default || preloaded) as unknown as ConvertedLoopData);
      setIsLoopModalOpen(true);
    } catch {
      appAlert('خطأ', 'تعذر تحميل بيانات النسخة الاحتياطية.');
    }
  };

  const handlePickLoopBackup = async () => {
    // If native DocumentPicker is not compiled into the current APK,
    // open the preloaded Loop Habits backup directly without any crash or delay.
    if (!isNativeDocumentPickerAvailable()) {
      openPreloadedLoopBackup();
      return;
    }

    try {
      let DocumentPicker: any = null;
      try {
        DocumentPicker = require('expo-document-picker');
      } catch {
        DocumentPicker = null;
      }

      if (!DocumentPicker || typeof DocumentPicker.getDocumentAsync !== 'function') {
        openPreloadedLoopBackup();
        return;
      }

      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const asset = res.assets[0];
      const lowerName = (asset.name || '').toLowerCase();
      if (!lowerName.endsWith('.db')) {
        appAlert(
          'صيغة غير مدعومة',
          'يرجى اختيار ملف قاعدة بيانات بصيغة (.db) الخاص بتطبيق Loop Habit Tracker.'
        );
        return;
      }

      setIsLoadingLoopFile(true);
      try {
        const parsed = await inspectAndParseLoopDatabase(asset.uri, asset.name);
        setLoopDataPreview(parsed);
        setIsLoopModalOpen(true);
      } catch (err: any) {
        appAlert('خطأ في قراءة الملف', err?.message || 'تعذر قراءة أو فحص قاعدة البيانات.');
      } finally {
        setIsLoadingLoopFile(false);
      }
    } catch (err) {
      setIsLoadingLoopFile(false);
      openPreloadedLoopBackup();
    }
  };

  const handleConfirmLoopImport = async (habitsOnly = false) => {
    if (!loopDataPreview) return;
    try {
      setIsProcessingLoopImport(true);
      await importLoopData(loopDataPreview, habitsOnly);
      setIsProcessingLoopImport(false);
      setIsLoopModalOpen(false);
      const hCount = loopDataPreview.habits.length;
      const cCount = habitsOnly ? 0 : loopDataPreview.checkins.length;
      setLoopDataPreview(null);
      appAlert(
        'اكتملت العملية بنجاح',
        habitsOnly
          ? `تم إنشاء ${hCount} عادة كعادات جديدة بنجاح بدون استيراد أي سجلات سابقة!`
          : `تم دمج ${hCount} عادة و ${cCount.toLocaleString('ar-EG')} سجل إنجاز بنجاح إلى تطبيق إنجاز!`
      );
    } catch (err) {
      setIsProcessingLoopImport(false);
      appAlert('فشل الاستيراد', 'حدث خطأ أثناء دمج البيانات في قاعدة البيانات.');
    }
  };

  const handleDeleteLoopHabits = () => {
    appAlert(
      'حذف عادات Loop المستوردة',
      `هل ترغب في حذف جميع العادات المستوردة (${loopHabitsCount} عادة) وكافة سجلاتها التاريخية؟\n\nلن تتأثر العادات الأصلية المنشأة في تطبيق إنجاز.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف العادات المستوردة',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteImportedLoopHabits();
              appAlert(
                'تم الحذف بنجاح',
                `تم إزالة ${res.deletedHabitsCount} عادة و ${res.deletedCheckinsCount.toLocaleString('ar-EG')} سجل إنجاز بنجاح.`
              );
            } catch {
              appAlert('خطأ', 'تعذر حذف العادات المستوردة.');
            }
          },
        },
      ]
    );
  };

  const themeOptions: { mode: ThemeMode; label: string }[] = [
    { mode: 'light', label: 'فاتح' },
    { mode: 'dark', label: 'داكن' },
    { mode: 'system', label: 'تلقائي' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, spacing.base),
            paddingHorizontal: spacing.base,
            paddingBottom: spacing.sm,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Text style={[typography.h1, { color: theme.text, textAlign: 'right' }]}>
          الإعدادات
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.base,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {/* Appearance Group */}
        <Card style={styles.groupCard}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 12 }]}>
            المظهر
          </Text>

          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const isSelected = themeMode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => setThemeMode(opt.mode)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected ? theme.text : theme.cardSecondary,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.sub,
                      {
                        color: isSelected ? theme.background : theme.textSecondary,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Content & Archive Group */}
        <Card style={styles.groupCard}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 12 }]}>
            إدارة المحتوى
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="العادات المؤرشفة"
            onPress={() => navigation.navigate('ArchivedHabits')}
            style={[styles.settingRow, { minHeight: touchTarget }]}
          >
            <View style={styles.linkArrowContainer}>
              {archivedHabitsCount > 0 ? (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: theme.cardSecondary },
                  ]}
                >
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>
                    {archivedHabitsCount}
                  </Text>
                </View>
              ) : null}
              <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
            </View>

            <View style={styles.settingText}>
              <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                العادات المؤرشفة
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                استعراض أو استعادة أو حذف العادات المؤرشفة
              </Text>
            </View>
          </Pressable>
        </Card>

        {/* Preferences Group */}
        <Card style={styles.groupCard}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 12 }]}>
            التفضيلات والتنبيهات
          </Text>

          {/* Haptics */}
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: hapticsEnabled }}
            onPress={toggleHaptics}
            style={[styles.settingRow, { minHeight: touchTarget }]}
          >
            <View style={styles.radioIndicator}>
              <Ionicons
                name={hapticsEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={hapticsEnabled ? theme.primary : theme.textMuted}
              />
            </View>

            <View style={styles.settingText}>
              <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                التفاعل اللمسي
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                اهتزاز خفيف عند تسجيل الإنجاز
              </Text>
            </View>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Sound Effects */}
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: soundEnabled }}
            onPress={toggleSound}
            style={[styles.settingRow, { minHeight: touchTarget }]}
          >
            <View style={styles.radioIndicator}>
              <Ionicons
                name={soundEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={soundEnabled ? theme.primary : theme.textMuted}
              />
            </View>

            <View style={styles.settingText}>
              <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                المؤثرات الصوتية
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                صوت رنين بهيج عند إكمال العادة
              </Text>
            </View>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Notifications */}
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: notificationsEnabled }}
            onPress={toggleNotifications}
            style={[styles.settingRow, { minHeight: touchTarget }]}
          >
            <View style={styles.radioIndicator}>
              <Ionicons
                name={notificationsEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={notificationsEnabled ? theme.primary : theme.textMuted}
              />
            </View>

            <View style={styles.settingText}>
              <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                التذكيرات اليومية
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                تنبيهات محلية لتذكيرك بمواعيد عاداتك
              </Text>
            </View>
          </Pressable>

          {notificationsEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

              {/* Evening Reflection Reminder */}
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: eveningReminderEnabled }}
                onPress={() => setEveningReminder(!eveningReminderEnabled)}
                style={[styles.settingRow, { minHeight: touchTarget }]}
              >
                <View style={styles.radioIndicator}>
                  <Ionicons
                    name={eveningReminderEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={eveningReminderEnabled ? theme.primary : theme.textMuted}
                  />
                </View>

                <View style={styles.settingText}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                    <Ionicons name="moon-outline" size={16} color={theme.primary} style={{ marginLeft: 6 }} />
                    <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                      تذكير المراجعة المسائية
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                    تنبيه يومي لمراجعة عاداتك وتدوين يومياتك قبل نهاية اليوم
                  </Text>
                </View>
              </Pressable>

              {eveningReminderEnabled && (
                <View
                  style={[
                    styles.eveningTimeContainer,
                    {
                      backgroundColor: theme.cardSecondary,
                      borderColor: theme.border,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <View style={styles.eveningTimeHeader}>
                    <Ionicons name="time-outline" size={15} color={theme.primary} />
                    <Text
                      style={[
                        typography.caption,
                        { color: theme.text, fontWeight: '600', marginRight: 6 },
                      ]}
                    >
                      موعد التذكير: {formatReminderTimeArabic(eveningReminderTime)}
                    </Text>
                  </View>

                  <View style={styles.quickTimeRow}>
                    {[
                      { time: '20:00', label: '08:00 م' },
                      { time: '20:30', label: '08:30 م' },
                      { time: '21:00', label: '09:00 م' },
                      { time: '21:30', label: '09:30 م' },
                      { time: '22:00', label: '10:00 م' },
                    ].map((item) => {
                      const isSelected = eveningReminderTime === item.time;
                      return (
                        <Pressable
                          key={item.time}
                          accessibilityRole="button"
                          accessibilityLabel={`اختيار موعد ${item.label}`}
                          onPress={() => setEveningReminder(true, item.time)}
                          style={({ pressed }) => [
                            styles.quickTimeChip,
                            {
                              backgroundColor: isSelected ? theme.primary : theme.background,
                              borderColor: isSelected ? theme.primary : theme.border,
                              borderRadius: radius.sm,
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isSelected ? '#FFFFFF' : theme.text,
                                fontWeight: isSelected ? '700' : '500',
                                fontSize: 11,
                              },
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={{ marginTop: 12 }}>
                <Button
                  title="إرسال إشعار تجريبي الآن"
                  iconName="notifications-outline"
                  variant="outline"
                  size="sm"
                  onPress={handleTestNotification}
                />
              </View>
            </>
          )}
        </Card>

        {/* Cloud Sync & Database Group */}
        <Card style={styles.groupCard}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 12 }]}>
            المزامنة السحابية وقاعدة البيانات
          </Text>

          {/* Cloud Sync Status Banner */}
          <View
            style={[
              styles.storageNotice,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: theme.border,
                borderRadius: radius.md,
                padding: 12,
                marginBottom: 12,
              },
            ]}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                {cloudSyncState === 'syncing' || isManualSyncing ? (
                  <ActivityIndicator size="small" color="#F59E0B" style={{ marginLeft: 8 }} />
                ) : (
                  <Ionicons
                    name={
                      cloudSyncState === 'synced'
                        ? 'cloud-done'
                        : cloudSyncState === 'offline'
                        ? 'cloud-offline'
                        : 'cloud-outline'
                    }
                    size={18}
                    color={
                      cloudSyncState === 'synced'
                        ? '#10B981'
                        : cloudSyncState === 'offline'
                        ? theme.textMuted
                        : theme.primary
                    }
                    style={{ marginLeft: 6 }}
                  />
                )}
                <Text style={[typography.caption, { color: theme.text, fontWeight: '700' }]}>
                  {cloudSyncState === 'syncing' || isManualSyncing
                    ? 'جارٍ المزامنة السحابية الآن...'
                    : cloudSyncState === 'synced'
                    ? 'متصل ومتزامن مع السحابة'
                    : cloudSyncState === 'offline'
                    ? 'وضع عدم الاتصال (يعمل محلياً)'
                    : 'قاعدة البيانات السحابية'}
                </Text>
              </View>

              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    cloudSyncState === 'syncing' || isManualSyncing
                      ? '#F59E0B'
                      : cloudSyncState === 'synced'
                      ? '#10B981'
                      : theme.textMuted,
                }}
              />
            </View>

            <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 6, textAlign: 'right', fontSize: 11 }]}>
              تتصل جميع أجهزتك بقاعدة البيانات السحابية الموحدة، لتتزامن عاداتك وسجلاتك وتدويناتك فورياً بين أجهزتك.
            </Text>

            {lastCloudSyncTime && (
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 6, textAlign: 'right', fontSize: 10 }]}>
                آخر مزامنة ناجحة: {dayjs(lastCloudSyncTime).format('YYYY/MM/DD hh:mm A')}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Button
              title={isManualSyncing || cloudSyncState === 'syncing' ? 'جارٍ المزامنة السحابية...' : 'مزامنة سحابية الآن'}
              loading={isManualSyncing || cloudSyncState === 'syncing'}
              iconName="sync-outline"
              variant="outline"
              size="sm"
              disabled={isManualSyncing || cloudSyncState === 'syncing'}
              onPress={handleManualSync}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle, marginBottom: 12 }]} />

          {/* Quick Metrics Grid */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricBox, { backgroundColor: theme.cardSecondary, borderRadius: radius.sm, borderColor: theme.border }]}>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>العادات النشطة</Text>
              <Text style={[typography.h3, { color: theme.text, marginTop: 2 }]}>{activeHabitsCount}</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: theme.cardSecondary, borderRadius: radius.sm, borderColor: theme.border }]}>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>سجلات الإنجاز</Text>
              <Text style={[typography.h3, { color: theme.text, marginTop: 2 }]}>{checkins.length}</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: theme.cardSecondary, borderRadius: radius.sm, borderColor: theme.border }]}>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>الخواطر المدونة</Text>
              <Text style={[typography.h3, { color: theme.text, marginTop: 2 }]}>{totalNotesCount}</Text>
            </View>
          </View>
        </Card>

        {/* Data & Backup Group */}
        <Card style={styles.groupCard}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 12 }]}>
            النسخ الاحتياطي والبيانات
          </Text>

          <View style={styles.backupActionsRow}>
            <Button
              title="تصدير نسخة احتياطية"
              iconName="cloud-upload-outline"
              variant="outline"
              size="sm"
              onPress={handleExportBackup}
              style={{ flex: 1, marginLeft: 8 }}
            />
            <Button
              title="استعادة نسخة احتياطية"
              iconName="cloud-download-outline"
              variant="outline"
              size="sm"
              onPress={() => setIsImportModalOpen(true)}
              style={{ flex: 1 }}
            />
          </View>

          <View style={{ marginTop: 8 }}>
            <Button
              title="تصدير السجلات إلى ملف إكسل (CSV)"
              iconName="document-text-outline"
              variant="outline"
              size="sm"
              onPress={handleExportCsv}
            />
          </View>

          <View style={{ marginTop: 8 }}>
            <Button
              title="استيراد من Loop Habit Tracker (.db)"
              iconName="file-tray-full-outline"
              variant="secondary"
              size="sm"
              onPress={handlePickLoopBackup}
              loading={isLoadingLoopFile}
              disabled={isLoadingLoopFile}
            />
          </View>

          {loopHabitsCount > 0 && (
            <View style={{ marginTop: 8 }}>
              <Button
                title={`حذف جميع عادات Loop المستوردة (${loopHabitsCount})`}
                iconName="trash-bin-outline"
                variant="destructive"
                size="sm"
                onPress={handleDeleteLoopHabits}
              />
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle, marginVertical: 12 }]} />

          <Button
            title="إضافة بيانات نموذجية"
            iconName="sparkles-outline"
            variant="secondary"
            size="sm"
            onPress={handleSeed}
            style={{ marginBottom: 8 }}
          />

          <Button
            title="مسح كافة البيانات"
            iconName="trash-outline"
            variant="destructive"
            size="sm"
            onPress={handleReset}
          />
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center' }]}>
            إنجاز • الإصدار 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Import Backup Modal */}
      <Modal
        visible={isImportModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => setIsImportModalOpen(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
              <Text style={[typography.h3, { color: theme.text }]}>
                استعادة نسخة احتياطية
              </Text>
            </View>

            <Text
              style={[
                typography.sub,
                { color: theme.textSecondary, textAlign: 'right', marginTop: 8, marginBottom: 10 },
              ]}
            >
              الصق نص النسخة الاحتياطية (JSON) في المربع أدناه:
            </Text>

            <TextInput
              value={importJsonText}
              onChangeText={setImportJsonText}
              placeholder='{"version": 1, "appName": "enjaz-habits", ...}'
              placeholderTextColor={theme.textMuted}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.modalTextInput,
                typography.caption,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderRadius: radius.sm,
                },
              ]}
            />

            {/* Mode selection */}
            <Text
              style={[
                typography.caption,
                { color: theme.textMuted, textAlign: 'right', marginTop: 12, marginBottom: 6 },
              ]}
            >
              خيارات الاستعادة:
            </Text>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setImportMode('merge')}
                style={[
                  styles.modePill,
                  {
                    backgroundColor: importMode === 'merge' ? theme.text : theme.cardSecondary,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.sub,
                    {
                      color: importMode === 'merge' ? theme.background : theme.textSecondary,
                      fontWeight: importMode === 'merge' ? '600' : '400',
                    },
                  ]}
                >
                  دمج مع البيانات الحالية
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setImportMode('replace')}
                style={[
                  styles.modePill,
                  {
                    backgroundColor: importMode === 'replace' ? theme.text : theme.cardSecondary,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.sub,
                    {
                      color: importMode === 'replace' ? theme.background : theme.textSecondary,
                      fontWeight: importMode === 'replace' ? '600' : '400',
                    },
                  ]}
                >
                  استبدال البيانات بالكامل
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Button
                title={isProcessingImport ? 'جارٍ الاستعادة...' : 'فحص واستعادة'}
                variant="primary"
                onPress={handleConfirmImport}
                disabled={isProcessingImport || !importJsonText.trim()}
                style={{ flex: 1, marginLeft: 8 }}
              />
              <Button
                title="إلغاء"
                variant="outline"
                onPress={() => setIsImportModalOpen(false)}
                style={{ flex: 0.5 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Loop Habit Tracker Import Modal */}
      <Modal
        visible={isLoopModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => !isProcessingLoopImport && setIsLoopModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, maxHeight: '88%' }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
                معاينة بيانات Loop Habits
              </Text>
              <Pressable
                onPress={() => setIsLoopModalOpen(false)}
                disabled={isProcessingLoopImport}
                hitSlop={10}
              >
                <Ionicons name="close-circle-outline" size={24} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              {/* File Info */}
              <View style={[styles.loopFileInfoBox, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                <Ionicons name="file-tray-full" size={24} color={theme.primary} />
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right', fontWeight: 'bold' }]}>
                    {loopDataPreview?.inspection.fileName}
                  </Text>
                  {loopDataPreview?.inspection.oldestRecordDate && (
                    <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                      السجلات من {loopDataPreview.inspection.oldestRecordDate} إلى {loopDataPreview.inspection.newestRecordDate}
                    </Text>
                  )}
                </View>
              </View>

              {/* Statistics Grid */}
              <View style={styles.loopStatsGrid}>
                <View style={[styles.loopStatCard, { backgroundColor: theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: theme.primary, textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.totalHabits ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    إجمالي العادات
                  </Text>
                </View>

                <View style={[styles.loopStatCard, { backgroundColor: theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: '#15803D', textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.activeHabitsCount ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    عادات نشطة
                  </Text>
                </View>

                <View style={[styles.loopStatCard, { backgroundColor: theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: theme.textMuted, textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.archivedHabitsCount ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    عادات مؤرشفة
                  </Text>
                </View>
              </View>

              <View style={[styles.loopStatsGrid, { marginTop: 8 }]}>
                <View style={[styles.loopStatCard, { backgroundColor: theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: theme.primary, textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.totalCheckinsCount.toLocaleString('ar-EG') ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    سجلات إنجاز
                  </Text>
                </View>

                <View style={[styles.loopStatCard, { backgroundColor: theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: '#B45309', textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.notesCount ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    ملاحظات يومية
                  </Text>
                </View>
              </View>

              {/* Safety notice banner */}
              <View style={[styles.loopNoticeBanner, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                <Text style={[typography.caption, { color: theme.primary, flex: 1, marginRight: 8, textAlign: 'right', lineHeight: 18 }]}>
                  استيراد آمن بنمط «الدمج دائماً»: ستُضاف كافة العادات والسجلات التاريخية دون مساس بأي من عاداتك أو بياناتك الحالية.
                </Text>
              </View>

              {/* Habits Preview Section */}
              <Text style={[typography.subMedium, { color: theme.text, textAlign: 'right', marginTop: 14, marginBottom: 8 }]}>
                قائمة العادات التي سيتم استيرادها:
              </Text>
              <View style={[styles.loopHabitsList, { borderColor: theme.border }]}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                  {loopDataPreview?.inspection.habitsPreview.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.loopHabitRow,
                        { borderBottomColor: theme.borderSubtle },
                        idx === (loopDataPreview.inspection.habitsPreview.length - 1) && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={[styles.loopHabitBadge, { backgroundColor: item.isArchived ? theme.cardHover : theme.primaryLight }]}>
                        <Text style={[typography.caption, { color: item.isArchived ? theme.textMuted : theme.primary, fontSize: 11 }]}>
                          {item.isArchived ? 'مؤرشفة' : 'نشطة'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
                        <View style={[styles.habitIconCircle, { backgroundColor: item.color + '20', marginLeft: 8 }]}>
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
                        </View>
                        <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right', flex: 1 }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={{ gap: 8, marginTop: 14 }}>
              <Button
                title={isProcessingLoopImport ? 'جاري إنشاء العادات...' : 'إنشاء العادات فقط (بدون سجلات سابقة)'}
                iconName="sparkles-outline"
                variant="primary"
                size="md"
                onPress={() => handleConfirmLoopImport(true)}
                loading={isProcessingLoopImport}
                disabled={isProcessingLoopImport}
              />
              <Button
                title={isProcessingLoopImport ? 'جاري الدمج...' : 'استيراد كامل مع السجلات التاريخية'}
                iconName="download-outline"
                variant="outline"
                size="sm"
                onPress={() => handleConfirmLoopImport(false)}
                disabled={isProcessingLoopImport}
              />
              <Button
                title="إلغاء"
                variant="ghost"
                size="sm"
                onPress={() => setIsLoopModalOpen(false)}
                disabled={isProcessingLoopImport}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
  },
  groupCard: {
    marginBottom: 12,
    padding: 14,
  },
  themeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    paddingRight: 10,
  },
  radioIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkArrowContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  backupActionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTextInput: {
    height: 120,
    borderWidth: 1,
    padding: 10,
    textAlign: 'left',
  },
  modeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 16,
  },
  modePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  eveningTimeContainer: {
    marginTop: 8,
    marginBottom: 6,
    padding: 12,
    borderWidth: 1,
  },
  eveningTimeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickTimeRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickTimeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  storageNotice: {
    borderWidth: 1,
  },
  metricsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 4,
  },
  metricBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  loopFileInfoBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 10,
  },
  loopStatsGrid: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  loopStatCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopNoticeBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  loopHabitsList: {
    maxHeight: 180,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loopHabitRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  loopHabitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  habitIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
