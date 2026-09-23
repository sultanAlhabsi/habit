import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
  FadeOutUp,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface ConfettiParticleConfig {
  x: number;
  yTarget: number;
  size: number;
  color: string;
  delay: number;
  rotate: number;
}

const CONFETTI_DATA: ConfettiParticleConfig[] = [
  { x: -80, yTarget: -22, size: 5, color: '#10B981', delay: 60, rotate: 45 },
  { x: -50, yTarget: -30, size: 4, color: '#059669', delay: 100, rotate: -25 },
  { x: -25, yTarget: -24, size: 6, color: '#34D399', delay: 0, rotate: 60 },
  { x: 0, yTarget: -35, size: 4, color: '#10B981', delay: 80, rotate: -40 },
  { x: 25, yTarget: -28, size: 5, color: '#6EE7B7', delay: 120, rotate: 30 },
  { x: 55, yTarget: -32, size: 4, color: '#059669', delay: 40, rotate: -55 },
  { x: 80, yTarget: -20, size: 5, color: '#10B981', delay: 90, rotate: 20 },
  { x: -95, yTarget: -15, size: 3, color: '#34D399', delay: 140, rotate: 75 },
  { x: -10, yTarget: -38, size: 5, color: '#10B981', delay: 60, rotate: -15 },
  { x: 40, yTarget: -18, size: 3, color: '#059669', delay: 110, rotate: 45 },
  { x: 95, yTarget: -26, size: 4, color: '#6EE7B7', delay: 70, rotate: -30 },
  { x: -65, yTarget: -16, size: 4, color: '#10B981', delay: 130, rotate: 10 },
];

const ConfettiParticle: React.FC<{
  config: ConfettiParticleConfig;
  progress: SharedValue<number>;
}> = ({ config, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const translateY = interpolate(p, [0, 0.4, 1], [0, config.yTarget, config.yTarget * 0.7]);
    const translateX = config.x * (0.8 + p * 0.4);
    const opacity = interpolate(p, [0, 0.2, 0.7, 1], [0, 1, 0.9, 0]);
    const scale = interpolate(p, [0, 0.3, 0.8, 1], [0, 1.2, 0.9, 0.2]);
    const rotation = `${config.rotate * (1 + p)}deg`;

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
        { rotate: rotation },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size > 4 ? 2 : config.size / 2,
          backgroundColor: config.color,
          marginLeft: -config.size / 2,
          marginTop: -config.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

export const DailyCelebrationBanner: React.FC = () => {
  const { theme, radius, spacing, typography } = useTheme();

  // 1. Animated Twinkling & Swaying Sparkles Icon
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // 2. Confetti Burst Progress
  const confettiProgress = useSharedValue(0);

  const triggerConfettiCycle = React.useCallback(() => {
    confettiProgress.value = 0;
    confettiProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1250, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 1800 }), // serene pause between showers
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, [confettiProgress]);

  useEffect(() => {
    // Continuous lively twinkle & gentle rotation for sparkles icon
    rotation.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 650, easing: Easing.inOut(Easing.quad) }),
        withTiming(14, { duration: 650, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 650, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.96, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 750, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Start repeating celebratory confetti shower
    triggerConfettiCycle();
  }, [triggerConfettiCycle, rotation, scale]);

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(450).springify().damping(18)}
      exiting={FadeOutUp.duration(300)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="إنجاز اليوم مكتمل ١٠٠٪"
        onPress={triggerConfettiCycle}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: `${theme.primary}12`,
            borderColor: theme.primary,
            borderRadius: radius.md,
            marginHorizontal: spacing.base,
            marginBottom: spacing.md,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        {/* Floating Confetti Layer */}
        <View pointerEvents="none" style={styles.confettiContainer}>
          {CONFETTI_DATA.map((config, index) => (
            <ConfettiParticle key={index} config={config} progress={confettiProgress} />
          ))}
        </View>

        {/* Twinkling Sparkles Icon */}
        <Animated.View style={[styles.iconWrapper, animatedSparkleStyle]}>
          <Ionicons name="sparkles" size={22} color="#10B981" />
        </Animated.View>

        {/* Celebratory Text */}
        <View style={styles.textContainer}>
          <Text style={[typography.subMedium, { color: theme.primary, fontWeight: '700', textAlign: 'right' }]}>
            أحسنت! أتممت جميع عاداتك لليوم بنجاح
          </Text>
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2, textAlign: 'right' }]}>
            حافظ على هذا الزخم والاستمرارية لبناء عادات راسخة.
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'visible',
  },
  iconWrapper: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    right: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  particle: {
    position: 'absolute',
  },
});
