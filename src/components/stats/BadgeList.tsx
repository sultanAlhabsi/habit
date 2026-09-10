import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';

interface Milestone {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  progressText: string;
}

interface BadgeListProps {
  totalHabits: number;
  bestStreak: number;
  totalCheckins: number;
  todayRate: number;
  hasEverHadPerfectDay?: boolean;
}

export const BadgeList: React.FC<BadgeListProps> = ({
  totalHabits,
  bestStreak,
  totalCheckins,
  todayRate,
  hasEverHadPerfectDay = false,
}) => {
  const { theme, radius, spacing, typography } = useTheme();

  const milestones: Milestone[] = [
    {
      id: 'first_habit',
      title: 'البداية',
      desc: 'إنشاء أول عادة في التطبيق',
      unlocked: totalHabits > 0,
      progressText: totalHabits > 0 ? 'مكتمل' : '٠/١ عادة',
    },
    {
      id: 'first_checkin',
      title: 'الخطوة الأولى',
      desc: 'تسجيل أول إنجاز لعادة',
      unlocked: totalCheckins >= 1,
      progressText: totalCheckins >= 1 ? 'مكتمل' : '٠/١ إنجاز',
    },
    {
      id: 'streak_3',
      title: '٣ أيام متتالية',
      desc: 'الالتزام بعادة لمدة 3 أيام متتالية',
      unlocked: bestStreak >= 3,
      progressText: bestStreak >= 3 ? 'مكتمل' : `${bestStreak}/٣ أيام`,
    },
    {
      id: 'perfect_day',
      title: 'يوم مكتمل',
      desc: 'إنجاز 100% من عادات اليوم المجدولة',
      unlocked: hasEverHadPerfectDay || (todayRate === 100 && totalHabits > 0),
      progressText:
        hasEverHadPerfectDay || (todayRate === 100 && totalHabits > 0)
          ? 'مكتمل'
          : 'في الانتظار',
    },
    {
      id: 'streak_7',
      title: 'أسبوع كامل',
      desc: 'الاستمرار بعادة لمدة 7 أيام متتالية',
      unlocked: bestStreak >= 7,
      progressText: bestStreak >= 7 ? 'مكتمل' : `${Math.min(7, bestStreak)}/٧ أيام`,
    },
    {
      id: 'checkins_50',
      title: '٥٠ إنجاز',
      desc: 'تسجيل 50 إنجازًا إجماليًا',
      unlocked: totalCheckins >= 50,
      progressText:
        totalCheckins >= 50 ? 'مكتمل' : `${Math.min(50, totalCheckins)}/٥٠ إنجاز`,
    },
    {
      id: 'streak_30',
      title: 'شهر من الانضباط',
      desc: 'الاستمرار لمدة 30 يومًا متتالية',
      unlocked: bestStreak >= 30,
      progressText:
        bestStreak >= 30 ? 'مكتمل' : `${Math.min(30, bestStreak)}/٣٠ يوم`,
    },
    {
      id: 'century_club',
      title: 'نادي المئة',
      desc: 'تسجيل 100 إنجاز إجمالي في التطبيق',
      unlocked: totalCheckins >= 100,
      progressText:
        totalCheckins >= 100 ? 'مكتمل' : `${Math.min(100, totalCheckins)}/١٠٠ إنجاز`,
    },
  ];

  const unlockedCount = milestones.filter((m) => m.unlocked).length;

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.xl }}>
      <View style={styles.headerRow}>
        <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
          محطات الالتزام
        </Text>
        <View
          style={[
            styles.counterBadge,
            {
              backgroundColor: theme.cardSecondary,
              borderColor: theme.border,
              borderRadius: radius.full,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              { color: theme.primary, fontWeight: '600', fontSize: 11 },
            ]}
          >
            {unlockedCount} من {milestones.length} محطات
          </Text>
        </View>
      </View>

      <View>
        {milestones.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.row,
              {
                borderBottomWidth: index < milestones.length - 1 ? 1 : 0,
                borderColor: theme.border,
                opacity: item.unlocked ? 1 : 0.6,
              },
            ]}
          >
            <View style={styles.textSide}>
              <View style={styles.titleLine}>
                <Text style={[typography.subMedium, { color: theme.text, textAlign: 'right' }]}>
                  {item.title}
                </Text>
                {!item.unlocked && (
                  <Text
                    style={[
                      typography.caption,
                      { color: theme.textMuted, fontSize: 11, marginLeft: 8 },
                    ]}
                  >
                    {item.progressText}
                  </Text>
                )}
              </View>
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, textAlign: 'right' }]}>
                {item.desc}
              </Text>
            </View>

            <View style={styles.iconSide}>
              <Ionicons
                name={item.unlocked ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={item.unlocked ? theme.primary : theme.textMuted}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  counterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  textSide: {
    flex: 1,
    paddingLeft: 12,
  },
  titleLine: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconSide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
