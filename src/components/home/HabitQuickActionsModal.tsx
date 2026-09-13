import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { formatArabicStreakDays, getHabitCategory } from '../../utils/habitUtils';

export interface HabitQuickActionsModalProps {
  visible: boolean;
  habit: Habit | null;
  selectedDate: string;
  isCompleted: boolean;
  isStreakAtRisk: boolean;
  streak: number;
  hasNote: boolean;
  isFutureDate?: boolean;
  onClose: () => void;
  onToggleCheckin: () => void;
  onTogglePin: () => void;
  onToggleActive: () => void;
  onOpenNote: () => void;
  onShare: () => void;
  onEditHabit: () => void;
  onViewDetails: () => void;
}

export const HabitQuickActionsModal: React.FC<HabitQuickActionsModalProps> = ({
  visible,
  habit,
  isCompleted,
  isStreakAtRisk,
  streak,
  hasNote,
  isFutureDate = false,
  onClose,
  onToggleCheckin,
  onTogglePin,
  onToggleActive,
  onOpenNote,
  onShare,
  onEditHabit,
  onViewDetails,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();

  if (!habit) return null;

  const category = getHabitCategory(habit.icon);

  const actions = [
    {
      id: 'checkin',
      icon: isCompleted ? 'close-circle-outline' : 'checkmark-circle-outline',
      title: isCompleted ? 'إلغاء إنجاز اليوم' : 'تسجيل إنجاز اليوم',
      subtitle: isCompleted
        ? 'إعادة العادة إلى قائمة المهام المتبقية'
        : 'توثيق إتمام العادة لليوم بنجاح',
      color: isCompleted ? theme.textSecondary : theme.primary,
      disabled: isFutureDate,
      onPress: () => {
        onToggleCheckin();
        onClose();
      },
    },
    {
      id: 'pin',
      icon: habit.isPinned ? 'pin' : 'pin-outline',
      title: habit.isPinned ? 'إلغاء التثبيت من البداية' : 'تثبيت في أعلى القائمة',
      subtitle: habit.isPinned
        ? 'إلغاء تثبيت العادة في مقدمة القائمة'
        : 'إبراز العادة لتظهر دائماً أولاً في الرئيسية',
      color: habit.isPinned ? '#E67E22' : theme.text,
      onPress: () => {
        onTogglePin();
        onClose();
      },
    },
    {
      id: 'note',
      icon: hasNote ? 'chatbox-ellipses' : 'chatbox-ellipses-outline',
      title: hasNote ? 'تعديل خاطرة وملاحظة اليوم' : 'تدوين خاطرة أو ملاحظة',
      subtitle: 'سجل انطباعاتك وتفاصيل تجربتك اليومية',
      color: theme.text,
      onPress: () => {
        onClose();
        setTimeout(onOpenNote, 150);
      },
    },
    {
      id: 'share',
      icon: 'share-social-outline',
      title: 'مشاركة إنجاز العادة',
      subtitle: 'نص ملهم بمعدل التزامك وسلسلتك الحالية',
      color: theme.text,
      onPress: () => {
        onClose();
        setTimeout(onShare, 150);
      },
    },
    {
      id: 'active',
      icon: habit.isActive ? 'pause-circle-outline' : 'play-circle-outline',
      title: habit.isActive ? 'إيقاف العادة مؤقتاً' : 'استئناف وتفعيل العادة',
      subtitle: habit.isActive
        ? 'تجميد التنبيهات مع الاحتفاظ بكافة السجلات'
        : 'إعادة إدراج العادة في المهام المجدولة',
      color: habit.isActive ? theme.textSecondary : theme.primary,
      onPress: () => {
        onToggleActive();
        onClose();
      },
    },
    {
      id: 'edit',
      icon: 'create-outline',
      title: 'تعديل بيانات العادة',
      subtitle: 'تعديل الاسم أو الهدف أو الألوان أو وقت التنبيه',
      color: theme.text,
      onPress: () => {
        onClose();
        setTimeout(onEditHabit, 150);
      },
    },
    {
      id: 'details',
      icon: 'stats-chart-outline',
      title: 'عرض الإحصائيات وسجل التاريخ',
      subtitle: 'الرسوم البيانية وتاريخ الأيام والخواطر',
      color: theme.primary,
      onPress: () => {
        onClose();
        setTimeout(onViewDetails, 150);
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.habitMeta}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: habit.color ? `${habit.color}18` : theme.cardSecondary,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Ionicons
                  name={(habit.icon as any) || 'ellipse-outline'}
                  size={20}
                  color={habit.color || theme.text}
                />
              </View>

              <View style={styles.titlesBox}>
                <View style={styles.nameRow}>
                  <Text
                    numberOfLines={1}
                    style={[typography.h3, { color: theme.text, textAlign: 'right' }]}
                  >
                    {habit.name}
                  </Text>
                  {habit.isPinned && (
                    <View
                      style={[
                        styles.pinnedPill,
                        {
                          backgroundColor: theme.cardSecondary,
                          borderColor: theme.border,
                          borderRadius: radius.full,
                        },
                      ]}
                    >
                      <Ionicons name="pin" size={10} color={theme.text} />
                    </View>
                  )}
                </View>

                <View style={styles.subMetaRow}>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {category}
                  </Text>

                  {streak > 0 && (
                    <View style={styles.streakBadge}>
                      <Ionicons
                        name="flame"
                        size={11}
                        color={isStreakAtRisk ? '#E67E22' : habit.color || theme.primary}
                        style={{ marginLeft: 2 }}
                      />
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isStreakAtRisk ? '#E67E22' : theme.textSecondary,
                            fontWeight: isStreakAtRisk ? '700' : '500',
                          },
                        ]}
                      >
                        {formatArabicStreakDays(streak)}
                      </Text>
                      {isStreakAtRisk && (
                        <Text style={[typography.caption, { color: '#E67E22', fontWeight: '700', marginRight: 4 }]}>
                          (مهددة 🔥)
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق قائمة الإجراءات"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  minWidth: touchTarget,
                  minHeight: touchTarget,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>

          {/* Quick Actions List */}
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={styles.actionsScroll}
          >
            {actions.map((action, index) => {
              const isLast = index === actions.length - 1;

              return (
                <Pressable
                  key={action.id}
                  disabled={action.disabled}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    styles.actionItem,
                    {
                      borderBottomColor: theme.borderSubtle,
                      borderBottomWidth: isLast ? 0 : 1,
                      backgroundColor: pressed ? theme.cardSecondary : 'transparent',
                      borderRadius: radius.md,
                      opacity: action.disabled ? 0.35 : pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.actionIconCircle,
                      {
                        backgroundColor: `${action.color}15`,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <Ionicons name={action.icon as any} size={18} color={action.color} />
                  </View>

                  <View style={styles.actionTextCol}>
                    <Text
                      style={[
                        typography.subMedium,
                        {
                          color: action.color,
                          textAlign: 'right',
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {action.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        typography.caption,
                        {
                          color: theme.textMuted,
                          textAlign: 'right',
                          fontSize: 11,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {action.subtitle}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-back"
                    size={15}
                    color={theme.textMuted}
                    style={{ opacity: 0.5 }}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: 8,
  },
  habitMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  titlesBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  pinnedPill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    marginRight: 4,
  },
  subMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginRight: 6,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsScroll: {
    maxHeight: 400,
  },
  actionItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 1,
  },
  actionIconCircle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  actionTextCol: {
    flex: 1,
  },
});
