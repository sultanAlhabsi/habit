import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { DayAdherence, Habit, HabitCheckin } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { calculateWeekAdherence, formatWeekRangeArabic, toArabicNumerals } from '../../utils/habitUtils';

interface WeeklyChartProps {
  habits?: Habit[];
  checkins?: HabitCheckin[];
  data?: DayAdherence[];
  weekLabel?: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  hasNextWeek?: boolean;
}

interface AnimatedWeeklyBarProps {
  item: DayAdherence;
  index: number;
  weekKey: string;
  theme: any;
  radius: any;
  typography: any;
}

const AnimatedWeeklyBar: React.FC<AnimatedWeeklyBarProps> = React.memo(({
  item,
  index,
  weekKey,
  theme,
  radius,
  typography,
}) => {
  const isItemFuture = Boolean(item.isFuture);
  const targetHeight = isItemFuture || item.rate === 0 ? 0 : Math.max(4, (item.rate / 100) * 80);

  const animatedHeight = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const prevWeekKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const isWeekChanged = prevWeekKeyRef.current !== weekKey;
    prevWeekKeyRef.current = weekKey;

    if (isWeekChanged) {
      // Reset and trigger staggered entrance from right to left
      animatedHeight.value = 0;
      labelOpacity.value = 0;

      animatedHeight.value = withDelay(
        index * 35,
        withTiming(targetHeight, {
          duration: 380,
          easing: Easing.out(Easing.cubic),
        })
      );

      labelOpacity.value = withDelay(
        index * 35 + 80,
        withTiming(1, {
          duration: 240,
          easing: Easing.out(Easing.quad),
        })
      );
    } else {
      // Same week with data change: smooth direct transition without resetting
      animatedHeight.value = withTiming(targetHeight, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      labelOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [weekKey, targetHeight, index]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const a11yLabel = `${item.dayName}: ${
    isItemFuture
      ? 'يوم قادم'
      : item.totalCount > 0
      ? `نسبة الالتزام ${toArabicNumerals(item.rate)}٪`
      : 'لا توجد عادات'
  }`;

  return (
    <View style={styles.barColumn} accessible={true} accessibilityLabel={a11yLabel}>
      <Animated.View style={animatedLabelStyle}>
        <Text
          style={[
            typography.caption,
            {
              color: isItemFuture
                ? theme.textMuted
                : item.rate > 0
                ? theme.text
                : theme.textMuted,
              fontSize: 10,
              marginBottom: 6,
            },
          ]}
        >
          {isItemFuture ? '-' : item.totalCount > 0 ? `${toArabicNumerals(item.rate)}٪` : '-'}
        </Text>
      </Animated.View>

      {/* Slim sleek bar track */}
      <View
        style={[
          styles.barTrack,
          {
            backgroundColor: theme.cardSecondary,
            borderRadius: radius.full,
            opacity: isItemFuture ? 0.35 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.barFill,
            animatedBarStyle,
            {
              backgroundColor: item.isToday ? theme.primary : theme.text,
              borderRadius: radius.full,
            },
          ]}
        />
      </View>

      {/* Day label */}
      <Text
        style={[
          typography.caption,
          {
            color: item.isToday
              ? theme.primary
              : item.totalCount > 0 && !isItemFuture
              ? theme.textSecondary
              : theme.textMuted,
            fontSize: 11,
            fontWeight: item.isToday ? '600' : '400',
            marginTop: 6,
          },
        ]}
      >
        {item.dayShort}
      </Text>

      {/* Constant height today dot container to prevent any vertical baseline jitter */}
      <View
        style={[
          styles.todayIndicator,
          {
            backgroundColor: item.isToday ? theme.primary : 'transparent',
          },
        ]}
      />
    </View>
  );
});

export const WeeklyChart: React.FC<WeeklyChartProps> = React.memo(({
  habits,
  checkins,
  data,
  weekLabel,
  onPrevWeek,
  onNextWeek,
  hasNextWeek,
}) => {
  const { theme, radius, spacing, typography } = useTheme();
  const [internalWeekOffset, setInternalWeekOffset] = useState(0);

  const chartReferenceDate = useMemo(
    () => dayjs().add(internalWeekOffset, 'week'),
    [internalWeekOffset]
  );

  const chartData = useMemo(() => {
    if (data) return data;
    if (habits && checkins) {
      return calculateWeekAdherence(habits, checkins, chartReferenceDate);
    }
    return [];
  }, [data, habits, checkins, chartReferenceDate]);

  const weekKey = useMemo(() => {
    if (chartData.length > 0) {
      return `${chartData[0].date}_${chartData[chartData.length - 1]?.date}`;
    }
    return chartReferenceDate.format('YYYY-MM-DD');
  }, [chartData, chartReferenceDate]);

  const chartLabel = useMemo(() => {
    if (weekLabel) return weekLabel;
    if (internalWeekOffset === 0) return 'الأسبوع الحالي';
    return formatWeekRangeArabic(chartReferenceDate);
  }, [weekLabel, internalWeekOffset, chartReferenceDate]);

  const canGoNext = hasNextWeek !== undefined ? hasNextWeek : internalWeekOffset < 0;
  const handlePrev = onPrevWeek || (() => setInternalWeekOffset((prev) => prev - 1));
  const handleNext =
    onNextWeek ||
    (() => {
      if (canGoNext) {
        setInternalWeekOffset((prev) => Math.min(0, prev + 1));
      }
    });

  const showNav = Boolean(onPrevWeek || (habits && checkins));

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
      <View style={styles.headerRow}>
        <View style={styles.titleSide}>
          <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
            الالتزام الأسبوعي
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, textAlign: 'right' }]}>
            {chartLabel || 'نسبة إنجاز العادات لكل يوم'}
          </Text>
        </View>

        {/* Week navigation controls */}
        {showNav && (
          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="الأسبوع السابق"
              onPress={handlePrev}
              style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="الأسبوع التالي"
              disabled={!canGoNext}
              onPress={handleNext}
              style={({ pressed }) => [
                styles.navBtn,
                { opacity: canGoNext ? (pressed ? 0.5 : 1) : 0.2 },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.chartArea}>
        {chartData.map((item, index) => (
          <AnimatedWeeklyBar
            key={item.date || index}
            item={item}
            index={index}
            weekKey={weekKey}
            theme={theme}
            radius={radius}
            typography={typography}
          />
        ))}
      </View>
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
  titleSide: {
    flex: 1,
  },
  navRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartArea: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 124,
    paddingTop: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 6,
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
