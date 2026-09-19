import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../common/AppText';
import { useTheme } from '../../theme/ThemeContext';

export type HabitFilter = 'all' | 'pending' | 'completed';

interface FilterTabsBarProps {
  filter: HabitFilter;
  onSelectFilter: (filter: HabitFilter) => void;
  allCount: number;
  pendingCount: number;
  completedCount: number;
}

const TABS: HabitFilter[] = ['all', 'pending', 'completed'];

export const FilterTabsBar: React.FC<FilterTabsBarProps> = React.memo(({
  filter,
  onSelectFilter,
  allCount,
  pendingCount,
  completedCount,
}) => {
  const { theme, typography } = useTheme();

  // Local active tab for instant, zero-lag visual feedback
  const [activeTab, setActiveTab] = useState<HabitFilter>(filter);

  const tabLayouts = useRef<{ [key in HabitFilter]?: { x: number; width: number } }>({});
  const isInitial = useRef(true);

  const lineX = useSharedValue(0);
  const lineWidth = useSharedValue(0);
  const lineOpacity = useSharedValue(0);

  const updatePosition = (tab: HabitFilter, immediate = false) => {
    const layout = tabLayouts.current[tab];
    if (!layout) return;

    const targetX = layout.x;
    const targetWidth = layout.width;

    if (immediate || isInitial.current) {
      isInitial.current = false;
      lineX.value = targetX;
      lineWidth.value = targetWidth;
      lineOpacity.value = 1;
    } else {
      lineOpacity.value = withTiming(1, { duration: 150 });
      lineX.value = withSpring(targetX, {
        damping: 24,
        stiffness: 280,
        mass: 0.7,
      });
      lineWidth.value = withSpring(targetWidth, {
        damping: 24,
        stiffness: 280,
        mass: 0.7,
      });
    }
  };

  // Sync if prop changes externally
  useEffect(() => {
    setActiveTab(filter);
    updatePosition(filter);
  }, [filter, allCount, pendingCount, completedCount]);

  const handlePressTab = (tab: HabitFilter) => {
    if (tab === activeTab) return;

    setActiveTab(tab);
    updatePosition(tab);
    onSelectFilter(tab);
  };

  const animatedLineStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: lineX.value }],
      width: lineWidth.value,
      opacity: lineOpacity.value,
    };
  });

  const labels: Record<HabitFilter, string> = {
    all: `الكل (${allCount})`,
    pending: `المتبقية (${pendingCount})`,
    completed: `المكتملة (${completedCount})`,
  };

  return (
    <View style={styles.container}>
      {/* Sliding Underline between the filters */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.slidingLine,
          {
            backgroundColor: theme.primary,
          },
          animatedLineStyle,
        ]}
      />

      {TABS.map((tab) => {
        const isSelected = activeTab === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => handlePressTab(tab)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              tabLayouts.current[tab] = { x, width };
              if (tab === activeTab) {
                updatePosition(activeTab, isInitial.current);
              }
            }}
            style={({ pressed }) => [
              styles.tabBtn,
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: isSelected ? theme.primary : theme.textMuted,
                  fontWeight: isSelected ? '700' : '400',
                  paddingBottom: 6,
                },
              ]}
            >
              {labels[tab]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
  },
  slidingLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2.5,
    borderRadius: 1.5,
    zIndex: 1,
  },
  tabBtn: {
    paddingVertical: 2,
  },
});
