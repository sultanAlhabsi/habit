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
import { ProgressBar } from '../components/common/ProgressBar';
import { HabitHeatmap } from '../components/details/HabitHeatmap';
import { HabitStatGrid } from '../components/details/HabitStatGrid';
import {
  calculateHabitStats,
  getHabitCategory,
  getHabitStreakStatus,
} from '../utils/habitUtils';

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
  const {
    habits,
    checkins,
    toggleCheckin,
    incrementCheckin,
    decrementCheckin,
    toggleHabitActive,
    deleteHabit,
    archiveHabit,
    restoreHabit,
  } = useHabitStore();

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
  const todayCheckin = checkins.find(
    (c) => c.habitId === habit.id && c.date === todayStr
  );
  const todayCount = todayCheckin ? todayCheckin.count : 0;
  const isCompletedToday = Boolean(todayCheckin?.completed);

  const completedDates = new Set(
    checkins
      .filter((c) => c.habitId === habit.id && c.completed)
      .map((c) => c.date)
  );

  const stats = calculateHabitStats(habit, checkins);
  const category = getHabitCategory(habit.icon);
  const streakStatus = getHabitStreakStatus(habit, checkins, todayStr);

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
    await restoreHabit(habit.id);
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
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={[typography.h2, { color: theme.text, textAlign: 'right' }]}>
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
                  <Text style={[typography.caption, { color: theme.textSecondary, fontSize: 11, fontWeight: '600' }]}>
                    {category}
                  </Text>
                </View>
              </View>
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
            habit.targetCount > 1 ? (
              <View
                style={{
                  marginTop: spacing.md,
                  paddingTop: spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <Text style={[typography.subMedium, { color: theme.text }]}>
                    إنجاز اليوم
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isCompletedToday ? theme.primary : theme.textSecondary,
                        fontWeight: isCompletedToday ? '700' : '500',
                      },
                    ]}
                  >
                    {todayCount} من {habit.targetCount} {habit.unit} (
                    {Math.min(100, Math.round((todayCount / habit.targetCount) * 100))}%)
                  </Text>
                </View>

                <View style={{ marginBottom: spacing.sm }}>
                  <ProgressBar
                    progress={Math.min(100, Math.round((todayCount / habit.targetCount) * 100))}
                    height={5}
                    color={isCompletedToday ? theme.primary : theme.text}
                  />
                </View>

                <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={isCompletedToday ? 'مكتملة بالكامل ✓' : 'إكمال العادة الآن'}
                      variant={isCompletedToday ? 'outline' : 'primary'}
                      onPress={() => toggleCheckin(habit.id, todayStr)}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      marginRight: 8,
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="زيادة إنجاز اليوم"
                      onPress={() => incrementCheckin(habit.id, todayStr)}
                      style={({ pressed }) => [
                        styles.stepperBtn,
                        {
                          backgroundColor: theme.cardSecondary,
                          borderColor: theme.border,
                          opacity: pressed ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="add" size={20} color={theme.text} />
                    </Pressable>

                    <Pressable
                      disabled={todayCount <= 0}
                      accessibilityRole="button"
                      accessibilityLabel="إنقاص إنجاز اليوم"
                      onPress={() => decrementCheckin(habit.id, todayStr)}
                      style={({ pressed }) => [
                        styles.stepperBtn,
                        {
                          backgroundColor: theme.cardSecondary,
                          borderColor: theme.border,
                          marginRight: 6,
                          opacity: todayCount <= 0 ? 0.3 : pressed ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="remove" size={20} color={theme.text} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: spacing.md }}>
                <Button
                  title={isCompletedToday ? 'مكتملة اليوم ✓' : 'تسجيل إنجاز اليوم'}
                  variant={isCompletedToday ? 'outline' : 'primary'}
                  onPress={() => toggleCheckin(habit.id, todayStr)}
                />
              </View>
            )
          ) : null}

          {!isArchived && (
            <View
              style={[
                styles.streakStatusCard,
                {
                  backgroundColor:
                    streakStatus.status === 'completed'
                      ? theme.primaryLight
                      : theme.cardSecondary,
                  borderColor:
                    streakStatus.status === 'completed'
                      ? theme.primary
                      : theme.border,
                  borderRadius: radius.md,
                  marginTop: spacing.md,
                },
              ]}
            >
              <Ionicons
                name={streakStatus.iconName as any}
                size={18}
                color={
                  streakStatus.status === 'completed'
                    ? theme.primary
                    : theme.textSecondary
                }
                style={{ marginLeft: 8 }}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color:
                      streakStatus.status === 'completed'
                        ? theme.primary
                        : theme.textSecondary,
                    fontWeight: '600',
                    flex: 1,
                    textAlign: 'right',
                  },
                ]}
              >
                {streakStatus.message}
              </Text>
            </View>
          )}
        </Card>

        {/* 4 Stats Grid */}
        <HabitStatGrid stats={stats} habitColor={habit.color} unit={habit.unit} />

        {/* Heatmap Calendar */}
        <HabitHeatmap
          completedDates={completedDates}
          habitColor={habit.color}
          createdAt={habit.createdAt}
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
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  streakStatusCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
});

