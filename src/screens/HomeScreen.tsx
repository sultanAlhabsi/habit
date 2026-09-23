import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Share,
  Modal,
  RefreshControl,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { appAlert } from '../services/alertService';
import { Text } from '../components/common/AppText';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { useShallow } from 'zustand/react/shallow';
import { Header } from '../components/common/Header';
import { DateStrip } from '../components/home/DateStrip';
import { DailyProgressCard } from '../components/home/DailyProgressCard';
import { DailyCelebrationBanner } from '../components/home/DailyCelebrationBanner';
import { HabitCard } from '../components/home/HabitCard';
import { QuickNoteModal } from '../components/home/QuickNoteModal';
import { QuickQuantityModal } from '../components/home/QuickQuantityModal';
import { HabitQuickActionsModal } from '../components/home/HabitQuickActionsModal';
import { ReorderHabitsModal } from '../components/home/ReorderHabitsModal';
import { EmptyState } from '../components/common/EmptyState';
import { FilterTabsBar } from '../components/home/FilterTabsBar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { HomeScreenSkeleton } from '../components/skeleton';


import {
  HABIT_CATEGORIES,
  HabitCategory,
  HABIT_SORT_OPTIONS,
  HabitSortOption,
  Habit,
} from '../types/habit';
import {
  calculateHabitStats,
  calculateCurrentStreakFromDates,
  getHabitsForDate,
  filterHabitsByQuery,
  formatDailySummaryForShare,
  isHabitDueOnDate,
  getHabitCategory,
  sortHabits,
  formatHabitStatsForShare,
  calculateStreakMilestone,
  isPeriodicFlexibleHabit,
  getWeeklyTargetProgress,
  getMonthlyTargetProgress,
  getPeriodicBadgeText,
} from '../utils/habitUtils';


interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, radius, spacing, typography, touchTarget } = useTheme();
  const flashListRef = useRef<FlashListRef<Habit>>(null);

  const triggerSmoothLayoutTransition = useCallback(() => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (_) {}
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'الكل'>('الكل');
  const [isPeriodicExpanded, setIsPeriodicExpanded] = useState(false);
  const [isOffScheduleExpanded, setIsOffScheduleExpanded] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [activeNoteModal, setActiveNoteModal] = useState<{
    habit: any;
    date: string;
    initialNote?: string;
  } | null>(null);
  const [activeQuantityModal, setActiveQuantityModal] = useState<{
    habit: Habit;
    currentCount: number;
    date: string;
  } | null>(null);
  const [activeQuickActionHabit, setActiveQuickActionHabit] = useState<Habit | null>(null);
  const [isReorderModalVisible, setIsReorderModalVisible] = useState(false);
  const [activeReorderHabitId, setActiveReorderHabitId] = useState<string | null>(null);

  const {
    habits,
    checkins,
    selectedDate,
    filter,
    sortOption,
    isLoading,
    isRefreshing,
    refreshHabits,
    setSelectedDate,
    setFilter,
    setSortOption,
    toggleCheckin,
    togglePinHabit,
    toggleHabitActive,
    deleteHabit,
    incrementCheckin,
    decrementCheckin,
    setHabitCount,
    updateCheckinNote,
    deleteCheckinNote,
    cloudSyncState,
  } = useHabitStore(
    useShallow((state) => ({
      habits: state.habits,
      checkins: state.checkins,
      selectedDate: state.selectedDate,
      filter: state.filter,
      sortOption: state.sortOption,
      isLoading: state.isLoading,
      isRefreshing: state.isRefreshing,
      refreshHabits: state.refreshHabits,
      setSelectedDate: state.setSelectedDate,
      setFilter: state.setFilter,
      setSortOption: state.setSortOption,
      toggleCheckin: state.toggleCheckin,
      togglePinHabit: state.togglePinHabit,
      toggleHabitActive: state.toggleHabitActive,
      deleteHabit: state.deleteHabit,
      incrementCheckin: state.incrementCheckin,
      decrementCheckin: state.decrementCheckin,
      setHabitCount: state.setHabitCount,
      updateCheckinNote: state.updateCheckinNote,
      deleteCheckinNote: state.deleteCheckinNote,
      cloudSyncState: state.cloudSyncState,
    }))
  );

  const activeSortItem =
    HABIT_SORT_OPTIONS.find((s) => s.id === sortOption) || HABIT_SORT_OPTIONS[0];

  // Interactive preview for inspecting the skeleton shimmer on demand
  const [isPreviewingSkeleton, setIsPreviewingSkeleton] = useState(false);
  const handlePreviewSkeleton = useCallback(() => {
    setIsPreviewingSkeleton(true);
    setTimeout(() => {
      setIsPreviewingSkeleton(false);
    }, 3500);
  }, []);

  const todayStr = dayjs().format('YYYY-MM-DD');
  const isToday = selectedDate === todayStr;
  const isFutureDate = dayjs(selectedDate).startOf('day').isAfter(dayjs().startOf('day'));

  // Fast O(1) lookup map for selectedDate: `${habitId}:${date}` -> HabitCheckin
  // Only filters checkins for selectedDate, reducing loop overhead by 99%
  const checkinsMap = useMemo(() => {
    const map = new Map<string, typeof checkins[0]>();
    for (let i = 0; i < checkins.length; i++) {
      const c = checkins[i];
      if (c.date === selectedDate) {
        map.set(`${c.habitId}:${c.date}`, c);
      }
    }
    return map;
  }, [checkins, selectedDate]);

  // Unarchived active habits (memoized)
  const activeUnarchivedHabits = useMemo(
    () => habits.filter((h) => !h.archivedAt),
    [habits]
  );

  // Periodic flexible habits (weekly_target and monthly_target)
  const periodicHabits = useMemo(
    () => activeUnarchivedHabits.filter(isPeriodicFlexibleHabit),
    [activeUnarchivedHabits]
  );

  // Scheduled habits (daily, specific_days, and monthly_day)
  const scheduledHabits = useMemo(
    () => activeUnarchivedHabits.filter((h) => !isPeriodicFlexibleHabit(h)),
    [activeUnarchivedHabits]
  );

  // Relevant scheduled habits due on selected date (memoized)
  const dueHabits = useMemo(
    () => getHabitsForDate(scheduledHabits, checkins, selectedDate),
    [scheduledHabits, checkins, selectedDate]
  );

  // Fast O(dueHabits) daily progress calculation - replaces heavy multi-year calculateOverallStats
  const dailyStats = useMemo(() => {
    const todayTotalCount = dueHabits.length;
    const todayCompletedCount = dueHabits.filter(
      (h) => checkinsMap.get(`${h.id}:${selectedDate}`)?.completed
    ).length;
    const todayCompletionRate =
      todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;
    return {
      todayCompletedCount,
      todayTotalCount,
      todayCompletionRate,
    };
  }, [dueHabits, checkinsMap, selectedDate]);

  const isSearchActive = Boolean(searchQuery.trim());

  // Base habits for rendering (memoized)
  const baseHabits = useMemo(() => {
    if (isSearchActive) {
      return filterHabitsByQuery(activeUnarchivedHabits, searchQuery);
    }
    return dueHabits;
  }, [isSearchActive, activeUnarchivedHabits, searchQuery, dueHabits]);

  // Category-filtered habits (memoized)
  const categoryFilteredHabits = useMemo(() => {
    if (selectedCategory === 'الكل') return baseHabits;
    return baseHabits.filter((h) => getHabitCategory(h.icon) === selectedCategory);
  }, [baseHabits, selectedCategory]);

  const categoryCompletedCount = useMemo(() =>
    categoryFilteredHabits.filter((h) =>
      checkinsMap.get(`${h.id}:${selectedDate}`)?.completed
    ).length,
    [categoryFilteredHabits, checkinsMap, selectedDate]
  );

  // Final filtered + sorted habits (memoized)
  const sortedFilteredHabits = useMemo(() => {
    const filtered = categoryFilteredHabits.filter((h) => {
      const isCompleted = Boolean(checkinsMap.get(`${h.id}:${selectedDate}`)?.completed);
      if (filter === 'completed') return isCompleted;
      if (filter === 'pending') return !isCompleted;
      return true;
    });
    return sortHabits(filtered, sortOption, checkins, selectedDate);
  }, [categoryFilteredHabits, checkinsMap, selectedDate, filter, sortOption, checkins]);

  // Pre-index completed dates by habit: habitId -> Set<dateStr>
  // Runs in O(checkins) once, enabling instant O(1) date lookups and ultra-fast streak calculations
  const completedDatesByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of checkins) {
      if (c.completed) {
        let set = map.get(c.habitId);
        if (!set) {
          set = new Set();
          map.set(c.habitId, set);
        }
        set.add(c.date);
      }
    }
    return map;
  }, [checkins]);

  // Ultra-fast current streak pre-computation for visible habits (O(1) lookups per habit)
  const habitStreakMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const habit of sortedFilteredHabits) {
      const dates = completedDatesByHabit.get(habit.id) || new Set<string>();
      map.set(habit.id, calculateCurrentStreakFromDates(habit, dates, selectedDate));
    }
    return map;
  }, [sortedFilteredHabits, completedDatesByHabit, selectedDate]);

  // Off-schedule habits: scheduled habits that are NOT due on selected date
  const offScheduleHabits = useMemo(() =>
    scheduledHabits.filter(
      (h) => !dueHabits.some((dh) => dh.id === h.id)
    ),
    [scheduledHabits, dueHabits]
  );

  const filteredOffScheduleHabits = useMemo(() => {
    if (selectedCategory === 'الكل') return offScheduleHabits;
    return offScheduleHabits.filter((h) => getHabitCategory(h.icon) === selectedCategory);
  }, [offScheduleHabits, selectedCategory]);

  const sortedOffScheduleHabits = useMemo(
    () => sortHabits(filteredOffScheduleHabits, sortOption, checkins, selectedDate),
    [filteredOffScheduleHabits, sortOption, checkins, selectedDate]
  );

  // Off-schedule streak cache (for expanded section)
  const offScheduleStreakMap = useMemo(() => {
    if (!isOffScheduleExpanded) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const habit of sortedOffScheduleHabits) {
      const dates = completedDatesByHabit.get(habit.id) || new Set<string>();
      map.set(habit.id, calculateCurrentStreakFromDates(habit, dates, selectedDate));
    }
    return map;
  }, [sortedOffScheduleHabits, completedDatesByHabit, selectedDate, isOffScheduleExpanded]);

  // Periodic habits filtered & sorted
  const filteredPeriodicHabits = useMemo(() => {
    if (selectedCategory === 'الكل') return periodicHabits;
    return periodicHabits.filter((h) => getHabitCategory(h.icon) === selectedCategory);
  }, [periodicHabits, selectedCategory]);

  const sortedPeriodicHabits = useMemo(
    () => sortHabits(filteredPeriodicHabits, sortOption, checkins, selectedDate),
    [filteredPeriodicHabits, sortOption, checkins, selectedDate]
  );

  // Periodic streak cache
  const periodicStreakMap = useMemo(() => {
    if (!isPeriodicExpanded) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const habit of sortedPeriodicHabits) {
      const dates = completedDatesByHabit.get(habit.id) || new Set<string>();
      map.set(habit.id, calculateCurrentStreakFromDates(habit, dates, selectedDate));
    }
    return map;
  }, [sortedPeriodicHabits, completedDatesByHabit, selectedDate, isPeriodicExpanded]);

  // Memoized handlers to avoid creating new function references on every render
  const handleShareDaily = useCallback(async () => {
    try {
      const message = formatDailySummaryForShare(selectedDate, habits, checkins);
      await Share.share({ message });
    } catch (_) {}
  }, [selectedDate, habits, checkins]);

  const handleToggleCheckin = useCallback(
    (habitId: string) => {
      triggerSmoothLayoutTransition();
      toggleCheckin(habitId, selectedDate);
    },
    [triggerSmoothLayoutTransition, toggleCheckin, selectedDate]
  );

  const handleIncrementCheckin = useCallback(
    (habitId: string) => {
      triggerSmoothLayoutTransition();
      incrementCheckin(habitId, selectedDate);
    },
    [triggerSmoothLayoutTransition, incrementCheckin, selectedDate]
  );

  const handleDecrementCheckin = useCallback(
    (habitId: string) => {
      triggerSmoothLayoutTransition();
      decrementCheckin(habitId, selectedDate);
    },
    [triggerSmoothLayoutTransition, decrementCheckin, selectedDate]
  );

  const handlePressDetails = useCallback(
    (habitId: string) => {
      navigation.navigate('HabitDetails', { habitId, date: selectedDate });
    },
    [navigation, selectedDate]
  );

  const handleLongPressHabit = useCallback((habit: Habit) => {
    setActiveReorderHabitId(habit.id);
    setIsReorderModalVisible(true);
  }, []);

  const handleQuickActions = useCallback((habit: Habit) => {
    setActiveQuickActionHabit(habit);
  }, []);

  const handlePressNote = useCallback(
    (habit: Habit, note?: string) => {
      setActiveNoteModal({
        habit,
        date: selectedDate,
        initialNote: note,
      });
    },
    [selectedDate]
  );

  const handlePressQuantity = useCallback(
    (habit: Habit, currentCount: number) => {
      setActiveQuantityModal({
        habit,
        currentCount,
        date: selectedDate,
      });
    },
    [selectedDate]
  );


  const listHeaderComponent = useMemo(
    () => (
      <View>
        {/* Date Selector Strip */}
        <DateStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Daily Progress Overview */}
        <DailyProgressCard
          date={selectedDate}
          completedCount={dailyStats.todayCompletedCount}
          totalCount={dailyStats.todayTotalCount}
          completionRate={dailyStats.todayCompletionRate}
          isToday={isToday}
          onPressToday={() => setSelectedDate(todayStr)}
        />

        {/* Celebratory Banner when all habits completed for today */}
        {isToday && dailyStats.todayTotalCount > 0 && dailyStats.todayCompletionRate === 100 && (
          <DailyCelebrationBanner />
        )}

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryScroll, { paddingHorizontal: spacing.base }]}
          style={{ marginBottom: spacing.sm }}
        >
          {HABIT_CATEGORIES.map((cat) => {
            const isCatSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                accessibilityRole="button"
                accessibilityState={{ selected: isCatSelected }}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: isCatSelected ? theme.primary : theme.cardSecondary,
                    borderColor: isCatSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isCatSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isCatSelected ? '700' : '400',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quiet Filter Tabs & Sort Button */}
        <View style={[styles.filterBarContainer, { marginHorizontal: spacing.base, marginBottom: spacing.md }]}>
          <FilterTabsBar
            filter={filter}
            onSelectFilter={setFilter}
            allCount={categoryFilteredHabits.length}
            pendingCount={Math.max(0, categoryFilteredHabits.length - categoryCompletedCount)}
            completedCount={categoryCompletedCount}
          />

          {/* Sort Selector Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`ترتيب العادات: ${activeSortItem.label}`}
            onPress={() => setIsSortModalVisible(true)}
            style={({ pressed }) => [
              styles.sortBtn,
              {
                backgroundColor: sortOption !== 'default' ? theme.cardSecondary : 'transparent',
                borderColor: sortOption !== 'default' ? theme.border : theme.border,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons
              name={activeSortItem.icon as any}
              size={13}
              color={sortOption !== 'default' ? theme.text : theme.textMuted}
            />
            <Text
              style={[
                typography.caption,
                {
                  color: sortOption !== 'default' ? theme.text : theme.textSecondary,
                  fontWeight: sortOption !== 'default' ? '600' : '400',
                  marginRight: 4,
                  fontSize: 11,
                },
              ]}
            >
              {activeSortItem.label}
            </Text>
          </Pressable>
        </View>
      </View>
    ),
    [
      selectedDate,
      dailyStats,
      isToday,
      todayStr,
      isFutureDate,
      theme,
      radius,
      spacing,
      typography,
      selectedCategory,
      filter,
      categoryFilteredHabits.length,
      categoryCompletedCount,
      activeSortItem,
      sortOption,
    ]
  );

  const listEmptyComponent = useMemo(() => {
    if (baseHabits.length === 0 && !isSearchActive) {
      return (
        <View style={{ alignItems: 'center' }}>
          <EmptyState
            icon="leaf-outline"
            title="لا توجد عادات لهذا اليوم"
            description="أنشئ عاداتك اليومية لتبدأ في بناء جدولك ومتابعة التزامك"
            actionTitle="إضافة عادة جديدة"
            onActionPress={() => navigation.navigate('AddEditHabit', {})}
          />
          {habits.length === 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="استعراض نماذج العادات الجاهزة"
              onPress={() => navigation.navigate('AddEditHabit', { openTemplates: true })}
              style={({ pressed }) => [
                styles.emptyStateTemplatesBtn,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.md,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="sparkles" size={15} color={theme.primary} style={{ marginLeft: 6 }} />
              <Text style={[typography.subMedium, { color: theme.primary, fontWeight: '600' }]}>
                استكشف نماذج العادات الجاهزة (24 نموذج)
              </Text>
            </Pressable>
          )}
        </View>
      );
    }

    if (sortedFilteredHabits.length === 0) {
      if (selectedCategory !== 'الكل' && categoryFilteredHabits.length === 0) {
        return (
          <EmptyState
            icon="filter-outline"
            title="لا توجد عادات في هذا التصنيف"
            description={`لم يتم العثور على عادات تنتمي لتصنيف "${selectedCategory}"`}
            actionTitle="عرض جميع التصنيفات"
            onActionPress={() => setSelectedCategory('الكل')}
          />
        );
      }
      if (isSearchActive) {
        return (
          <EmptyState
            icon="search-outline"
            title="لم يتم العثور على نتائج"
            description={`لا توجد عادات مطابقة للبحث "${searchQuery}"`}
            actionTitle="مسح البحث"
            onActionPress={() => setSearchQuery('')}
          />
        );
      }
      if (filter === 'pending') {
        return (
          <EmptyState
            icon="checkmark-outline"
            title="أتممت عادات اليوم"
            description="جميع العادات المجدولة مكتملة بنجاح"
          />
        );
      }
      return (
        <EmptyState
          icon="ellipse-outline"
          title="لا توجد عادات مكتملة بعد"
          description="اضغط على الدائرة بجانب أي عادة لتسجيل إنجازها"
        />
      );
    }

    return null;
  }, [
    baseHabits.length,
    isSearchActive,
    habits.length,
    navigation,
    theme.cardSecondary,
    theme.border,
    theme.primary,
    radius.md,
    typography.subMedium,
    sortedFilteredHabits.length,
    selectedCategory,
    categoryFilteredHabits.length,
    searchQuery,
    filter,
  ]);

  const listFooterComponent = useMemo(() => {
    const hasPeriodic = !isSearchActive && filteredPeriodicHabits.length > 0;
    const hasOffSchedule = !isSearchActive && filteredOffScheduleHabits.length > 0;

    if (!hasPeriodic && !hasOffSchedule) {
      return <View style={{ height: insets.bottom + 80 }} />;
    }

    return (
      <View style={{ marginTop: spacing.base, paddingBottom: insets.bottom + 80 }}>
        {/* Periodic Flexible Habits Section (Weekly & Monthly) */}
        {hasPeriodic && (
          <View style={{ marginBottom: spacing.md }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إظهار الأهداف المرنة الأسبوعية والشهرية"
              accessibilityState={{ expanded: isPeriodicExpanded }}
              onPress={() => setIsPeriodicExpanded(!isPeriodicExpanded)}
              style={({ pressed }) => [
                styles.offScheduleHeader,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.md,
                  marginHorizontal: spacing.base,
                  marginBottom: isPeriodicExpanded ? spacing.xs : spacing.md,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={styles.offScheduleHeaderRow}>
                <View style={styles.offScheduleHeaderTitle}>
                  <Ionicons name="repeat-outline" size={16} color={theme.textSecondary} />
                  <Text style={[typography.subMedium, { color: theme.text, marginRight: 8 }]}>
                    أهداف مرنة أسبوعية وشهرية ({filteredPeriodicHabits.length})
                  </Text>
                </View>
                <Ionicons
                  name={isPeriodicExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.textSecondary}
                />
              </View>
            </Pressable>

            {isPeriodicExpanded && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: theme.textMuted,
                    textAlign: 'right',
                    marginHorizontal: spacing.base + 4,
                    marginBottom: spacing.xs,
                    fontSize: 11,
                  },
                ]}
              >
                أهداف حرة تنجزها في أي يوم يناسبك
              </Text>
            )}

            {isPeriodicExpanded &&
              sortedPeriodicHabits.map((habit, pIndex) => {
                const checkin = checkinsMap.get(`${habit.id}:${selectedDate}`);
                const isCompletedToday = Boolean(checkin?.completed);
                const currentCount = checkin ? checkin.count : 0;
                const streak = periodicStreakMap.get(habit.id) ?? 0;
                const periodicBadgeText = getPeriodicBadgeText(
                  habit,
                  completedDatesByHabit.get(habit.id) || new Set<string>(),
                  selectedDate
                );

                return (
                  <Animated.View
                    key={`periodic_${habit.id}`}
                    entering={FadeInDown.delay(Math.min(pIndex, 4) * 25).duration(180)}
                  >
                    <HabitCard
                      key={`periodic_${habit.id}`}
                      habit={habit}
                      isCompleted={isCompletedToday}
                      currentCount={currentCount}
                      streak={streak}
                      isFuture={isFutureDate}
                      isOffSchedule={false}
                      periodicBadgeText={periodicBadgeText}
                      hasNote={Boolean(checkin?.note?.trim())}
                      onToggleCheckin={() => handleToggleCheckin(habit.id)}
                      onPressDetails={() => handlePressDetails(habit.id)}
                      onLongPress={() => handleLongPressHabit(habit)}
                      onPressNote={() => handlePressNote(habit, checkin?.note)}
                      onPressQuantity={() => handlePressQuantity(habit, currentCount)}
                      onPressQuickActions={() => handleQuickActions(habit)}
                    />
                  </Animated.View>
                );
              })}
          </View>
        )}

        {/* Off-schedule habits */}
        {hasOffSchedule && (
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إظهار العادات في استراحة اليوم"
              accessibilityState={{ expanded: isOffScheduleExpanded }}
              onPress={() => setIsOffScheduleExpanded(!isOffScheduleExpanded)}
              style={({ pressed }) => [
                styles.offScheduleHeader,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.md,
                  marginHorizontal: spacing.base,
                  marginBottom: isOffScheduleExpanded ? spacing.xs : spacing.md,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={styles.offScheduleHeaderRow}>
                <View style={styles.offScheduleHeaderTitle}>
                  <Ionicons name="bed-outline" size={16} color={theme.textSecondary} />
                  <Text style={[typography.subMedium, { color: theme.text, marginRight: 8 }]}>
                    عادات في استراحة اليوم ({filteredOffScheduleHabits.length})
                  </Text>
                </View>
                <Ionicons
                  name={isOffScheduleExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.textSecondary}
                />
              </View>
            </Pressable>

            {isOffScheduleExpanded && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: theme.textMuted,
                    textAlign: 'right',
                    marginHorizontal: spacing.base + 4,
                    marginBottom: spacing.xs,
                    fontSize: 11,
                  },
                ]}
              >
                عادات مجدولة لأيام أخرى — يمكنك تسجيل إنجازها الآن إن أردت
              </Text>
            )}

            {isOffScheduleExpanded &&
              sortedOffScheduleHabits.map((habit, offIndex) => {
                const checkin = checkinsMap.get(`${habit.id}:${selectedDate}`);
                const isCompleted = Boolean(checkin?.completed);
                const currentCount = checkin ? checkin.count : 0;
                const streak = offScheduleStreakMap.get(habit.id) ?? 0;
                const periodicBadgeText = getPeriodicBadgeText(
                  habit,
                  completedDatesByHabit.get(habit.id) || new Set<string>(),
                  selectedDate
                );

                return (
                  <Animated.View
                    key={`off_${habit.id}`}
                    entering={FadeInDown.delay(Math.min(offIndex, 4) * 25).duration(180)}
                  >
                    <HabitCard
                      key={`off_${habit.id}`}
                      habit={habit}
                      isCompleted={isCompleted}
                      currentCount={currentCount}
                      streak={streak}
                      isFuture={isFutureDate}
                      isOffSchedule={true}
                      periodicBadgeText={periodicBadgeText}
                      hasNote={Boolean(checkin?.note?.trim())}
                      onToggleCheckin={() => handleToggleCheckin(habit.id)}
                      onPressDetails={() => handlePressDetails(habit.id)}
                      onLongPress={() => handleLongPressHabit(habit)}
                      onPressNote={() => handlePressNote(habit, checkin?.note)}
                      onPressQuantity={() => handlePressQuantity(habit, currentCount)}
                      onPressQuickActions={() => handleQuickActions(habit)}
                    />
                  </Animated.View>
                );
              })}
          </View>
        )}
      </View>
    );
  }, [
    isSearchActive,
    filteredPeriodicHabits.length,
    isPeriodicExpanded,
    sortedPeriodicHabits,
    periodicStreakMap,
    completedDatesByHabit,
    filteredOffScheduleHabits.length,
    isOffScheduleExpanded,
    sortedOffScheduleHabits,
    checkinsMap,
    selectedDate,
    offScheduleStreakMap,
    isFutureDate,
    handleToggleCheckin,
    handleIncrementCheckin,
    handleDecrementCheckin,
    handlePressDetails,
    handleLongPressHabit,
    handleQuickActions,
    handlePressNote,
    theme,
    radius.md,
    spacing,
    typography,
    insets.bottom,
    sortedFilteredHabits.length,
  ]);

  const habitKeyExtractor = useCallback((item: Habit) => item.id, []);

  const renderHabitItem = useCallback(
    ({ item: habit }: { item: Habit }) => {
      const checkin = checkinsMap.get(`${habit.id}:${selectedDate}`);
      const isCompleted = Boolean(checkin?.completed);
      const currentCount = checkin ? checkin.count : 0;
      const streak = habitStreakMap.get(habit.id) ?? 0;
      const isDue = isHabitDueOnDate(habit, selectedDate, true);
      const periodicBadgeText = getPeriodicBadgeText(
        habit,
        completedDatesByHabit.get(habit.id) || new Set<string>(),
        selectedDate
      );

      return (
        <HabitCard
          habit={habit}
          isCompleted={isCompleted}
          currentCount={currentCount}
          streak={streak}
          isFuture={isFutureDate}
          isOffSchedule={!isDue}
          periodicBadgeText={periodicBadgeText}
          hasNote={Boolean(checkin?.note?.trim())}
          onToggleCheckin={() => handleToggleCheckin(habit.id)}
          onPressDetails={() => handlePressDetails(habit.id)}
          onLongPress={() => handleLongPressHabit(habit)}
          onPressNote={() => handlePressNote(habit, checkin?.note)}
          onPressQuantity={() => handlePressQuantity(habit, currentCount)}
          onPressQuickActions={() => handleQuickActions(habit)}
        />
      );
    },
    [
      checkinsMap,
      selectedDate,
      habitStreakMap,
      completedDatesByHabit,
      isFutureDate,
      handleToggleCheckin,
      handlePressDetails,
      handleLongPressHabit,
      handlePressNote,
      handlePressQuantity,
      handleQuickActions,
    ]
  );

  const flashListExtraData = useMemo(
    () => ({
      selectedDate,
      checkinsMap,
      habitStreakMap,
      isFutureDate,
      completedDatesByHabit,
      theme,
    }),
    [
      selectedDate,
      checkinsMap,
      habitStreakMap,
      isFutureDate,
      completedDatesByHabit,
      theme,
    ]
  );

  if (isLoading || isPreviewingSkeleton) {
    return <HomeScreenSkeleton insetsTop={insets.top} insetsBottom={insets.bottom} />;
  }

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
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
            <Pressable
              onLongPress={handlePreviewSkeleton}
              delayLongPress={350}
              accessibilityRole="header"
              accessibilityHint="اضغط مطولاً لمعاينة هيكل التحميل"
            >
              <Text style={[typography.h1, { color: theme.text, textAlign: 'right' }]}>
                العادات
              </Text>
            </Pressable>
            {cloudSyncState === 'syncing' && (
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  marginRight: spacing.sm,
                  backgroundColor: theme.primary + '18',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radius.full,
                }}
              >
                <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 4 }} />
                <Text style={[typography.caption, { color: theme.primary, fontSize: 11 }]}>
                  جاري المزامنة...
                </Text>
              </View>
            )}
          </View>
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

      <FlashList
        ref={flashListRef}
        data={sortedFilteredHabits}
        renderItem={renderHabitItem}
        keyExtractor={habitKeyExtractor}
        drawDistance={350}
        ListHeaderComponent={listHeaderComponent}
        ListFooterComponent={listFooterComponent}
        ListEmptyComponent={listEmptyComponent}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={refreshHabits}
        extraData={flashListExtraData}
      />

      {/* Quick Daily Reflection Note Modal */}
      <QuickNoteModal
        visible={activeNoteModal !== null}
        habit={activeNoteModal?.habit || null}
        date={activeNoteModal?.date || selectedDate}
        initialNote={activeNoteModal?.initialNote}
        onClose={() => setActiveNoteModal(null)}
        onSave={async (note) => {
          if (activeNoteModal) {
            await updateCheckinNote(activeNoteModal.habit.id, activeNoteModal.date, note);
          }
        }}
        onDelete={async () => {
          if (activeNoteModal) {
            await deleteCheckinNote(activeNoteModal.habit.id, activeNoteModal.date);
          }
        }}
      />

      {/* Quick Quantity Input Modal */}
      <QuickQuantityModal
        visible={activeQuantityModal !== null}
        habit={activeQuantityModal?.habit || null}
        date={activeQuantityModal?.date || selectedDate}
        currentCount={activeQuantityModal?.currentCount || 0}
        onClose={() => setActiveQuantityModal(null)}
        onSave={async (count) => {
          if (activeQuantityModal) {
            triggerSmoothLayoutTransition();
            await setHabitCount(activeQuantityModal.habit.id, count, activeQuantityModal.date);
          }
        }}
      />

      {/* Habit Quick Actions Modal (on Long Press) */}
      <HabitQuickActionsModal
        visible={activeQuickActionHabit !== null}
        habit={activeQuickActionHabit}
        selectedDate={selectedDate}
        isCompleted={
          Boolean(
            activeQuickActionHabit &&
            checkinsMap.get(`${activeQuickActionHabit.id}:${selectedDate}`)?.completed
          )
        }
        streak={
          activeQuickActionHabit
            ? (habitStreakMap.get(activeQuickActionHabit.id) ??
               offScheduleStreakMap.get(activeQuickActionHabit.id) ??
               0)
            : 0
        }
        hasNote={
          Boolean(
            activeQuickActionHabit &&
            checkinsMap.get(`${activeQuickActionHabit.id}:${selectedDate}`)?.note?.trim()
          )
        }
        isFutureDate={isFutureDate}
        onClose={() => setActiveQuickActionHabit(null)}
        onToggleCheckin={() => {
          if (activeQuickActionHabit) {
            triggerSmoothLayoutTransition();
            toggleCheckin(activeQuickActionHabit.id, selectedDate);
          }
        }}
        onTogglePin={() => {
          if (activeQuickActionHabit) {
            togglePinHabit(activeQuickActionHabit.id);
          }
        }}
        onToggleActive={() => {
          if (activeQuickActionHabit) {
            toggleHabitActive(activeQuickActionHabit.id);
          }
        }}
        onOpenNote={() => {
          if (activeQuickActionHabit) {
            const chk = checkinsMap.get(`${activeQuickActionHabit.id}:${selectedDate}`);
            setActiveNoteModal({
              habit: activeQuickActionHabit,
              date: selectedDate,
              initialNote: chk?.note,
            });
          }
        }}
        onShare={async () => {
          if (activeQuickActionHabit) {
            try {
              const stats = calculateHabitStats(activeQuickActionHabit, checkins);
              const milestone = calculateStreakMilestone(stats.currentStreak);
              const text = formatHabitStatsForShare(
                activeQuickActionHabit,
                stats,
                milestone
              );
              await Share.share({ message: text });
            } catch (_) {}
          }
        }}
        onEditHabit={() => {
          if (activeQuickActionHabit) {
            navigation.navigate('AddEditHabit', {
              habitId: activeQuickActionHabit.id,
            });
          }
        }}
        onViewDetails={() => {
          if (activeQuickActionHabit) {
            navigation.navigate('HabitDetails', {
              habitId: activeQuickActionHabit.id,
              date: selectedDate,
            });
          }
        }}
        onReorderHabit={() => {
          const targetId = activeQuickActionHabit?.id || null;
          setActiveQuickActionHabit(null);
          setActiveReorderHabitId(targetId);
          setIsReorderModalVisible(true);
        }}
        onDeleteHabit={() => {
          if (activeQuickActionHabit) {
            const habitToDelete = activeQuickActionHabit;
            appAlert(
              'حذف العادة',
              `هل أنت متأكد من حذف عادة "${habitToDelete.name}" نهائيًا؟ سيتم حذف كافة السجلات التابعة لها ولا يمكن التراجع.`,
              [
                { text: 'إلغاء', style: 'cancel' },
                {
                  text: 'حذف نهائي',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteHabit(habitToDelete.id);
                  },
                },
              ]
            );
          }
        }}
      />

      {/* Reorder Habits Modal */}
      <ReorderHabitsModal
        visible={isReorderModalVisible}
        initialFocusedHabitId={activeReorderHabitId}
        onClose={() => {
          setIsReorderModalVisible(false);
          setActiveReorderHabitId(null);
        }}
      />

      {/* Sort Options Modal */}
      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsSortModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderRadius: radius.lg,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
                ترتيب العادات
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إغلاق نافذة الترتيب"
                onPress={() => setIsSortModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            {HABIT_SORT_OPTIONS.map((item) => {
              const isSelected = sortOption === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    setSortOption(item.id);
                    setIsSortModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.sortOptionRow,
                    {
                      backgroundColor: isSelected ? theme.cardSecondary : 'transparent',
                      borderRadius: radius.md,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.sortOptionRight}>
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? theme.text : theme.textMuted}
                    />
                    <Text
                      style={[
                        typography.sub,
                        {
                          color: isSelected ? theme.text : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '400',
                          marginRight: 10,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={theme.text} />
                  )}
                </Pressable>
              );
            })}

            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 8 }} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="فتح وضع إعادة ترتيب العادات بالسحب والإفلات"
              onPress={() => {
                setIsSortModalVisible(false);
                setTimeout(() => {
                  setActiveReorderHabitId(null);
                  setIsReorderModalVisible(true);
                }, 150);
              }}
              style={({ pressed }) => [
                styles.sortOptionRow,
                {
                  backgroundColor: `${theme.primary}12`,
                  borderColor: theme.primary,
                  borderWidth: 1,
                  borderRadius: radius.md,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.sortOptionRight}>
                <Ionicons name="swap-vertical" size={18} color={theme.primary} />
                <Text
                  style={[
                    typography.subMedium,
                    {
                      color: theme.primary,
                      fontWeight: '700',
                      marginRight: 10,
                    },
                  ]}
                >
                  إعادة الترتيب اليدوي (سحب وإفلات)
                </Text>
              </View>
              <Ionicons name="chevron-back" size={16} color={theme.primary} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  categoryScroll: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
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
  offScheduleHeader: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  offScheduleHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  offScheduleHeaderTitle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  filterBarContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: 2,
  },
  filterTabsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  sortBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  sortOptionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 2,
  },
  sortOptionRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  emptyStateTemplatesBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginTop: -8,
    marginBottom: 20,
  },
  periodicHeaderContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 4,
  },
});

