import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onActionPress,
  style,
}) => {
  const { theme, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl }, style]}>
      <Ionicons
        name={icon}
        size={32}
        color={theme.textMuted}
        style={{ marginBottom: spacing.md }}
      />

      <Text
        style={[
          typography.h3,
          {
            color: theme.text,
            textAlign: 'center',
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          typography.sub,
          {
            color: theme.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: actionTitle ? spacing.lg : 0,
            maxWidth: 280,
          },
        ]}
      >
        {description}
      </Text>

      {actionTitle && onActionPress ? (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="outline"
          size="sm"
          iconName="add"
          iconPosition="left"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
