import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  LinearTransition,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Habit } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import {
  formatArabicStreakDays,
  formatHabitStreakArabic,
  formatHabitScheduleShort,
  isQuantitativeHabit,
} from '../../utils/habitUtils';
import { MicroParticleBurst, MicroParticleBurstRef } from '../common/MicroParticleBurst';
import { ProgressBar } from '../common/ProgressBar';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  currentCount?: number;
  isFuture?: boolean;
  isOffSchedule?: boolean;
  hasNote?: boolean;
  periodicBadgeText?: string;
  onToggleCheckin: () => void;
  onPressDetails: () => void;
  onLongPress?: () => void;
  onPressNote?: () => void;
  onPressQuantity?: () => void;
  onPressQuickActions?: () => void;
}

const HabitCardBase: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  streak,
  currentCount = 0,
  isFuture = false,
  isOffSchedule = false,
  hasNote = false,
  periodicBadgeText,
  onToggleCheckin,
  onPressDetails,
  onLongPress,
  onPressNote,
  onPressQuantity,
  onPressQuickActions,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();
  const isMultiTarget = isQuantitativeHabit(habit);
  const safeCount = Math.max(0, currentCount);

  // Optimistic completion state to keep card visible under finger before sliding
  const [isLocallyChecked, setIsLocallyChecked] = useState<boolean | null>(null);
  const checkinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particleRef = useRef<MicroParticleBurstRef>(null);

  // Synchronize optimistic state with prop updates
  useEffect(() => {
    setIsLocallyChecked(null);
  }, [isCompleted]);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (checkinTimeoutRef.current) {
        clearTimeout(checkinTimeoutRef.current);
      }
    };
  }, []);

  const effectiveCompleted = isLocallyChecked !== null ? isLocallyChecked : isCompleted;
  const isTargetMet = effectiveCompleted || (isMultiTarget && safeCount >= habit.targetCount);
  const progressRatio = habit.targetCount > 0 ? safeCount / habit.targetCount : 0;
  const scheduleBadgeText = formatHabitScheduleShort(habit);

  // Subtle tactile press scale (0.98) for card body press + horizontal swipe gesture
  const cardScale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const animatedCardMotionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: cardScale.value },
    ],
  }));

  const animatedCheckBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
  }));

  const animatedNoteBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
  }));

  const animatedCheckIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, 25, 75],
      [0.5, 0.85, 1.15],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      translateX.value,
      [0, 15, 50],
      [0, 0.7, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const animatedNoteIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      -translateX.value,
      [0, 25, 75],
      [0.5, 0.85, 1.15],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      -translateX.value,
      [0, 15, 50],
      [0, 0.7, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const handlePressCircle = () => {
    if (isMultiTarget) {
      if (onPressQuantity) onPressQuantity();
      return;
    }

    if (checkinTimeoutRef.current) {
      clearTimeout(checkinTimeoutRef.current);
      checkinTimeoutRef.current = null;
    }

    if (!effectiveCompleted) {
      // 1. Immediately show completed visual state right under user's finger
      setIsLocallyChecked(true);

      // 2. Trigger micro-particles celebratory burst around the fixed circle
      particleRef.current?.trigger();

      // 3. Keep card peacefully in place for 280ms so the eye takes in completion,
      // then trigger the store update to slide down calmly
      checkinTimeoutRef.current = setTimeout(() => {
        onToggleCheckin();
      }, 280);
    } else {
      // Immediate uncheck
      setIsLocallyChecked(false);
      onToggleCheckin();
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      'worklet';
      if (isFuture && e.translationX > 0) {
        translateX.value = 0;
        return;
      }
      if (e.translationX > 0) {
        translateX.value = Math.min(115, e.translationX * 0.85);
      } else {
        translateX.value = Math.max(-115, e.translationX * 0.85);
      }
    })
    .onEnd(() => {
      'worklet';
      const THRESHOLD = 70;
      if (translateX.value > THRESHOLD && !isFuture) {
        runOnJS(handlePressCircle)();
      } else if (translateX.value < -THRESHOLD) {
        if (onPressNote) {
          runOnJS(onPressNote)();
        }
      }
      translateX.value = withSpring(0, {
        damping: 22,
        stiffness: 260,
        mass: 0.9,
      });
    });

  return (
    <View
      style={[
        styles.swipeRoot,
        {
          marginHorizontal: spacing.base,
          marginBottom: 8,
          borderRadius: radius.md,
        },
      ]}
    >
      {/* Background action: Check Action (revealed on Swipe Right) */}
      <Animated.View
        style={[
          styles.swipeActionBackground,
          styles.checkActionBg,
          {
            backgroundColor: effectiveCompleted
              ? theme.textMuted
              : (habit.color || theme.primary),
            borderRadius: radius.md,
          },
          animatedCheckBgStyle,
        ]}
      >
        <Animated.View style={[styles.actionContent, animatedCheckIconStyle]}>
          <Ionicons
            name={effectiveCompleted ? 'close-circle' : 'checkmark-circle'}
            size={22}
            color="#FFFFFF"
          />
          <Text style={[typography.caption, styles.actionText]}>
            {effectiveCompleted ? 'إلغاء' : 'إتمام'}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Background action: Note Action (revealed on Swipe Left) */}
      <Animated.View
        style={[
          styles.swipeActionBackground,
          styles.noteActionBg,
          {
            backgroundColor: habit.color || theme.primary,
            borderRadius: radius.md,
          },
          animatedNoteBgStyle,
        ]}
      >
        <Animated.View style={[styles.actionContent, animatedNoteIconStyle]}>
          <Ionicons name="document-text" size={22} color="#FFFFFF" />
          <Text style={[typography.caption, styles.actionText]}>
            ملاحظة
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Foreground Swipeable Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedCardMotionStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`تفاصيل عادة ${habit.name}`}
            accessibilityHint="اضغط مطولاً لتغيير ترتيب العادة، أو اسحب يميناً للإتمام ويساراً للملاحظة"
            onPress={onPressDetails}
            onPressIn={() => {
              cardScale.value = withTiming(0.98, { duration: 90 });
            }}
            onPressOut={() => {
              cardScale.value = withSpring(1, { damping: 16, stiffness: 300 });
            }}
            onLongPress={onLongPress}
            delayLongPress={300}
            style={({ pressed }) => [
              styles.cardContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderRadius: radius.md,
                paddingVertical: 12,
                paddingHorizontal: spacing.base,
                opacity: pressed ? 0.88 : habit.isActive ? 1 : 0.5,
              },
            ]}
          >
            <View style={styles.cardContent}>
          {/* Right side in RTL: Unified Check / Quantity Target Circle */}
          <Pressable
            disabled={isFuture}
            accessibilityRole={isMultiTarget ? 'button' : 'checkbox'}
            accessibilityState={isMultiTarget ? undefined : { checked: effectiveCompleted, disabled: isFuture }}
            accessibilityLabel={
              isFuture
                ? `لا يمكن تسجيل إنجاز لتاريخ مستقبلي (${habit.name})`
                : isMultiTarget
                ? `تسجيل كمية ${habit.name} (${safeCount}/${habit.targetCount} ${habit.unit})`
                : effectiveCompleted
                ? `إلغاء إتمام ${habit.name}`
                : `تسجيل إتمام ${habit.name}`
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handlePressCircle}
            android_disableSound={false}
            style={({ pressed }) => [
              styles.checkTarget,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: isFuture ? 0.35 : pressed ? 0.6 : 1,
              },
            ]}
          >
            {/* Celebratory micro particle burst around the fixed button circle */}
            <MicroParticleBurst ref={particleRef} color={habit.color || theme.primary} />

            <View
              style={[
                styles.checkCircle,
                {
                  borderColor: isTargetMet
                    ? (habit.color || theme.primary)
                    : isMultiTarget && safeCount > 0
                    ? (habit.color || theme.primary)
                    : isFuture
                    ? theme.border
                    : theme.isDark
                    ? '#3E444E'
                    : theme.textMuted,
                  backgroundColor: isTargetMet
                    ? (habit.color || theme.primary)
                    : isMultiTarget && safeCount > 0
                    ? `${habit.color || theme.primary}18`
                    : theme.isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'transparent',
                },
              ]}
            >
              {isTargetMet ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : isMultiTarget ? (
                safeCount > 0 ? (
                  <Ionicons name="add" size={14} color={habit.color || theme.primary} />
                ) : (
                  <Ionicons name="add" size={14} color={theme.textMuted} />
                )
              ) : null}
            </View>
          </Pressable>


        {/* Center: Habit Details */}
        <View style={styles.textDetails}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[
                typography.bodyMedium,
                {
                  color: isTargetMet ? theme.textMuted : theme.text,
                  textAlign: 'right',
                  textDecorationLine: isTargetMet ? 'line-through' : 'none',
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
            <ProgressBar
              progress={Math.min(100, Math.round(progressRatio * 100))}
              height={3}
              color={habit.color || theme.primary}
              style={{ marginTop: 4 }}
            />
          )}

          <View style={styles.metaRow}>
            {streak > 0 ? (
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
                  {formatHabitStreakArabic(streak, habit.frequency)}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginLeft: 8, opacity: 0.5 }}>
                <Ionicons name="flame" size={12} color={theme.textMuted} style={{ marginLeft: 3 }} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: theme.textMuted,
                      textAlign: 'right',
                    },
                  ]}
                >
                  {habit.frequency === 'weekly_target'
                    ? '٠ أسابيع متتالية'
                    : habit.frequency === 'monthly_target'
                    ? '٠ أشهر متتالية'
                    : '٠ أيام متتالية'}
                </Text>
              </View>
            )}

            {periodicBadgeText && (
              <View
                style={[
                  styles.periodicBadge,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.xs,
                  },
                ]}
              >
                <Ionicons name="repeat-outline" size={11} color={theme.textSecondary} style={{ marginLeft: 3 }} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: theme.textSecondary,
                      fontWeight: '600',
                      fontSize: 10,
                    },
                  ]}
                >
                  {periodicBadgeText}
                </Text>
              </View>
            )}

            {scheduleBadgeText && !periodicBadgeText && (
              <View
                style={[
                  styles.periodicBadge,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.xs,
                  },
                ]}
              >
                <Ionicons name="calendar-outline" size={10} color={theme.textSecondary} style={{ marginLeft: 3 }} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: theme.textSecondary,
                      fontWeight: '600',
                      fontSize: 10,
                    },
                  ]}
                >
                  {scheduleBadgeText}
                </Text>
              </View>
            )}

            {isMultiTarget && (
              <Pressable
                disabled={isFuture || !onPressQuantity}
                accessibilityRole="button"
                accessibilityLabel="تعديل الكمية المسجلة"
                onPress={onPressQuantity}
                hitSlop={4}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isTargetMet
                        ? (habit.color || theme.primary)
                        : safeCount > 0
                        ? (habit.color || theme.primary)
                        : theme.textMuted,
                      fontWeight: isTargetMet || safeCount > 0 ? '600' : '400',
                      textAlign: 'right',
                    },
                  ]}
                >
                  {`${safeCount} من ${habit.targetCount} ${habit.unit}${safeCount >= habit.targetCount ? ' ✓' : ''}`}
                </Text>
              </Pressable>
            )}

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
                • استراحة اليوم
              </Text>
            )}

            {hasNote && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="عرض أو تعديل ملاحظة اليوم"
                onPress={onPressNote}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.noteBadgePressable,
                  {
                    backgroundColor: habit.color
                      ? theme.isDark
                        ? `${habit.color}2A`
                        : `${habit.color}1E`
                      : theme.primaryLight,
                    borderWidth: theme.isDark ? 1 : 0,
                    borderColor: habit.color ? `${habit.color}40` : theme.border,
                    borderRadius: radius.sm,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="document-text" size={11} color={habit.color || theme.primary} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: habit.color || theme.primary,
                      fontSize: 10,
                      marginRight: 3,
                      fontWeight: '600',
                    },
                  ]}
                >
                  ملاحظة
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Left side in RTL: Category Icon & Quick Actions Button */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
          {onPressQuickActions && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`خيارات سريعة لعادة ${habit.name}`}
              hitSlop={8}
              onPress={onPressQuickActions}
              style={({ pressed }) => [
                styles.quickActionsBtn,
                {
                  opacity: pressed ? 0.4 : 0.8,
                },
              ]}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={theme.textMuted} />
            </Pressable>
          )}

          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isTargetMet
                  ? theme.cardSecondary
                  : habit.color
                  ? theme.isDark
                    ? `${habit.color}2C`
                    : `${habit.color}15`
                  : theme.cardSecondary,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Ionicons
              name={(habit.icon as any) || 'ellipse-outline'}
              size={18}
              color={
                isTargetMet
                  ? theme.textMuted
                  : habit.color || theme.textSecondary
              }
            />
          </View>
        </View>
      </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeRoot: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeActionBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  checkActionBg: {
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  noteActionBg: {
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
    marginTop: 2,
  },
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
    position: 'relative',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
  periodicBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 1,
  },
  quickActionsBtn: {
    width: 28,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});

export const HabitCard = React.memo(HabitCardBase, (prev, next) => {
  return (
    prev.habit.id === next.habit.id &&
    prev.habit.name === next.habit.name &&
    prev.habit.color === next.habit.color &&
    prev.habit.icon === next.habit.icon &&
    prev.habit.targetCount === next.habit.targetCount &&
    prev.habit.unit === next.habit.unit &&
    prev.habit.isPinned === next.habit.isPinned &&
    prev.habit.isActive === next.habit.isActive &&
    prev.isCompleted === next.isCompleted &&
    prev.streak === next.streak &&
    prev.currentCount === next.currentCount &&
    prev.isFuture === next.isFuture &&
    prev.isOffSchedule === next.isOffSchedule &&
    prev.hasNote === next.hasNote &&
    prev.periodicBadgeText === next.periodicBadgeText
  );
});
