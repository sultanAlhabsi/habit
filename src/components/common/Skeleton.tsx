import React, { createContext, useContext, useEffect } from 'react';
import { DimensionValue, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface SkeletonContextType {
  opacity: SharedValue<number>;
}

const SkeletonContext = createContext<SkeletonContextType | null>(null);

export interface SkeletonProviderProps {
  children: React.ReactNode;
  duration?: number;
  minOpacity?: number;
  maxOpacity?: number;
}

/**
 * Provides a unified synchronized shimmer pulse for all nested Skeleton elements
 */
export const SkeletonProvider: React.FC<SkeletonProviderProps> = ({
  children,
  duration = 850,
  minOpacity = 0.45,
  maxOpacity = 0.95,
}) => {
  const opacity = useSharedValue(minOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(maxOpacity, {
        duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity, duration, minOpacity, maxOpacity]);

  return (
    <SkeletonContext.Provider value={{ opacity }}>
      {children}
    </SkeletonContext.Provider>
  );
};

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  duration?: number;
}

/**
 * Elegant, hardware-accelerated placeholder primitive that renders on Reanimated UI thread.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  style,
  color,
  duration = 850,
}) => {
  const { theme, radius } = useTheme();
  const context = useContext(SkeletonContext);

  // Standalone fallback if used outside SkeletonProvider
  const localOpacity = useSharedValue(0.45);

  useEffect(() => {
    if (!context) {
      localOpacity.value = withRepeat(
        withTiming(0.95, {
          duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [context, localOpacity, duration]);

  const activeOpacity = context ? context.opacity : localOpacity;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: activeOpacity.value,
  }));

  const resolvedRadius = borderRadius !== undefined ? borderRadius : radius.sm;
  const resolvedColor =
    color || (theme.isDark ? '#262A30' : '#E6E4DD');

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: resolvedRadius,
          backgroundColor: resolvedColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
