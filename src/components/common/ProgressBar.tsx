import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface SparkConfig {
  id: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  delay: number;
}

// 8 micro-sparks tailored for a rich forest green spark trail
const SPARK_CONFIGS: SparkConfig[] = [
  // First wave of sparks (early in the glide)
  { id: 1, dx: 14, dy: -6, size: 2.8, color: '#FFFFFF', delay: 0.0 },
  { id: 2, dx: 18, dy: 5, size: 2.4, color: '#A8DAB5', delay: 0.08 },
  { id: 3, dx: 24, dy: -3, size: 2.0, color: '#528D6F', delay: 0.15 },
  { id: 4, dx: 12, dy: 7, size: 2.2, color: '#76B392', delay: 0.22 },
  // Second wave of sparks (as glide continues)
  { id: 5, dx: 16, dy: -8, size: 2.6, color: '#FFFFFF', delay: 0.30 },
  { id: 6, dx: 22, dy: 4, size: 2.2, color: '#A8DAB5', delay: 0.36 },
  { id: 7, dx: 26, dy: -5, size: 1.8, color: '#3D6B53', delay: 0.42 },
  { id: 8, dx: 15, dy: 6, size: 2.0, color: '#76B392', delay: 0.48 },
];

interface SparkParticleProps {
  progress: SharedValue<number>;
  config: SparkConfig;
  headSize: number;
}

const SparkParticle: React.FC<SparkParticleProps> = React.memo(({ progress, config, headSize }) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    if (p <= config.delay || p >= 1) {
      return { opacity: 0 };
    }

    // Active window for each micro-spark
    const windowDuration = 0.38;
    const elapsed = p - config.delay;
    const localP = Math.min(1, Math.max(0, elapsed / windowDuration));

    if (localP >= 1) {
      return { opacity: 0 };
    }

    // Snappy burst fade in (first 15%), then smooth dissipation fade out
    const opacity = localP < 0.15
      ? localP / 0.15
      : Math.pow(1 - (localP - 0.15) / 0.85, 1.6);

    const distance = Math.sin(localP * (Math.PI / 2));

    return {
      opacity,
      transform: [
        { translateX: distance * config.dx },
        { translateY: distance * config.dy },
        { scale: (1 - localP * 0.5) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkParticle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
          left: (headSize - config.size) / 2,
          top: (headSize - config.size) / 2,
          shadowColor: config.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
});

interface ProgressBarProps {
  progress: number; // 0 to 1 or 0 to 100
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 4,
  style,
}) => {
  const { theme, radius } = useTheme();
  const normalizedProgress = progress > 1 ? progress / 100 : progress;
  const clamped = Math.min(1, Math.max(0, isNaN(normalizedProgress) ? 0 : normalizedProgress));

  const isFirstRender = useRef(true);
  const prevClamped = useRef(clamped);

  const progressAnim = useSharedValue(clamped);
  const sparkIgnition = useSharedValue(0);
  const sparksProgress = useSharedValue(0);

  useEffect(() => {
    // Avoid animation flash on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      progressAnim.value = clamped;
      return;
    }

    if (clamped !== prevClamped.current) {
      prevClamped.current = clamped;

      // 1. Emit flying sparks along the travel path
      sparksProgress.value = 0;
      sparksProgress.value = withTiming(1, {
        duration: 620,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });

      // 2. Ignite spark head during movement, then extinguish back to calm state
      sparkIgnition.value = withSequence(
        withTiming(1, { duration: 60, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) })
      );

      // 3. Fluid spring movement for the progress bar
      progressAnim.value = withSpring(clamped, {
        damping: 18,
        stiffness: 140,
        mass: 0.8,
      });
    }
  }, [clamped, progressAnim, sparkIgnition, sparksProgress]);

  const dotSize = Math.max(height + 2, 7);
  const glowSize = dotSize + 10;
  // Forest Green by default
  const barColor = color || theme.primary || '#2A4B3A';

  const animatedFillStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      width: `${progressAnim.value * 100}%`,
    };
  });

  const animatedHeadStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      // Hide dot when progress is practically 0
      opacity: progressAnim.value > 0.005 ? 1 : 0,
    };
  });

  const animatedAuraStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: sparkIgnition.value * 0.7,
      transform: [
        { scale: 0.8 + sparkIgnition.value * 0.35 },
      ],
    };
  });

  const animatedCoreStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: sparkIgnition.value,
      transform: [
        { scale: 0.7 + sparkIgnition.value * 0.3 },
      ],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
        },
        style,
      ]}
    >
      {/* Background Track */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.cardSecondary,
            borderRadius: radius.full,
          },
        ]}
      />

      {/* Fluid Spring Fill */}
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: barColor,
            borderRadius: radius.full,
          },
          animatedFillStyle,
        ]}
      >
        {/* Leading Edge Spark Assembly */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sparkHeadWrapper,
            {
              left: 0,
              top: (height - dotSize) / 2,
              width: dotSize,
              height: dotSize,
            },
            animatedHeadStyle,
          ]}
        >
          {/* Micro-Sparks Spray (trailing backwards into the track) */}
          {SPARK_CONFIGS.map((spark) => (
            <SparkParticle
              key={spark.id}
              progress={sparksProgress}
              config={spark}
              headSize={dotSize}
            />
          ))}

          {/* Outer Forest Green Spark Aura (Active ONLY during movement) */}
          <Animated.View
            style={[
              styles.sparkAura,
              {
                width: glowSize,
                height: glowSize,
                borderRadius: glowSize / 2,
                backgroundColor: '#3D6B53',
                left: -(glowSize - dotSize) / 2,
                top: -(glowSize - dotSize) / 2,
              },
              animatedAuraStyle,
            ]}
          />

          {/* Base Calm Dot (Solid Forest Green, serene and non-radiant at rest) */}
          <View
            style={[
              styles.calmDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: barColor,
              },
            ]}
          />

          {/* White-Hot Spark Core (Active ONLY during movement, gives fiery spark glow) */}
          <Animated.View
            style={[
              styles.sparkCore,
              {
                width: Math.max(dotSize - 3, 3),
                height: Math.max(dotSize - 3, 3),
                borderRadius: Math.max(dotSize - 3, 3) / 2,
                left: (dotSize - Math.max(dotSize - 3, 3)) / 2,
                top: (dotSize - Math.max(dotSize - 3, 3)) / 2,
              },
              animatedCoreStyle,
            ]}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row-reverse',
    position: 'relative',
    overflow: 'visible',
  },
  track: {
    ...StyleSheet.absoluteFill,
  },
  fill: {
    height: '100%',
    position: 'relative',
  },
  sparkHeadWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  calmDot: {
    position: 'absolute',
  },
  sparkAura: {
    position: 'absolute',
  },
  sparkCore: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 4,
  },
  sparkParticle: {
    position: 'absolute',
  },
});
