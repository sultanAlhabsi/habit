import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Habit, HabitCheckin } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';
import {
  calculateMonthAdherence,
  formatMonthlySummaryForShare,
  formatArabicCount,
} from '../../utils/habitUtils';

interface MonthlyAdherenceCardProps {
  habits: Habit[];
  checkins: HabitCheckin[];
}

export const MonthlyAdherenceCard: React.FC<MonthlyAdherenceCardProps> = ({
  habits,
  checkins,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();
  const [monthOffset, setMonthOffset] = useState(0);

  const referenceDate = dayjs().add(monthOffset, 'month');
  const stats = calculateMonthAdherence(habits, checkins, referenceDate);

  const canGoNext = monthOffset < 0;
  const prevMonth = () => setMonthOffset((prev) => prev - 1);
  const nextMonth = () => {
    if (canGoNext) {
      setMonthOffset((prev) => Math.min(0, prev + 1));
    }
  };

  const handleShareMonth = async () => {
    try {
      const message = formatMonthlySummaryForShare(stats);
      await Share.share({ message });
    } catch (_) {}
  };

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
      {/* Month Header and Navigation */}
      <View style={styles.headerRow}>
        <View style={styles.titleSide}>
          <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
            الالتزام الشهري
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, textAlign: 'right' }]}>
            {stats.monthLabel}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="مشاركة إنجازات الشهر"
            onPress={handleShareMonth}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="share-outline" size={19} color={theme.text} />
          </Pressable>

          <View style={styles.navControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="الشهر السابق"
              onPress={prevMonth}
              style={({ pressed }) => [
                styles.navBtn,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="الشهر التالي"
              disabled={!canGoNext}
              onPress={nextMonth}
              style={({ pressed }) => [
                styles.navBtn,
                { opacity: canGoNext ? (pressed ? 0.5 : 1) : 0.25 },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Monthly Progress Bar */}
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        <View style={styles.progressLabelRow}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>
            معدل إنجاز العادات المجدولة
          </Text>
          <Text style={[typography.h3, { color: theme.text, fontWeight: '700' }]}>
            {stats.completionRate}%
          </Text>
        </View>
        <ProgressBar
          progress={stats.completionRate}
          height={6}
          color={stats.completionRate >= 80 ? theme.primary : theme.text}
        />
      </View>

      {/* 3 Key Monthly Metrics */}
      <View style={[styles.metricsGrid, { borderColor: theme.border }]}>
        <View style={[styles.metricItem, { borderLeftWidth: 1, borderColor: theme.border }]}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center' }]}>
            الإنجازات
          </Text>
          <Text style={[typography.h3, { color: theme.text, marginTop: 4, textAlign: 'center' }]}>
            {stats.totalCompletions}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' }]}>
            من {formatArabicCount(stats.totalDueOpportunities, 'فرصة', 'فرصتان', 'فرص', 'فرصة')}
          </Text>
        </View>

        <View style={[styles.metricItem, { borderLeftWidth: 1, borderColor: theme.border }]}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center' }]}>
            أيام مكتملة 100%
          </Text>
          <Text style={[typography.h3, { color: theme.primary, marginTop: 4, textAlign: 'center' }]}>
            {stats.perfectDaysCount}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' }]}>
            {stats.perfectDaysCount === 1
              ? 'يوم مثالي'
              : stats.perfectDaysCount === 2
              ? 'يومان مثاليان'
              : stats.perfectDaysCount >= 3 && stats.perfectDaysCount <= 10
              ? 'أيام مثالية'
              : 'يوم مثالي'}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center' }]}>
            أيام التقييم
          </Text>
          <Text style={[typography.h3, { color: theme.text, marginTop: 4, textAlign: 'center' }]}>
            {stats.daysPassedInMonth}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' }]}>
            من أصل {stats.totalDaysInMonth} يوم
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleSide: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  navControls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
