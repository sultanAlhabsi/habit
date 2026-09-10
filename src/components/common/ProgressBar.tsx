import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

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
  const clamped = Math.min(1, Math.max(0, normalizedProgress));

  const animValue = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: clamped,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const widthInterpolation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: theme.cardSecondary,
          borderRadius: radius.full,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolation,
            backgroundColor: color || theme.text,
            borderRadius: radius.full,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
