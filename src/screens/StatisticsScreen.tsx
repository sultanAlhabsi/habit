import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Card } from '../components/common/Card';
import { WeeklyChart } from '../components/stats/WeeklyChart';
import { BadgeList } from '../components/stats/BadgeList';
import { calculateHabitStats, calculateOverallStats } from '../utils/habitUtils';

export const StatisticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, typography } = useTheme();
  const { habits, checkins, selectedDate } = useHabitStore();

  const overall = calculateOverallStats(habits, checkins, selectedDate);

  const rankedHabits = [...habits]
    .map((h) => ({
      habit: h,
      stats: calculateHabitStats(h, checkins),
    }))
    .sort((a, b) => b.stats.currentStreak - a.stats.currentStreak || b.stats.completionRate - a.stats.completionRate);

  const kpis = [
    { title: 'إنجاز اليوم', value: `${overall.todayCompletionRate}%` },
    { title: 'أعلى سلسلة', value: `${overall.bestOverallStreak} يوم` },
    { title: 'إجمالي المرات', value: `${overall.totalCheckinsEver}` },
    { title: 'العادات النشطة', value: `${overall.activeHabits}` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, spacing.base),
            paddingHorizontal: spacing.base,
            paddingBottom: spacing.sm,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Text style={[typography.h1, { color: theme.text, textAlign: 'right' }]}>
          الإحصائيات
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.base,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {/* Unified 4-metric overview card */}
        <Card style={[styles.kpiContainer, { marginBottom: spacing.base, padding: 0 }]}>
          <View style={styles.kpiGrid}>
            {kpis.map((kpi, idx) => (
              <View
                key={idx}
                style={[
                  styles.kpiCell,
                  {
                    borderBottomWidth: idx < 2 ? 1 : 0,
                    borderLeftWidth: idx % 2 === 0 ? 1 : 0,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right' }]}>
                  {kpi.title}
                </Text>
                <Text style={[typography.h2, { color: theme.text, marginTop: 4, textAlign: 'right' }]}>
                  {kpi.value}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Weekly Adherence Chart */}
        <WeeklyChart data={overall.weeklyAdherence} />

        {/* Habits Leaderboard */}
        <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
          <View style={{ marginBottom: 12 }}>
            <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
              الالتزام بالعادات
            </Text>
          </View>

          {rankedHabits.length === 0 ? (
            <Text style={[typography.sub, { color: theme.textMuted, textAlign: 'center', marginVertical: 8 }]}>
              لا توجد عادات مسجلة
            </Text>
          ) : (
            rankedHabits.map((item, index) => (
              <View
                key={item.habit.id}
                style={[
                  styles.rankRow,
                  {
                    borderBottomColor: theme.border,
                    borderBottomWidth: index === rankedHabits.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <View style={styles.rankLeft}>
                  <Text style={[typography.subMedium, { color: theme.text }]}>
                    {item.stats.currentStreak} يوم
                  </Text>
                </View>

                <View style={styles.rankRight}>
                  <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                    {item.habit.name}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                    نسبة الالتزام: {item.stats.completionRate}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Milestones */}
        <BadgeList
          totalHabits={overall.totalHabits}
          bestStreak={overall.bestOverallStreak}
          totalCheckins={overall.totalCheckinsEver}
          todayRate={overall.todayCompletionRate}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
  },
  kpiContainer: {
    overflow: 'hidden',
  },
  kpiGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  kpiCell: {
    width: '50%',
    padding: 14,
  },
  rankRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rankRight: {
    flex: 1,
  },
  rankLeft: {
    alignItems: 'flex-start',
    paddingRight: 10,
  },
});
