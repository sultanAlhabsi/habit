import React, { useMemo } from 'react';
import {View, StyleSheet} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitCheckin } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';
import { calculateCategoryAnalytics, formatArabicCount, toArabicNumerals } from '../../utils/habitUtils';

interface CategoryPerformanceCardProps {
  habits: Habit[];
  checkins: HabitCheckin[];
}

export const CategoryPerformanceCard: React.FC<CategoryPerformanceCardProps> = React.memo(({
  habits,
  checkins,
}) => {
  const { theme, radius, spacing, typography } = useTheme();
  const analytics = useMemo(
    () => calculateCategoryAnalytics(habits, checkins),
    [habits, checkins]
  );

  const activeCategoriesCount = useMemo(
    () => analytics.categories.filter((c) => c.activeHabits > 0).length,
    [analytics.categories]
  );

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleSide}>
          <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
            توازن مجالات الحياة
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, textAlign: 'right' }]}>
            توزيع العادات ونسبة الالتزام حسب المجال
          </Text>
        </View>

        {activeCategoriesCount > 0 && (
          <View
            style={[
              styles.scoreBadge,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: theme.border,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Ionicons name="scale-outline" size={13} color={theme.primary} style={{ marginLeft: 4 }} />
            <Text style={[typography.caption, { color: theme.text, fontWeight: '600' }]}>
              توازن: {toArabicNumerals(analytics.balanceScore)}٪
            </Text>
          </View>
        )}
      </View>

      {/* Insight Box */}
      {analytics.insightMessage ? (
        <View
          style={[
            styles.insightBox,
            {
              backgroundColor: theme.cardSecondary,
              borderColor: theme.border,
              borderRadius: radius.md,
              marginTop: spacing.sm,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Ionicons
            name="bulb-outline"
            size={18}
            color={theme.primary}
            style={{ marginLeft: 8, marginTop: 2 }}
          />
          <Text
            style={[
              typography.caption,
              {
                color: theme.text,
                flex: 1,
                textAlign: 'right',
                lineHeight: 18,
              },
            ]}
          >
            {analytics.insightMessage}
          </Text>
        </View>
      ) : null}

      {/* Category List */}
      <View style={styles.categoryList}>
        {analytics.categories.map((item, index) => {
          const hasHabits = item.activeHabits > 0;
          const isLast = index === analytics.categories.length - 1;

          return (
            <View
              key={item.category}
              style={[
                styles.categoryRow,
                {
                  borderBottomColor: theme.borderSubtle,
                  borderBottomWidth: isLast ? 0 : 1,
                  paddingBottom: isLast ? 0 : spacing.sm,
                  marginBottom: isLast ? 0 : spacing.sm,
                },
              ]}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryMetaRight}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: `${item.color}18`,
                        borderRadius: radius.sm,
                      },
                    ]}
                  >
                    <Ionicons name={item.iconName as any} size={16} color={item.color} />
                  </View>

                  <View>
                    <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                      {item.category}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', fontSize: 11 }]}>
                      {hasHabits
                        ? formatArabicCount(
                            item.activeHabits,
                            'عادة نشطة واحدة',
                            'عادتان نشطتان',
                            'عادات نشطة',
                            'عادة نشطة'
                          )
                        : 'لا توجد عادات حالياً'}
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryRateLeft}>
                  {hasHabits ? (
                    <View style={styles.rateGroup}>
                      <Text style={[typography.subMedium, { color: item.color, fontWeight: '700' }]}>
                        {toArabicNumerals(item.completionRate)}٪
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10, marginTop: 1 }]}>
                        ({toArabicNumerals(item.totalCheckins)} إنجاز)
                      </Text>
                    </View>
                  ) : (
                    <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                      —
                    </Text>
                  )}
                </View>
              </View>

              {/* Progress bar */}
              {hasHabits && (
                <View style={{ marginTop: 8 }}>
                  <ProgressBar
                    progress={item.completionRate}
                    height={5}
                    color={item.color}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSide: {
    flex: 1,
  },
  scoreBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  insightBox: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    padding: 10,
    borderWidth: 1,
  },
  categoryList: {
    width: '100%',
  },
  categoryRow: {
    width: '100%',
  },
  categoryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryMetaRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRateLeft: {
    alignItems: 'flex-start',
  },
  rateGroup: {
    alignItems: 'flex-start',
  },
});
