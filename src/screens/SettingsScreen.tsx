import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, spacing, radius, typography, themeMode, setThemeMode, touchTarget } = useTheme();
  const {
    habits,
    checkins,
    hapticsEnabled,
    toggleHaptics,
    notificationsEnabled,
    toggleNotifications,
    eveningReminderEnabled,
    eveningReminderTime,
    setEveningReminder,
    exportBackup,
    importBackup,
    seedData,
    resetAllData,
  } = useHabitStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const archivedHabitsCount = habits.filter((h) => Boolean(h.archivedAt)).length;

  const handleSeed = () => {
    Alert.alert(
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
    Alert.alert(
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
      Alert.alert(
        'تم الإرسال',
        'تمت جدولة إشعار تجريبي وسيصلك خلال ثانيتين!'
      );
    } else {
      Alert.alert(
        'تعذر الإرسال',
        'يرجى التأكد من تفعيل أذونات الإشعارات لتطبيق إنجاز من إعدادات النظام.'
      );
    }
  };

  const handleExportBackup = async () => {
    try {
      const payload = await exportBackup();
      await exportBackupViaShare(payload);
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير النسخة الاحتياطية.');
    }
  };

  const handleExportCsv = async () => {
    try {
      if (habits.length === 0) {
        Alert.alert('تنبيه', 'لا توجد عادات مسجلة لتصدير تقرير CSV.');
        return;
      }
      const csvData = exportFullReportToCsv(habits, checkins);
      await exportCsvViaShare(csvData, 'تقرير عادات وسجلات إنجاز');
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير ملف CSV.');
    }
  };

  const handleConfirmImport = async () => {
    const validation = validateBackupJson(importJsonText);
    if (!validation.valid) {
      Alert.alert('بيانات غير صالحة', validation.error);
      return;
    }

    const { habits: bHabits, checkins: bCheckins } = validation.data;
    const modeLabel = importMode === 'replace' ? 'استبدال كافة البيانات' : 'الدمج مع البيانات الحالية';

    Alert.alert(
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
              Alert.alert('نجاح', 'تمت استعادة النسخة الاحتياطية بنجاح!');
            } catch (error) {
              setIsProcessingImport(false);
              Alert.alert('خطأ', 'فشلت عملية الاستعادة. يرجى التحقق من صحة الملف.');
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
});
