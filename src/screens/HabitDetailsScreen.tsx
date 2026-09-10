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
  const { theme, spacing, radius, typography, touchTarget } = useTheme();
  const { habits, checkins, toggleCheckin, toggleHabitActive, deleteHabit, archiveHabit } = useHabitStore();

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

  const isArchived = Boolean(habit.archivedAt);
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

  const handleArchiveConfirm = () => {
    Alert.alert(
      'أرشفة العادة',
      `هل تريد نقل عادة "${habit.name}" إلى الأرشيف؟ سيتم إيقاف التذكيرات مع الاحتفاظ بكافة السجلات والإحصائيات.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'أرشفة',
          onPress: async () => {
            await archiveHabit(habit.id, true);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    await archiveHabit(habit.id, false);
    Alert.alert('تمت الاستعادة', `تمت استعادة عادة "${habit.name}" إلى قائمتك اليومية.`);
  };

  const handleDeleteConfirm = () => {
    Alert.alert(
      'حذف العادة',
      `هل أنت متأكد من حذف عادة "${habit.name}" نهائيًا؟ سيتم حذف كافة السجلات التابعة لها ولا يمكن التراجع.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
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
        {/* Archived Banner if applicable */}
        {isArchived ? (
          <View
            style={[
              styles.archivedBanner,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: theme.border,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Ionicons name="archive-outline" size={18} color={theme.textSecondary} />
            <Text
              style={[
                typography.sub,
                { color: theme.textSecondary, marginRight: 8, flex: 1, textAlign: 'right' },
              ]}
            >
              هذه العادة في الأرشيف (تم إيقاف تذكيراتها اليومية)
            </Text>
          </View>
        ) : null}

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
                {isArchived ? ' • مؤرشفة' : !habit.isActive ? ' • متوقفة مؤقتًا' : ''}
              </Text>
            </View>

            <View style={styles.heroIconSide}>
              <View
                style={[
                  styles.heroIconBox,
                  {
                    backgroundColor: habit.color ? `${habit.color}18` : theme.cardSecondary,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Ionicons
                  name={(habit.icon as any) || 'ellipse-outline'}
                  size={26}
                  color={habit.color || theme.text}
                />
              </View>
            </View>
          </View>

          {/* Clean Today Check Toggle (if not archived) */}
          {!isArchived ? (
            <View style={{ marginTop: spacing.md }}>
              <Button
                title={isCompletedToday ? 'مكتملة اليوم ✓' : 'تسجيل إنجاز اليوم'}
                variant={isCompletedToday ? 'outline' : 'primary'}
                onPress={() => toggleCheckin(habit.id, todayStr)}
              />
            </View>
          ) : null}
        </Card>

        {/* 4 Stats Grid */}
        <HabitStatGrid stats={stats} habitColor={habit.color} unit={habit.unit} />

        {/* Heatmap Calendar */}
        <HabitHeatmap
          completedDates={completedDates}
          habitColor={habit.color}
          onToggleDate={(dateStr) => !isArchived && toggleCheckin(habit.id, dateStr)}
          readOnly={isArchived}
        />

        {/* Quiet Actions */}
        <View style={styles.actionsContainer}>
          {isArchived ? (
            <Button
              title="استعادة العادة من الأرشيف"
              variant="primary"
              onPress={handleRestore}
              style={{ marginBottom: spacing.sm }}
            />
          ) : (
            <>
              <Button
                title={habit.isActive ? 'إيقاف مؤقت للعادة' : 'استئناف العادة'}
                variant="outline"
                onPress={() => toggleHabitActive(habit.id)}
                style={{ marginBottom: spacing.sm }}
              />
              <Button
                title="أرشفة العادة"
                variant="outline"
                onPress={handleArchiveConfirm}
                style={{ marginBottom: spacing.sm }}
              />
            </>
          )}

          <Button
            title={isArchived ? 'حذف نهائي للعادة' : 'حذف العادة'}
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
  heroIconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    marginTop: 4,
  },
  archivedBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});

