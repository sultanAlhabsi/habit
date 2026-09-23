import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import dayjs from 'dayjs';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../common/ProgressBar';
import { useTheme } from '../../theme/ThemeContext';
import { formatArabicDate, toArabicNumerals } from '../../utils/habitUtils';

interface DailyProgressCardProps {
  date: string;
  completedCount: number;
  totalCount: number;
  completionRate: number;
  isToday?: boolean;
  onPressToday?: () => void;
  onCompleteAll?: () => void;
  onResetAll?: () => void;
}

export const DailyProgressCard: React.FC<DailyProgressCardProps> = React.memo(({
  date,
  completedCount,
  totalCount,
  completionRate,
  isToday = true,
  onPressToday,
  onCompleteAll,
  onResetAll,
}) => {
  const { theme, radius, spacing, typography } = useTheme();
  const isFutureDate = dayjs(date).startOf('day').isAfter(dayjs().startOf('day'));

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
              ? `${toArabicNumerals(completedCount)} من ${toArabicNumerals(totalCount)} مكتملة`
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
                {toArabicNumerals(completionRate)}٪
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

      {/* Quick Bulk Completion / Reset Row */}
      {totalCount > 0 && !isFutureDate && (
        <View style={styles.actionRow}>
          {completedCount < totalCount && onCompleteAll && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`إكمال جميع العادات المتبقية (${toArabicNumerals(totalCount - completedCount)})`}
              onPress={onCompleteAll}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: theme.isDark ? `${theme.primary}18` : `${theme.primary}10`,
                  borderColor: theme.isDark ? `${theme.primary}40` : `${theme.primary}25`,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons name="checkmark-done-outline" size={14} color={theme.primary} style={{ marginLeft: 5 }} />
              <Text style={[typography.caption, { color: theme.primary, fontWeight: '600', fontSize: 11 }]}>
                إكمال المتبقي ({toArabicNumerals(totalCount - completedCount)})
              </Text>
            </Pressable>
          )}

          {completionRate === 100 && onResetAll && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إعادة تعيين عادات اليوم"
              onPress={onResetAll}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  opacity: pressed ? 0.6 : 0.85,
                },
              ]}
            >
              <Ionicons name="refresh-outline" size={13} color={theme.textMuted} style={{ marginLeft: 4 }} />
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                إلغاء تحديد الكل
              </Text>
            </Pressable>
          )}
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
  actionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
});

