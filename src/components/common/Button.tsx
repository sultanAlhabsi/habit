import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  iconName,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...rest
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; iconColor: string } => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: theme.cardSecondary,
            borderWidth: 1,
            borderColor: theme.border,
          },
          text: { color: theme.text },
          iconColor: theme.text,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.border,
          },
          text: { color: theme.text },
          iconColor: theme.text,
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: theme.destructiveLight,
            borderWidth: 1,
            borderColor: `${theme.destructive}30`,
          },
          text: { color: theme.destructive },
          iconColor: theme.destructive,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: theme.textSecondary },
          iconColor: theme.textSecondary,
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: theme.text, // Solid deep dark tone for primary action
          },
          text: { color: theme.card },
          iconColor: theme.card,
        };
    }
  };

  const getSizeStyles = (): { height: number; paddingHorizontal: number; fontSize: number } => {
    switch (size) {
      case 'sm':
        return { height: 38, paddingHorizontal: spacing.md, fontSize: 13 };
      case 'lg':
        return { height: 48, paddingHorizontal: spacing.xl, fontSize: 15 };
      case 'md':
      default:
        return { height: touchTarget, paddingHorizontal: spacing.base, fontSize: 14 };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: radius.md,
          opacity: pressed ? 0.8 : disabled ? 0.4 : 1,
        },
        variantStyle.container,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color} size="small" />
      ) : (
        <View style={styles.content}>
          {iconName && iconPosition === 'left' && (
            <Ionicons
              name={iconName}
              size={sizeStyle.fontSize + 3}
              color={variantStyle.iconColor}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              typography.subMedium,
              {
                color: variantStyle.text.color,
                fontSize: sizeStyle.fontSize,
                fontWeight: '500',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconName && iconPosition === 'right' && (
            <Ionicons
              name={iconName}
              size={sizeStyle.fontSize + 3}
              color={variantStyle.iconColor}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
