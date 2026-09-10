import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DayAdherence } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';

interface WeeklyChartProps {
  data: DayAdherence[];
  weekLabel?: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  hasNextWeek?: boolean;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({
  data,
  weekLabel,
  onPrevWeek,
  onNextWeek,
  hasNextWeek = false,
}) => {
  const { theme, radius, spacing, typography } = useTheme();

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
      <View style={styles.headerRow}>
        <View style={styles.titleSide}>
          <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
            الالتزام الأسبوعي
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, textAlign: 'right' }]}>
            {weekLabel || 'نسبة إنجاز العادات لكل يوم'}
          </Text>
        </View>

        {/* Week navigation controls */}
        {onPrevWeek && (
          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="الأسبوع السابق"
              onPress={onPrevWeek}
              style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="الأسبوع التالي"
              disabled={!hasNextWeek}
              onPress={onNextWeek}
              style={({ pressed }) => [
                styles.navBtn,
                { opacity: hasNextWeek ? (pressed ? 0.5 : 1) : 0.2 },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const isItemFuture = Boolean(item.isFuture);
          const barHeight = isItemFuture || item.rate === 0 ? 0 : Math.max(4, (item.rate / 100) * 80);

          return (
            <View key={index} style={styles.barColumn}>
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
                {isItemFuture ? '-' : item.totalCount > 0 ? `${item.rate}%` : '-'}
              </Text>

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
                {!isItemFuture && item.rate > 0 && (
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: item.isToday ? theme.primary : theme.text,
                        borderRadius: radius.full,
                      },
                    ]}
                  />
                )}
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

              {item.isToday && (
                <View
                  style={[
                    styles.todayIndicator,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
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
