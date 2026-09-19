import React, { useState, useEffect, useMemo } from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';

interface HabitHeatmapProps {
  completedDates: Set<string>;
  habitColor: string;
  selectedDate?: string;
  onSelectDate?: (dateStr: string) => void;
  onToggleDate?: (dateStr: string) => void;
  readOnly?: boolean;
  createdAt?: string;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = React.memo(({
  completedDates,
  habitColor,
  selectedDate,
  onSelectDate,
  onToggleDate,
  readOnly = false,
  createdAt,
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

      {/* Days Grid */}
      <View style={styles.calendarGrid}>
        {cells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <View key={`empty_${idx}`} style={styles.dayCol} />;
          }

          const cellDate = currentMonth.date(dayNum).startOf('day');
          const dateStr = cellDate.format('YYYY-MM-DD');
          const isCompleted = completedDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const isFuture = cellDate.isAfter(dayjs().startOf('day'));
          const isBeforeCreation = createdAt
            ? cellDate.isBefore(dayjs(createdAt).startOf('day'))
            : false;
          const isDisabled = isFuture || readOnly || isBeforeCreation;

          return (
            <Pressable
              key={dateStr}
              disabled={isDisabled}
              accessibilityRole="button"
              accessibilityLabel={
                isBeforeCreation
                  ? `تاريخ سابق لإنشاء العادة (${dateStr})`
                  : isFuture
                  ? `تاريخ مستقبلي (${dateStr})`
                  : isSelected
                  ? `اليوم المختار (${dateStr})${isCompleted ? '، مكتمل' : ''}`
                  : `تسجيل ${dateStr}`
              }
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
              style={({ pressed }) => [
                styles.dayCol,
                styles.dayCell,
                {
                  opacity: isDisabled
                    ? readOnly
                      ? 0.8
                      : 0.2
                    : pressed
                    ? 0.6
                    : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.dayCircle,
                  {
                    borderRadius: radius.full,
                    backgroundColor: isCompleted ? (habitColor || theme.primary) : 'transparent',
                    borderColor: isSelected
                      ? isCompleted
                        ? theme.text
                        : (habitColor || theme.primary)
                      : isToday
                      ? theme.text
                      : 'transparent',
                    borderWidth: isSelected ? 2 : isToday && !isCompleted ? 1 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isCompleted
                        ? '#FFFFFF'
                        : isSelected
                        ? (habitColor || theme.primary)
                        : isToday
                        ? theme.text
                        : theme.textSecondary,
                      fontWeight: isCompleted || isToday || isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {dayNum}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text
        style={[
          typography.caption,
          {
            color: theme.textMuted,
            textAlign: 'center',
            marginTop: spacing.md,
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
    marginBottom: 6,
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
    minHeight: 34,
  },
  dayCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
