import React, { useState, useMemo } from 'react';
import {View, StyleSheet, ScrollView, Pressable, Share} from 'react-native';
import { Text } from '../components/common/AppText';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { useShallow } from 'zustand/react/shallow';
import { Card } from '../components/common/Card';
import { WeeklyChart } from '../components/stats/WeeklyChart';
import { MonthlyAdherenceCard } from '../components/stats/MonthlyAdherenceCard';
import { CategoryPerformanceCard } from '../components/stats/CategoryPerformanceCard';
import { BadgeList } from '../components/stats/BadgeList';
import {
  calculateHabitStats,
  calculateOverallStats,
  formatOverallStatsForShare,
  formatArabicStreakDays,
  toArabicNumerals,
} from '../utils/habitUtils';
import type { Habit, HabitCheckin } from '../types/habit';

export const StatisticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme, spacing, radius, typography, touchTarget } = useTheme();
  const { habits, checkins } = useHabitStore(
    useShallow((state) => ({
      habits: state.habits,
      checkins: state.checkins,
    }))
  );

  const LEADERBOARD_INITIAL_COUNT = 5;
  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false);

  const todayStr = dayjs().format('YYYY-MM-DD');

  const handleShareStats = async () => {
    try {
      const message = formatOverallStatsForShare(habits, checkins, todayStr);
      await Share.share({ message });
    } catch (_) {}
  };

  // Single-pass computation: calculate stats for each habit once, find max streak, and rank active habits
  const { rankedHabits, overall } = useMemo(() => {
    const checkinsByHabit = new Map<string, HabitCheckin[]>();
    for (const c of checkins) {
      let list = checkinsByHabit.get(c.habitId);
      if (!list) {
        list = [];
        checkinsByHabit.set(c.habitId, list);
      }
      list.push(c);
    }

    let bestOverallStreak = 0;
    const ranked: { habit: Habit; stats: ReturnType<typeof calculateHabitStats> }[] = [];

    for (const h of habits) {
      const hCheckins = checkinsByHabit.get(h.id) || [];
      const stats = calculateHabitStats(h, hCheckins);

      if (stats.bestStreak > bestOverallStreak) {
        bestOverallStreak = stats.bestStreak;
      }

      if (!h.archivedAt && h.isActive) {
        ranked.push({ habit: h, stats });
      }
    }

    ranked.sort(
      (a, b) =>
        b.stats.currentStreak - a.stats.currentStreak ||
        b.stats.completionRate - a.stats.completionRate
    );

    const overallStats = calculateOverallStats(
      habits,
      checkins,
      todayStr,
      bestOverallStreak,
      checkinsByHabit
    );

    return {
      rankedHabits: ranked,
      overall: overallStats,
    };
  }, [habits, checkins, todayStr]);

  const displayedHabits = isLeaderboardExpanded
    ? rankedHabits
    : rankedHabits.slice(0, LEADERBOARD_INITIAL_COUNT);
  const remainingHabitsCount = Math.max(0, rankedHabits.length - LEADERBOARD_INITIAL_COUNT);

  const kpis = [
    { title: 'إنجاز اليوم', value: `${toArabicNumerals(overall.todayCompletionRate)}٪` },
    { title: 'أعلى سلسلة', value: formatArabicStreakDays(overall.bestOverallStreak) },
    { title: 'إجمالي المرات', value: toArabicNumerals(overall.totalCheckinsEver) },
    { title: 'العادات النشطة', value: toArabicNumerals(overall.activeHabits) },
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
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={[typography.h1, { color: theme.text, textAlign: 'right' }]}>
          الإحصائيات
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="مشاركة الإحصائيات"
          onPress={handleShareStats}
          style={({ pressed }) => [
            styles.shareBtn,
            {
              minWidth: touchTarget,
              minHeight: touchTarget,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="share-outline" size={21} color={theme.text} />
        </Pressable>
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

        {/* Monthly Adherence & Performance Analytics */}
        <MonthlyAdherenceCard habits={habits} checkins={checkins} />

        {/* Weekly Adherence Chart with Isolated Week Navigation */}
        <WeeklyChart habits={habits} checkins={checkins} />

        {/* Life Domains & Category Balance */}
        <CategoryPerformanceCard habits={habits} checkins={checkins} />

        {/* Habits Leaderboard */}
        <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
          <View style={{ marginBottom: 12 }}>
            <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
              الالتزام بالعادات النشطة
            </Text>
          </View>

          {rankedHabits.length === 0 ? (
            <Text style={[typography.sub, { color: theme.textMuted, textAlign: 'center', marginVertical: 8 }]}>
              لا توجد عادات نشطة مسجلة
            </Text>
          ) : (
            <>
              {displayedHabits.map((item, index) => (
                <Pressable
                  key={item.habit.id}
                  accessibilityRole="button"
                  accessibilityLabel={`عرض تفاصيل عادة ${item.habit.name}`}
                  onPress={() =>
                    navigation.navigate('HabitDetails', { habitId: item.habit.id })
                  }
                  style={({ pressed }) => [
                    styles.rankRow,
                    {
                      borderBottomColor: theme.border,
                      borderBottomWidth:
                        index === displayedHabits.length - 1 && remainingHabitsCount === 0
                          ? 0
                          : 1,
                      opacity: pressed ? 0.65 : 1,
                    },
                  ]}
                >
                  <View style={styles.rankRight}>
                    <View
                      style={[
                        styles.rankIconBox,
                        {
                          backgroundColor: item.habit.color
                            ? `${item.habit.color}15`
                            : theme.cardSecondary,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Ionicons
                        name={(item.habit.icon as any) || 'ellipse-outline'}
                        size={16}
                        color={item.habit.color || theme.textSecondary}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                        {item.habit.name}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 2 }]}>
                        نسبة الالتزام: {item.stats.completionRate}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rankLeft}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                      <Ionicons
                        name="flame"
                        size={14}
                        color={item.stats.currentStreak > 0 ? (item.habit.color || theme.primary) : theme.textMuted}
                        style={{ marginLeft: 4 }}
                      />
                      <Text style={[typography.subMedium, { color: theme.text }]}>
                        {formatArabicStreakDays(item.stats.currentStreak)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}

              {rankedHabits.length > LEADERBOARD_INITIAL_COUNT && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isLeaderboardExpanded
                      ? 'طي قائمة العادات'
                      : `عرض بقية العادات، ${toArabicNumerals(remainingHabitsCount)} عادة إضافية`
                  }
                  onPress={() => setIsLeaderboardExpanded((prev) => !prev)}
                  style={({ pressed }) => [
                    styles.expandBtn,
                    {
                      borderTopColor: theme.border,
                      borderTopWidth: 1,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={isLeaderboardExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.primary}
                    style={{ marginLeft: 6 }}
                  />
                  <Text style={[typography.subMedium, { color: theme.primary }]}>
                    {isLeaderboardExpanded
                      ? 'طي القائمة'
                      : `عرض بقية العادات (${toArabicNumerals(remainingHabitsCount)})`}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </Card>

        {/* Milestones */}
        <BadgeList
          totalHabits={overall.totalHabits}
          bestStreak={overall.bestOverallStreak}
          totalCheckins={overall.totalCheckinsEver}
          todayRate={overall.todayCompletionRate}
          hasEverHadPerfectDay={overall.hasEverHadPerfectDay}
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
  shareBtn: {
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  rankIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  rankLeft: {
    alignItems: 'flex-start',
    paddingRight: 10,
  },
  expandBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 4,
  },
});
