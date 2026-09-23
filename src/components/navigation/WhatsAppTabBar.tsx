import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { AppText } from '../common/AppText';

interface TabMeta {
  title: string;
  focusedIcon: keyof typeof Ionicons.glyphMap;
  unfocusedIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIG: Record<string, TabMeta> = {
  HomeTab: {
    title: 'الرئيسية',
    focusedIcon: 'calendar',
    unfocusedIcon: 'calendar-outline',
  },
  StatisticsTab: {
    title: 'الإحصائيات',
    focusedIcon: 'bar-chart',
    unfocusedIcon: 'bar-chart-outline',
  },
  SettingsTab: {
    title: 'الإعدادات',
    focusedIcon: 'settings',
    unfocusedIcon: 'settings-outline',
  },
};

interface WhatsAppTabItemProps {
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  label: string;
  focusedIcon: keyof typeof Ionicons.glyphMap;
  unfocusedIcon: keyof typeof Ionicons.glyphMap;
}

const WhatsAppTabItem: React.FC<WhatsAppTabItemProps> = ({
  isFocused,
  onPress,
  onLongPress,
  label,
  focusedIcon,
  unfocusedIcon,
}) => {
  const { theme } = useTheme();
  const progress = useSharedValue(isFocused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, {
      damping: 16,
      stiffness: 200,
      mass: 0.7,
    });
  }, [isFocused, progress]);

  const pillAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.2, 1], [0, 0.5, 1]),
      transform: [
        { scaleX: interpolate(p, [0, 1], [0.35, 1]) },
        { scaleY: interpolate(p, [0, 1], [0.75, 1]) },
      ],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  const handlePressIn = () => {
    pressScale.value = withSpring(0.94, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const iconName = isFocused ? focusedIcon : unfocusedIcon;
  const iconColor = isFocused ? theme.tabPillActiveIcon : theme.tabInactive;
  const labelColor = isFocused ? theme.tabActiveLabel : theme.tabInactive;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabContent, buttonAnimatedStyle]}>
        <View style={styles.pillContainer}>
          <Animated.View
            style={[
              styles.pill,
              { backgroundColor: theme.tabPill },
              pillAnimatedStyle,
            ]}
          />
          <View style={styles.iconCenter}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>
        </View>
        <AppText
          style={[
            styles.tabLabel,
            {
              color: labelColor,
              fontWeight: isFocused ? '700' : '500',
            },
          ]}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
};

export const WhatsAppTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
  insets,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.barContainer,
        {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name] || {
          title: route.name,
          focusedIcon: 'apps' as const,
          unfocusedIcon: 'apps-outline' as const,
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <WhatsAppTabItem
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            label={config.title}
            focusedIcon={config.focusedIcon}
            unfocusedIcon={config.unfocusedIcon}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    elevation: 0,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    width: 64,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
  },
  iconCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
});

export default WhatsAppTabBar;
