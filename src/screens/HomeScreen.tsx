import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Header } from '../components/common/Header';
import { DateStrip } from '../components/home/DateStrip';
import { DailyProgressCard } from '../components/home/DailyProgressCard';
import { HabitCard } from '../components/home/HabitCard';
import { EmptyState } from '../components/common/EmptyState';
import {
  calculateOverallStats,
  calculateHabitStats,
  getHabitsForDate,
  filterHabitsByQuery,
  formatDailySummaryForShare,
} from '../utils/habitUtils';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, radius, spacing, typography, touchTarget } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const {
    habits,
    checkins,
    selectedDate,
    filter,
    isLoading,
    setSelectedDate,
    setFilter,
    toggleCheckin,
    incrementCheckin,
    decrementCheckin,
  } = useHabitStore();

  const todayStr = dayjs().format('YYYY-MM-DD');
  const isToday = selectedDate === todayStr;
  const isFutureDate = dayjs(selectedDate).startOf('day').isAfter(dayjs().startOf('day'));

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  }

  // Calculate overall stats for selected date
  const overallStats = calculateOverallStats(habits, checkins, selectedDate);

  // Relevant habits for selected date (active due habits + paused habits completed on this date)
  const dueHabits = getHabitsForDate(habits, checkins, selectedDate);
  const searchedHabits = searchQuery.trim()
    ? filterHabitsByQuery(dueHabits, searchQuery)
    : dueHabits;

  const searchedCompletedCount = searchedHabits.filter((h) =>
    checkins.some((c) => c.habitId === h.id && c.date === selectedDate && c.completed)
  ).length;

  const filteredHabits = searchedHabits.filter((h) => {
    const isCompleted = checkins.some(
      (c) => c.habitId === h.id && c.date === selectedDate && c.completed
    );
    if (filter === 'completed') return isCompleted;
    if (filter === 'pending') return !isCompleted;
    return true; // 'all'
  });

  const handleShareDaily = async () => {
    try {
      const message = formatDailySummaryForShare(selectedDate, habits, checkins);
      await Share.share({ message });
    } catch (_) {}
  };

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
        <View style={styles.headerTitles}>
          <Text style={[typography.h1, { color: theme.text, textAlign: 'right' }]}>
            العادات
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="مشاركة إنجاز اليوم"
            onPress={handleShareDaily}
            style={({ pressed }) => [
              styles.headerBtn,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="share-outline" size={21} color={theme.text} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSearchVisible ? 'إغلاق البحث' : 'البحث عن عادة'}
            onPress={() => {
              if (isSearchVisible) {
                setSearchQuery('');
                setIsSearchVisible(false);
              } else {
                setIsSearchVisible(true);
              }
            }}
            style={({ pressed }) => [
              styles.headerBtn,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons
              name={isSearchVisible ? 'close' : 'search-outline'}
              size={22}
              color={theme.text}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إضافة عادة جديدة"
            onPress={() => navigation.navigate('AddEditHabit', {})}
            style={({ pressed }) => [
              styles.headerBtn,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="add" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Expandable Search Input */}
      {isSearchVisible && (
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.cardSecondary,
              borderColor: theme.border,
              borderRadius: radius.md,
              marginHorizontal: spacing.base,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.textMuted}
            style={{ marginLeft: 8 }}
          />
          <TextInput
            placeholder="بحث بالاسم أو الوصف..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            style={[
              typography.body,
              styles.searchInput,
              {
                color: theme.text,
              },
            ]}
          />
          {searchQuery.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="مسح البحث"
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </View>
      )}

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
          isToday={isToday}
          onPressToday={() => setSelectedDate(todayStr)}
        />

        {/* Celebratory Banner when all habits completed for today */}
        {isToday && overallStats.todayTotalCount > 0 && overallStats.todayCompletionRate === 100 && (
          <View
            style={[
              styles.celebrationCard,
              {
                backgroundColor: theme.primaryLight,
                borderColor: theme.primary,
                borderRadius: radius.md,
                marginHorizontal: spacing.base,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Ionicons name="sparkles" size={20} color={theme.primary} style={{ marginLeft: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.subMedium, { color: theme.primary, textAlign: 'right' }]}>
                أحسنت! أتممت جميع عاداتك لليوم بنجاح 🎉
              </Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2, textAlign: 'right' }]}>
                حافظ على هذا الزخم والاستمرارية لبناء عادات راسخة.
              </Text>
            </View>
          </View>
        )}

        {/* Quiet Filter Tabs */}
        <View style={[styles.filterRow, { marginHorizontal: spacing.base, marginBottom: spacing.md }]}>
          {(['all', 'pending', 'completed'] as const).map((tab) => {
            const isSelected = filter === tab;
            const labels = {
              all: `الكل (${searchedHabits.length})`,
              pending: `المتبقية (${Math.max(0, searchedHabits.length - searchedCompletedCount)})`,
              completed: `المكتملة (${searchedCompletedCount})`,
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
          searchQuery.trim() ? (
            <EmptyState
              icon="search-outline"
              title="لم يتم العثور على نتائج"
              description={`لا توجد عادات مطابقة للبحث "${searchQuery}"`}
              actionTitle="مسح البحث"
              onActionPress={() => setSearchQuery('')}
            />
          ) : filter === 'pending' ? (
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
            const checkin = checkins.find(
              (c) => c.habitId === habit.id && c.date === selectedDate
            );
            const isCompleted = Boolean(checkin?.completed);
            const currentCount = checkin ? checkin.count : 0;
            const stats = calculateHabitStats(habit, checkins);

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompleted={isCompleted}
                currentCount={currentCount}
                streak={stats.currentStreak}
                isFuture={isFutureDate}
                onToggleCheckin={() => toggleCheckin(habit.id, selectedDate)}
                onIncrement={() => incrementCheckin(habit.id, selectedDate)}
                onDecrement={() => decrementCheckin(habit.id, selectedDate)}
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
  headerActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 6,
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
  celebrationCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
});
