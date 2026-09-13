import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Share,
  Modal,
  RefreshControl,
  Alert,
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
import { QuickNoteModal } from '../components/home/QuickNoteModal';
import { HabitQuickActionsModal } from '../components/home/HabitQuickActionsModal';
import { EmptyState } from '../components/common/EmptyState';
import {
  HABIT_CATEGORIES,
  HabitCategory,
  HABIT_SORT_OPTIONS,
  HabitSortOption,
  Habit,
} from '../types/habit';
import {
  calculateOverallStats,
  calculateHabitStats,
  getHabitsForDate,
  filterHabitsByQuery,
  formatDailySummaryForShare,
  isHabitDueOnDate,
  getHabitCategory,
  sortHabits,
  formatHabitStatsForShare,
  calculateStreakMilestone,
} from '../utils/habitUtils';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, radius, spacing, typography, touchTarget } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'الكل'>('الكل');
  const [isOffScheduleExpanded, setIsOffScheduleExpanded] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [activeNoteModal, setActiveNoteModal] = useState<{
    habit: any;
    date: string;
    initialNote?: string;
  } | null>(null);
  const [activeQuickActionHabit, setActiveQuickActionHabit] = useState<Habit | null>(null);

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
    completeAllDueHabits,
    incrementCheckin,
    decrementCheckin,
    updateCheckinNote,
    deleteCheckinNote,
  } = useHabitStore();

  const activeSortItem =
    HABIT_SORT_OPTIONS.find((s) => s.id === sortOption) || HABIT_SORT_OPTIONS[0];

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
  const overallStats = useMemo(() =>
    calculateOverallStats(habits, checkins, selectedDate),
  [habits, checkins, selectedDate]);

  // Unarchived active habits
  const activeUnarchivedHabits = useMemo(() =>
    habits.filter((h) => !h.archivedAt),
  [habits]);

  // Relevant habits for selected date (active due habits + paused habits completed on this date)
  const dueHabits = useMemo(() =>
    getHabitsForDate(habits, checkins, selectedDate),
  [habits, checkins, selectedDate]);

  const isSearchActive = Boolean(searchQuery.trim());

  // Search searches across ALL active habits so user can find and log off-schedule habits too
  const baseHabits = useMemo(() =>
    isSearchActive
      ? filterHabitsByQuery(activeUnarchivedHabits, searchQuery)
      : dueHabits,
  [isSearchActive, activeUnarchivedHabits, searchQuery, dueHabits]);

  // Filter by category
  const categoryFilteredHabits = useMemo(() =>
    selectedCategory === 'الكل'
      ? baseHabits
      : baseHabits.filter((h) => getHabitCategory(h.icon) === selectedCategory),
  [selectedCategory, baseHabits]);

  const categoryCompletedCount = useMemo(() =>
    categoryFilteredHabits.filter((h) =>
      checkins.some((c) => c.habitId === h.id && c.date === selectedDate && c.completed)
    ).length,
  [categoryFilteredHabits, checkins, selectedDate]);

  const filteredHabits = useMemo(() =>
    categoryFilteredHabits.filter((h) => {
      const isCompleted = checkins.some(
        (c) => c.habitId === h.id && c.date === selectedDate && c.completed
      );
      if (filter === 'completed') return isCompleted;
      if (filter === 'pending') return !isCompleted;
      return true; // 'all'
    }),
  [categoryFilteredHabits, checkins, selectedDate, filter]);

  const sortedFilteredHabits = useMemo(() =>
    sortHabits(
      filteredHabits,
      sortOption,
      checkins,
      selectedDate
    ),
  [filteredHabits, sortOption, checkins, selectedDate]);

  // Off-schedule habits for selected date (when not searching)
  const offScheduleHabits = useMemo(() =>
    activeUnarchivedHabits.filter(
      (h) => !dueHabits.some((dh) => dh.id === h.id)
    ),
  [activeUnarchivedHabits, dueHabits]);

  const filteredOffScheduleHabits = useMemo(() =>
    selectedCategory === 'الكل'
      ? offScheduleHabits
      : offScheduleHabits.filter((h) => getHabitCategory(h.icon) === selectedCategory),
  [selectedCategory, offScheduleHabits]);

  const sortedOffScheduleHabits = useMemo(() =>
    sortHabits(
      filteredOffScheduleHabits,
      sortOption,
      checkins,
      selectedDate
    ),
  [filteredOffScheduleHabits, sortOption, checkins, selectedDate]);

  // Pre-calculate stats for displayed habits to avoid O(n) per item on every render
  const habitStatsMap = useMemo(() => {
    const map = new Map();
    const allDisplayedHabits = new Set([
      ...sortedFilteredHabits,
      ...sortedOffScheduleHabits,
      ...(activeQuickActionHabit ? [activeQuickActionHabit] : [])
    ]);

    for (const habit of allDisplayedHabits) {
      if (!map.has(habit.id)) {
        map.set(habit.id, calculateHabitStats(habit, checkins));
      }
    }
    return map;
  }, [sortedFilteredHabits, sortedOffScheduleHabits, activeQuickActionHabit, checkins]);

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshHabits}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
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
          onCompleteAll={
            !isFutureDate &&
            overallStats.todayTotalCount > 0 &&
            overallStats.todayCompletedCount < overallStats.todayTotalCount
              ? () => {
                  const pendingCount =
                    overallStats.todayTotalCount - overallStats.todayCompletedCount;
                  Alert.alert(
                    'إكمال جميع العادات',
                    `هل ترغب في تسجيل إنجاز جميع العادات المتبقية (${pendingCount}) لهذا اليوم؟`,
                    [
                      { text: 'إلغاء', style: 'cancel' },
                      {
                        text: 'إكمال الكل',
                        style: 'default',
                        onPress: async () => {
                          await completeAllDueHabits(selectedDate);
                        },
                      },
                    ]
                  );
                }
              : undefined
          }
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
                أحسنت! أتممت جميع عاداتك لليوم بنجاح
              </Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2, textAlign: 'right' }]}>
                حافظ على هذا الزخم والاستمرارية لبناء عادات راسخة.
              </Text>
            </View>
          </View>
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
                    backgroundColor: isCatSelected ? theme.text : theme.cardSecondary,
                    borderColor: isCatSelected ? theme.text : theme.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isCatSelected ? theme.background : theme.textSecondary,
                      fontWeight: isCatSelected ? '700' : '500',
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
          <View style={styles.filterTabsRow}>
            {(['all', 'pending', 'completed'] as const).map((tab) => {
              const isSelected = filter === tab;
              const labels = {
                all: `الكل (${categoryFilteredHabits.length})`,
                pending: `المتبقية (${Math.max(0, categoryFilteredHabits.length - categoryCompletedCount)})`,
                completed: `المكتملة (${categoryCompletedCount})`,
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

        {/* Habits List or Empty States */}
        {baseHabits.length === 0 && !isSearchActive ? (
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
        ) : sortedFilteredHabits.length === 0 ? (
          selectedCategory !== 'الكل' && categoryFilteredHabits.length === 0 ? (
            <EmptyState
              icon="filter-outline"
              title="لا توجد عادات في هذا التصنيف"
              description={`لم يتم العثور على عادات تنتمي لتصنيف "${selectedCategory}"`}
              actionTitle="عرض جميع التصنيفات"
              onActionPress={() => setSelectedCategory('الكل')}
            />
          ) : isSearchActive ? (
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
              description="جميع العادات المجدولة مكتملة بنجاح"
            />
          ) : (
            <EmptyState
              icon="ellipse-outline"
              title="لا توجد عادات مكتملة بعد"
              description="اضغط على الدائرة بجانب أي عادة لتسجيل إنجازها"
            />
          )
        ) : (
          sortedFilteredHabits.map((habit) => {
            const checkin = checkins.find(
              (c) => c.habitId === habit.id && c.date === selectedDate
            );
            const isCompleted = Boolean(checkin?.completed);
            const currentCount = checkin ? checkin.count : 0;
            const stats = habitStatsMap.get(habit.id) || { currentStreak: 0, bestStreak: 0, completionRate: 0, totalCompletions: 0 };
            const isDue = isHabitDueOnDate(habit, selectedDate, true);

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompleted={isCompleted}
                currentCount={currentCount}
                streak={stats.currentStreak}
                isFuture={isFutureDate}
                isOffSchedule={!isDue}
                hasNote={Boolean(checkin?.note?.trim())}
                onToggleCheckin={() => toggleCheckin(habit.id, selectedDate)}
                onIncrement={() => incrementCheckin(habit.id, selectedDate)}
                onDecrement={() => decrementCheckin(habit.id, selectedDate)}
                onPressDetails={() =>
                  navigation.navigate('HabitDetails', { habitId: habit.id, date: selectedDate })
                }
                onLongPress={() => setActiveQuickActionHabit(habit)}
                onPressNote={() =>
                  setActiveNoteModal({
                    habit,
                    date: selectedDate,
                    initialNote: checkin?.note,
                  })
                }
              />
            );
          })
        )}

        {/* Off-Schedule Habits Collapsible Section */}
        {!isSearchActive && filteredOffScheduleHabits.length > 0 && (
          <View style={{ marginTop: spacing.base }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إظهار العادات غير المجدولة لليوم"
              onPress={() => setIsOffScheduleExpanded(!isOffScheduleExpanded)}
              style={({ pressed }) => [
                styles.offScheduleHeader,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.md,
                  marginHorizontal: spacing.base,
                  marginBottom: isOffScheduleExpanded ? spacing.sm : spacing.md,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={styles.offScheduleHeaderRow}>
                <View style={styles.offScheduleHeaderTitle}>
                  <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                  <Text style={[typography.subMedium, { color: theme.text, marginRight: 8 }]}>
                    عادات أخرى غير مجدولة اليوم ({filteredOffScheduleHabits.length})
                  </Text>
                </View>
                <Ionicons
                  name={isOffScheduleExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.textSecondary}
                />
              </View>
            </Pressable>

            {isOffScheduleExpanded &&
              sortedOffScheduleHabits.map((habit) => {
                const checkin = checkins.find(
                  (c) => c.habitId === habit.id && c.date === selectedDate
                );
                const isCompleted = Boolean(checkin?.completed);
                const currentCount = checkin ? checkin.count : 0;
                const stats = habitStatsMap.get(habit.id) || { currentStreak: 0, bestStreak: 0, completionRate: 0, totalCompletions: 0 };

                return (
                  <HabitCard
                    key={`off_${habit.id}`}
                    habit={habit}
                    isCompleted={isCompleted}
                    currentCount={currentCount}
                    streak={stats.currentStreak}
                    isFuture={isFutureDate}
                    isOffSchedule={true}
                    hasNote={Boolean(checkin?.note?.trim())}
                    onToggleCheckin={() => toggleCheckin(habit.id, selectedDate)}
                    onIncrement={() => incrementCheckin(habit.id, selectedDate)}
                    onDecrement={() => decrementCheckin(habit.id, selectedDate)}
                    onPressDetails={() =>
                      navigation.navigate('HabitDetails', { habitId: habit.id, date: selectedDate })
                    }
                    onLongPress={() => setActiveQuickActionHabit(habit)}
                    onPressNote={() =>
                      setActiveNoteModal({
                        habit,
                        date: selectedDate,
                        initialNote: checkin?.note,
                      })
                    }
                  />
                );
              })}
          </View>
        )}
      </ScrollView>

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

      {/* Habit Quick Actions Modal (on Long Press) */}
      <HabitQuickActionsModal
        visible={activeQuickActionHabit !== null}
        habit={activeQuickActionHabit}
        selectedDate={selectedDate}
        isCompleted={
          Boolean(
            activeQuickActionHabit &&
            checkins.some(
              (c) =>
                c.habitId === activeQuickActionHabit.id &&
                c.date === selectedDate &&
                c.completed
            )
          )
        }
        streak={
          activeQuickActionHabit
            ? (habitStatsMap.get(activeQuickActionHabit.id)?.currentStreak || 0)
            : 0
        }
        hasNote={
          Boolean(
            activeQuickActionHabit &&
            checkins.find(
              (c) =>
                c.habitId === activeQuickActionHabit.id && c.date === selectedDate
            )?.note?.trim()
          )
        }
        isFutureDate={isFutureDate}
        onClose={() => setActiveQuickActionHabit(null)}
        onToggleCheckin={() => {
          if (activeQuickActionHabit) {
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
            const chk = checkins.find(
              (c) =>
                c.habitId === activeQuickActionHabit.id &&
                c.date === selectedDate
            );
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
              const stats = habitStatsMap.get(activeQuickActionHabit.id) || calculateHabitStats(activeQuickActionHabit, checkins);
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
});

