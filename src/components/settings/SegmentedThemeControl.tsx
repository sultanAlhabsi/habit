import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../common/AppText';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import { triggerLightHaptic } from '../../utils/haptics';

interface SegmentedThemeControlProps {
  currentMode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export const SegmentedThemeControl: React.FC<SegmentedThemeControlProps> = ({
  currentMode,
  onChange,
}) => {
  const { isDark, theme, radius, typography } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'فاتح', icon: 'sunny-outline' },
    { mode: 'dark', label: 'داكن', icon: 'moon-outline' },
    { mode: 'system', label: 'تلقائي', icon: 'phone-portrait-outline' },
  ];

  const handleSelect = (mode: ThemeMode) => {
    if (mode === currentMode) return;
    triggerLightHaptic();
    onChange(mode);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary,
          borderColor: theme.border,
          borderRadius: radius.md,
        },
      ]}
      accessibilityRole="radiogroup"
    >
      {options.map((opt) => {
        const isSelected = currentMode === opt.mode;

        // Visual design for selected segment: soft elevation, comfortable dark surface without glare
        const activeBgColor = isDark ? '#2D323B' : '#FFFFFF';
        const activeBorderColor = isDark ? '#3D4450' : 'rgba(0,0,0,0.06)';

        return (
          <Pressable
            key={opt.mode}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`اختيار مظهر ${opt.label}`}
            onPress={() => handleSelect(opt.mode)}
            style={({ pressed }) => [
              styles.optionPill,
              {
                borderRadius: radius.sm,
                backgroundColor: isSelected ? activeBgColor : 'transparent',
                borderColor: isSelected ? activeBorderColor : 'transparent',
                borderWidth: isSelected ? 1 : 0,
                opacity: pressed ? 0.75 : 1,
              },
              isSelected && styles.activeShadow,
            ]}
          >
            <Ionicons
              name={opt.icon}
              size={14}
              color={isSelected ? (isDark ? '#F8FAFC' : theme.primary) : theme.textSecondary}
              style={{ marginLeft: 5 }}
            />
            <Text
              style={[
                typography.caption,
                {
                  color: isSelected ? theme.text : theme.textSecondary,
                  fontWeight: isSelected ? '600' : '400',
                  fontSize: 11.5,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    padding: 3,
    borderWidth: 1,
    gap: 4,
  },
  optionPill: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
