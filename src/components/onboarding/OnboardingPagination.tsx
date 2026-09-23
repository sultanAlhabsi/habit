import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface OnboardingPaginationProps {
  total: number;
  activeIndex: number;
  onDotPress?: (index: number) => void;
}

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 140,
  mass: 0.8,
};

const DotItem: React.FC<{
  index: number;
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress?: () => void;
}> = ({ index, isActive, activeColor, inactiveColor, onPress }) => {
  const animatedActive = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    animatedActive.value = withSpring(isActive ? 1 : 0, SPRING_CONFIG);
  }, [isActive, animatedActive]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const width = 8 + animatedActive.value * 18; // 8px circle -> 26px elongated pill
    const opacity = 0.4 + animatedActive.value * 0.6;

    return {
      width,
      opacity,
      backgroundColor: isActive ? activeColor : inactiveColor,
    };
  });

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      style={styles.dotTouchTarget}
    >
      <Animated.View style={[styles.dot, animatedStyle]} />
    </Pressable>
  );
};

export const OnboardingPagination: React.FC<OnboardingPaginationProps> = ({
  total,
  activeIndex,
  onDotPress,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, idx) => (
        <DotItem
          key={`dot-${idx}`}
          index={idx}
          isActive={idx === activeIndex}
          activeColor={theme.primary}
          inactiveColor={isDark ? '#3A3A36' : '#D1CEBF'}
          onPress={() => onDotPress?.(idx)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 24,
  },
  dotTouchTarget: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});
