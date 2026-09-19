import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, typography, touchTarget } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.base),
          paddingHorizontal: spacing.base,
          paddingBottom: spacing.sm,
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {onBackPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            onPress={onBackPress}
            style={({ pressed }) => [
              styles.backButton,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            {/* RTL back arrow */}
            <Ionicons name="chevron-forward" size={22} color={theme.text} />
          </Pressable>
        ) : (
          <View style={{ width: 8 }} />
        )}

        <View style={styles.titleContainer}>
          <Text
            numberOfLines={1}
            style={[
              typography.h2,
              { color: theme.text, textAlign: 'right' },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={[
                typography.sub,
                { color: theme.textSecondary, marginTop: 2, textAlign: 'right' },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <View style={styles.rightActionContainer}>{rightAction}</View>
        ) : (
          <View style={{ width: onBackPress ? touchTarget : 8 }} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
