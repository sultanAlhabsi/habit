import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Vibration,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Habit } from '../../types/habit';
import { toArabicNumerals } from '../../utils/habitUtils';

export interface StarterHabitDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetCount: number;
  unit: string;
  isDefaultSelected: boolean;
}

export const STARTER_HABITS: StarterHabitDefinition[] = [
  {
    id: 'starter_water',
    name: 'شرب ٨ أكواب ماء',
    description: 'ترطيب الجسم وتجديد النشاط والحيوية طوال اليوم',
    icon: 'water-outline',
    color: '#0369A1',
    targetCount: 8,
    unit: 'كوب',
    isDefaultSelected: true,
  },
  {
    id: 'starter_reading',
    name: 'قراءة ٢٠ صفحة',
    description: 'تغذية العقل وبناء عادة القراءة اليومية بهدوء',
    icon: 'book-outline',
    color: '#2A4B3A',
    targetCount: 20,
    unit: 'صفحة',
    isDefaultSelected: true,
  },
  {
    id: 'starter_exercise',
    name: '٣٠ دقيقة نشاط بدني',
    description: 'مشي خفيف، جري، أو تمارين رياضية لتنشيط الجسم',
    icon: 'fitness-outline',
    color: '#B45309',
    targetCount: 30,
    unit: 'دقيقة',
    isDefaultSelected: true,
  },
  {
    id: 'starter_mindfulness',
    name: 'أذكار واستراحة سكينة',
    description: 'لحظات صفاء ذهني واستحضار للهدوء النفسي',
    icon: 'sparkles-outline',
    color: '#6D28D9',
    targetCount: 1,
    unit: 'مرة',
    isDefaultSelected: false,
  },
  {
    id: 'starter_sleep',
    name: 'نوم هادئ مبكر',
    description: 'إغلاق الشاشات مبكراً لنوم عميق وصحي',
    icon: 'moon-outline',
    color: '#1E3A8A',
    targetCount: 1,
    unit: 'مرة',
    isDefaultSelected: false,
  },
];

interface OnboardingStarterPackProps {
  onComplete: (selected: Omit<Habit, 'id' | 'createdAt'>[]) => void;
  isRevisit?: boolean;
}

const StarterHabitRow: React.FC<{
  item: StarterHabitDefinition;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ item, isSelected, onToggle }) => {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const handlePress = () => {
    try {
      Vibration.vibrate(14);
    } catch {}
    scale.value = withSequence(
      withTiming(0.96, { duration: 70 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.habitItem,
          {
            backgroundColor: isDark
              ? isSelected
                ? '#1F2A22'
                : '#1B1B19'
              : isSelected
              ? '#F2F8F4'
              : '#FFFFFF',
            borderColor: isSelected
              ? theme.primary
              : isDark
              ? '#2A2A26'
              : '#ECEAE4',
          },
          animatedStyle,
        ]}
      >
        {/* Habit Icon */}
        <View
          style={[
            styles.habitIconBox,
            {
              backgroundColor: isSelected
                ? isDark
                  ? '#283B2E'
                  : '#E2EFE7'
                : isDark
                ? '#242422'
                : '#F4F3EF',
            },
          ]}
        >
          <Ionicons
            name={item.icon as any}
            size={22}
            color={isSelected ? theme.primary : theme.textMuted}
          />
        </View>

        {/* Info */}
        <View style={styles.habitDetails}>
          <Text style={[styles.habitName, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.habitDesc, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        </View>

        {/* Checkbox Pill */}
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: isSelected
                ? theme.primary
                : 'transparent',
              borderColor: isSelected
                ? theme.primary
                : isDark
                ? '#4A4A44'
                : '#D0CDC4',
            },
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

export const OnboardingStarterPack: React.FC<OnboardingStarterPackProps> = ({
  onComplete,
  isRevisit,
}) => {
  const { theme, isDark } = useTheme();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    STARTER_HABITS.filter((h) => h.isDefaultSelected).map((h) => h.id)
  );

  const toggleHabit = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleFinish = () => {
    const selectedHabits: Omit<Habit, 'id' | 'createdAt'>[] = STARTER_HABITS
      .filter((h) => selectedIds.includes(h.id))
      .map((h) => ({
        name: h.name,
        description: h.description,
        icon: h.icon,
        color: h.color,
        frequency: 'daily' as const,
        frequencyDays: [0, 1, 2, 3, 4, 5, 6],
        targetCount: h.targetCount,
        unit: h.unit,
        isActive: true,
      }));

    onComplete(selectedHabits);
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          ابدأ عاداتك فوراً 🌿
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          اخترنا لك عادات مبدئية أساسية لتنطلق بها.. يمكنك تخصيصها أو إزالتها بلمسة واحدة:
        </Text>
      </View>

      {/* Habits List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {STARTER_HABITS.map((item) => (
          <StarterHabitRow
            key={item.id}
            item={item}
            isSelected={selectedIds.includes(item.id)}
            onToggle={() => toggleHabit(item.id)}
          />
        ))}
      </ScrollView>

      {/* Bottom Confirm Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleFinish}
          style={({ pressed }) => [
            styles.finishButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={styles.finishButtonText}>
            {selectedIds.length > 0
              ? `انطلق الآن مع (${toArabicNumerals(selectedIds.length)}) عادات 🚀`
              : 'ابدأ بقائمة فارغة 🌿'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  listContent: {
    gap: 10,
    paddingBottom: 20,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  habitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  habitDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'left',
  },
  habitDesc: {
    fontSize: 11,
    textAlign: 'left',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  buttonContainer: {
    paddingVertical: 14,
  },
  finishButton: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2A4B3A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
