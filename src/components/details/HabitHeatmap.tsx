import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { Habit, HabitCheckin } from '../../types/habit';
import { isQuantitativeHabit, toArabicNumerals } from '../../utils/habitUtils';

interface HabitHeatmapProps {
  completedDates: Set<string>;
  habitColor: string;
  selectedDate?: string;
  onSelectDate?: (dateStr: string) => void;
  onToggleDate?: (dateStr: string) => void;
  readOnly?: boolean;
  createdAt?: string;
  habit?: Habit;
  checkins?: HabitCheckin[];
}

function hexToRgba(color: string, alpha: number): string {
  if (!color) return `rgba(42, 75, 58, ${alpha})`;
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
}

interface AnimatedHeatmapCellProps {
  dayNum: number;
  dateStr: string;
  idx: number;
  monthKey: string;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  isDisabled: boolean;
  readOnly: boolean;
  isBeforeCreation: boolean;
  intensity: {
    isCompleted: boolean;
    ratio: number;
    backgroundColor: string;
    textColor: string;
    hasActivity: boolean;
  };
  baseColor: string;
  theme: any;
  radius: any;
  typography: any;
  onPress: () => void;
  onLongPress?: () => void;
}

const AnimatedHeatmapCell: React.FC<AnimatedHeatmapCellProps> = React.memo(({
  dayNum,
  dateStr,
  idx,
  monthKey,
  isToday,
  isSelected,
  isFuture,
  isDisabled,
  readOnly,
  isBeforeCreation,
  intensity,
  baseColor,
  theme,
  radius,
  typography,
  onPress,
  onLongPress,
}) => {
  const colIndex = idx % 7;
  const rowIndex = Math.floor(idx / 7);
  const diagonal = rowIndex + colIndex;
  const staggerDelay = diagonal * 22;

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const prevMonthKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const isMonthChanged = prevMonthKeyRef.current !== monthKey;
    prevMonthKeyRef.current = monthKey;

    if (isMonthChanged) {
      scale.value = 0.3;
      opacity.value = 0;

      scale.value = withDelay(
        staggerDelay,
        withSpring(1, { damping: 13, stiffness: 170, mass: 0.8 })
      );
      opacity.value = withDelay(
        staggerDelay,
        withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) })
      );
    }
  }, [monthKey, staggerDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(1.18, { duration: 90, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onPress();
  };

  const a11yLabel = isBeforeCreation
    ? `تاريخ سابق لإنشاء العادة (${dateStr})`
    : isFuture
    ? `تاريخ مستقبلي (${dateStr})`
    : isSelected
    ? `اليوم المختار (${dateStr})${intensity.isCompleted ? '، مكتمل' : ''}`
    : `${dateStr}${intensity.isCompleted ? '، مكتمل' : intensity.ratio > 0 ? `، إنجاز ${toArabicNumerals(Math.round(intensity.ratio * 100))}٪` : '، غير مكتمل'}`;

  const borderColor = isSelected
    ? intensity.isCompleted
      ? theme.text
      : baseColor
    : isToday
    ? theme.text
    : 'transparent';

  const borderWidth = isSelected ? 2 : isToday ? 1.5 : 0;

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.dayCol,
        styles.dayCell,
        {
          opacity: isDisabled
            ? readOnly
              ? 0.75
              : 0.22
            : pressed
            ? 0.7
            : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.dayBox,
          animatedStyle,
          {
            borderRadius: radius.sm || 8,
            backgroundColor: intensity.hasActivity ? intensity.backgroundColor : theme.cardSecondary,
            borderColor,
            borderWidth,
          },
        ]}
      >
        <Text
          style={[
            typography.caption,
            {
              color: intensity.hasActivity
                ? intensity.textColor
                : isSelected
                ? baseColor
                : isToday
                ? theme.text
                : theme.textSecondary,
              fontWeight: intensity.isCompleted || isToday || isSelected ? '600' : '400',
              fontSize: 11,
            },
          ]}
        >
          {dayNum}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

export const HabitHeatmap: React.FC<HabitHeatmapProps> = React.memo(({
  completedDates,
  habitColor,
  selectedDate,
  onSelectDate,
  onToggleDate,
  readOnly = false,
  createdAt,
  habit,
  checkins,
}) => {
  const { theme, radius, spacing, typography } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? dayjs(selectedDate) : dayjs()
  );

  useEffect(() => {
    if (selectedDate && dayjs(selectedDate).isValid()) {
      const targetMonth = dayjs(selectedDate).startOf('month');
      if (!targetMonth.isSame(currentMonth.startOf('month'))) {
        setCurrentMonth(targetMonth);
      }
    }
  }, [selectedDate]);

  const startOfMonth = currentMonth.startOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = startOfMonth.day(); // 0 is Sunday

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthTitle = `${arabicMonths[currentMonth.month()]} ${currentMonth.year()}`;
  const monthKey = currentMonth.format('YYYY-MM');

  const weekDays = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  const canGoPrev = !createdAt || currentMonth.isAfter(dayjs(createdAt).startOf('month'));
  const prevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth((prev) => prev.subtract(1, 'month'));
    }
  };
  const nextMonth = () => {
    if (currentMonth.isBefore(dayjs(), 'month')) {
      setCurrentMonth((prev) => prev.add(1, 'month'));
    }
  };

  const checkinMap = useMemo(() => {
    const map = new Map<string, HabitCheckin>();
    if (checkins && habit) {
      for (const c of checkins) {
        if (c.habitId === habit.id) {
          map.set(c.date, c);
        }
      }
    }
    return map;
  }, [checkins, habit]);

  const baseColor = habitColor || theme.primary;

  const getCellIntensity = (dateStr: string) => {
    const isCompleted = completedDates.has(dateStr);

    if (!habit || !isQuantitativeHabit(habit)) {
      if (isCompleted) {
        return {
          isCompleted: true,
          ratio: 1,
          backgroundColor: baseColor,
          textColor: '#FFFFFF',
          hasActivity: true,
        };
      }
      return {
        isCompleted: false,
        ratio: 0,
        backgroundColor: 'transparent',
        textColor: theme.textSecondary,
        hasActivity: false,
      };
    }

    const c = checkinMap.get(dateStr);
    const target = habit.targetCount && habit.targetCount > 0 ? habit.targetCount : 1;
    const count = c?.count || 0;
    const ratio = Math.min(1, count / target);

    if (isCompleted || ratio >= 1) {
      return {
        isCompleted: true,
        ratio: 1,
        backgroundColor: baseColor,
        textColor: '#FFFFFF',
        hasActivity: true,
      };
    }
    if (ratio >= 0.5) {
      return {
        isCompleted: false,
        ratio,
        backgroundColor: hexToRgba(baseColor, 0.65),
        textColor: '#FFFFFF',
        hasActivity: true,
      };
    }
    if (ratio > 0) {
      return {
        isCompleted: false,
        ratio,
        backgroundColor: hexToRgba(baseColor, 0.3),
        textColor: theme.text,
        hasActivity: true,
      };
    }

    return {
      isCompleted: false,
      ratio: 0,
      backgroundColor: 'transparent',
      textColor: theme.textSecondary,
      hasActivity: false,
    };
  };

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      arr.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d);
    }
    return arr;
  }, [startDayOfWeek, daysInMonth]);

  const todayStr = dayjs().format('YYYY-MM-DD');

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
      {/* Month Navigation */}
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="الشهر السابق"
          onPress={prevMonth}
          disabled={!canGoPrev}
          style={({ pressed }) => [
            styles.navBtn,
            { opacity: canGoPrev ? (pressed ? 0.5 : 1) : 0.2 },
          ]}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.text} />
        </Pressable>

        <Text style={[typography.h3, { color: theme.text }]}>{monthTitle}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="الشهر التالي"
          onPress={nextMonth}
          disabled={!currentMonth.isBefore(dayjs(), 'month')}
          style={({ pressed }) => [
            styles.navBtn,
            { opacity: currentMonth.isBefore(dayjs(), 'month') ? (pressed ? 0.5 : 1) : 0.2 },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={theme.text} />
        </Pressable>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((d, index) => (
          <View key={index} style={styles.dayCol}>
            <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Heatmap Days Grid */}
      <View style={styles.calendarGrid}>
        {cells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <View key={`empty_${idx}`} style={styles.dayCol} />;
          }

          const cellDate = currentMonth.date(dayNum).startOf('day');
          const dateStr = cellDate.format('YYYY-MM-DD');
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const isFuture = cellDate.isAfter(dayjs().startOf('day'));
          const isBeforeCreation = createdAt
            ? cellDate.isBefore(dayjs(createdAt).startOf('day'))
            : false;
          const isDisabled = isFuture || readOnly || isBeforeCreation;
          const intensity = getCellIntensity(dateStr);

          return (
            <AnimatedHeatmapCell
              key={dateStr}
              dayNum={dayNum}
              dateStr={dateStr}
              idx={idx}
              monthKey={monthKey}
              isToday={isToday}
              isSelected={isSelected}
              isFuture={isFuture}
              isDisabled={isDisabled}
              readOnly={readOnly}
              isBeforeCreation={isBeforeCreation}
              intensity={intensity}
              baseColor={baseColor}
              theme={theme}
              radius={radius}
              typography={typography}
              onPress={() => {
                if (onSelectDate) {
                  onSelectDate(dateStr);
                } else if (onToggleDate) {
                  onToggleDate(dateStr);
                }
              }}
              onLongPress={() => {
                if (!readOnly && onToggleDate) {
                  onToggleDate(dateStr);
                }
              }}
            />
          );
        })}
      </View>

      {/* Heatmap Color Gradation Legend */}
      <View style={styles.legendRow}>
        <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}>
          أقل
        </Text>
        <View style={styles.legendTiles}>
          <View style={[styles.legendBox, { backgroundColor: theme.cardSecondary, borderRadius: 3 }]} />
          <View style={[styles.legendBox, { backgroundColor: hexToRgba(baseColor, 0.3), borderRadius: 3 }]} />
          <View style={[styles.legendBox, { backgroundColor: hexToRgba(baseColor, 0.65), borderRadius: 3 }]} />
          <View style={[styles.legendBox, { backgroundColor: baseColor, borderRadius: 3 }]} />
        </View>
        <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}>
          أكثر
        </Text>
      </View>

      <Text
        style={[
          typography.caption,
          {
            color: theme.textMuted,
            textAlign: 'center',
            marginTop: spacing.sm,
            fontSize: 11,
          },
        ]}
      >
        {readOnly
          ? 'العادة في الأرشيف (للقراءة فقط)'
          : 'اضغط لاختيار اليوم واستعراض خواطره، واضغط مجدداً للتسجيل'}
      </Text>
    </Card>
  );
});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  dayCol: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  dayCell: {
    minHeight: 36,
  },
  dayBox: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 2,
  },
  legendTiles: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
  },
});
