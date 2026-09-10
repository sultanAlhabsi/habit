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
} from '../services/backupService';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, spacing, radius, typography, themeMode, setThemeMode, touchTarget } = useTheme();
  const {
    habits,
    hapticsEnabled,
    toggleHaptics,
    notificationsEnabled,
    toggleNotifications,
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
            <View style={{ marginTop: 10 }}>
              <Button
                title="إرسال إشعار تجريبي الآن"
                variant="outline"
                size="sm"
                onPress={handleTestNotification}
              />
            </View>
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
              variant="outline"
              size="sm"
              onPress={handleExportBackup}
              style={{ flex: 1, marginLeft: 8 }}
            />
            <Button
              title="استعادة نسخة احتياطية"
              variant="outline"
              size="sm"
              onPress={() => setIsImportModalOpen(true)}
              style={{ flex: 1 }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle, marginVertical: 12 }]} />

          <Button
            title="إضافة بيانات نموذجية"
            variant="secondary"
            size="sm"
            onPress={handleSeed}
            style={{ marginBottom: 8 }}
          />

          <Button
            title="مسح كافة البيانات"
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
});
