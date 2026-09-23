import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  PanResponder,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Habit } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { useHabitStore } from '../../store/useHabitStore';
import { reorderArray, sortHabits, isQuantitativeHabit, formatHabitFrequencyLabel } from '../../utils/habitUtils';

interface ReorderHabitsModalProps {
  visible: boolean;
  initialFocusedHabitId?: string | null;
  onClose: () => void;
}

const ITEM_HEIGHT = 74;

export const ReorderHabitsModal: React.FC<ReorderHabitsModalProps> = ({
  visible,
  initialFocusedHabitId,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, radius, spacing, typography, touchTarget } = useTheme();
  const habits = useHabitStore((state) => state.habits);
  const reorderHabits = useHabitStore((state) => state.reorderHabits);
  const hapticsEnabled = useHabitStore((state) => state.hapticsEnabled);

  // Filter active, unarchived habits
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archivedAt && h.isActive),
    [habits]
  );

  const [localHabits, setLocalHabits] = useState<Habit[]>([]);
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null);
  const [focusedHabitId, setFocusedHabitId] = useState<string | null>(null);

  const localHabitsRef = useRef<Habit[]>(localHabits);
  localHabitsRef.current = localHabits;
  const isVisibleRef = useRef(false);

  // Animated values for smooth drag feedback
  const dragY = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  // Initialize sorted habits when modal becomes visible
  useEffect(() => {
    if (visible && !isVisibleRef.current) {
      const sorted = sortHabits(activeHabits, 'default', [], '');
      setLocalHabits(sorted);
      localHabitsRef.current = sorted;
      setFocusedHabitId(initialFocusedHabitId || null);
      setDraggingHabitId(null);
      dragY.setValue(0);
      dragScale.setValue(1);
    }
    isVisibleRef.current = visible;
  }, [visible, initialFocusedHabitId]);

  // Separate pinned and regular habits
  const pinnedList = useMemo(
    () => localHabits.filter((h) => h.isPinned),
    [localHabits]
  );

  const regularList = useMemo(
    () => localHabits.filter((h) => !h.isPinned),
    [localHabits]
  );

  const triggerHaptic = (duration = 30) => {
    if (hapticsEnabled) {
      Vibration.vibrate(duration);
    }
  };

  const handleSaveAndClose = () => {
    const currentList = localHabitsRef.current;
    onClose();
    setTimeout(() => {
      reorderHabits(currentList);
    }, 50);
  };

  const handleResetToChronological = () => {
    const sorted = [...localHabitsRef.current].sort((a, b) => {
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return a.createdAt.localeCompare(b.createdAt);
    });
    setLocalHabits(sorted);
    localHabitsRef.current = sorted;
    triggerHaptic(40);
    setTimeout(() => {
      reorderHabits(sorted);
    }, 0);
  };

  // Drag PanResponder for a given habit
  const createPanResponder = (habit: Habit) => {
    let currentDy = 0;
    let accumulatedSteps = 0;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        setDraggingHabitId(habit.id);
        setFocusedHabitId(habit.id);
        triggerHaptic(40);
        Animated.parallel([
          Animated.spring(dragScale, {
            toValue: 1.04,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderMove: (_, gesture) => {
        currentDy = gesture.dy;
        dragY.setValue(currentDy);

        const stepThreshold = ITEM_HEIGHT;
        const currentSteps = Math.trunc(currentDy / stepThreshold);

        if (currentSteps !== accumulatedSteps) {
          const diff = currentSteps - accumulatedSteps;
          accumulatedSteps = currentSteps;

          setLocalHabits((prev) => {
            const isTargetPinned = Boolean(habit.isPinned);
            const currentSubList = isTargetPinned
              ? prev.filter((h) => h.isPinned)
              : prev.filter((h) => !h.isPinned);
            const otherSubList = isTargetPinned
              ? prev.filter((h) => !h.isPinned)
              : prev.filter((h) => h.isPinned);

            const currentIndex = currentSubList.findIndex((h) => h.id === habit.id);
            if (currentIndex < 0) return prev;

            const targetIndex = currentIndex + diff;
            if (targetIndex < 0 || targetIndex >= currentSubList.length) {
              return prev;
            }

            const updatedSubList = reorderArray(currentSubList, currentIndex, targetIndex);
            triggerHaptic(20);

            const next = isTargetPinned
              ? [...updatedSubList, ...otherSubList]
              : [...otherSubList, ...updatedSubList];
            localHabitsRef.current = next;
            return next;
          });
        }
      },
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(dragScale, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setDraggingHabitId(null);
          triggerHaptic(30);
          const currentList = localHabitsRef.current;
          setTimeout(() => {
            reorderHabits(currentList);
          }, 0);
        });
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(dragScale, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setDraggingHabitId(null);
        });
      },
    });
  };

  const renderHabitRow = (
    habit: Habit,
    index: number,
    totalCount: number
  ) => {
    const isDragging = draggingHabitId === habit.id;
    const isFocused = focusedHabitId === habit.id;
    const panResponder = createPanResponder(habit);

    const rowStyle = isDragging
      ? {
          transform: [{ translateY: dragY }, { scale: dragScale }],
          zIndex: 999,
          elevation: 6,
          backgroundColor: theme.cardSecondary,
          borderRadius: radius.md,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        }
      : {
          zIndex: 1,
          borderWidth: 0,
          backgroundColor: isFocused ? `${habit.color || theme.primary}12` : theme.cardSecondary,
        };

    return (
      <Animated.View
        key={habit.id}
        style={[
          styles.habitRow,
          {
            borderRadius: radius.md,
            marginBottom: 8,
            paddingVertical: 10,
            paddingHorizontal: spacing.sm,
            borderWidth: 0,
          },
          rowStyle,
        ]}
      >
        {/* Right Side in RTL: Habit Icon Badge */}
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: `${habit.color || theme.primary}18`,
              borderRadius: radius.sm,
            },
          ]}
        >
          <Ionicons
            name={(habit.icon as any) || 'sparkles-outline'}
            size={18}
            color={habit.color || theme.primary}
          />
        </View>

        {/* Center: Habit Name and Target info */}
        <View style={styles.habitInfo}>
          <View style={styles.habitNameRow}>
            <Text
              numberOfLines={1}
              style={[
                typography.bodyMedium,
                {
                  color: theme.text,
                  textAlign: 'right',
                  fontWeight: isFocused ? '700' : '600',
                  flexShrink: 1,
                },
              ]}
            >
              {habit.name}
            </Text>
            {habit.isPinned && (
              <View
                style={[
                  styles.pinnedBadge,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.xs,
                  },
                ]}
              >
                <Ionicons name="pin" size={9} color={theme.primary} />
              </View>
            )}
          </View>

          <Text
            numberOfLines={1}
            style={[
              typography.caption,
              {
                color: theme.textMuted,
                textAlign: 'right',
                marginTop: 2,
              },
            ]}
          >
            {isQuantitativeHabit(habit)
              ? `الهدف: ${habit.targetCount} ${habit.unit} يومياً`
              : formatHabitFrequencyLabel(habit)}
          </Text>
        </View>

        {/* Left Side in RTL: Drag Handle without capsule */}
        <View
          {...panResponder.panHandlers}
          accessibilityRole="button"
          accessibilityLabel={`مقبض سحب لعادة ${habit.name}`}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.dragHandle}
        >
          <Ionicons
            name="reorder-two-outline"
            size={18}
            color={isDragging ? (habit.color || theme.primary) : theme.textMuted}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.backdropPressable}
          onPress={onClose}
          accessibilityLabel="إغلاق نافذة الترتيب"
        />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.card,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderTopWidth: 1,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Header indicator bar */}
          <View style={[styles.dragBar, { backgroundColor: theme.border }]} />

          {/* Top Header Row */}
          <View style={[styles.headerRow, { paddingHorizontal: spacing.base }]}>
            <View style={styles.headerTitles}>
              <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
                إعادة ترتيب العادات
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                اسحب بالمقبض (≡) لإعادة الترتيب
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق نافذة الترتيب"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeHeaderBtn,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.full,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Instruction & Reset Banner */}
          <View
            style={[
              styles.tipContainer,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: theme.border,
                borderRadius: radius.md,
                marginHorizontal: spacing.base,
                marginTop: spacing.sm,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', lineHeight: 18 }]}>
                يُحفظ هذا الترتيب المخصص ويصبح ترتيبك الافتراضي على الشاشة الرئيسية.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إعادة الترتيب حسب تاريخ الإنشاء"
              onPress={handleResetToChronological}
              hitSlop={6}
              style={({ pressed }) => [
                styles.resetBtn,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                  borderRadius: radius.sm,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons name="refresh-outline" size={13} color={theme.textSecondary} style={{ marginLeft: 4 }} />
              <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600', fontSize: 11 }]}>
                حسب الإنشاء
              </Text>
            </Pressable>
          </View>

          {/* Scrollable list of habits */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
          >
            {/* Pinned Habits Section */}
            {pinnedList.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionBadge}>
                    <Ionicons name="pin" size={11} color={theme.primary} style={{ marginLeft: 4 }} />
                    <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', fontSize: 11 }]}>
                      العادات المثبتة ({pinnedList.length})
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}>
                    تظهر دائماً في بداية القائمة
                  </Text>
                </View>

                {pinnedList.map((h, idx) =>
                  renderHabitRow(h, idx, pinnedList.length)
                )}
              </View>
            )}

            {/* Regular Habits Section */}
            <View style={styles.sectionContainer}>
              {pinnedList.length > 0 && (
                <View style={[styles.sectionHeaderRow, { marginTop: 8 }]}>
                  <Text style={[typography.subMedium, { color: theme.text, fontWeight: '700' }]}>
                    العادات اليومية ({regularList.length})
                  </Text>
                </View>
              )}

              {regularList.map((h, idx) =>
                renderHabitRow(h, idx, regularList.length)
              )}
            </View>
          </ScrollView>

          {/* Bottom Confirmation Bar */}
          <View style={[styles.bottomBar, { paddingHorizontal: spacing.base, marginTop: spacing.sm }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="حفظ الترتيب والرجوع"
              onPress={handleSaveAndClose}
              style={({ pressed }) => [
                styles.saveBottomBtn,
                {
                  backgroundColor: theme.primary,
                  borderRadius: radius.md,
                  minHeight: touchTarget,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>
                حفظ الترتيب
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    maxHeight: '85%',
    width: '100%',
    paddingTop: 8,
  },
  dragBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitles: {
    flex: 1,
  },
  closeHeaderBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tipContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  sectionContainer: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  habitRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    minHeight: ITEM_HEIGHT - 6,
  },
  dragHandle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
    paddingLeft: 8,
  },
  habitNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  pinnedBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  bottomBar: {
    width: '100%',
  },
  saveBottomBtn: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
