import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { AnimatedLogoRing } from '../common/AnimatedLogoRing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
  maxTimeoutMs?: number;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  isReady,
  onFinish,
  maxTimeoutMs = 3000,
}) => {
  const { isDark } = useTheme();
  const [timedOut, setTimedOut] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Safety fallback: do not block indefinitely if background tasks lag
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      setTimedOut(true);
    }, maxTimeoutMs);

    return () => clearTimeout(maxTimer);
  }, [maxTimeoutMs]);

  // Immediately exit as soon as the app data is ready or timed out
  useEffect(() => {
    if ((isReady || timedOut) && !isExiting) {
      setIsExiting(true);

      opacity.value = withTiming(
        0,
        {
          duration: 250,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        },
        (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        }
      );

      scale.value = withTiming(1.04, {
        duration: 250,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      });
    }
  }, [isReady, timedOut, isExiting, onFinish, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  // Background matching app.json splash screen (#F6F5F0) for light mode or dark background
  const backgroundColor = isDark ? '#121212' : '#F6F5F0';

  return (
    <Animated.View
      pointerEvents={isExiting ? 'none' : 'auto'}
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor },
        animatedStyle,
      ]}
    >
      {/* Centered Minimalist Animated Ring Logo (matches native splash proportion) */}
      <AnimatedLogoRing
        size={135}
        duration={1200}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
});
