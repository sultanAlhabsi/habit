import React, { useEffect } from 'react';
import { StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface MorphingThemeToggleProps {
  size?: number;
  onToggle?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const MorphingThemeToggle: React.FC<MorphingThemeToggleProps> = ({
  size = 36,
  onToggle,
  style,
  accessibilityLabel = 'تبديل الوضع الليلي والنهاري',
}) => {
  const { isDark, setThemeMode, theme, radius } = useTheme();

  // 0 = Light (Sun), 1 = Dark (Moon)
  const progress = useSharedValue(isDark ? 1 : 0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(isDark ? 1 : 0, {
      damping: 14,
      stiffness: 120,
      mass: 0.8,
    });
  }, [isDark]);

  const handlePress = () => {
    buttonScale.value = withSequence(
      withTiming(0.88, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 12, stiffness: 220 })
    );

    if (onToggle) {
      onToggle();
    } else {
      setThemeMode(isDark ? 'light' : 'dark');
    }
  };

  // Outer container rotation: 0deg to 180deg
  const animatedContainerStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [
        { rotate: `${rotate}deg` },
        { scale: buttonScale.value },
      ],
    };
  });

  // Sun icon animation (fades & scales down with rotation when entering dark mode)
  const animatedSunStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.55], [1, 0], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP);
    const rotate = interpolate(progress.value, [0, 1], [0, 90], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Moon icon animation (scales & fades in with counter-rotation when entering dark mode)
  const animatedMoonStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0.45, 1], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0.4, 0.9], [0, 1], Extrapolation.CLAMP);
    const rotate = interpolate(progress.value, [0, 1], [-90, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const iconSize = size * 0.72;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={`الوضع الحالي: ${isDark ? 'داكن' : 'فاتح'}. اضغط للتبديل`}
      onPress={handlePress}
      style={[
        styles.touchable,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: radius.full,
          backgroundColor: theme.cardSecondary,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.container, animatedContainerStyle, { width: size, height: size }]}>
        {/* Sun (SVG Vector with 8 radiating beams) */}
        <Animated.View style={[styles.layer, animatedSunStyle]}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
            <G fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {/* Sun Core */}
              <Circle cx="12" cy="12" r="4.8" fill="#F59E0B" stroke="#F59E0B" />
              {/* 8 Sun Rays */}
              <Line x1="12" y1="1.8" x2="12" y2="4" />
              <Line x1="12" y1="20" x2="12" y2="22.2" />
              <Line x1="4.79" y1="4.79" x2="6.35" y2="6.35" />
              <Line x1="17.65" y1="17.65" x2="19.21" y2="19.21" />
              <Line x1="1.8" y1="12" x2="4" y2="12" />
              <Line x1="20" y1="12" x2="22.2" y2="12" />
              <Line x1="4.79" y1="19.21" x2="6.35" y2="17.65" />
              <Line x1="17.65" y1="6.35" x2="19.21" y2="4.79" />
            </G>
          </Svg>
        </Animated.View>

        {/* Moon (SVG Crescent Vector with Twinkling Stars) */}
        <Animated.View style={[styles.layer, animatedMoonStyle]}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
            {/* Elegant Crescent Moon */}
            <Path
              d="M20.5 13.05A8.5 8.5 0 1 1 10.95 3.5a6.8 6.8 0 0 0 9.55 9.55z"
              fill="#E2E8F0"
              stroke="#94A3B8"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* Twinkling Night Star 1 */}
            <Path
              d="M18.5 3.5l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z"
              fill="#FEF08A"
            />
            {/* Twinkling Night Star 2 */}
            <Path
              d="M19.5 16.5l.3.7.7.3-.7.3-.3.7-.3-.7-.7-.3.7-.3z"
              fill="#FEF08A"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
