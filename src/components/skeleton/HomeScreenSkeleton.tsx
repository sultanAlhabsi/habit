import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Skeleton, SkeletonProvider } from '../common/Skeleton';

export interface HomeScreenSkeletonProps {
  insetsTop?: number;
  insetsBottom?: number;
}

/**
 * Placeholder skeleton for a single HabitCard
 */
export const HabitCardSkeleton: React.FC = () => {
  const { theme, radius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.habitCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderRadius: radius.md,
          padding: spacing.base,
          marginHorizontal: spacing.base,
          marginBottom: spacing.sm,
        },
      ]}
    >
      {/* Right side: Icon + Title & Category */}
      <View style={styles.cardRightSection}>
        <Skeleton width={42} height={42} borderRadius={21} />
        <View style={styles.cardTexts}>
          <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={68} height={12} borderRadius={4} />
        </View>
      </View>

      {/* Left side: Checkbox action button */}
      <Skeleton width={36} height={36} borderRadius={18} />
    </View>
  );
};

/**
 * Placeholder skeleton for the 7-day DateStrip
 */
export const DateStripSkeleton: React.FC = () => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.dateStripRow, { paddingHorizontal: spacing.base, marginBottom: spacing.sm }]}>
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton
          key={index}
          width={42}
          height={62}
          borderRadius={21}
        />
      ))}
    </View>
  );
};

/**
 * Placeholder skeleton for DailyProgressCard
 */
export const DailyProgressCardSkeleton: React.FC = () => {
  const { theme, radius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.progressCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderRadius: radius.md,
          padding: spacing.base,
          marginHorizontal: spacing.base,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View style={styles.progressHeaderRow}>
        <View>
          <Skeleton width={110} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={12} borderRadius={4} />
        </View>
        <Skeleton width={48} height={24} borderRadius={6} />
      </View>

      {/* Progress Bar Track */}
      <Skeleton width="100%" height={8} borderRadius={4} style={{ marginTop: 14 }} />

      {/* Footer hint */}
      <Skeleton width={140} height={12} borderRadius={4} style={{ marginTop: 12 }} />
    </View>
  );
};

/**
 * Placeholder skeleton for Category Chips
 */
export const CategoryFilterSkeleton: React.FC = () => {
  const { spacing } = useTheme();
  const chipWidths = [64, 76, 58, 82, 70];

  return (
    <View style={[styles.categoryRow, { paddingHorizontal: spacing.base, marginBottom: spacing.sm }]}>
      {chipWidths.map((w, index) => (
        <Skeleton
          key={index}
          width={w}
          height={30}
          borderRadius={15}
          style={{ marginLeft: 8 }}
        />
      ))}
    </View>
  );
};

/**
 * Full-screen loading skeleton for HomeScreen.
 * Wraps everything in a unified SkeletonProvider for synchronized harmonic shimmer.
 */
export const HomeScreenSkeleton: React.FC<HomeScreenSkeletonProps> = ({
  insetsTop = 0,
  insetsBottom = 0,
}) => {
  const { theme, spacing } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  // Calculate dynamic card count to fill entire viewport down to bottom navigation bar
  const TOP_SECTION_ESTIMATE = 310 + insetsTop + insetsBottom;
  const availableHeight = Math.max(0, windowHeight - TOP_SECTION_ESTIMATE);
  const CARD_SLOT_HEIGHT = 86;
  const cardCount = Math.max(5, Math.ceil(availableHeight / CARD_SLOT_HEIGHT));

  return (
    <SkeletonProvider duration={850} minOpacity={0.45} maxOpacity={0.95}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Top Header Bar */}
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insetsTop, spacing.base),
              paddingHorizontal: spacing.base,
              paddingBottom: spacing.sm,
              backgroundColor: theme.background,
            },
          ]}
        >
          {/* Header Title on Right */}
          <Skeleton width={96} height={28} borderRadius={6} />

          {/* Action Icons on Left */}
          <View style={styles.headerActions}>
            <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 8 }} />
            <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 8 }} />
            <Skeleton width={36} height={36} borderRadius={18} />
          </View>
        </View>

        {/* Scrollable Body */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insetsBottom, spacing.sm) }}
          scrollEnabled={false}
        >
          {/* Date Selector Strip Skeleton */}
          <DateStripSkeleton />

          {/* Daily Progress Overview Skeleton */}
          <DailyProgressCardSkeleton />

          {/* Category Filter Chips Skeleton */}
          <CategoryFilterSkeleton />

          {/* Habit Cards Skeletons filling to the bottom of the page */}
          {Array.from({ length: cardCount }).map((_, index) => (
            <HabitCardSkeleton key={index} />
          ))}
        </ScrollView>
      </View>
    </SkeletonProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  dateStripRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCard: {
    borderWidth: 1,
  },
  progressHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  habitCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  cardRightSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  cardTexts: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
});
