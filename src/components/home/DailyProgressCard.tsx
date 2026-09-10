import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '../common/ProgressBar';
import { useTheme } from '../../theme/ThemeContext';
import { formatArabicDate } from '../../utils/habitUtils';

interface DailyProgressCardProps {
  date: string;
  completedCount: number;
  totalCount: number;
  completionRate: number;
}

export const DailyProgressCard: React.FC<DailyProgressCardProps> = ({
  date,
  completedCount,
  totalCount,
  completionRate,
}) => {
  const { theme, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { marginHorizontal: spacing.base, marginBottom: spacing.base }]}>
      <View style={styles.infoRow}>
        {/* Right side in RTL: Date and Title */}
        <View>
          <Text style={[typography.subMedium, { color: theme.text, textAlign: 'right' }]}>
            {formatArabicDate(date)}
          </Text>
        </View>

        {/* Left side in RTL: Count & Percentage */}
        <View style={styles.metricRow}>
          <Text style={[typography.sub, { color: theme.textSecondary, marginLeft: 6 }]}>
            {totalCount > 0
              ? `${completedCount} من ${totalCount} مكتملة`
              : 'لا توجد عادات'}
          </Text>
          {totalCount > 0 && (
            <Text style={[typography.subMedium, { color: theme.text, fontWeight: '600' }]}>
              {completionRate}%
            </Text>
          )}
        </View>
      </View>

      {totalCount > 0 && (
        <View style={{ marginTop: 8 }}>
          <ProgressBar progress={completionRate} height={3} color={theme.text} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
});
