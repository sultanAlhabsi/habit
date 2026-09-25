import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../common/AppText';
import { AppSwitch } from '../common/AppSwitch';
import { useTheme } from '../../theme/ThemeContext';
import { triggerLightHaptic } from '../../utils/haptics';

export interface SettingRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  description?: string;
  type?: 'switch' | 'link' | 'button' | 'custom';
  value?: boolean;
  onValueChange?: (val: boolean) => void;
  onPress?: () => void;
  badgeText?: string | number;
  rightComponent?: React.ReactNode;
  isDestructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
  hideDivider?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  iconName,
  iconColor,
  iconBgColor,
  title,
  description,
  type = 'link',
  value = false,
  onValueChange,
  onPress,
  badgeText,
  rightComponent,
  isDestructive = false,
  disabled = false,
  loading = false,
  hideDivider = false,
}) => {
  const { isDark, theme, typography } = useTheme();

  const handleToggle = (newVal: boolean) => {
    if (disabled || loading) return;
    triggerLightHaptic();
    onValueChange?.(newVal);
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (type === 'switch') {
      handleToggle(!value);
      return;
    }
    triggerLightHaptic();
    onPress?.();
  };

  const resolvedIconColor = isDestructive
    ? theme.destructive
    : iconColor || (isDark ? theme.text : theme.primary);

  const resolvedIconBg = isDestructive
    ? isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2'
    : iconBgColor || (isDark ? 'rgba(255, 255, 255, 0.07)' : theme.primaryLight);

  return (
    <View style={styles.outerContainer}>
      <Pressable
        accessibilityRole={type === 'switch' ? 'switch' : 'button'}
        accessibilityState={{
          checked: type === 'switch' ? value : undefined,
          disabled,
        }}
        accessibilityLabel={`${title}${description ? `، ${description}` : ''}`}
        onPress={handlePress}
        disabled={disabled || (!onPress && type !== 'switch')}
        style={({ pressed }) => [
          styles.row,
          {
            opacity: disabled ? 0.45 : pressed && (type !== 'switch' || onPress) ? 0.7 : 1,
          },
        ]}
      >
        {/* Right side in RTL (Leading): Icon container + Text labels */}
        <View style={styles.infoContainer}>
          <View style={[styles.iconBox, { backgroundColor: resolvedIconBg, borderRadius: 10 }]}>
            <Ionicons name={iconName} size={18} color={resolvedIconColor} />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[
                typography.bodyMedium,
                {
                  color: isDestructive ? theme.destructive : theme.text,
                  textAlign: 'right',
                  fontWeight: '600',
                  fontSize: 14,
                  lineHeight: 20,
                },
              ]}
            >
              {title}
            </Text>
            {description ? (
              <Text
                style={[
                  typography.caption,
                  {
                    color: theme.textSecondary,
                    textAlign: 'right',
                    marginTop: 2,
                    fontSize: 11.5,
                    lineHeight: 16,
                  },
                ]}
              >
                {description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Left side in RTL (Trailing): Controls / Value / Navigation indicator */}
        <View style={styles.actionContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : type === 'switch' ? (
            <AppSwitch
              value={value}
              onValueChange={handleToggle}
              disabled={disabled}
              activeColor={theme.primary}
              accessibilityLabel={title}
            />
          ) : rightComponent ? (
            rightComponent
          ) : (
            <View style={styles.linkAffordance}>
              {badgeText !== undefined && badgeText !== null && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isDark ? '#262A30' : theme.cardSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: theme.textSecondary,
                        fontSize: 11.5,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {badgeText}
                  </Text>
                </View>
              )}
              {type === 'link' && (
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={theme.textMuted}
                  style={styles.chevron}
                />
              )}
            </View>
          )}
        </View>
      </Pressable>

      {!hideDivider && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark ? '#23272E' : theme.borderSubtle,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  infoContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  linkAffordance: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  chevron: {
    marginRight: 2,
  },
  divider: {
    height: 1,
    marginRight: 60, // Aligns flush after the icon box for modern inset grouped style
    marginLeft: 14,
  },
});
