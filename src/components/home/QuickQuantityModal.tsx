import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../common/Button';
import { formatArabicDate, normalizeArabicNumerals, toArabicNumerals } from '../../utils/habitUtils';

interface QuickQuantityModalProps {
  visible: boolean;
  habit: Habit | null;
  date: string;
  currentCount?: number;
  onClose: () => void;
  onSave: (count: number) => Promise<void> | void;
}

export const QuickQuantityModal: React.FC<QuickQuantityModalProps> = ({
  visible,
  habit,
  date,
  currentCount = 0,
  onClose,
  onSave,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();
  const [inputText, setInputText] = useState<string>(currentCount > 0 ? toArabicNumerals(currentCount) : '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setInputText(currentCount > 0 ? toArabicNumerals(currentCount) : '');
      setIsSaving(false);
    }
  }, [visible, currentCount]);

  if (!habit) return null;

  const targetCount = Math.max(1, habit.targetCount || 1);
  const normalizedStr = normalizeArabicNumerals(inputText.trim());
  const parsedCount = Math.max(0, parseInt(normalizedStr, 10) || 0);
  const isCompleted = parsedCount >= targetCount;
  const progressPercent = Math.round((parsedCount / targetCount) * 100);
  const habitColor = habit.color || theme.primary;

  const handleSave = () => {
    onClose();
    Promise.resolve(onSave(parsedCount)).catch(() => {});
  };

  const handleSetCount = (value: number) => {
    const next = Math.max(0, value);
    setInputText(next > 0 ? toArabicNumerals(next) : '');
  };

  const handleAddStep = (step: number) => {
    handleSetCount(parsedCount + step);
  };

  const quickChips = [
    { label: '+١', value: 1 },
    { label: '+٥', value: 5 },
    { label: '+١٠', value: 10 },
    { label: '+٢٠', value: 20 },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.habitMeta}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: habit.color ? `${habit.color}18` : theme.cardSecondary,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name={(habit.icon as any) || 'ellipse-outline'}
                    size={20}
                    color={habit.color || theme.text}
                  />
                </View>

                <View style={styles.titlesBox}>
                  <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
                    {habit.name}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginTop: 2 }]}>
                    تسجيل كمية: {formatArabicDate(date)}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إغلاق نافذة تسجيل الكمية"
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderRadius: radius.full,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Target info card */}
            <View
              style={[
                styles.targetInfoCard,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.md,
                  marginTop: spacing.md,
                },
              ]}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                  <Ionicons name="flag-outline" size={14} color={habit.color || theme.primary} style={{ marginLeft: 6 }} />
                  <Text style={[typography.subMedium, { color: theme.text, fontWeight: '700' }]}>
                    الحد الأدنى المطلوب:
                  </Text>
                </View>
                <Text style={[typography.subMedium, { color: habit.color || theme.primary, fontWeight: '700' }]}>
                  {targetCount} {habit.unit}
                </Text>
              </View>
            </View>

            {/* Main Numeric Input & Steppers */}
            <View style={[styles.inputRow, { marginTop: spacing.base }]}>
              {/* Stepper + */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="زيادة الكمية بواحد"
                onPress={() => handleAddStep(1)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="add" size={24} color={theme.text} />
              </Pressable>

              {/* Number text field */}
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <TextInput
                  value={inputText}
                  onChangeText={(v) => setInputText(toArabicNumerals(v))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                  selectTextOnFocus
                  style={[
                    styles.quantityInput,
                    typography.h1,
                    {
                      color: isCompleted ? habitColor : theme.text,
                      backgroundColor: theme.background,
                      borderColor: isCompleted ? habitColor : theme.border,
                      borderRadius: radius.md,
                      minHeight: touchTarget,
                    },
                  ]}
                />
                <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginTop: 4 }]}>
                  {habit.unit}
                </Text>
              </View>

              {/* Stepper - */}
              <Pressable
                disabled={parsedCount <= 0}
                accessibilityRole="button"
                accessibilityLabel="إنقاص الكمية بواحد"
                onPress={() => handleAddStep(-1)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.md,
                    opacity: parsedCount <= 0 ? 0.3 : pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="remove" size={24} color={theme.text} />
              </Pressable>
            </View>

            {/* Quick Increment Chips */}
            <View style={[styles.chipsContainer, { marginTop: spacing.md }]}>
              {quickChips.map((chip) => (
                <Pressable
                  key={chip.label}
                  accessibilityRole="button"
                  accessibilityLabel={`إضافة ${chip.label}`}
                  onPress={() => handleAddStep(chip.value)}
                  style={({ pressed }) => [
                    styles.chipBtn,
                    {
                      backgroundColor: theme.cardSecondary,
                      borderColor: theme.border,
                      borderRadius: radius.sm,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[typography.caption, { color: theme.text, fontWeight: '600' }]}>
                    {chip.label}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تعيين الحد الأدنى مباشرة"
                onPress={() => handleSetCount(targetCount)}
                style={({ pressed }) => [
                  styles.chipBtn,
                  {
                    backgroundColor: isCompleted ? theme.cardSecondary : `${habit.color || theme.primary}15`,
                    borderColor: isCompleted ? theme.border : habit.color || theme.primary,
                    borderRadius: radius.sm,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    { color: isCompleted ? theme.textSecondary : habit.color || theme.primary, fontWeight: '700' },
                  ]}
                >
                  الحد الأدنى ({targetCount})
                </Text>
              </Pressable>

              {parsedCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="مسح القيمة إلى صفر"
                  onPress={() => handleSetCount(0)}
                  style={({ pressed }) => [
                    styles.chipBtn,
                    {
                      backgroundColor: theme.cardSecondary,
                      borderColor: theme.border,
                      borderRadius: radius.sm,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[typography.caption, { color: theme.destructive || '#E74C3C', fontWeight: '600' }]}>
                    تصفير
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Status & Progress Bar */}
            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: isCompleted ? `${habitColor}15` : theme.cardSecondary,
                  borderColor: isCompleted ? `${habitColor}40` : theme.border,
                  borderRadius: radius.md,
                  marginTop: spacing.md,
                },
              ]}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : 'time-outline'}
                    size={16}
                    color={isCompleted ? habitColor : theme.textSecondary}
                    style={{ marginLeft: 6 }}
                  />
                  <Text
                    style={[
                      typography.subMedium,
                      {
                        color: isCompleted ? habitColor : theme.text,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {isCompleted ? 'مكتملة بنجاح!' : parsedCount > 0 ? 'قيد الإنجاز' : 'غير مكتملة'}
                  </Text>
                </View>

                <Text
                  style={[
                    typography.caption,
                    {
                      color: isCompleted ? habitColor : theme.textSecondary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {parsedCount} / {targetCount} {habit.unit} ({progressPercent}%)
                </Text>
              </View>

              {/* Visual Progress Bar */}
              <View
                style={[
                  styles.progressBarTrack,
                  {
                    backgroundColor: theme.border,
                    borderRadius: radius.full,
                    marginTop: 8,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, progressPercent)}%`,
                      backgroundColor: habitColor,
                      borderRadius: radius.full,
                    },
                  ]}
                />
              </View>

              {!isCompleted && parsedCount > 0 && (
                <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 6, fontSize: 11 }]}>
                  * يتبقى {Math.max(0, targetCount - parsedCount)} {habit.unit} لتحقيق الحد الأدنى واحتساب العادة مكتملة.
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={[styles.actionsContainer, { marginTop: spacing.lg }]}>
              <Button
                title={isSaving ? 'جارٍ الحفظ...' : 'حفظ الكمية'}
                variant="primary"
                onPress={handleSave}
                disabled={isSaving}
                style={{ marginBottom: spacing.xs }}
              />

              <Button
                title="إلغاء"
                variant="outline"
                onPress={onClose}
                disabled={isSaving}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  habitMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  titlesBox: {
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInfoCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quantityInput: {
    textAlign: 'center',
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontWeight: '700',
    fontSize: 26,
  },
  chipsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    padding: 12,
    borderWidth: 1,
  },
  progressBarTrack: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  actionsContainer: {
    paddingTop: 4,
  },
});
