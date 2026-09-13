import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
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

  const today = dayjs();
  const selDay = dayjs(selectedDate);
  const diffFromToday = selDay.diff(today, 'day');

  // Dynamic window: if selectedDate is outside standard 14 days around today, center around selectedDate
  const centerDate = Math.abs(diffFromToday) <= 7 ? today : selDay;
  const days = Array.from({ length: 15 }).map((_, index) => {
    const d = centerDate.subtract(7 - index, 'day');
    return {
      dateStr: d.format('YYYY-MM-DD'),
      dayNum: d.date(),
      dayShort: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'][d.day()],
      isToday: d.isSame(today, 'day'),
    };
  });

  const selectedIndex = days.findIndex((d) => d.dateStr === selectedDate);

  useEffect(() => {
    if (selectedIndex >= 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: Math.max(0, selectedIndex * 52 - 120),
          animated: true,
        });
      }, 100);
    }
  }, [selectedIndex, selectedDate]);

  const todayStr = today.format('YYYY-MM-DD');
  const isSelectedToday = selectedDate === todayStr;
  const canGoNextWeek = dayjs(selectedDate).startOf('day').isBefore(today.startOf('day'));

  return (
    <View style={[styles.container, { marginBottom: spacing.sm }]}>
      {/* Week Navigation Header */}
      <View style={[styles.navRow, { paddingHorizontal: spacing.base, marginBottom: 6 }]}>
        <View style={styles.dateLabelGroup}>
          <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
            {formatArabicDate(selectedDate)}
          </Text>

          {!isSelectedToday && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العودة لتاريخ اليوم"
              onPress={() => onSelectDate(todayStr)}
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
            onPress={() => onSelectDate(dayjs(selectedDate).subtract(7, 'day').format('YYYY-MM-DD'))}
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
                const nextWeekDate = dayjs(selectedDate).add(7, 'day');
                // Don't overshoot today when navigating forward
                const cappedDate = nextWeekDate.isAfter(today) ? today : nextWeekDate;
                onSelectDate(cappedDate.format('YYYY-MM-DD'));
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
        }}
      >
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;

          return (
            <Pressable
              key={item.dateStr}
              accessibilityRole="button"
              accessibilityLabel={`${item.dayShort} ${item.dayNum}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectDate(item.dateStr)}
              style={({ pressed }) => [
                styles.dayItem,
                {
                  minWidth: 44,
                  minHeight: touchTarget + 4,
                  borderRadius: radius.md,
                  marginHorizontal: 3,
                  backgroundColor: isSelected
                    ? theme.text
                    : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected
                      ? theme.background
                      : theme.textSecondary,
                    fontSize: 11,
                    fontWeight: isSelected ? '600' : '400',
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
                      ? theme.background
                      : item.isToday
                      ? theme.primary
                      : theme.text,
                    fontWeight: isSelected || item.isToday ? '600' : '400',
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
                        ? theme.background
                        : theme.primary,
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
