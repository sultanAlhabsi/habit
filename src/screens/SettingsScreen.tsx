import React, { useState, useRef, useEffect } from 'react';
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
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Button } from '../components/common/Button';
import { SegmentedThemeControl } from '../components/settings/SegmentedThemeControl';
import { SettingGroup } from '../components/settings/SettingGroup';
import { SettingRow } from '../components/settings/SettingRow';
import { CloudSyncStatusCard } from '../components/settings/CloudSyncStatusCard';
import { ClockTimePicker } from '../components/common/ClockTimePicker';
import { sendTestNotification } from '../services/notificationService';
import {
  exportBackupViaShare,
  validateBackupJson,
  exportCsvViaShare,
  pickAndReadBackupFile,
} from '../services/backupService';
import { exportFullReportToCsv } from '../utils/habitUtils';
import {
  inspectAndParseLoopDatabase,
  ConvertedLoopData,
} from '../services/loopImportService';
import { triggerLightHaptic } from '../utils/haptics';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark, theme, spacing, radius, typography, themeMode, setThemeMode } = useTheme();
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
    deduplicateHabits,
  } = useHabitStore();

  // Modal & Time Picker States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [selectedBackupPayload, setSelectedBackupPayload] = useState<any | null>(null);
  const [selectedBackupFileName, setSelectedBackupFileName] = useState<string>('');
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [isManualPasteOpen, setIsManualPasteOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [isAdvancedDevOpen, setIsAdvancedDevOpen] = useState(false);
  const eveningReminderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (eveningReminderDebounceRef.current) {
        clearTimeout(eveningReminderDebounceRef.current);
      }
    };
  }, []);

  const handleEveningReminderTimeChange = (newTime: string) => {
    if (eveningReminderDebounceRef.current) {
      clearTimeout(eveningReminderDebounceRef.current);
    }
    eveningReminderDebounceRef.current = setTimeout(() => {
      setEveningReminder(true, newTime);
    }, 350);
  };

  // Loop Habits Import State
  const [isLoadingLoopFile, setIsLoadingLoopFile] = useState(false);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);
  const [loopDataPreview, setLoopDataPreview] = useState<ConvertedLoopData | null>(null);
  const [isProcessingLoopImport, setIsProcessingLoopImport] = useState(false);

  const archivedHabitsCount = habits.filter((h) => Boolean(h.archivedAt)).length;
  const loopHabitsCount = habits.filter((h) => h.id.startsWith('loop_')).length;

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

  const handleDeduplicate = async () => {
    setIsDeduplicating(true);
    try {
      const res = await deduplicateHabits();
      if (res.mergedHabitsCount > 0) {
        appAlert(
          'تم توحيد قاعدة البيانات بنجاح',
          `تم بنجاح دمج وتوحيد ${res.mergedHabitsCount} عادة مكررة، وتأمين ${res.migratedCheckinsCount} سجل إنجاز دون أي فقدان للبيانات، ومزامنة السحابة.`
        );
      } else {
        appAlert(
          'قاعدة البيانات نظيفة وموحدة',
          'تم فحص قاعدة البيانات محلياً وسحابياً؛ لا توجد أي عادات مكررة حالياً، وجميع سجلاتك متزامنة بدقة.'
        );
      }
    } catch (err: any) {
      appAlert('خطأ', err?.message || 'حدث خطأ أثناء تنظيف وتوحيد العادات.');
    } finally {
      setIsDeduplicating(false);
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
      'تأكيد مسح البيانات نهائياً',
      'تحذير: سيتم حذف جميع العادات المسجلة وسجلات الإنجاز والخواطر بشكل دائم لا يمكن استرجاعه.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح كافة البيانات',
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

  const handlePickBackupFile = async () => {
    setIsPickingFile(true);
    try {
      const res = await pickAndReadBackupFile();
      if (res.canceled) return;
      if (!res.valid) {
        appAlert('ملف غير صالح', res.error || 'تعذر قراءة ملف النسخة الاحتياطية.');
        return;
      }
      setSelectedBackupPayload(res.data);
      setSelectedBackupFileName(res.fileName || 'نسخة_احتياطية.json');
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleConfirmImport = async () => {
    let payloadToImport = selectedBackupPayload;

    if (!payloadToImport) {
      const validation = validateBackupJson(importJsonText);
      if (!validation.valid) {
        appAlert('بيانات غير صالحة', validation.error);
        return;
      }
      payloadToImport = validation.data;
    }

    const { habits: bHabits, checkins: bCheckins } = payloadToImport;
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
              await importBackup(payloadToImport, importMode);
              setIsProcessingImport(false);
              setIsImportModalOpen(false);
              setSelectedBackupPayload(null);
              setSelectedBackupFileName('');
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

  const openPreloadedLoopBackup = async () => {
    try {
      const preloadedModule = await import('../services/loopBackupPreloaded.json');
      const preloaded = preloadedModule.default || preloadedModule;
      setLoopDataPreview(preloaded as unknown as ConvertedLoopData);
      setIsLoopModalOpen(true);
    } catch {
      appAlert('خطأ', 'تعذر تحميل بيانات النسخة الاحتياطية.');
    }
  };

  const handlePickLoopBackup = async () => {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 26),
            paddingHorizontal: spacing.base,
            paddingBottom: spacing.sm,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Text style={[typography.h1, { color: theme.text, textAlign: 'right', fontSize: 22, lineHeight: 28 }]}>
          الإعدادات
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.base,
          paddingBottom: insets.bottom + 85,
        }}
      >
        {/* Group 1: General Experience & Appearance */}
        <SettingGroup title="المظهر والتفضيلات">
          <View style={styles.themeRowContainer}>
            <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6, fontWeight: '600', fontSize: 11.5 }]}>
              نمط العرض المفضل
            </Text>
            <SegmentedThemeControl currentMode={themeMode} onChange={setThemeMode} />
          </View>

          <View style={[styles.inlineDivider, { backgroundColor: isDark ? '#23272E' : theme.borderSubtle }]} />

          <SettingRow
            iconName="finger-print-outline"
            title="التفاعل اللمسي"
            description="اهتزاز خفيف لتأكيد تسجيل الإنجاز"
            type="switch"
            value={hapticsEnabled}
            onValueChange={toggleHaptics}
          />

          <SettingRow
            iconName="volume-medium-outline"
            title="المؤثرات الصوتية"
            description="صوت رنين بهيج عند إكمال العادة"
            type="switch"
            value={soundEnabled}
            onValueChange={toggleSound}
            hideDivider
          />
        </SettingGroup>

        {/* Group 2: Notifications & Evening Reflection */}
        <SettingGroup title="التنبيهات والمراجعة اليومية">
          <SettingRow
            iconName="notifications-outline"
            title="التذكيرات اليومية"
            description="تنبيهات محلية لتذكيرك بمواعيد عاداتك"
            type="switch"
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            hideDivider={!notificationsEnabled}
          />

          {notificationsEnabled && (
            <>
              <SettingRow
                iconName="moon-outline"
                title="تذكير المراجعة المسائية"
                description="تنبيه يومي لمراجعة عاداتك وتدوين يومياتك"
                type="switch"
                value={eveningReminderEnabled}
                onValueChange={(val) => setEveningReminder(val)}
              />

              {eveningReminderEnabled && (
                <View style={styles.eveningClockWrapper}>
                  <ClockTimePicker
                    value={eveningReminderTime}
                    color={theme.primary}
                    onChange={handleEveningReminderTimeChange}
                    presets={[
                      { time: '20:00', label: '٠٨:٠٠ م', desc: 'مبكراً' },
                      { time: '20:30', label: '٠٨:٣٠ م', desc: 'مساءً' },
                      { time: '21:30', label: '٠٩:٣٠ م', desc: 'الافتراضي' },
                      { time: '22:00', label: '١٠:٠٠ م', desc: 'ليلاً' },
                      { time: '22:30', label: '١٠:٣٠ م', desc: 'متأخراً' },
                    ]}
                  />
                  <View style={[styles.eveningClockDivider, { backgroundColor: theme.border }]} />
                </View>
              )}

              <SettingRow
                iconName="paper-plane-outline"
                title="إرسال إشعار تجريبي الآن"
                description="التحقق الفوري من وصول التنبيهات لجهازك"
                type="button"
                onPress={handleTestNotification}
                hideDivider
              />
            </>
          )}
        </SettingGroup>

        {/* Group 3: Cloud Sync & Data Management */}
        <SettingGroup title="البيانات والمزامنة السحابية">
          <CloudSyncStatusCard
            cloudSyncState={cloudSyncState}
            lastCloudSyncTime={lastCloudSyncTime}
            isManualSyncing={isManualSyncing}
            onSyncPress={handleManualSync}
          />

          <SettingRow
            iconName="cloud-upload-outline"
            title="تصدير نسخة احتياطية"
            description="حفظ نسخة كاملة من عاداتك وسجلاتك كملف JSON"
            type="link"
            onPress={handleExportBackup}
          />

          <SettingRow
            iconName="cloud-download-outline"
            title="استعادة نسخة احتياطية"
            description="استعادة السجلات من ملف نسخة سابقة"
            type="link"
            onPress={() => {
              setSelectedBackupPayload(null);
              setSelectedBackupFileName('');
              setImportJsonText('');
              setIsManualPasteOpen(false);
              setIsImportModalOpen(true);
            }}
          />

          <SettingRow
            iconName="document-text-outline"
            title="تصدير تقرير السجلات (Excel / CSV)"
            description="تصدير بيانات الإنجاز لبرنامج Excel والجداول"
            type="link"
            onPress={handleExportCsv}
          />

          <SettingRow
            iconName="file-tray-full-outline"
            title="استيراد من Loop Habit Tracker"
            description="استيراد قاعدة بيانات سابقة بصيغة .db"
            type="link"
            onPress={handlePickLoopBackup}
            loading={isLoadingLoopFile}
            hideDivider={loopHabitsCount === 0}
          />

          {loopHabitsCount > 0 && (
            <SettingRow
              iconName="trash-outline"
              title={`حذف عادات Loop المستوردة (${loopHabitsCount})`}
              description="إزالة العادات المستوردة وسجلاتها التاريخية فقط"
              type="link"
              isDestructive
              onPress={handleDeleteLoopHabits}
              hideDivider
            />
          )}
        </SettingGroup>

        {/* Group 4: Content & Support */}
        <SettingGroup title="المحتوى والمساعدة">
          <SettingRow
            iconName="archive-outline"
            title="العادات المؤرشفة"
            description="استعراض أو استعادة أو حذف العادات المؤرشفة"
            type="link"
            badgeText={archivedHabitsCount > 0 ? archivedHabitsCount : undefined}
            onPress={() => navigation.navigate('ArchivedHabits')}
          />

          <SettingRow
            iconName="compass-outline"
            title="دليل البداية والترحيب"
            description="إعادة استعراض جولة التعريف بمزايا إنجاز"
            type="link"
            onPress={() => navigation.navigate('Onboarding', { isRevisit: true })}
            hideDivider
          />
        </SettingGroup>

        {/* Group 5: Storage & Danger Zone */}
        <SettingGroup title="إدارة التخزين والصيانة">
          <SettingRow
            iconName="trash-bin-outline"
            title="مسح كافة البيانات نهائياً"
            description="حذف جميع العادات وسجلات الإنجاز بشكل لا رجعة فيه"
            type="link"
            isDestructive
            onPress={handleReset}
            hideDivider={!isAdvancedDevOpen}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="أدوات الصيانة وقاعدة البيانات المتقدمة"
            onPress={() => {
              triggerLightHaptic();
              setIsAdvancedDevOpen(!isAdvancedDevOpen);
            }}
            style={({ pressed }) => [
              styles.devToolsToggle,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600', marginLeft: 6 }]}>
              أدوات الصيانة وقاعدة البيانات (متقدم)
            </Text>
            <Ionicons
              name={isAdvancedDevOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.textMuted}
            />
          </Pressable>

          {isAdvancedDevOpen && (
            <>
              <View style={[styles.inlineDivider, { backgroundColor: isDark ? '#23272E' : theme.borderSubtle }]} />

              <SettingRow
                iconName="shield-checkmark-outline"
                title="تنظيف وتوحيد العادات المكررة"
                description="فحص قاعدة البيانات محلياً وسحابياً لدمج التكرارات"
                type="button"
                loading={isDeduplicating}
                disabled={isDeduplicating || isManualSyncing}
                onPress={handleDeduplicate}
              />

              <SettingRow
                iconName="sparkles-outline"
                title="إضافة بيانات نموذجية تجريبية"
                description="توليد عادات وسجلات افتراضية لتجربة الإحصائيات فوراً"
                type="button"
                onPress={handleSeed}
              />

              <SettingRow
                iconName="speedometer-outline"
                title="مراقب الأداء وقائمة المطورين (Perf Monitor)"
                description="إظهار معدل الإطارات (FPS) والذاكرة واختبارات الأداء"
                type="button"
                onPress={() => {
                  try {
                    const { DevSettings } = require('react-native');
                    DevSettings?.openMenu?.();
                  } catch {}
                }}
                hideDivider
              />
            </>
          )}
        </SettingGroup>

        {/* App Version Footer */}
        <View style={styles.footer}>
          <Text style={[typography.caption, { color: isDark ? '#94A3B8' : theme.textSecondary, textAlign: 'center', fontWeight: '500' }]}>
            إنجاز • الإصدار ١.٠.٠
          </Text>
        </View>
      </ScrollView>


      {/* Modern Backup Restore Modal */}
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
            {/* Modal Header: Title on Right, Close on Left */}
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: theme.text }]}>
                استعادة نسخة احتياطية
              </Text>

              <Pressable
                onPress={() => setIsImportModalOpen(false)}
                hitSlop={10}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="close-circle-outline" size={24} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* File Selection Box */}
            {selectedBackupPayload ? (
              <View
                style={[
                  styles.selectedFileCard,
                  {
                    backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                  <Ionicons name="document-text" size={24} color={theme.primary} />
                  <View style={{ marginRight: 10, flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: theme.text, fontWeight: '700', textAlign: 'right' }]}>
                      {selectedBackupFileName}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginTop: 2 }]}>
                      يحتوي على {selectedBackupPayload.habits?.length ?? 0} عادة و {selectedBackupPayload.checkins?.length ?? 0} سجل إنجاز
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handlePickBackupFile}
                  style={styles.changeFileButton}
                >
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                    تغيير الملف
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ marginVertical: 10 }}>
                <Button
                  title={isPickingFile ? 'جارٍ فتح الملفات...' : 'اختيار ملف النسخة الاحتياطية (.json)'}
                  iconName="folder-open-outline"
                  variant="primary"
                  size="md"
                  onPress={handlePickBackupFile}
                  loading={isPickingFile}
                  disabled={isPickingFile}
                />
              </View>
            )}

            {/* Mode selection pills */}
            <Text
              style={[
                typography.caption,
                { color: theme.textSecondary, textAlign: 'right', marginTop: 12, marginBottom: 8, fontWeight: '600' },
              ]}
            >
              طريقة الاستعادة:
            </Text>

            <View style={styles.modeRow}>
              <Pressable
                onPress={() => {
                  triggerLightHaptic();
                  setImportMode('merge');
                }}
                style={[
                  styles.modePill,
                  {
                    backgroundColor: importMode === 'merge' ? (isDark ? '#2D323B' : '#FFFFFF') : 'transparent',
                    borderColor: importMode === 'merge' ? theme.primary : theme.border,
                    borderRadius: radius.sm,
                    borderWidth: importMode === 'merge' ? 1.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.sub,
                    {
                      color: importMode === 'merge' ? theme.text : theme.textSecondary,
                      fontWeight: importMode === 'merge' ? '700' : '400',
                      fontSize: 12,
                    },
                  ]}
                >
                  دمج مع البيانات الحالية
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  triggerLightHaptic();
                  setImportMode('replace');
                }}
                style={[
                  styles.modePill,
                  {
                    backgroundColor: importMode === 'replace' ? (isDark ? '#2D323B' : '#FFFFFF') : 'transparent',
                    borderColor: importMode === 'replace' ? theme.destructive : theme.border,
                    borderRadius: radius.sm,
                    borderWidth: importMode === 'replace' ? 1.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.sub,
                    {
                      color: importMode === 'replace' ? theme.destructive : theme.textSecondary,
                      fontWeight: importMode === 'replace' ? '700' : '400',
                      fontSize: 12,
                    },
                  ]}
                >
                  استبدال البيانات بالكامل
                </Text>
              </Pressable>
            </View>

            {/* Fallback Manual Paste Option */}
            <Pressable
              onPress={() => setIsManualPasteOpen(!isManualPasteOpen)}
              style={styles.manualToggleLink}
            >
              <Ionicons
                name={isManualPasteOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={theme.textMuted}
              />
              <Text style={[typography.caption, { color: theme.textMuted, marginRight: 4 }]}>
                أو لصق نص JSON يدوياً (متقدم)
              </Text>
            </Pressable>

            {isManualPasteOpen && (
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
                    backgroundColor: isDark ? '#181A1F' : theme.background,
                    borderColor: theme.border,
                    borderRadius: radius.sm,
                  },
                ]}
              />
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Button
                title={isProcessingImport ? 'جارٍ الاستعادة...' : 'تأكيد واستعادة'}
                variant="primary"
                onPress={handleConfirmImport}
                disabled={isProcessingImport || (!selectedBackupPayload && !importJsonText.trim())}
                style={{ flex: 1, marginLeft: 8 }}
              />
              <Button
                title="إلغاء"
                variant="outline"
                onPress={() => setIsImportModalOpen(false)}
                style={{ flex: 0.4 }}
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
              <View style={[styles.loopFileInfoBox, { backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary, borderColor: theme.border }]}>
                <Ionicons name="file-tray-full" size={24} color={theme.primary} />
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right', fontWeight: 'bold' }]}>
                    {loopDataPreview?.inspection.fileName}
                  </Text>
                  {loopDataPreview?.inspection.oldestRecordDate && (
                    <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginTop: 2 }]}>
                      السجلات من {loopDataPreview.inspection.oldestRecordDate} إلى {loopDataPreview.inspection.newestRecordDate}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.loopStatsGrid}>
                <View style={[styles.loopStatCard, { backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: theme.primary, textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.totalHabits ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    إجمالي العادات
                  </Text>
                </View>

                <View style={[styles.loopStatCard, { backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: '#15803D', textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.activeHabitsCount ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    عادات نشطة
                  </Text>
                </View>

                <View style={[styles.loopStatCard, { backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: theme.textMuted, textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.archivedHabitsCount ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    عادات مؤرشفة
                  </Text>
                </View>
              </View>

              <View style={[styles.loopStatsGrid, { marginTop: 8 }]}>
                <View style={[styles.loopStatCard, { backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: theme.primary, textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.totalCheckinsCount.toLocaleString('ar-EG') ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    سجلات إنجاز
                  </Text>
                </View>

                <View style={[styles.loopStatCard, { backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary }]}>
                  <Text style={[typography.h3, { color: '#B45309', textAlign: 'center' }]}>
                    {loopDataPreview?.inspection.notesCount ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
                    ملاحظات يومية
                  </Text>
                </View>
              </View>

              <View style={[styles.loopNoticeBanner, { backgroundColor: isDark ? 'rgba(42, 75, 58, 0.2)' : theme.primaryLight, borderColor: theme.primary }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                <Text style={[typography.caption, { color: theme.primary, flex: 1, marginRight: 8, textAlign: 'right', lineHeight: 18 }]}>
                  استيراد آمن بنمط «الدمج دائماً»: ستُضاف كافة العادات والسجلات التاريخية دون مساس بأي من عاداتك الحالية.
                </Text>
              </View>

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
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
                        <View style={[styles.habitIconCircle, { backgroundColor: item.color + '20', marginLeft: 8 }]}>
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
                        </View>
                        <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right', flex: 1 }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <View style={[styles.loopHabitBadge, { backgroundColor: item.isArchived ? (isDark ? '#262A30' : theme.cardHover) : theme.primaryLight }]}>
                        <Text style={[typography.caption, { color: item.isArchived ? theme.textMuted : theme.primary, fontSize: 11 }]}>
                          {item.isArchived ? 'مؤرشفة' : 'نشطة'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

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
  themeRowContainer: {
    padding: 14,
    paddingBottom: 12,
  },
  inlineDivider: {
    height: 1,
    width: '100%',
  },
  eveningClockWrapper: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 2,
  },
  eveningClockDivider: {
    height: 1,
    marginRight: 60,
    marginLeft: 14,
    marginTop: 16,
  },
  devToolsToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  footer: {
    marginTop: 18,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  selectedFileCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    marginVertical: 10,
  },
  changeFileButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalTextInput: {
    height: 100,
    borderWidth: 1,
    padding: 10,
    textAlign: 'left',
    marginBottom: 12,
  },
  manualToggleLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  modeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 6,
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
