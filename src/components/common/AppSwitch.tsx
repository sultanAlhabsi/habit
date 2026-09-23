import React, { useEffect } from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { triggerLightHaptic } from '../../utils/haptics';

export interface AppSwitchProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  activeColor?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

// Material Design Switch Dimensions (matching Android settings screenshot)
const TRACK_WIDTH = 42;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 24;
const TRAVEL_DISTANCE = TRACK_WIDTH - THUMB_SIZE; // 18px

export const AppSwitch: React.FC<AppSwitchProps> = ({
  value,
  onValueChange,
  activeColor,
  disabled = false,
  accessibilityLabel,
}) => {
  const { isDark, theme } = useTheme();
  const effectiveActiveColor = activeColor || theme.primary;
  const inactiveTrackColor = isDark ? '#333842' : '#E2E8F0';

  const progress = useSharedValue(value ? 1 : 0);
  const pressedScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      damping: 18,
      stiffness: 240,
      mass: 0.6,
    });
  }, [value, progress]);

  const trackAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [inactiveTrackColor, effectiveActiveColor]
      ),
    };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const translateX = interpolate(progress.value, [0, 1], [0, TRAVEL_DISTANCE]);
    return {
      transform: [
        { translateX },
        { scale: pressedScale.value },
      ],
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    pressedScale.value = withSpring(0.92, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    pressedScale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const handlePress = () => {
    if (disabled) return;
    triggerLightHaptic();
    onValueChange(!value);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        disabled && styles.disabled,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {/* Slender Pill Track */}
      <Animated.View style={[styles.track, trackAnimatedStyle]} />

      {/* Overlapping White Thumb with Elevation */}
      <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE,
    justifyContent: 'center',
    position: 'relative',
    direction: 'ltr', // Enforces strict LTR coordinate space for thumb translation
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    left: 0,
    top: (THUMB_SIZE - TRACK_HEIGHT) / 2, // Centered vertically behind thumb
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 0,
    top: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.22,
        shadowRadius: 2.5,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  disabled: {
    opacity: 0.45,
  },
});

export default AppSwitch;
