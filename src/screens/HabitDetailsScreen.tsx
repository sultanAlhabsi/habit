import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Share,
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
import { StreakMilestoneCard } from '../components/details/StreakMilestoneCard';
import { HabitConsistencyCard } from '../components/details/HabitConsistencyCard';
import { HabitNotesSection } from '../components/details/HabitNotesSection';
import {
  calculateHabitStats,
  getHabitCategory,
  getHabitStreakStatus,
  calculateStreakMilestone,
  calculateHabitConsistencyPattern,
  formatHabitStatsForShare,
  getHabitCheckinNotes,
  formatArabicDate,
  exportSingleHabitToCsv,
} from '../utils/habitUtils';
import { exportCsvViaShare } from '../services/backupService';

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
    updateCheckinNote,
    deleteCheckinNote,
    toggleHabitActive,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    togglePinHabit,
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
  const initialDate = route.params?.date as string | undefined;
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate && dayjs(initialDate).isValid() ? initialDate : todayStr
  );
  const isViewingToday = selectedDate === todayStr;

  const activeCheckin = checkins.find(
    (c) => c.habitId === habit.id && c.date === selectedDate
  );
  const activeCount = activeCheckin ? activeCheckin.count : 0;
  const isCompletedOnDate = Boolean(activeCheckin?.completed);

  const completedDates = new Set(
    checkins
      .filter((c) => c.habitId === habit.id && c.completed)
      .map((c) => c.date)
  );

  const stats = calculateHabitStats(habit, checkins);
  const category = getHabitCategory(habit.icon);
  const streakStatus = getHabitStreakStatus(habit, checkins, selectedDate);
  const milestoneInfo = calculateStreakMilestone(stats.currentStreak);
  const consistencyPattern = calculateHabitConsistencyPattern(habit, checkins, todayStr);
  const allHabitNotes = getHabitCheckinNotes(checkins, habit.id);

  const handleShare = async () => {
    try {
      const latestNote = allHabitNotes.length > 0 ? allHabitNotes[0].note : undefined;
      const shareMessage = formatHabitStatsForShare(habit, stats, milestoneInfo, latestNote);
      await Share.share({ message: shareMessage });
    } catch {
      // Gracefully handle dismissed share dialog
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = exportSingleHabitToCsv(habit, checkins);
      const success = await exportCsvViaShare(csv, `سجل عادة - ${habit.name}`);
      if (!success) {
        Alert.alert('تنبيه', 'تعذر فتح نافذة مشاركة الملف، يرجى المحاولة لاحقًا.');
      }
    } catch {
      Alert.alert('خطأ', 'حدث خطأ أثناء إعداد ملف التصدير.');
    }
  };

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
          <View style={styles.headerRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={habit.isPinned ? 'إلغاء تثبيت العادة' : 'تثبيت العادة في البداية'}
              onPress={() => togglePinHabit(habit.id)}
              style={({ pressed }) => [
                styles.headerActionBtn,
                {
                  minWidth: touchTarget,
                  minHeight: touchTarget,
                  opacity: pressed ? 0.6 : 1,
                  marginLeft: 4,
                },
              ]}
            >
              <Ionicons
                name={habit.isPinned ? 'pin' : 'pin-outline'}
                size={20}
                color={habit.isPinned ? theme.primary : theme.text}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="مشاركة إنجاز العادة"
              onPress={handleShare}
              style={({ pressed }) => [
                styles.headerActionBtn,
                {
                  minWidth: touchTarget,
                  minHeight: touchTarget,
                  opacity: pressed ? 0.6 : 1,
                  marginLeft: 4,
                },
              ]}
            >
              <Ionicons name="share-social-outline" size={20} color={theme.text} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تعديل العادة"
              onPress={() => navigation.navigate('AddEditHabit', { habitId: habit.id })}
              style={({ pressed }) => [
                styles.headerActionBtn,
                {
                  minWidth: touchTarget,
                  minHeight: touchTarget,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons name="pencil-outline" size={20} color={theme.text} />
            </Pressable>
          </View>
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

          {/* Date Viewing Indicator (when inspecting past date) */}
          {!isViewingToday && (
            <View
              style={[
                styles.dateViewingBadge,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                <Text
                  style={[
                    typography.caption,
                    { color: theme.text, marginRight: 6, fontWeight: '600' },
                  ]}
                >
                  سجل تاريخ: {formatArabicDate(selectedDate)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="العودة لتاريخ اليوم"
                onPress={() => setSelectedDate(todayStr)}
                style={({ pressed }) => [
                  styles.returnTodayBtn,
                  {
                    backgroundColor: theme.primaryLight,
                    borderRadius: radius.sm,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    { color: theme.primary, fontWeight: '600', fontSize: 11 },
                  ]}
                >
                  العودة لتاريخ اليوم
                </Text>
              </Pressable>
            </View>
          )}

          {/* Clean Date Check Toggle (if not archived) */}
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
                    {isViewingToday ? 'إنجاز اليوم' : `إنجاز ${formatArabicDate(selectedDate)}`}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isCompletedOnDate ? theme.primary : theme.textSecondary,
                        fontWeight: isCompletedOnDate ? '700' : '500',
                      },
                    ]}
                  >
                    {activeCount} من {habit.targetCount} {habit.unit} (
                    {Math.min(100, Math.round((activeCount / habit.targetCount) * 100))}%)
                  </Text>
                </View>

                <View style={{ marginBottom: spacing.sm }}>
                  <ProgressBar
                    progress={Math.min(100, Math.round((activeCount / habit.targetCount) * 100))}
                    height={5}
                    color={isCompletedOnDate ? theme.primary : theme.text}
                  />
                </View>

                <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={isCompletedOnDate ? 'مكتملة بالكامل' : 'إكمال العادة الآن'}
                      iconName={isCompletedOnDate ? 'checkmark-circle' : 'checkmark-outline'}
                      variant={isCompletedOnDate ? 'outline' : 'primary'}
                      onPress={() => toggleCheckin(habit.id, selectedDate)}
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
                      accessibilityLabel="زيادة إنجاز التاريخ المحدد"
                      onPress={() => incrementCheckin(habit.id, selectedDate)}
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
                      disabled={activeCount <= 0}
                      accessibilityRole="button"
                      accessibilityLabel="إنقاص إنجاز التاريخ المحدد"
                      onPress={() => decrementCheckin(habit.id, selectedDate)}
                      style={({ pressed }) => [
                        styles.stepperBtn,
                        {
                          backgroundColor: theme.cardSecondary,
                          borderColor: theme.border,
                          marginRight: 6,
                          opacity: activeCount <= 0 ? 0.3 : pressed ? 0.6 : 1,
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
                  title={
                    isCompletedOnDate
                      ? isViewingToday
                        ? 'مكتملة اليوم'
                        : 'مكتملة بهذا التاريخ'
                      : isViewingToday
                      ? 'تسجيل إنجاز اليوم'
                      : 'تسجيل إنجاز لهذا التاريخ'
                  }
                  iconName={isCompletedOnDate ? 'checkmark-circle' : 'checkmark-outline'}
                  variant={isCompletedOnDate ? 'outline' : 'primary'}
                  onPress={() => toggleCheckin(habit.id, selectedDate)}
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

        {/* Behavioral Psychology Streak Milestone Tier */}
        <StreakMilestoneCard milestoneInfo={milestoneInfo} habitColor={habit.color} />

        {/* Daily Reflection Notes & Habit Diary */}
        <HabitNotesSection
          habit={habit}
          selectedDate={selectedDate}
          currentCheckin={activeCheckin}
          allNotes={allHabitNotes}
          onSaveNote={async (date, note) => {
            await updateCheckinNote(habit.id, date, note);
          }}
          onDeleteNote={async (date) => {
            await deleteCheckinNote(habit.id, date);
          }}
        />

        {/* Day-of-Week Consistency Pattern */}
        <HabitConsistencyCard
          consistencyPattern={consistencyPattern}
          habitColor={habit.color}
        />

        {/* Heatmap Calendar */}
        <HabitHeatmap
          completedDates={completedDates}
          habitColor={habit.color}
          createdAt={habit.createdAt}
          selectedDate={selectedDate}
          onSelectDate={(dateStr) => {
            if (selectedDate === dateStr) {
              if (!isArchived) {
                toggleCheckin(habit.id, dateStr);
              }
            } else {
              setSelectedDate(dateStr);
            }
          }}
          onToggleDate={(dateStr) => {
            if (!isArchived) {
              setSelectedDate(dateStr);
              toggleCheckin(habit.id, dateStr);
            }
          }}
          readOnly={isArchived}
        />

        {/* Quiet Actions */}
        <View style={styles.actionsContainer}>
          {isArchived ? (
            <>
              <Button
                title="استعادة العادة من الأرشيف"
                iconName="arrow-undo-outline"
                variant="primary"
                onPress={handleRestore}
                style={{ marginBottom: spacing.sm }}
              />
              <Button
                title="نسخ كعادة جديدة نشطة"
                iconName="copy-outline"
                variant="outline"
                onPress={() => navigation.navigate('AddEditHabit', { duplicateFromId: habit.id })}
                style={{ marginBottom: spacing.sm }}
              />
            </>
          ) : (
            <>
              <Button
                title={habit.isPinned ? 'إلغاء تثبيت العادة' : 'تثبيت العادة في البداية'}
                iconName={habit.isPinned ? 'pin-outline' : 'pin'}
                variant="outline"
                onPress={() => togglePinHabit(habit.id)}
                style={{ marginBottom: spacing.sm }}
              />
              <Button
                title="تكرار العادة كعادة جديدة"
                iconName="copy-outline"
                variant="outline"
                onPress={() => navigation.navigate('AddEditHabit', { duplicateFromId: habit.id })}
                style={{ marginBottom: spacing.sm }}
              />
              <Button
                title={habit.isActive ? 'إيقاف مؤقت للعادة' : 'استئناف العادة'}
                iconName={habit.isActive ? 'pause-outline' : 'play-outline'}
                variant="outline"
                onPress={() => toggleHabitActive(habit.id)}
                style={{ marginBottom: spacing.sm }}
              />
              <Button
                title="أرشفة العادة"
                iconName="archive-outline"
                variant="outline"
                onPress={handleArchiveConfirm}
                style={{ marginBottom: spacing.sm }}
              />
            </>
          )}

          <Button
            title="تصدير سجل العادة والملاحظات (CSV)"
            iconName="download-outline"
            variant="outline"
            onPress={handleExportCsv}
            style={{ marginBottom: spacing.sm }}
          />

          <Button
            title={isArchived ? 'حذف نهائي للعادة' : 'حذف العادة'}
            iconName="trash-outline"
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
  headerRightActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  headerActionBtn: {
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
  dateViewingBadge: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  returnTodayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});

