import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../../theme/ThemeContext';
import { formatArabicDate } from '../../utils/habitUtils';

interface DateStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DateStrip: React.FC<DateStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const itemLayouts = useRef<{ [key: string]: { x: number; y: number; width: number; height: number } }>({});
  const isInitialMount = useRef(true);

  // Local active date for zero-latency, instant response
  const [activeDate, setActiveDate] = useState<string>(selectedDate);

  const capsuleX = useSharedValue(0);
  const capsuleY = useSharedValue(0);
  const capsuleWidth = useSharedValue(44);
  const capsuleHeight = useSharedValue(48);
  const capsuleOpacity = useSharedValue(0);

  const today = dayjs();
  const selDay = dayjs(selectedDate);
  const diffFromToday = selDay.diff(today, 'day');

  // Dynamic window: if selectedDate is outside standard 14 days around today, center around selectedDate
  const centerDate = Math.abs(diffFromToday) <= 7 ? today : selDay;
  const centerDateStr = centerDate.format('YYYY-MM-DD');

  const days = useMemo(() =>
    Array.from({ length: 15 }).map((_, index) => {
      const d = centerDate.subtract(7 - index, 'day');
      return {
        dateStr: d.format('YYYY-MM-DD'),
        dayNum: d.date(),
        dayShort: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'][d.day()],
        isToday: d.isSame(today, 'day'),
      };
    }),
    [centerDateStr]
  );

  const selectedIndex = days.findIndex((d) => d.dateStr === activeDate);

  const updateCapsulePosition = (dateStr: string, immediate = false) => {
    const layout = itemLayouts.current[dateStr];
    if (!layout) return;

    if (immediate || isInitialMount.current) {
      isInitialMount.current = false;
      capsuleX.value = layout.x;
      capsuleY.value = layout.y;
      capsuleWidth.value = layout.width;
      capsuleHeight.value = layout.height;
      capsuleOpacity.value = 1;
    } else {
      capsuleOpacity.value = withTiming(1, { duration: 150 });
      capsuleY.value = layout.y;
      capsuleHeight.value = layout.height;
      capsuleWidth.value = withSpring(layout.width, {
        damping: 24,
        stiffness: 260,
        mass: 0.7,
      });
      capsuleX.value = withSpring(layout.x, {
        damping: 24,
        stiffness: 260,
        mass: 0.7,
      });
    }
  };

  useEffect(() => {
    setActiveDate(selectedDate);
    updateCapsulePosition(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedIndex >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: Math.max(0, selectedIndex * 52 - 120),
        animated: true,
      });
    }
  }, [selectedIndex]);

  const handleDayPress = (dateStr: string) => {
    if (dateStr === activeDate) return;

    setActiveDate(dateStr);
    updateCapsulePosition(dateStr);
    onSelectDate(dateStr);
  };

  const animatedCapsuleStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: capsuleOpacity.value,
      width: capsuleWidth.value,
      height: capsuleHeight.value,
      transform: [
        { translateX: capsuleX.value },
        { translateY: capsuleY.value },
      ],
    };
  });

  const todayStr = today.format('YYYY-MM-DD');
  const isSelectedToday = activeDate === todayStr;
  const canGoNextWeek = dayjs(activeDate).startOf('day').isBefore(today.startOf('day'));

  return (
    <View style={[styles.container, { marginBottom: spacing.sm }]}>
      {/* Week Navigation Header */}
      <View style={[styles.navRow, { paddingHorizontal: spacing.base, marginBottom: 6 }]}>
        <View style={styles.dateLabelGroup}>
          <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
            {formatArabicDate(activeDate)}
          </Text>

          {!isSelectedToday && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العودة لتاريخ اليوم"
              onPress={() => handleDayPress(todayStr)}
              style={({ pressed }) => [
                styles.todayQuickBadge,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.full,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: theme.primary, fontSize: 11, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 1 },
                ]}
              >
                اليوم
              </Text>
              <Ionicons name="return-up-back" size={12} color={theme.primary} style={{ marginRight: 2 }} />
            </Pressable>
          )}
        </View>

        <View style={styles.chevronsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="الأسبوع السابق"
            onPress={() => handleDayPress(dayjs(activeDate).subtract(7, 'day').format('YYYY-MM-DD'))}
            style={({ pressed }) => [
              styles.navBtn,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="الأسبوع التالي"
            disabled={!canGoNextWeek}
            onPress={() => {
              if (canGoNextWeek) {
                const nextWeekDate = dayjs(activeDate).add(7, 'day');
                const cappedDate = nextWeekDate.isAfter(today) ? today : nextWeekDate;
                handleDayPress(cappedDate.format('YYYY-MM-DD'));
              }
            }}
            style={({ pressed }) => [
              styles.navBtn,
              { opacity: canGoNextWeek ? (pressed ? 0.5 : 1) : 0.25 },
            ]}
          >
            <Ionicons name="chevron-back" size={16} color={theme.textMuted} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* The Sliding Green Capsule Indicator */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slidingCapsule,
            {
              backgroundColor: theme.primary,
              borderRadius: radius.md,
            },
            animatedCapsuleStyle,
          ]}
        />

        {days.map((item) => {
          const isSelected = item.dateStr === activeDate;

          return (
            <Pressable
              key={item.dateStr}
              accessibilityRole="button"
              accessibilityLabel={`${item.dayShort} ${item.dayNum}`}
              accessibilityState={{ selected: isSelected }}
              android_disableSound={false}
              onPress={() => handleDayPress(item.dateStr)}
              onLayout={(e) => {
                const { x, y, width, height } = e.nativeEvent.layout;
                itemLayouts.current[item.dateStr] = { x, y, width, height };
                if (item.dateStr === activeDate) {
                  updateCapsulePosition(activeDate, isInitialMount.current);
                }
              }}
              style={({ pressed }) => [
                styles.dayItem,
                {
                  minWidth: 44,
                  minHeight: touchTarget + 4,
                  borderRadius: radius.md,
                  marginHorizontal: 3,
                  backgroundColor: 'transparent',
                  opacity: pressed ? 0.7 : 1,
                  zIndex: 2,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : theme.textSecondary,
                    fontSize: 11,
                    fontWeight: isSelected ? '600' : '400',
                    opacity: isSelected ? 0.9 : 1,
                  },
                ]}
              >
                {item.dayShort}
              </Text>

              <Text
                style={[
                  typography.subMedium,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : item.isToday
                      ? theme.primary
                      : theme.text,
                    fontWeight: isSelected ? '700' : item.isToday ? '600' : '400',
                    marginTop: 2,
                  },
                ]}
              >
                {item.dayNum}
              </Text>

              {item.isToday ? (
                <View
                  style={[
                    styles.todayDot,
                    {
                      backgroundColor: isSelected
                        ? '#FFFFFF'
                        : theme.primary,
                      opacity: isSelected ? 0.95 : 1,
                    },
                  ]}
                />
              ) : (
                <View style={{ height: 4, marginTop: 3 }} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  slidingCapsule: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  navRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevronsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabelGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  todayQuickBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
});

