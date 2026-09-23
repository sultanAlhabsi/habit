import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../common/ProgressBar';
import { useTheme } from '../../theme/ThemeContext';
import { formatArabicDate } from '../../utils/habitUtils';

interface DailyProgressCardProps {
  date: string;
  completedCount: number;
  totalCount: number;
  completionRate: number;
  isToday?: boolean;
  onPressToday?: () => void;
}

export const DailyProgressCard: React.FC<DailyProgressCardProps> = React.memo(({
  date,
  completedCount,
  totalCount,
  completionRate,
  isToday = true,
  onPressToday,
}) => {
  const { theme, radius, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          marginHorizontal: spacing.base,
          marginBottom: spacing.base,
          backgroundColor: theme.isDark ? theme.card : 'transparent',
          borderColor: theme.isDark ? theme.border : 'transparent',
          borderWidth: theme.isDark ? 1 : 0,
          borderRadius: radius.md,
          paddingHorizontal: theme.isDark ? spacing.base : 0,
          paddingVertical: theme.isDark ? 12 : 4,
        },
      ]}
    >
      <View style={styles.infoRow}>
        {/* Right side in RTL: Date and Back to Today option */}
        <View style={styles.dateSide}>
          <Text style={[typography.subMedium, { color: theme.text, textAlign: 'right' }]}>
            {isToday ? 'إنجاز اليوم' : formatArabicDate(date)}
          </Text>

          {!isToday && onPressToday && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العودة لتاريخ اليوم"
              onPress={onPressToday}
              style={({ pressed }) => [
                styles.todayPill,
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
                  { color: theme.primary, fontSize: 11, fontWeight: '500' },
                ]}
              >
                اليوم
              </Text>
              <Ionicons name="return-up-back" size={12} color={theme.primary} style={{ marginRight: 3 }} />
            </Pressable>
          )}
        </View>

        {/* Left side in RTL: Count & Percentage */}
        <View style={styles.metricRow}>
          <Text style={[typography.sub, { color: theme.textSecondary, marginLeft: 6 }]}>
            {totalCount > 0
              ? `${completedCount} من ${totalCount} مكتملة`
              : 'لا توجد عادات'}
          </Text>
          {totalCount > 0 && (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
              <Text
                style={[
                  typography.subMedium,
                  {
                    color: completionRate === 100 ? '#10B981' : theme.text,
                    fontWeight: completionRate === 100 ? '700' : '600',
                  },
                ]}
              >
                {completionRate}%
              </Text>
              {completionRate === 100 && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#10B981"
                  style={{ marginRight: 4 }}
                />
              )}
            </View>
          )}
        </View>
      </View>

      {totalCount > 0 && (
        <View style={{ marginTop: 8 }}>
          <ProgressBar
            progress={completionRate}
            height={completionRate === 100 ? 4 : 3}
            color={theme.primary}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSide: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  todayPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    marginRight: 8,
  },
  metricRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
});
