import React from 'react';
import {View, StyleSheet} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { toArabicNumerals, formatArabicCount } from '../../utils/habitUtils';

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

export const BadgeList: React.FC<BadgeListProps> = React.memo(({
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
      progressText: totalHabits > 0 ? 'مكتمل' : `${toArabicNumerals(Math.min(1, totalHabits))}/١ عادة`,
    },
    {
      id: 'first_checkin',
      title: 'الخطوة الأولى',
      desc: 'تسجيل أول إنجاز لعادة',
      unlocked: totalCheckins >= 1,
      progressText: totalCheckins >= 1 ? 'مكتمل' : `${toArabicNumerals(Math.min(1, totalCheckins))}/١ إنجاز`,
    },
    {
      id: 'streak_3',
      title: '٣ أيام متتالية',
      desc: 'الالتزام بعادة لمدة ٣ أيام متتالية',
      unlocked: bestStreak >= 3,
      progressText: bestStreak >= 3 ? 'مكتمل' : `${toArabicNumerals(Math.min(3, bestStreak))}/٣ أيام`,
    },
    {
      id: 'perfect_day',
      title: 'يوم مكتمل',
      desc: 'إنجاز ١٠٠٪ من عادات اليوم المجدولة',
      unlocked: hasEverHadPerfectDay || (todayRate === 100 && totalHabits > 0),
      progressText:
        hasEverHadPerfectDay || (todayRate === 100 && totalHabits > 0)
          ? 'مكتمل'
          : 'في الانتظار',
    },
    {
      id: 'streak_7',
      title: 'أسبوع كامل',
      desc: 'الاستمرار بعادة لمدة ٧ أيام متتالية',
      unlocked: bestStreak >= 7,
      progressText: bestStreak >= 7 ? 'مكتمل' : `${toArabicNumerals(Math.min(7, bestStreak))}/٧ أيام`,
    },
    {
      id: 'checkins_50',
      title: '٥٠ إنجاز',
      desc: 'تسجيل ٥٠ إنجازًا إجماليًا',
      unlocked: totalCheckins >= 50,
      progressText:
        totalCheckins >= 50 ? 'مكتمل' : `${toArabicNumerals(Math.min(50, totalCheckins))}/٥٠ إنجاز`,
    },
    {
      id: 'streak_30',
      title: 'شهر من الانضباط',
      desc: 'الاستمرار لمدة ٣٠ يومًا متتالية',
      unlocked: bestStreak >= 30,
      progressText:
        bestStreak >= 30 ? 'مكتمل' : `${toArabicNumerals(Math.min(30, bestStreak))}/٣٠ يوم`,
    },
    {
      id: 'streak_66',
      title: 'العادة التلقائية',
      desc: 'الاستمرار لمدة ٦٦ يومًا وتثبيت المسار العصبي',
      unlocked: bestStreak >= 66,
      progressText:
        bestStreak >= 66 ? 'مكتمل' : `${toArabicNumerals(Math.min(66, bestStreak))}/٦٦ يوم`,
    },
    {
      id: 'century_club',
      title: 'نادي المئة',
      desc: 'تسجيل ١٠٠ إنجاز إجمالي في التطبيق',
      unlocked: totalCheckins >= 100,
      progressText:
        totalCheckins >= 100 ? 'مكتمل' : `${toArabicNumerals(Math.min(100, totalCheckins))}/١٠٠ إنجاز`,
    },
    {
      id: 'checkins_200',
      title: 'سيد العادات',
      desc: 'تسجيل ٢٠٠ إنجاز إجمالي في التطبيق',
      unlocked: totalCheckins >= 200,
      progressText:
        totalCheckins >= 200 ? 'مكتمل' : `${toArabicNumerals(Math.min(200, totalCheckins))}/٢٠٠ إنجاز`,
    },
    {
      id: 'streak_365',
      title: 'سنة التميز',
      desc: 'الاستمرار لمدة عام كامل (٣٦٥ يومًا) متتالية',
      unlocked: bestStreak >= 365,
      progressText:
        bestStreak >= 365 ? 'مكتمل' : `${toArabicNumerals(Math.min(365, bestStreak))}/٣٦٥ يوم`,
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
            {toArabicNumerals(unlockedCount)} من {formatArabicCount(milestones.length, 'محطة', 'محطتان', 'محطات', 'محطة')}
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
});

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
