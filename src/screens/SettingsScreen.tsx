import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, radius, typography, themeMode, setThemeMode, touchTarget } = useTheme();
  const { hapticsEnabled, toggleHaptics, seedData, resetAllData } = useHabitStore();

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

        {/* Preferences Group */}
        <Card style={styles.groupCard}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 12 }]}>
            التفضيلات
          </Text>

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
        </Card>

        {/* Data Group */}
        <Card style={styles.groupCard}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 12 }]}>
            البيانات
          </Text>

          <Button
            title="إضافة بيانات تجريبية"
            variant="secondary"
            size="sm"
            onPress={handleSeed}
            style={{ marginBottom: 10 }}
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
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
});
