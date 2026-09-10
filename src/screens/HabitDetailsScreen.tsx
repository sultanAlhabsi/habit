import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { HabitHeatmap } from '../components/details/HabitHeatmap';
import { HabitStatGrid } from '../components/details/HabitStatGrid';
import { calculateHabitStats } from '../utils/habitUtils';

interface HabitDetailsScreenProps {
  route: any;
  navigation: any;
}

export const HabitDetailsScreen: React.FC<HabitDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, typography, touchTarget } = useTheme();
  const { habits, checkins, toggleCheckin, toggleHabitActive, deleteHabit } = useHabitStore();

  const habitId = route.params?.habitId;
  const habit = habits.find((h) => h.id === habitId);

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title="تفاصيل العادة" onBackPress={() => navigation.goBack()} />
        <View style={styles.notFoundCenter}>
          <Text style={[typography.body, { color: theme.textSecondary }]}>
            لم يتم العثور على العادة
          </Text>
        </View>
      </View>
    );
  }

  const todayStr = dayjs().format('YYYY-MM-DD');
  const isCompletedToday = checkins.some(
    (c) => c.habitId === habit.id && c.date === todayStr && c.completed
  );

  const completedDates = new Set(
    checkins
      .filter((c) => c.habitId === habit.id && c.completed)
      .map((c) => c.date)
  );

  const stats = calculateHabitStats(habit, checkins);

  const handleDeleteConfirm = () => {
    Alert.alert(
      'حذف العادة',
      `هل أنت متأكد من حذف عادة "${habit.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habit.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="التفاصيل"
        subtitle={habit.name}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تعديل العادة"
            onPress={() => navigation.navigate('AddEditHabit', { habitId: habit.id })}
            style={({ pressed }) => [
              styles.headerEditBtn,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="pencil-outline" size={20} color={theme.text} />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.base,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Habit Summary Card */}
        <Card style={[styles.heroCard, { marginBottom: spacing.base }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitles}>
              <Text style={[typography.h2, { color: theme.text, textAlign: 'right' }]}>
                {habit.name}
              </Text>
              {habit.description ? (
                <Text
                  style={[
                    typography.sub,
                    { color: theme.textSecondary, marginTop: 4, textAlign: 'right' },
                  ]}
                >
                  {habit.description}
                </Text>
              ) : null}

              <Text
                style={[
                  typography.caption,
                  { color: theme.textMuted, marginTop: 6, textAlign: 'right' },
                ]}
              >
                {habit.frequency === 'daily'
                  ? 'يوميًا'
                  : `أيام محددة (${habit.frequencyDays.length} أيام)`}
                {' • '}
                الهدف: {habit.targetCount} {habit.unit}
                {!habit.isActive && ' • متوقفة مؤقتًا'}
              </Text>
            </View>

            <View style={styles.heroIconSide}>
              <Ionicons
                name={(habit.icon as any) || 'ellipse-outline'}
                size={28}
                color={theme.text}
              />
            </View>
          </View>

          {/* Clean Today Check Toggle */}
          <View style={{ marginTop: spacing.md }}>
            <Button
              title={isCompletedToday ? 'مكتملة اليوم ✓' : 'تسجيل إنجاز اليوم'}
              variant={isCompletedToday ? 'outline' : 'primary'}
              onPress={() => toggleCheckin(habit.id, todayStr)}
            />
          </View>
        </Card>

        {/* 4 Stats Grid */}
        <HabitStatGrid stats={stats} habitColor={habit.color} />

        {/* Heatmap Calendar */}
        <HabitHeatmap
          completedDates={completedDates}
          habitColor={habit.color}
          onToggleDate={(dateStr) => toggleCheckin(habit.id, dateStr)}
        />

        {/* Quiet Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title={habit.isActive ? 'إيقاف مؤقت للعادة' : 'استئناف العادة'}
            variant="outline"
            onPress={() => toggleHabitActive(habit.id)}
            style={{ marginBottom: spacing.sm }}
          />

          <Button
            title="حذف العادة"
            variant="destructive"
            onPress={handleDeleteConfirm}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEditBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    padding: 16,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  heroTitles: {
    flex: 1,
    paddingLeft: 12,
  },
  heroIconSide: {
    paddingTop: 2,
  },
  actionsContainer: {
    marginTop: 4,
  },
});
