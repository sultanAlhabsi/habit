import React from 'react';
import {View, StyleSheet} from 'react-native';
import { Text } from '../common/AppText';
import { HabitStats, HabitFrequency } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { formatHabitStreakArabic, toArabicNumerals } from '../../utils/habitUtils';

interface HabitStatGridProps {
  stats: HabitStats;
  habitColor?: string;
  unit?: string;
  totalLoggedUnits?: number;
  frequency?: HabitFrequency;
}

export const HabitStatGrid: React.FC<HabitStatGridProps> = React.memo(({ stats, unit, totalLoggedUnits, frequency = 'daily' }) => {
  const { theme, spacing, typography } = useTheme();

  const items = [
    { title: 'الالتزام الحالي', value: formatHabitStreakArabic(stats.currentStreak, frequency) },
    { title: 'أفضل إنجاز', value: formatHabitStreakArabic(stats.bestStreak, frequency) },
    {
      title: totalLoggedUnits !== undefined && totalLoggedUnits > 0 ? 'إجمالي المنجز' : 'إجمالي المرات',
      value:
        totalLoggedUnits !== undefined && totalLoggedUnits > 0
          ? `${toArabicNumerals(totalLoggedUnits)} ${unit || ''}`
          : `${toArabicNumerals(stats.totalCompletions)} ${unit || 'مرة'}`,
    },
    { title: 'نسبة الالتزام', value: `${toArabicNumerals(stats.completionRate)}٪` },
  ];

  return (
    <Card style={[styles.container, { marginBottom: spacing.base, padding: 0 }]}>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.cell,
              {
                borderBottomWidth: index < 2 ? 1 : 0,
                borderLeftWidth: index % 2 === 0 ? 1 : 0,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right' }]}>
              {item.title}
            </Text>
            <Text style={[typography.h2, { color: theme.text, marginTop: 4, textAlign: 'right' }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    padding: 14,
  },
});
