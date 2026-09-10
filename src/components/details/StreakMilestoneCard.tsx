import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import type { StreakMilestoneInfo } from '../../types/habit';

interface StreakMilestoneCardProps {
  milestoneInfo: StreakMilestoneInfo;
  habitColor?: string;
}

export const StreakMilestoneCard: React.FC<StreakMilestoneCardProps> = ({
  milestoneInfo,
  habitColor,
}) => {
  const { theme, radius, spacing, typography } = useTheme();
  const accentColor = habitColor || theme.primary;

  const { currentTier, nextMilestone, progressPercent, isTopTier, currentStreak } = milestoneInfo;

  return (
    <Card style={[styles.container, { marginBottom: spacing.base }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: `${accentColor}18`,
                borderRadius: radius.md,
              },
            ]}
          >
            <Ionicons
              name={(currentTier.icon as any) || 'flame-outline'}
              size={20}
              color={accentColor}
            />
          </View>
          <View style={styles.headerTitles}>
            <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
              محطة بناء العادة
            </Text>
            <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right' }]}>
              {currentTier.name} ({currentTier.days} {currentTier.days === 1 ? 'يوم' : 'أيام'})
            </Text>
          </View>
        </View>

        {/* Current streak pill */}
        <View
          style={[
            styles.streakBadge,
            {
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}40`,
              borderRadius: radius.full,
            },
          ]}
        >
          <Ionicons name="flame" size={13} color={accentColor} style={{ marginLeft: 3 }} />
          <Text style={[typography.caption, { color: accentColor, fontWeight: '700' }]}>
            {currentStreak} {currentStreak === 1 ? 'يوم' : currentStreak <= 10 ? 'أيام' : 'يوم'}
          </Text>
        </View>
      </View>

      {/* Tier description */}
      <Text
        style={[
          typography.sub,
          {
            color: theme.textSecondary,
            marginTop: spacing.xs,
            marginBottom: spacing.md,
            textAlign: 'right',
            lineHeight: 20,
          },
        ]}
      >
        {currentTier.description}
      </Text>

      {/* Next Milestone progress */}
      {!isTopTier && nextMilestone ? (
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[typography.caption, { color: theme.text, fontWeight: '600' }]}>
              المحطة القادمة: {nextMilestone.tier.name} ({nextMilestone.tier.days} يوم)
            </Text>
            <Text style={[typography.caption, { color: accentColor, fontWeight: '700' }]}>
              {progressPercent}%
            </Text>
          </View>

          {/* Progress Bar Track */}
          <View
            style={[
              styles.progressBarTrack,
              {
                backgroundColor: theme.cardSecondary,
                borderRadius: radius.full,
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.max(5, Math.min(100, progressPercent))}%`,
                  backgroundColor: accentColor,
                  borderRadius: radius.full,
                },
              ]}
            />
          </View>

          <Text
            style={[
              typography.caption,
              {
                color: theme.textMuted,
                marginTop: 6,
                textAlign: 'right',
                fontSize: 11,
              },
            ]}
          >
            باقي {nextMilestone.remainingDays}{' '}
            {nextMilestone.remainingDays === 1
              ? 'يوم واحد'
              : nextMilestone.remainingDays <= 10
              ? 'أيام'
              : 'يوم'}{' '}
            من الاستمرار المتتالي للوصول إلى المحطة التالية.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.topTierBanner,
            {
              backgroundColor: `${accentColor}12`,
              borderRadius: radius.md,
              borderColor: `${accentColor}30`,
            },
          ]}
        >
          <Ionicons name="trophy" size={16} color={accentColor} style={{ marginLeft: 6 }} />
          <Text
            style={[
              typography.caption,
              {
                color: accentColor,
                fontWeight: '600',
                flex: 1,
                textAlign: 'right',
              },
            ]}
          >
            ما شاء الله! حققت أعلى محطة التزام وانضباط (نادي المئة).
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithIcon: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  headerTitles: {
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 7,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  topTierBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    marginTop: 4,
  },
});
