import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface WhatsAppTabIconProps {
  focused: boolean;
  focusedIcon: keyof typeof Ionicons.glyphMap;
  unfocusedIcon: keyof typeof Ionicons.glyphMap;
  size?: number;
}

export const WhatsAppTabIcon: React.FC<WhatsAppTabIconProps> = ({
  focused,
  focusedIcon,
  unfocusedIcon,
  size = 24,
}) => {
  const { theme } = useTheme();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });
  }, [focused, progress]);

  const pillAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.3, 1], [0, 0.6, 1]),
      transform: [
        { scaleX: interpolate(p, [0, 1], [0.65, 1]) },
        { scaleY: interpolate(p, [0, 1], [0.85, 1]) },
      ],
    };
  });

  const iconColor = focused ? theme.tabPillActiveIcon : theme.tabInactive;
  const iconName = focused ? focusedIcon : unfocusedIcon;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: theme.tabPill },
          pillAnimatedStyle,
        ]}
      />
      <View style={styles.iconWrapper}>
        <Ionicons name={iconName} size={size} color={iconColor} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 64,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default WhatsAppTabIcon;
