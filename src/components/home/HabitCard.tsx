import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { formatArabicStreakDays } from '../../utils/habitUtils';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  currentCount?: number;
  isFuture?: boolean;
  isOffSchedule?: boolean;
  hasNote?: boolean;
  onToggleCheckin: () => void;
  onPressDetails: () => void;
  onLongPress?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onPressNote?: () => void;
}

const HabitCardComponent: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  streak,
  currentCount = 0,
  isFuture = false,
  isOffSchedule = false,
  hasNote = false,
  onToggleCheckin,
  onPressDetails,
  onLongPress,
  onIncrement,
  onDecrement,
  onPressNote,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();
  const isMultiTarget = habit.targetCount > 1;
  const safeCount = isCompleted
    ? habit.targetCount
    : Math.min(habit.targetCount, Math.max(0, currentCount));
  const progressRatio = habit.targetCount > 0 ? (isCompleted ? 1 : Math.min(1, safeCount / habit.targetCount)) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`تفاصيل عادة ${habit.name}`}
      accessibilityHint="اضغط مطولاً لعرض الإجراءات السريعة"
      onPress={onPressDetails}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderRadius: radius.md,
          marginHorizontal: spacing.base,
          marginBottom: 8,
          paddingVertical: 12,
          paddingHorizontal: spacing.base,
          opacity: pressed ? 0.75 : habit.isActive ? 1 : 0.5,
        },
      ]}
    >
      <View style={styles.cardContent}>
        {/* Right side in RTL: Controls */}
        {isCompleted ? (
          isMultiTarget ? (
            <View style={styles.multiControlGroup}>
              <Pressable
                disabled={isFuture}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: true, disabled: isFuture }}
                accessibilityLabel={
                  isFuture
                    ? `لا يمكن تسجيل إنجاز لتاريخ مستقبلي (${habit.name})`
                    : `إلغاء إتمام ${habit.name}`
                }
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                onPress={onToggleCheckin}
                style={({ pressed }) => [
                  styles.checkTarget,
                  {
                    minWidth: 36,
                    minHeight: touchTarget,
                    opacity: isFuture ? 0.35 : pressed ? 0.6 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkCircle,
                    {
                      borderColor: theme.primary,
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </Pressable>

              {!isFuture && onDecrement && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`إنقاص إنجاز ${habit.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  onPress={onDecrement}
                  style={({ pressed }) => [
                    styles.stepBtn,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.cardSecondary,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Ionicons name="remove" size={13} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              disabled={isFuture}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: true, disabled: isFuture }}
              accessibilityLabel={
                isFuture
                  ? `لا يمكن تسجيل إنجاز لتاريخ مستقبلي (${habit.name})`
                  : `إلغاء إتمام ${habit.name}`
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={onToggleCheckin}
              style={({ pressed }) => [
                styles.checkTarget,
                {
                  minWidth: touchTarget,
                  minHeight: touchTarget,
                  opacity: isFuture ? 0.35 : pressed ? 0.6 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.checkCircle,
                  {
                    borderColor: habit.color || theme.primary,
                    backgroundColor: habit.color || theme.primary,
                  },
                ]}
              >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            </Pressable>
          )
        ) : isMultiTarget ? (
          <View style={styles.multiControlGroup}>
            <Pressable
              disabled={isFuture}
              accessibilityRole="button"
              accessibilityLabel={
                isFuture
                  ? `لا يمكن تسجيل إنجاز لتاريخ مستقبلي (${habit.name})`
                  : `إضافة إنجاز لـ ${habit.name} (${safeCount}/${habit.targetCount})`
              }
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              onPress={onIncrement || onToggleCheckin}
              onLongPress={onToggleCheckin}
              style={({ pressed }) => [
                styles.checkTarget,
                {
                  minWidth: 36,
                  minHeight: touchTarget,
                  opacity: isFuture ? 0.35 : pressed ? 0.6 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.checkCircle,
                  {
                    borderColor: safeCount > 0 ? (habit.color || theme.primary) : theme.textMuted,
                    backgroundColor: safeCount > 0 ? `${habit.color || theme.primary}18` : 'transparent',
                  },
                ]}
              >
                {safeCount > 0 ? (
                  <Ionicons name="add" size={14} color={habit.color || theme.primary} />
                ) : (
                  <Ionicons name="add" size={14} color={theme.textMuted} />
                )}
              </View>
            </Pressable>

            {safeCount > 0 && !isFuture && onDecrement && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`إنقاص إنجاز ${habit.name}`}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                onPress={onDecrement}
                style={({ pressed }) => [
                  styles.stepBtn,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.cardSecondary,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="remove" size={13} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable
            disabled={isFuture}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: false, disabled: isFuture }}
            accessibilityLabel={
              isFuture
                ? `لا يمكن تسجيل إنجاز لتاريخ مستقبلي (${habit.name})`
                : `تسجيل إتمام ${habit.name}`
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onToggleCheckin}
            style={({ pressed }) => [
              styles.checkTarget,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: isFuture ? 0.35 : pressed ? 0.6 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.checkCircle,
                {
                  borderColor: isFuture ? theme.border : theme.textMuted,
                  backgroundColor: 'transparent',
                },
              ]}
            />
          </Pressable>
        )}

        {/* Center: Habit Details */}
        <View style={styles.textDetails}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[
                typography.bodyMedium,
                {
                  color: isCompleted ? theme.textMuted : theme.text,
                  textAlign: 'right',
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                  flexShrink: 1,
                },
              ]}
            >
              {habit.name}
            </Text>
            {habit.isPinned && (
              <View
                accessibilityLabel="عادة مثبتة ذات أولوية"
                style={[
                  styles.pinnedBadge,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.xs,
                  },
                ]}
              >
                <Ionicons name="pin" size={10} color={theme.primary} />
              </View>
            )}
          </View>

          {/* Multi-target Progress Track */}
          {isMultiTarget && (
            <View
              style={[
                styles.miniProgressTrack,
                { backgroundColor: theme.cardSecondary, borderRadius: radius.full },
              ]}
            >
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    width: `${Math.round(progressRatio * 100)}%`,
                    backgroundColor: isCompleted
                      ? theme.primary
                      : habit.color || theme.text,
                    borderRadius: radius.full,
                  },
                ]}
              />
            </View>
          )}

          <View style={styles.metaRow}>
            {streak > 0 && (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginLeft: 8 }}>
                <Ionicons name="flame" size={12} color={habit.color || theme.primary} style={{ marginLeft: 3 }} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: theme.textSecondary,
                      textAlign: 'right',
                    },
                  ]}
                >
                  {formatArabicStreakDays(streak)}
                </Text>
              </View>
            )}

            <Text
              style={[
                typography.caption,
                {
                  color: isCompleted
                    ? theme.textMuted
                    : isMultiTarget && safeCount > 0
                    ? theme.primary
                    : theme.textMuted,
                  fontWeight: isMultiTarget && safeCount > 0 ? '600' : '400',
                  textAlign: 'right',
                },
              ]}
            >
              {isMultiTarget
                ? `${safeCount} من ${habit.targetCount} ${habit.unit}`
                : habit.unit}
            </Text>

            {!habit.isActive && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: theme.textMuted,
                    textAlign: 'right',
                    marginRight: 8,
                  },
                ]}
              >
                • متوقفة
              </Text>
            )}

            {isOffSchedule && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: theme.textSecondary,
                    textAlign: 'right',
                    marginRight: 6,
                    fontSize: 11,
                  },
                ]}
              >
                • غير مجدولة اليوم
              </Text>
            )}

            {hasNote ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="عرض أو تعديل ملاحظة اليوم"
                onPress={onPressNote}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.noteBadgePressable,
                  {
                    backgroundColor: theme.primaryLight,
                    borderRadius: radius.sm,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="document-text" size={11} color={theme.primary} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: theme.primary,
                      fontSize: 10,
                      marginRight: 3,
                      fontWeight: '600',
                    },
                  ]}
                >
                  ملاحظة
                </Text>
              </Pressable>
            ) : onPressNote && !isFuture ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إضافة ملاحظة سريعة لليوم"
                onPress={onPressNote}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.quickAddNoteBtn,
                  {
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="create-outline" size={12} color={theme.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Left side in RTL: Category Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isCompleted
                ? theme.cardSecondary
                : habit.color
                ? `${habit.color}15`
                : theme.cardSecondary,
              borderRadius: radius.sm,
            },
          ]}
        >
          <Ionicons
            name={(habit.icon as any) || 'ellipse-outline'}
            size={18}
            color={
              isCompleted
                ? theme.textMuted
                : habit.color || theme.textSecondary
            }
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  checkTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiControlGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginLeft: 6,
    gap: 4,
  },
  stepBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textDetails: {
    flex: 1,
    paddingHorizontal: 6,
  },
  miniProgressTrack: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
    marginTop: 4,
  },
  miniProgressFill: {
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 3,
  },
  iconContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  pinnedBadge: {
    marginRight: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBadgePressable: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginRight: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quickAddNoteBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Performance optimization: prevent unnecessary re-renders in lists
const areEqual = (prevProps: HabitCardProps, nextProps: HabitCardProps) => {
  return (
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.streak === nextProps.streak &&
    prevProps.currentCount === nextProps.currentCount &&
    prevProps.isFuture === nextProps.isFuture &&
    prevProps.isOffSchedule === nextProps.isOffSchedule &&
    prevProps.hasNote === nextProps.hasNote &&
    prevProps.habit === nextProps.habit
  );
};

export const HabitCard = React.memo(HabitCardComponent, areEqual);
