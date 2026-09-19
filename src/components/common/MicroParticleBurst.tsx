import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

export interface MicroParticleBurstRef {
  trigger: () => void;
}

interface MicroParticleBurstProps {
  color?: string;
}

interface ParticleConfig {
  angle: number;
  distance: number;
  size: number;
  isAccent: boolean;
}

const PARTICLE_COUNT = 8;

// Pre-calculate fixed geometry for 8 starburst particles
const PARTICLES: ParticleConfig[] = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const angle = (i * 2 * Math.PI) / PARTICLE_COUNT + Math.PI / PARTICLE_COUNT;
  return {
    angle,
    distance: i % 2 === 0 ? 25 : 20,
    size: i % 2 === 0 ? 4 : 3,
    isAccent: i === 1 || i === 5,
  };
});

const ParticleItem: React.FC<{
  config: ParticleConfig;
  progress: SharedValue<number>;
  baseColor: string;
}> = ({ config, progress, baseColor }) => {
  const cos = Math.cos(config.angle);
  const sin = Math.sin(config.angle);
  const particleColor = config.isAccent ? '#EAB308' : baseColor;

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const currentDist = p * config.distance;
    const translateX = cos * currentDist;
    const translateY = sin * currentDist;

    // Fast expand, linger, and fade out cleanly
    const scale = interpolate(p, [0, 0.2, 0.7, 1], [0, 1.2, 0.8, 0]);
    const opacity = interpolate(p, [0, 0.15, 0.75, 1], [0, 1, 0.8, 0]);

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
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
          borderRadius: config.size / 2,
          backgroundColor: particleColor,
          marginLeft: -config.size / 2,
          marginTop: -config.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

export const MicroParticleBurst = forwardRef<MicroParticleBurstRef, MicroParticleBurstProps>(
  ({ color = '#2A4B3A' }, ref) => {
    const progress = useSharedValue(0);
    const lastTriggerRef = useRef(0);

    useImperativeHandle(ref, () => ({
      trigger: () => {
        const now = Date.now();
        // Prevent accidental double trigger within 250ms
        if (now - lastTriggerRef.current < 250) return;
        lastTriggerRef.current = now;

        progress.value = 0;
        progress.value = withTiming(
          1,
          {
            duration: 400,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            if (finished) {
              progress.value = 0;
            }
          }
        );
      },
    }));

    return (
      <View pointerEvents="none" style={styles.container}>
        {PARTICLES.map((config, index) => (
          <ParticleItem
            key={index}
            config={config}
            progress={progress}
            baseColor={color}
          />
        ))}
      </View>
    );
  }
);

MicroParticleBurst.displayName = 'MicroParticleBurst';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
  },
});

