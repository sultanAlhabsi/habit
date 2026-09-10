import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';

interface HabitHeatmapProps {
  completedDates: Set<string>;
  habitColor: string;
  onToggleDate: (dateStr: string) => void;
  readOnly?: boolean;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({
  completedDates,
  habitColor,
  onToggleDate,
  readOnly = false,
}) => {
  const { theme, radius, spacing, typography } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const startOfMonth = currentMonth.startOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = startOfMonth.day(); // 0 is Sunday

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthTitle = `${arabicMonths[currentMonth.month()]} ${currentMonth.year()}`;

  const weekDays = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  const prevMonth = () => setCurrentMonth((prev) => prev.subtract(1, 'month'));
  const nextMonth = () => {
    if (currentMonth.isBefore(dayjs(), 'month')) {
      setCurrentMonth((prev) => prev.add(1, 'month'));
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const todayStr = dayjs().format('YYYY-MM-DD');

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
      {/* Month Navigation */}
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="الشهر السابق"
          onPress={prevMonth}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.5 : 1 }]}
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

          const dateStr = currentMonth.date(dayNum).format('YYYY-MM-DD');
          const isCompleted = completedDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = currentMonth.date(dayNum).isAfter(dayjs(), 'day');

          return (
            <Pressable
              key={dateStr}
              disabled={isFuture || readOnly}
              onPress={() => onToggleDate(dateStr)}
              style={({ pressed }) => [
                styles.dayCol,
                styles.dayCell,
                {
                  opacity: isFuture || readOnly ? (readOnly ? 0.8 : 0.2) : pressed ? 0.6 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.dayCircle,
                  {
                    borderRadius: radius.full,
                    backgroundColor: isCompleted ? (habitColor || theme.primary) : 'transparent',
                    borderColor: isToday ? theme.text : 'transparent',
                    borderWidth: isToday && !isCompleted ? 1 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isCompleted
                        ? '#FFFFFF'
                        : isToday
                        ? theme.text
                        : theme.textSecondary,
                      fontWeight: isCompleted || isToday ? '600' : '400',
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
          : 'اضغط على أي يوم للتعديل أو التسجيل'}
      </Text>
    </Card>
  );
};

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
