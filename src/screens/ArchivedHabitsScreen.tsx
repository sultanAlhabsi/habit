import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { calculateHabitStats, formatArabicDate, formatArabicDaysCount } from '../utils/habitUtils';
import { Habit } from '../types/habit';

interface ArchivedHabitsScreenProps {
  navigation: any;
}

export const ArchivedHabitsScreen: React.FC<ArchivedHabitsScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, typography, touchTarget } = useTheme();
  const { habits, checkins, restoreHabit, deleteHabit } = useHabitStore();

  const archivedHabits = habits.filter((h) => Boolean(h.archivedAt));

  const handleRestore = (habit: Habit) => {
    Alert.alert(
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
    Alert.alert(
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

  const renderHabitItem = ({ item: habit }: { item: Habit }) => {
    const stats = calculateHabitStats(habit, checkins);
    const archivedDateFormatted = habit.archivedAt
      ? formatArabicDate(habit.archivedAt)
      : '';

    return (
      <Card style={[styles.card, { marginBottom: spacing.sm }]}>
        <Pressable
          onPress={() => navigation.navigate('HabitDetails', { habitId: habit.id })}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitles}>
              <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
                {habit.name}
              </Text>
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
                { backgroundColor: theme.cardSecondary },
              ]}
            >
              <Ionicons
                name={(habit.icon as any) || 'archive-outline'}
                size={22}
                color={theme.textSecondary}
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
                {stats.totalCompletions} {habit.unit}
              </Text>
            </View>

            <View style={styles.statCol}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                أطول سلسلة
              </Text>
              <Text style={[typography.subMedium, { color: theme.text }]}>
                {formatArabicDaysCount(stats.bestStreak)}
              </Text>
            </View>

          </View>
        </Pressable>

        <View style={styles.cardActions}>
          <Button
            title="استعادة"
            variant="outline"
            size="sm"
            onPress={() => handleRestore(habit)}
            style={{ flex: 1, marginLeft: 6 }}
          />
          <Button
            title="نسخ ⎘"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('AddEditHabit', { duplicateFromId: habit.id })}
            style={{ flex: 1, marginLeft: 6 }}
          />
          <Button
            title="حذف"
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
            ? `${archivedHabits.length} عادة في الأرشيف`
            : undefined
        }
        onBackPress={() => navigation.goBack()}
      />

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
      ) : (
        <FlatList
          data={archivedHabits}
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
