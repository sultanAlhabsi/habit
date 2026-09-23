import React from 'react';
import {View, StyleSheet} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { toArabicNumerals } from '../../utils/habitUtils';
import type { HabitConsistencyPattern } from '../../types/habit';

interface HabitConsistencyCardProps {
  consistencyPattern: HabitConsistencyPattern;
  habitColor?: string;
}

export const HabitConsistencyCard: React.FC<HabitConsistencyCardProps> = React.memo(({
  consistencyPattern,
  habitColor,
}) => {
  const { theme, radius, spacing, typography } = useTheme();
  const accentColor = habitColor || theme.primary;

  const { days, bestDay, insightMessage } = consistencyPattern;

  const badgeBg = habitColor
    ? theme.isDark
      ? `${habitColor}22`
      : `${habitColor}14`
    : `${theme.primary}15`;

  const badgeBorder = habitColor
    ? theme.isDark
      ? `${habitColor}45`
      : `${habitColor}35`
    : `${theme.primary}40`;

  return (
    <Card style={[styles.container, { marginBottom: spacing.base }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleSection}>
          <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
            نمط الالتزام الأسبوعي
          </Text>
          <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right' }]}>
            نسبة الإنجاز في كل يوم من أيام الأسبوع
          </Text>
        </View>

        {bestDay && bestDay.rate > 0 && (
          <View
            style={[
              styles.bestDayBadge,
              {
                backgroundColor: badgeBg,
                borderColor: badgeBorder,
                borderRadius: radius.full,
              },
            ]}
          >
            <Ionicons name="ribbon-outline" size={12} color={accentColor} style={{ marginLeft: 3 }} />
            <Text style={[typography.caption, { color: accentColor, fontWeight: '700', fontSize: 11 }]}>
              {bestDay.dayName} {toArabicNumerals(bestDay.rate)}٪
            </Text>
          </View>
        )}
      </View>

      {/* 7 Days Distribution Bars */}
      <View style={styles.chartContainer}>
        {days.map((d) => {
          const isBest = bestDay && bestDay.dayIndex === d.dayIndex && d.rate > 0;
          const hasData = d.dueCount > 0;
          const barHeightPercent = hasData ? Math.max(8, d.rate) : 0;
          const barColor = accentColor;

          return (
            <View key={d.dayIndex} style={styles.dayColumn}>
              {/* Rate percentage label above */}
              <Text
                style={[
                  typography.caption,
                  {
                    color: hasData ? (isBest ? accentColor : theme.text) : theme.textMuted,
                    fontSize: 10,
                    fontWeight: isBest ? '700' : '500',
                    marginBottom: 4,
                  },
                ]}
              >
                {hasData ? `${toArabicNumerals(d.rate)}٪` : '-'}
              </Text>

              {/* Vertical Bar Track */}
              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                {hasData && (
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${barHeightPercent}%`,
                        backgroundColor: barColor,
                        borderRadius: radius.sm,
                      },
                    ]}
                  />
                )}
              </View>

              {/* Day short name label below */}
              <Text
                style={[
                  typography.caption,
                  {
                    color: isBest ? theme.text : theme.textSecondary,
                    fontWeight: isBest ? '700' : '400',
                    marginTop: 6,
                    fontSize: 11,
                  },
                ]}
              >
                {d.dayShort}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Insight message callout */}
      {insightMessage ? (
        <View
          style={[
            styles.insightBox,
            {
              backgroundColor: theme.cardSecondary,
              borderColor: theme.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Ionicons
            name="bulb-outline"
            size={16}
            color={accentColor}
            style={{ marginLeft: 8, marginTop: 1 }}
          />
          <Text
            style={[
              typography.caption,
              {
                color: theme.text,
                flex: 1,
                textAlign: 'right',
                lineHeight: 18,
              },
            ]}
          >
            {insightMessage}
          </Text>
        </View>
      ) : null}
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  bestDayBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  chartContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 105,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: 64,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
  },
  insightBox: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    padding: 10,
    borderWidth: 1,
  },
});
