import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onToggleCheckin: () => void;
  onPressDetails: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  streak,
  onToggleCheckin,
  onPressDetails,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`تفاصيل عادة ${habit.name}`}
      onPress={onPressDetails}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderRadius: radius.md,
          marginHorizontal: spacing.base,
          marginBottom: 8,
          paddingVertical: 12,
          paddingHorizontal: spacing.base,
          opacity: pressed ? 0.75 : habit.isActive ? 1 : 0.5,
        },
      ]}
    >
      <View style={styles.cardContent}>
        {/* Right side in RTL: Checkmark Circle */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={`تسجيل إتمام ${habit.name}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={onToggleCheckin}
          style={({ pressed }) => [
            styles.checkTarget,
            {
              minWidth: touchTarget,
              minHeight: touchTarget,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.checkCircle,
              {
                borderColor: isCompleted ? theme.primary : theme.textMuted,
                backgroundColor: isCompleted ? theme.primary : 'transparent',
              },
            ]}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
        </Pressable>

        {/* Center: Habit Details */}
        <View style={styles.textDetails}>
          <Text
            numberOfLines={1}
            style={[
              typography.bodyMedium,
              {
                color: isCompleted ? theme.textMuted : theme.text,
                textAlign: 'right',
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              },
            ]}
          >
            {habit.name}
          </Text>

          <View style={styles.metaRow}>
            {streak > 0 && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: theme.textSecondary,
                    textAlign: 'right',
                    marginLeft: 8,
                  },
                ]}
              >
                {streak} {streak === 1 ? 'يوم' : 'أيام'} متتالية
              </Text>
            )}

            <Text
              style={[
                typography.caption,
                {
                  color: theme.textMuted,
                  textAlign: 'right',
                },
              ]}
            >
              {habit.targetCount > 1
                ? `${habit.targetCount} ${habit.unit}`
                : habit.unit}
            </Text>

            {!habit.isActive && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: theme.textMuted,
                    textAlign: 'right',
                    marginRight: 8,
                  },
                ]}
              >
                • متوقفة
              </Text>
            )}
          </View>
        </View>

        {/* Left side in RTL: Quiet Category Icon */}
        <View style={styles.iconSide}>
          <Ionicons
            name={(habit.icon as any) || 'ellipse-outline'}
            size={18}
            color={isCompleted ? theme.textMuted : theme.textSecondary}
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  checkTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textDetails: {
    flex: 1,
    paddingHorizontal: 6,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 3,
  },
  iconSide: {
    paddingLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
