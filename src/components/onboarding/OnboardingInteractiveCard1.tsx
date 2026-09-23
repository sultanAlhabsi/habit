import React, { useState, useCallback, useEffect } from 'react';
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
  withSequence,
  withRepeat,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useTheme } from '../../theme/ThemeContext';

// ─────────────────────────────────────────────────────────────
// Particle definition (pure data — no Hooks)
// ─────────────────────────────────────────────────────────────
interface ParticleData {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
}

const PARTICLE_COLORS = [
  '#2A4B3A',
  '#0F766E',
  '#D97706',
  '#10B981',
  '#528268',
  '#F59E0B',
];

const PARTICLES: ParticleData[] = Array.from({ length: 8 }).map((_, i) => ({
  id: i,
  angle: (i * (360 / 8) * Math.PI) / 180,
  distance: 36 + (i % 2) * 12,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  size: i % 2 === 0 ? 5 : 4,
}));

// ─────────────────────────────────────────────────────────────
// Single Particle — its own component so Hooks are at top level
// ─────────────────────────────────────────────────────────────
interface ParticleItemProps {
  particle: ParticleData;
  progress: SharedValue<number>;
}

const ParticleItem: React.FC<ParticleItemProps> = ({ particle, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const tx = Math.cos(particle.angle) * particle.distance * p;
    const ty = Math.sin(particle.angle) * particle.distance * p;
    const opacity = p > 0 ? 1 - p : 0;
    const scale = 1 - p * 0.4;

    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particleDot,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Main Card Component
// ─────────────────────────────────────────────────────────────
export const OnboardingInteractiveCard1: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [isCompleted, setIsCompleted] = useState(false);
  const player = useAudioPlayer(require('../../../assets/sounds/complete.wav'));

  // Pure 2D gentle ambient floating (zero touch matrix conflicts)
  const floatTranslateY = useSharedValue(0);
  const cardScale = useSharedValue(1);

  // Check button & celebration
  const checkScale = useSharedValue(1);
  const particleProgress = useSharedValue(0);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(10);

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

  // ── Celebration trigger ────────────────────────────────────
  const triggerCelebration = useCallback(() => {
    try {
      Vibration.vibrate(28);
    } catch {}

    try {
      if (player) {
        player.seekTo(0);
        player.play();
      }
    } catch {}

    checkScale.value = withSequence(
      withTiming(0.85, { duration: 100 }),
      withSpring(1.15, { damping: 8, stiffness: 180 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );

    particleProgress.value = 0;
    particleProgress.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });

    toastOpacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withTiming(1, { duration: 1200 }),
      withTiming(0, { duration: 300 })
    );
    toastTranslateY.value = withSequence(
      withSpring(0, { damping: 12, stiffness: 140 }),
      withTiming(0, { duration: 1200 }),
      withTiming(-12, { duration: 300 })
    );
  }, [checkScale, particleProgress, toastOpacity, toastTranslateY]);

  const handleToggleCheck = useCallback(() => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    if (nextState) {
      triggerCelebration();
    } else {
      try {
        Vibration.vibrate(15);
      } catch {}
      checkScale.value = withSequence(
        withTiming(0.9, { duration: 90 }),
        withSpring(1, { damping: 14, stiffness: 160 })
      );
    }
  }, [isCompleted, triggerCelebration, checkScale]);

  // ── Animated styles ────────────────────────────────────────
  const cardAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateY: floatTranslateY.value },
        { scale: cardScale.value },
      ],
    };
  });

  const checkAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: checkScale.value }] };
  });

  const toastAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: toastOpacity.value,
      transform: [{ translateY: toastTranslateY.value }],
    };
  });

  return (
    <View style={styles.outerContainer}>
      {/* Floating Success Toast */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toastBadge,
          {
            backgroundColor: isDark ? '#1C2E24' : '#EBF5EF',
            borderColor: isDark ? '#2D4E3C' : '#CBE5D5',
          },
          toastAnimatedStyle,
        ]}
      >
        <Ionicons name="sparkles" size={14} color="#15803D" />
        <Text
          style={[
            styles.toastText,
            { color: isDark ? '#A7F3D0' : '#15803D' },
          ]}
        >
          أحسنت! أتممت عادتك الأولى ✨
        </Text>
      </Animated.View>

      {/* 2D Floating Interactive Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? '#1C1C1A' : '#FFFFFF',
            borderColor: isDark ? '#2B2B28' : '#ECEAE4',
            shadowColor: isDark ? '#000000' : '#2A4B3A',
          },
          cardAnimatedStyle,
        ]}
      >
        {/* Card Top Row */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: isDark ? '#242D26' : '#EEF4F0' },
            ]}
          >
            <Ionicons name="book-outline" size={18} color={theme.primary} />
            <Text style={[styles.categoryTitle, { color: theme.primary }]}>
              معرفة وتعلّم
            </Text>
          </View>

          <View
            style={[
              styles.streakPill,
              { backgroundColor: isDark ? '#26241E' : '#FFFBEB' },
            ]}
          >
            <Ionicons name="flame" size={14} color="#D97706" />
            <Text style={styles.streakText}>سلسلة ٧ أيام</Text>
          </View>
        </View>

        {/* Habit Title */}
        <View style={styles.cardContent}>
          <Text style={[styles.habitTitle, { color: theme.text }]}>
            قراءة ٢٠ صفحة يومياً
          </Text>
          <Text
            style={[styles.habitSubtitle, { color: theme.textSecondary }]}
          >
            كل يوم، بعد صلاة الفجر
          </Text>
        </View>

        {/* Footer: Progress + Check Button */}
        <View style={styles.cardFooter}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressCount, { color: theme.text }]}>
              {isCompleted ? '٢٠ / ٢٠ صفحة' : '٠ / ٢٠ صفحة'}
            </Text>
            <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
              {isCompleted ? 'اكتمل الهدف اليومي' : 'المس الدائرة للتجربة'}
            </Text>
          </View>

          {/* Check button + Particles wrapper */}
          <View style={styles.checkButtonWrapper}>
            {/* Particles — each is its own component */}
            {PARTICLES.map((p) => (
              <ParticleItem
                key={`p-${p.id}`}
                particle={p}
                progress={particleProgress}
              />
            ))}

            <Pressable
              onPress={handleToggleCheck}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Animated.View
                style={[
                  styles.checkButton,
                  {
                    backgroundColor: isCompleted
                      ? theme.primary
                      : isDark
                      ? '#262624'
                      : '#F3F2EE',
                    borderColor: isCompleted
                      ? theme.primary
                      : isDark
                      ? '#383834'
                      : '#DDD9D0',
                  },
                  checkAnimatedStyle,
                ]}
              >
                <Ionicons
                  name={isCompleted ? 'checkmark' : 'ellipse-outline'}
                  size={22}
                  color={
                    isCompleted
                      ? '#FFFFFF'
                      : isDark
                      ? '#71716A'
                      : '#A09C94'
                  }
                />
              </Animated.View>
            </Pressable>
          </View>
        </View>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Ionicons
            name="hand-left-outline"
            size={12}
            color={theme.textMuted}
          />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>
            المس الدائرة لإتمام العادة وتجربة الإنجاز
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
  toastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    zIndex: 10,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryTitle: { fontSize: 12, fontWeight: '600' },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  cardContent: { marginBottom: 16 },
  habitTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'left',
  },
  habitSubtitle: { fontSize: 12, textAlign: 'left' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  progressInfo: { flex: 1 },
  progressCount: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  progressLabel: { fontSize: 11 },
  checkButtonWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  particleDot: {
    position: 'absolute',
    top: 22,
    left: 22,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
  },
  hintText: { fontSize: 10, fontWeight: '500' },
});
