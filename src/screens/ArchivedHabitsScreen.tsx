import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { appAlert } from '../services/alertService';
import { Text } from '../components/common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import {
  calculateHabitStats,
  formatArabicDate,
  formatArabicStreakDays,
  formatArabicCount,
  filterHabitsByQuery,
  getHabitCategory,
  toArabicNumerals,
} from '../utils/habitUtils';
import { Habit, HABIT_CATEGORIES, HabitCategory } from '../types/habit';

interface ArchivedHabitsScreenProps {
  navigation: any;
}

export const ArchivedHabitsScreen: React.FC<ArchivedHabitsScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, radius, typography, touchTarget } = useTheme();
  const { habits, checkins, restoreHabit, deleteHabit } = useHabitStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'الكل'>('الكل');


  const isSearchActive = Boolean(searchQuery.trim());

  const archivedHabits = useMemo(
    () => habits.filter((h) => Boolean(h.archivedAt)),
    [habits]
  );

  const filteredArchivedHabits = useMemo(() => {
    const searched = isSearchActive
      ? filterHabitsByQuery(archivedHabits, searchQuery)
      : archivedHabits;
    if (selectedCategory === 'الكل') return searched;
    return searched.filter((h) => getHabitCategory(h.icon) === selectedCategory);
  }, [archivedHabits, isSearchActive, searchQuery, selectedCategory]);

  const handleRestore = (habit: Habit) => {
    appAlert(
      'استعادة العادة',
      `هل تريد استعادة عادة "${habit.name}" إلى قائمة العادات اليومية؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استعادة',
          onPress: async () => {
            await restoreHabit(habit.id);
          },
        },
      ]
    );
  };

  const handleDeletePermanent = (habit: Habit) => {
    appAlert(
      'حذف نهائي للعادة',
      `هل أنت متأكد من حذف عادة "${habit.name}" نهائيًا؟ سيتم حذف جميع سجلات الإنجازات السابقة ولا يمكن التراجع.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habit.id);
          },
        },
      ]
    );
  };

  // Pre-compute stats for all archived habits to avoid per-item calculation in FlatList
  const archivedHabitStatsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateHabitStats>>();
    for (const habit of filteredArchivedHabits) {
      map.set(habit.id, calculateHabitStats(habit, checkins));
    }
    return map;
  }, [filteredArchivedHabits, checkins]);

  const renderHabitItem = ({ item: habit }: { item: Habit }) => {
    const stats = archivedHabitStatsMap.get(habit.id) ?? calculateHabitStats(habit, checkins);
    const category = getHabitCategory(habit.icon);
    const archivedDateFormatted = habit.archivedAt
      ? formatArabicDate(habit.archivedAt)
      : '';

    return (
      <Card style={[styles.card, { marginBottom: spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`تفاصيل عادة ${habit.name}`}
          onPress={() => navigation.navigate('HabitDetails', { habitId: habit.id })}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitles}>
              <View style={styles.titleBadgeRow}>
                <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
                  {habit.name}
                </Text>
                <View
                  style={[
                    styles.categoryTag,
                    {
                      backgroundColor: theme.cardSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: theme.textSecondary, fontSize: 11, fontWeight: '600' },
                    ]}
                  >
                    {category}
                  </Text>
                </View>
              </View>

              {habit.description ? (
                <Text
                  numberOfLines={1}
                  style={[
                    typography.sub,
                    { color: theme.textSecondary, marginTop: 2, textAlign: 'right' },
                  ]}
                >
                  {habit.description}
                </Text>
              ) : null}

              {archivedDateFormatted ? (
                <Text
                  style={[
                    typography.caption,
                    { color: theme.textMuted, marginTop: 4, textAlign: 'right' },
                  ]}
                >
                  أُرشفت في {archivedDateFormatted}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: habit.color ? `${habit.color}15` : theme.cardSecondary,
                },
              ]}
            >
              <Ionicons
                name={(habit.icon as any) || 'archive-outline'}
                size={22}
                color={habit.color || theme.textSecondary}
              />
            </View>
          </View>

          <View
            style={[
              styles.statsRow,
              { borderTopColor: theme.borderSubtle, marginTop: spacing.sm },
            ]}
          >
            <View style={styles.statCol}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                إجمالي الإنجازات
              </Text>
              <Text style={[typography.subMedium, { color: theme.text }]}>
                {toArabicNumerals(stats.totalCompletions)} {habit.unit}
              </Text>
            </View>

            <View style={styles.statCol}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                أطول سلسلة
              </Text>
              <Text style={[typography.subMedium, { color: theme.text }]}>
                {formatArabicStreakDays(stats.bestStreak)}
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.cardActions}>
          <Button
            title="استعادة"
            iconName="arrow-undo-outline"
            variant="outline"
            size="sm"
            onPress={() => handleRestore(habit)}
            style={{ flex: 1, marginLeft: 6 }}
          />
          <Button
            title="نسخ"
            iconName="copy-outline"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('AddEditHabit', { duplicateFromId: habit.id })}
            style={{ flex: 1, marginLeft: 6 }}
          />
          <Button
            title="حذف"
            iconName="trash-outline"
            variant="destructive"
            size="sm"
            onPress={() => handleDeletePermanent(habit)}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="العادات المؤرشفة"
        subtitle={
          archivedHabits.length > 0
            ? formatArabicCount(
                archivedHabits.length,
                'عادة مؤرشفة',
                'عادتان مؤرشفتان',
                'عادات مؤرشفة'
              )
            : undefined
        }
        onBackPress={() => navigation.goBack()}
        rightAction={
          archivedHabits.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSearchVisible ? 'إغلاق البحث' : 'البحث في الأرشيف'}
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
          ) : undefined
        }
      />

      {/* Expandable Search Bar */}
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
            placeholder="بحث في العادات المؤرشفة..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            style={[
              typography.body,
              styles.searchInput,
              { color: theme.text },
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

      {/* Category Filter Chips when archived habits exist */}
      {archivedHabits.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryScroll, { paddingHorizontal: spacing.base }]}
          style={{ marginBottom: spacing.sm, maxHeight: 40 }}
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
                    borderRadius: radius.full,
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
      )}

      {archivedHabits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: theme.cardSecondary },
            ]}
          >
            <Ionicons
              name="archive-outline"
              size={36}
              color={theme.textMuted}
            />
          </View>
          <Text style={[typography.h3, { color: theme.text, marginTop: 16 }]}>
            لا توجد عادات مؤرشفة
          </Text>
          <Text
            style={[
              typography.sub,
              {
                color: theme.textSecondary,
                textAlign: 'center',
                marginTop: 6,
                maxWidth: 280,
                lineHeight: 22,
              },
            ]}
          >
            العادات التي تقوم بأرشفتها ستبقى هنا مع كامل إحصائياتها ويمكنك استعادتها في أي وقت.
          </Text>
        </View>
      ) : filteredArchivedHabits.length === 0 ? (
        isSearchActive ? (
          <EmptyState
            icon="search-outline"
            title="لم يتم العثور على نتائج"
            description={`لا توجد عادات مؤرشفة مطابقة للبحث "${searchQuery}"`}
            actionTitle="مسح البحث"
            onActionPress={() => setSearchQuery('')}
          />
        ) : (
          <EmptyState
            icon="filter-outline"
            title="لا توجد عادات في هذا التصنيف"
            description={`لا توجد عادات مؤرشفة تنتمي لتصنيف "${selectedCategory}"`}
            actionTitle="عرض جميع التصنيفات"
            onActionPress={() => setSelectedCategory('الكل')}
          />
        )
      ) : (
        <FlatList
          data={filteredArchivedHabits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabitItem}
          contentContainerStyle={{
            padding: spacing.base,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    textAlign: 'right',
    paddingVertical: 0,
    fontSize: 14,
  },
  categoryScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  card: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitles: {
    flex: 1,
    paddingLeft: 12,
  },
  titleBadgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  statCol: {
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
