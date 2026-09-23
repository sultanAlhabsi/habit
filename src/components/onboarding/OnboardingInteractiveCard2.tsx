import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Vibration,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { toArabicNumerals } from '../../utils/habitUtils';

// ─────────────────────────────────────────────────────────────
// Week data (pure data)
// Visual order: index 0 (س) on the far left -> index 6 (ج) on the far right
// ─────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { day: 'س', maxHeight: 24 },
  { day: 'ح', maxHeight: 32 },
  { day: 'ن', maxHeight: 20 },
  { day: 'ث', maxHeight: 30 },
  { day: 'ر', maxHeight: 28 },
  { day: 'خ', maxHeight: 34 },
  { day: 'ج', maxHeight: 18 },
];

// ─────────────────────────────────────────────────────────────
// Single animated bar — its own component
// Staggered rise from left (index 0) to right (index 6) when active
// ─────────────────────────────────────────────────────────────
interface BarColumnProps {
  day: string;
  maxHeight: number;
  index: number;
  primaryColor: string;
  mutedColor: string;
  isDark: boolean;
  isActive: boolean;
}

const BarColumn: React.FC<BarColumnProps> = ({
  day,
  maxHeight,
  index,
  primaryColor,
  mutedColor,
  isDark,
  isActive,
}) => {
  const barHeight = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Reset first, then animate one by one from left to right
      barHeight.value = 0;
      barHeight.value = withDelay(
        150 + index * 65,
        withSpring(maxHeight, { damping: 14, stiffness: 130 })
      );
    } else {
      barHeight.value = 0;
    }
  }, [isActive, barHeight, index, maxHeight]);

  const barStyle = useAnimatedStyle(() => {
    'worklet';
    return { height: barHeight.value };
  });

  return (
    <View style={styles.barColumn}>
      <View
        style={[
          styles.barTrack,
          { backgroundColor: isDark ? '#292926' : '#ECE8DE' },
        ]}
      >
        <Animated.View
          style={[styles.barFill, { backgroundColor: primaryColor }, barStyle]}
        />
      </View>
      <Text style={[styles.dayLabel, { color: mutedColor }]}>{day}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Card Component
// ─────────────────────────────────────────────────────────────
interface OnboardingInteractiveCard2Props {
  isActive?: boolean;
}

export const OnboardingInteractiveCard2: React.FC<OnboardingInteractiveCard2Props> = ({
  isActive = true,
}) => {
  const { theme, isDark } = useTheme();
  const [streakCount, setStreakCount] = useState(14);

  // Pure 2D gentle ambient floating (zero touch matrix conflicts)
  const floatTranslateY = useSharedValue(0);
  const cardScale = useSharedValue(1);

  // Flame breathing
  const flameScale = useSharedValue(1);
  const flameRotate = useSharedValue(0);

  useEffect(() => {
    floatTranslateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [floatTranslateY]);

  // Flame continuous breathing pulse
  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.96, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    flameRotate.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-3, { duration: 800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [flameRotate, flameScale]);

  const handleFlameTap = useCallback(() => {
    try {
      Vibration.vibrate(20);
    } catch {}
    setStreakCount((prev) => prev + 1);

    flameScale.value = withSequence(
      withTiming(1.25, { duration: 120 }),
      withSpring(1, { damping: 8, stiffness: 180 })
    );
  }, [flameScale]);

  // ── Animated styles ─────────────────────────────────────────
  const cardAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateY: floatTranslateY.value },
        { scale: cardScale.value },
      ],
    };
  });

  const flameAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: flameScale.value },
        { rotate: `${flameRotate.value}deg` },
      ],
    };
  });

  return (
    <View style={styles.outerContainer}>
      <Animated.View
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? '#1C1C1A' : '#FFFFFF',
            borderColor: isDark ? '#2B2B28' : '#ECEAE4',
            shadowColor: isDark ? '#000000' : '#B45309',
          },
          cardAnimatedStyle,
        ]}
      >
        {/* Flame hero */}
        <View style={styles.heroSection}>
          <Pressable onPress={handleFlameTap} hitSlop={15}>
            <Animated.View
              style={[
                styles.flameCircle,
                {
                  backgroundColor: isDark ? '#2E2214' : '#FEF3C7',
                  borderColor: isDark ? '#5C3B14' : '#FDE68A',
                },
                flameAnimatedStyle,
              ]}
            >
              <Ionicons name="flame" size={36} color="#D97706" />
            </Animated.View>
          </Pressable>

          <View style={styles.streakHeader}>
            <Text style={[styles.streakCountNumber, { color: theme.text }]}>
              {toArabicNumerals(streakCount)} يوماً متواصلاً
            </Text>
            <View style={styles.streakSubBadge}>
              <Ionicons name="trophy-outline" size={12} color="#D97706" />
              <Text style={styles.streakSubText}>
                أفضل التزام: {toArabicNumerals(Math.max(28, streakCount))} يوماً • استمرارية مذهلة
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly chart — BarColumn components with left-to-right staggered rise */}
        <View
          style={[
            styles.chartBox,
            {
              backgroundColor: isDark ? '#222220' : '#FAF9F6',
              borderColor: isDark ? '#2E2E2A' : '#F0EEE6',
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.textSecondary }]}>
              الالتزام هذا الأسبوع
            </Text>
            <Text style={[styles.chartScore, { color: theme.primary }]}>
              ٧ / ٧ أيام 🎯
            </Text>
          </View>

          <View style={styles.barsContainer}>
            {WEEK_DAYS.map((w, index) => (
              <BarColumn
                key={`bar-${w.day}-${index}`}
                day={w.day}
                maxHeight={w.maxHeight}
                index={index}
                primaryColor={theme.primary}
                mutedColor={theme.textMuted}
                isDark={isDark}
                isActive={isActive}
              />
            ))}
          </View>
        </View>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Ionicons name="sparkles-outline" size={12} color={theme.textMuted} />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>
            المس الشعلة لزيادة الحماس واستشعار الزخم
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
    }),
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  flameCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakHeader: { alignItems: 'center' },
  streakCountNumber: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  streakSubBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakSubText: { fontSize: 11, fontWeight: '600', color: '#B45309' },
  chartBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: { fontSize: 11, fontWeight: '600' },
  chartScore: { fontSize: 11, fontWeight: '700' },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 4,
    paddingBottom: 2,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barTrack: {
    height: 38,
    width: 12,
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barFill: {
    width: 12,
    borderRadius: 6,
  },
  dayLabel: { fontSize: 11, fontWeight: '600' },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  hintText: { fontSize: 10, fontWeight: '500' },
});
