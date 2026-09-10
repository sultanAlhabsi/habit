import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'flat',
  ...rest
}) => {
  const { theme, radius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.lg,
          padding: spacing.base,
          backgroundColor: variant === 'flat' ? theme.card : theme.cardSecondary,
          borderWidth: 1,
          borderColor: theme.border,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
