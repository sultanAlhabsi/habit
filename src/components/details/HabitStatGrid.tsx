import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HabitStats } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';

interface HabitStatGridProps {
  stats: HabitStats;
  habitColor: string;
}

export const HabitStatGrid: React.FC<HabitStatGridProps> = ({ stats }) => {
  const { theme, spacing, typography } = useTheme();

  const items = [
    { title: 'الالتزام الحالي', value: `${stats.currentStreak} يوم` },
    { title: 'أفضل إنجاز', value: `${stats.bestStreak} يوم` },
    { title: 'إجمالي المرات', value: `${stats.totalCompletions} مرة` },
    { title: 'نسبة الالتزام', value: `${stats.completionRate}%` },
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
};

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
