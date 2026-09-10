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
}

interface BadgeListProps {
  totalHabits: number;
  bestStreak: number;
  totalCheckins: number;
  todayRate: number;
}

export const BadgeList: React.FC<BadgeListProps> = ({
  totalHabits,
  bestStreak,
  totalCheckins,
  todayRate,
}) => {
  const { theme, spacing, typography } = useTheme();

  const milestones: Milestone[] = [
    {
      id: 'first_habit',
      title: 'البداية',
      desc: 'إنشاء أول عادة في التطبيق',
      unlocked: totalHabits > 0,
    },
    {
      id: 'streak_3',
      title: '٣ أيام متتالية',
      desc: 'الالتزام بعادة لمدة 3 أيام متتالية',
      unlocked: bestStreak >= 3,
    },
    {
      id: 'perfect_day',
      title: 'يوم مكتمل',
      desc: 'إنجاز 100% من عادات اليوم',
      unlocked: todayRate === 100 && totalHabits > 0,
    },
    {
      id: 'streak_7',
      title: 'أسبوع كامل',
      desc: 'الاستمرار بعادة لمدة 7 أيام متتالية',
      unlocked: bestStreak >= 7,
    },
    {
      id: 'century_club',
      title: '٥٠ إنجاز',
      desc: 'تسجيل 50 إنجازًا إجماليًا',
      unlocked: totalCheckins >= 50,
    },
    {
      id: 'streak_30',
      title: 'شهر من الانضباط',
      desc: 'الاستمرار لمدة 30 يومًا متتالية',
      unlocked: bestStreak >= 30,
    },
  ];

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.xl }}>
      <View style={{ marginBottom: 12 }}>
        <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
          محطات الالتزام
        </Text>
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
                opacity: item.unlocked ? 1 : 0.45,
              },
            ]}
          >
            <View style={styles.textSide}>
              <Text style={[typography.subMedium, { color: theme.text, textAlign: 'right' }]}>
                {item.title}
              </Text>
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
  iconSide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
