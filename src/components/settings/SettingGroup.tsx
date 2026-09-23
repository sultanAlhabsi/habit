import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text } from '../common/AppText';
import { useTheme } from '../../theme/ThemeContext';

interface SettingGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SettingGroup: React.FC<SettingGroupProps> = ({
  title,
  description,
  children,
  style,
}) => {
  const { theme, radius, typography, isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {title && (
        <View style={styles.titleContainer}>
          <Text
            style={[
              typography.caption,
              {
                color: isDark ? '#94A3B8' : theme.textSecondary,
                textAlign: 'right',
                fontWeight: '600',
                fontSize: 12,
                letterSpacing: 0.1,
                textTransform: 'uppercase',
              },
            ]}
          >
            {title}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderRadius: radius.lg || 16,
          },
        ]}
      >
        {children}
      </View>

      {description && (
        <Text
          style={[
            typography.caption,
            {
              color: theme.textMuted,
              textAlign: 'right',
              marginTop: 6,
              marginHorizontal: 12,
              fontSize: 11.5,
              lineHeight: 16,
            },
          ]}
        >
          {description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
    width: '100%',
  },
  titleContainer: {
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
