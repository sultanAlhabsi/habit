import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { DateStrip } from '../components/home/DateStrip';
import { DailyProgressCard } from '../components/home/DailyProgressCard';
import { HabitCard } from '../components/home/HabitCard';
import { EmptyState } from '../components/common/EmptyState';
import {
  calculateHabitStats,
  calculateOverallStats,
  isHabitDueOnDate,
} from '../utils/habitUtils';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, radius, typography, touchTarget } = useTheme();

  const {
    habits,
    checkins,
    selectedDate,
    isLoading,
    filter,
    setSelectedDate,
    setFilter,
    toggleCheckin,
  } = useHabitStore();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  }

  // Calculate overall stats for selected date
  const overallStats = calculateOverallStats(habits, checkins, selectedDate);

  // Filter habits for selected date
  const dueHabits = habits.filter((h) => isHabitDueOnDate(h, selectedDate));

  const filteredHabits = dueHabits.filter((h) => {
    const isCompleted = checkins.some(
      (c) => c.habitId === h.id && c.date === selectedDate && c.completed
    );
    if (filter === 'completed') return isCompleted;
    if (filter === 'pending') return !isCompleted;
    return true; // 'all'
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, spacing.base),
            paddingHorizontal: spacing.base,
            paddingBottom: spacing.sm,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="إضافة عادة جديدة"
          onPress={() => navigation.navigate('AddEditHabit', {})}
          style={({ pressed }) => [
            styles.addHeaderBtn,
            {
              minWidth: touchTarget,
              minHeight: touchTarget,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.headerTitles}>
          <Text style={[typography.h1, { color: theme.text, textAlign: 'right' }]}>
            العادات
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Date Selector Strip */}
        <DateStrip
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
        />

        {/* Daily Progress Overview */}
        <DailyProgressCard
          date={selectedDate}
          completedCount={overallStats.todayCompletedCount}
          totalCount={overallStats.todayTotalCount}
          completionRate={overallStats.todayCompletionRate}
        />

        {/* Quiet Filter Tabs */}
        <View style={[styles.filterRow, { marginHorizontal: spacing.base, marginBottom: spacing.md }]}>
          {(['all', 'pending', 'completed'] as const).map((tab) => {
            const isSelected = filter === tab;
            const labels = {
              all: `الكل (${dueHabits.length})`,
              pending: `المتبقية (${dueHabits.length - overallStats.todayCompletedCount})`,
              completed: `المكتملة (${overallStats.todayCompletedCount})`,
            };

            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setFilter(tab)}
                style={({ pressed }) => [
                  styles.filterTab,
                  {
                    borderBottomColor: isSelected ? theme.text : 'transparent',
                    borderBottomWidth: 1.5,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? theme.text : theme.textMuted,
                      fontWeight: isSelected ? '600' : '400',
                      paddingBottom: 6,
                    },
                  ]}
                >
                  {labels[tab]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Habits List or Empty States */}
        {dueHabits.length === 0 ? (
          <EmptyState
            icon="leaf-outline"
            title="لا توجد عادات لهذا اليوم"
            description="أنشئ عاداتك اليومية لتبدأ في بناء جدولك ومتابعة التزامك"
            actionTitle="إضافة عادة"
            onActionPress={() => navigation.navigate('AddEditHabit', {})}
          />
        ) : filteredHabits.length === 0 ? (
          filter === 'pending' ? (
            <EmptyState
              icon="checkmark-outline"
              title="أتممت عادات اليوم"
              description="جميع العادات المجدولة مكتملة"
            />
          ) : (
            <EmptyState
              icon="ellipse-outline"
              title="لا توجد عادات مكتملة بعد"
              description="اضغط على الدائرة بجانب أي عادة لتسجيل إنجازها"
            />
          )
        ) : (
          filteredHabits.map((habit) => {
            const isCompleted = checkins.some(
              (c) => c.habitId === habit.id && c.date === selectedDate && c.completed
            );
            const stats = calculateHabitStats(habit, checkins);

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompleted={isCompleted}
                streak={stats.currentStreak}
                onToggleCheckin={() => toggleCheckin(habit.id, selectedDate)}
                onPressDetails={() =>
                  navigation.navigate('HabitDetails', { habitId: habit.id })
                }
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitles: {
    flex: 1,
  },
  addHeaderBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: 16,
  },
  filterTab: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
});
