import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface BadgeProps {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'neutral' | 'custom';
  customColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  iconName,
  variant = 'neutral',
  size = 'md',
  style,
}) => {
  const { theme, radius, spacing, typography } = useTheme();

  const isPrimary = variant === 'primary' || variant === 'accent' || variant === 'success';
  const isDanger = variant === 'danger';

  const bg = isDanger
    ? theme.destructiveLight
    : isPrimary
    ? theme.primaryLight
    : theme.cardSecondary;

  const textColor = isDanger
    ? theme.destructive
    : isPrimary
    ? theme.primary
    : theme.textSecondary;

  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: theme.border,
          borderRadius: radius.sm,
          paddingHorizontal: isSm ? 6 : spacing.sm,
          paddingVertical: isSm ? 2 : 3,
        },
        style,
      ]}
    >
      {iconName ? (
        <Ionicons
          name={iconName}
          size={isSm ? 11 : 13}
          color={textColor}
          style={{ marginRight: 3 }}
        />
      ) : null}
      <Text
        style={[
          isSm ? typography.caption : typography.sub,
          {
            color: textColor,
            fontSize: isSm ? 11 : 12,
            fontWeight: '500',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 0.5,
  },
});
