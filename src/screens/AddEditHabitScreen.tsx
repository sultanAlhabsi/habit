import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { appAlert } from '../services/alertService';
import { Text } from '../components/common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { ClockTimePicker } from '../components/common/ClockTimePicker';
import { AppSwitch } from '../components/common/AppSwitch';
import {
  DAYS_OF_WEEK_AR,
  HabitFrequency,
} from '../types/habit';
import { HABIT_PALETTES } from '../theme/colors';
import { isValidReminderTime } from '../utils/notificationUtils';
import { normalizeArabicNumerals, toArabicNumerals } from '../utils/habitUtils';
import { HabitTemplateModal } from '../components/habits/HabitTemplateModal';
import { HabitIconPickerModal } from '../components/habits/HabitIconPickerModal';
import {
  HabitTemplate,
  getHabitTemplateById,
} from '../utils/habitTemplates';
import {
  triggerLightHaptic,
  triggerMediumHaptic,
  triggerSuccessHaptic,
} from '../utils/haptics';
import {
  getHabitDraft,
  saveHabitDraft,
  deleteHabitDraft,
} from '../services/draftService';

interface AddEditHabitScreenProps {
  route: any;
  navigation: any;
}

export const AddEditHabitScreen: React.FC<AddEditHabitScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark, spacing, radius, typography, touchTarget } = useTheme();
  const { habits, addHabit, updateHabit, deleteHabit } = useHabitStore();

  const habitId = route.params?.habitId;
  const duplicateFromId = route.params?.duplicateFromId;
  const initialTemplateId = route.params?.initialTemplateId;
  const initialTemplate = initialTemplateId ? getHabitTemplateById(initialTemplateId) : null;

  const existingHabit = habitId ? habits.find((h) => h.id === habitId) : null;
  const duplicateSourceHabit = duplicateFromId ? habits.find((h) => h.id === duplicateFromId) : null;
  const isEditing = Boolean(existingHabit);
  const isDuplicating = Boolean(duplicateSourceHabit && !existingHabit);

  const templateHabit = existingHabit || duplicateSourceHabit;

  const [name, setName] = useState(
    existingHabit?.name ||
      (duplicateSourceHabit ? `${duplicateSourceHabit.name} (نسخة)` : '') ||
      (initialTemplate?.name || '')
  );
  const [description, setDescription] = useState(
    templateHabit?.description || initialTemplate?.description || ''
  );
  const [selectedIcon, setSelectedIcon] = useState(
    templateHabit?.icon || initialTemplate?.icon || 'fitness-outline'
  );
  const [selectedColor, setSelectedColor] = useState(
    templateHabit?.color || initialTemplate?.color || HABIT_PALETTES[0].hex
  );

  const initialFreq = templateHabit?.frequency || initialTemplate?.frequency || 'daily';
  const getInitialTab = (): 'daily' | 'weekly' | 'monthly' => {
    if (initialFreq === 'weekly_target' || initialFreq === 'specific_days') return 'weekly';
    if (initialFreq === 'monthly_day' || initialFreq === 'monthly_target') return 'monthly';
    return 'daily';
  };

  const [freqTab, setFreqTab] = useState<'daily' | 'weekly' | 'monthly'>(getInitialTab());
  const [weeklyMode, setWeeklyMode] = useState<'target' | 'specific_days'>(
    initialFreq === 'weekly_target' ? 'target' : 'specific_days'
  );
  const [monthlyMode, setMonthlyMode] = useState<'day' | 'target'>(
    initialFreq === 'monthly_target' ? 'target' : 'day'
  );
  const [weeklyTargetCount, setWeeklyTargetCount] = useState(
    String(templateHabit?.weeklyTargetCount || 3)
  );
  const [monthlyTargetCount, setMonthlyTargetCount] = useState(
    String(templateHabit?.monthlyTargetCount || 4)
  );
  const [monthlyDay, setMonthlyDay] = useState(
    String(templateHabit?.monthlyDay || 1)
  );
  const [frequency, setFrequency] = useState<HabitFrequency>(initialFreq);
  const [frequencyDays, setFrequencyDays] = useState<number[]>(
    templateHabit?.frequencyDays || initialTemplate?.frequencyDays || [0, 1, 2, 3, 4, 5, 6]
  );
  const [targetCount, setTargetCount] = useState(
    String(templateHabit?.targetCount || initialTemplate?.targetCount || '1')
  );
  const [unit, setUnit] = useState(
    templateHabit?.unit || initialTemplate?.unit || 'مرة'
  );
  const [reminderTime, setReminderTime] = useState(
    templateHabit?.reminderTime || initialTemplate?.reminderTime || '08:00'
  );
  const [hasReminder, setHasReminder] = useState(
    Boolean(templateHabit?.reminderTime || initialTemplate?.reminderTime)
  );
  const [isPinned, setIsPinned] = useState(Boolean(templateHabit?.isPinned));
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(
    Boolean(route.params?.openTemplates)
  );
  const [isIconModalVisible, setIsIconModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const quickChipsScrollRef = useRef<ScrollView>(null);

  // Restore draft if creating a new habit and unsaved draft exists
  useEffect(() => {
    let isMounted = true;
    if (!isEditing && !isDuplicating && !initialTemplate && !route.params?.openTemplates) {
      getHabitDraft('new').then((draft) => {
        if (!isMounted || !draft) return;
        if (draft.name?.trim() || draft.description?.trim()) {
          setName(draft.name || '');
          setDescription(draft.description || '');
          if (draft.selectedIcon) setSelectedIcon(draft.selectedIcon);
          if (draft.selectedColor) setSelectedColor(draft.selectedColor);
          if (draft.freqTab) setFreqTab(draft.freqTab);
          if (draft.weeklyMode) setWeeklyMode(draft.weeklyMode);
          if (draft.monthlyMode) setMonthlyMode(draft.monthlyMode);
          if (draft.weeklyTargetCount) setWeeklyTargetCount(draft.weeklyTargetCount);
          if (draft.monthlyTargetCount) setMonthlyTargetCount(draft.monthlyTargetCount);
          if (draft.monthlyDay) setMonthlyDay(draft.monthlyDay);
          if (draft.frequency) setFrequency(draft.frequency);
          if (draft.frequencyDays) setFrequencyDays(draft.frequencyDays);
          if (draft.targetCount) setTargetCount(draft.targetCount);
          if (draft.unit) setUnit(draft.unit);
          if (draft.reminderTime) setReminderTime(draft.reminderTime);
          if (draft.hasReminder !== undefined) setHasReminder(draft.hasReminder);
          if (draft.isPinned !== undefined) setIsPinned(draft.isPinned);
          setIsDraftRestored(true);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Autosave draft when form fields change (debounced 800ms)
  useEffect(() => {
    if (isEditing || isDuplicating || isSaving) return;
    if (!name.trim() && !description.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      saveHabitDraft(
        {
          name,
          description,
          selectedIcon,
          selectedColor,
          freqTab,
          weeklyMode,
          monthlyMode,
          weeklyTargetCount,
          monthlyTargetCount,
          monthlyDay,
          frequency,
          frequencyDays,
          targetCount,
          unit,
          reminderTime,
          hasReminder,
          isPinned,
        },
        'new'
      );
    }, 800);

    return () => clearTimeout(timer);
  }, [
    isEditing,
    isDuplicating,
    isSaving,
    name,
    description,
    selectedIcon,
    selectedColor,
    freqTab,
    weeklyMode,
    monthlyMode,
    weeklyTargetCount,
    monthlyTargetCount,
    monthlyDay,
    frequency,
    frequencyDays,
    targetCount,
    unit,
    reminderTime,
    hasReminder,
    isPinned,
  ]);

  const handleDiscardDraft = async () => {
    triggerLightHaptic();
    await deleteHabitDraft('new');
    setIsDraftRestored(false);
    setName('');
    setDescription('');
    setSelectedIcon('fitness-outline');
    setSelectedColor(HABIT_PALETTES[0].hex);
    setFreqTab('daily');
    setFrequency('daily');
    setFrequencyDays([0, 1, 2, 3, 4, 5, 6]);
    setTargetCount('1');
    setUnit('مرة');
    setReminderTime('08:00');
    setHasReminder(false);
    setIsPinned(false);
  };

  const applyTemplate = (template: HabitTemplate) => {
    triggerSuccessHaptic();
    setName(template.name);
    setDescription(template.description);
    setSelectedIcon(template.icon);
    setSelectedColor(template.color);
    setFrequency(template.frequency);
    setFrequencyDays(template.frequencyDays);
    if (template.frequency === 'specific_days') {
      setFreqTab('weekly');
      setWeeklyMode('specific_days');
    } else {
      setFreqTab('daily');
    }
    setTargetCount(String(template.targetCount));
    setUnit(template.unit);
    if (template.reminderTime) {
      setReminderTime(template.reminderTime);
      setHasReminder(true);
    } else {
      setHasReminder(false);
    }
  };

  const featuredTemplates = useMemo(() => {
    return [
      getHabitTemplateById('template_water'),
      getHabitTemplateById('template_quran'),
      getHabitTemplateById('template_reading'),
      getHabitTemplateById('template_exercise'),
      getHabitTemplateById('template_walk'),
    ].filter(Boolean) as HabitTemplate[];
  }, []);

  const commonUnits = ['مرة', 'دقيقة', 'صفحة', 'لتر', 'خطوة', 'كوب'];

  const toggleDay = (dayIndex: number) => {
    triggerLightHaptic();
    if (frequencyDays.includes(dayIndex)) {
      if (frequencyDays.length === 1) return; // Maintain at least one day
      setFrequencyDays(frequencyDays.filter((d) => d !== dayIndex));
    } else {
      setFrequencyDays([...frequencyDays, dayIndex].sort());
    }
  };

  const handleStepperChange = (delta: number) => {
    triggerLightHaptic();
    const current = parseInt(normalizeArabicNumerals(targetCount), 10) || 1;
    const next = Math.max(1, current + delta);
    setTargetCount(String(next));
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      appAlert('تنبيه', 'يرجى إدخال اسم العادة.');
      return;
    }

    const normalizedReminderTime = normalizeArabicNumerals(reminderTime);
    if (hasReminder && !isValidReminderTime(normalizedReminderTime)) {
      appAlert(
        'تنبيه',
        'يرجى تحديد وقت تذكير صحيح بتنسيق 24 ساعة (مثلاً 08:00 أو 20:30).'
      );
      return;
    }

    const parsedTarget = parseInt(normalizeArabicNumerals(targetCount), 10);
    const validTarget = isNaN(parsedTarget) || parsedTarget < 1 ? 1 : Math.min(99999, parsedTarget);

    const parsedWeeklyTarget = parseInt(normalizeArabicNumerals(weeklyTargetCount), 10);
    const validWeeklyTarget = isNaN(parsedWeeklyTarget) || parsedWeeklyTarget < 1 ? 3 : Math.min(7, parsedWeeklyTarget);

    const parsedMonthlyTarget = parseInt(normalizeArabicNumerals(monthlyTargetCount), 10);
    const validMonthlyTarget = isNaN(parsedMonthlyTarget) || parsedMonthlyTarget < 1 ? 4 : Math.min(31, parsedMonthlyTarget);

    const parsedMonthlyDay = parseInt(normalizeArabicNumerals(monthlyDay), 10);
    const validMonthlyDay = isNaN(parsedMonthlyDay) || parsedMonthlyDay < 1 ? 1 : Math.min(31, parsedMonthlyDay);

    const finalReminder = hasReminder ? normalizedReminderTime : null;

    const habitPayload = {
      name: trimmedName,
      description: description.trim() || undefined,
      icon: selectedIcon,
      color: selectedColor,
      frequency,
      frequencyDays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : frequencyDays,
      targetCount: validTarget,
      weeklyTargetCount: frequency === 'weekly_target' ? validWeeklyTarget : undefined,
      monthlyTargetCount: frequency === 'monthly_target' ? validMonthlyTarget : undefined,
      monthlyDay: frequency === 'monthly_day' ? validMonthlyDay : undefined,
      unit: unit.trim() || 'مرة',
      reminderTime: finalReminder,
      isPinned,
    };

    try {
      setIsSaving(true);
      triggerMediumHaptic();
      if (isEditing && existingHabit) {
        await updateHabit({
          ...existingHabit,
          ...habitPayload,
        });
      } else {
        await addHabit({
          ...habitPayload,
          isActive: true,
        });
        await deleteHabitDraft('new');
      }
      triggerSuccessHaptic();
      navigation.goBack();
    } catch (err) {
      setIsSaving(false);
      appAlert('خطأ', 'حدث خطأ أثناء حفظ العادة، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleDelete = () => {
    if (!existingHabit) return;
    appAlert(
      'حذف العادة',
      `هل أنت متأكد من حذف عادة "${existingHabit.name}" نهائيًا؟ سيتم حذف كافة السجلات التابعة لها ولا يمكن التراجع.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            triggerMediumHaptic();
            navigation.goBack();
            await deleteHabit(existingHabit.id);
          },
        },
      ]
    );
  };

  const currentPal = HABIT_PALETTES.find(
    (p) => p.hex.toLowerCase() === selectedColor.toLowerCase()
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title={isEditing ? 'تعديل العادة' : isDuplicating ? 'نسخ العادة' : 'عادة جديدة'}
        subtitle={
          isEditing
            ? existingHabit?.name
            : isDuplicating
            ? `نسخ من "${duplicateSourceHabit?.name}"`
            : undefined
        }
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.base,
          paddingBottom: insets.bottom + 100, // Extra space for sticky bottom bar
        }}
      >
        {/* Restored Draft Banner */}
        {isDraftRestored && !isEditing && !isDuplicating && (
          <View
            style={[
              styles.draftBanner,
              {
                backgroundColor: theme.isDark ? `${theme.primary}18` : `${theme.primary}10`,
                borderColor: theme.primary,
                borderRadius: radius.md,
                marginBottom: spacing.md,
                padding: spacing.md,
              },
            ]}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flex: 1 }}>
                <Ionicons name="document-text-outline" size={18} color={theme.primary} style={{ marginLeft: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.subMedium, { color: theme.text, textAlign: 'right', fontWeight: '700' }]}>
                    تم استرجاع مسودة غير محفوظة
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', fontSize: 11 }]}>
                    يمكنك متابعة التعديل أو بدء عادة جديدة
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="مسح المسودة والبدء من جديد"
                onPress={handleDiscardDraft}
                style={({ pressed }) => [
                  styles.discardDraftBtn,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.sm,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: '#EF4444', fontWeight: '600' }]}>
                  مسح المسودة
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Curated Habit Templates Quick Strip (When creating new habit) */}
        {!isEditing && !isDuplicating && (
          <View style={styles.templatesHeaderContainer}>
            <View style={styles.templatesTitleRow}>
              <View style={styles.templatesTextGroup}>
                <Text style={[typography.subMedium, { color: theme.text, textAlign: 'right', fontWeight: '700' }]}>
                  نماذج جاهزة سريعة ✨
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', fontSize: 11 }]}>
                  اختر نموذجًا لتعبئة الإعدادات فوراً
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تصفح جميع نماذج العادات الجاهزة"
                onPress={() => {
                  triggerLightHaptic();
                  setIsTemplateModalVisible(true);
                }}
                style={({ pressed }) => [
                  styles.browseTemplatesBtn,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderRadius: radius.full,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="sparkles-outline" size={13} color={theme.primary} style={{ marginLeft: 4 }} />
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                  تصفح الكل (24)
                </Text>
              </Pressable>
            </View>

            <ScrollView
              ref={quickChipsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onContentSizeChange={() => {
                quickChipsScrollRef.current?.scrollToEnd({ animated: false });
              }}
              contentContainerStyle={styles.quickChipsContent}
              style={{ marginTop: 8 }}
            >
              {featuredTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  accessibilityRole="button"
                  accessibilityLabel={`استخدام نموذج ${template.name}`}
                  onPress={() => applyTemplate(template)}
                  style={({ pressed }) => [
                    styles.quickTemplateChip,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      borderRadius: radius.full,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.quickChipIcon,
                      {
                        backgroundColor: `${template.color}20`,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <Ionicons name={template.icon as any} size={14} color={template.color} />
                  </View>
                  <Text style={[typography.caption, { color: theme.text, fontWeight: '600' }]}>
                    {template.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* المجموعة 1: الهوية والمظهر (Unified Identity Section)               */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <Card style={styles.insetGroupCard}>
          <View style={styles.identityRow}>
            {/* Interactive Icon Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تغيير أيقونة العادة"
              onPress={() => {
                triggerLightHaptic();
                setIsIconModalVisible(true);
              }}
              style={({ pressed }) => [
                styles.iconAvatarBtn,
                {
                  backgroundColor: selectedColor,
                  borderRadius: radius.lg,
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: selectedColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.35 : 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              <Ionicons name={selectedIcon as any} size={28} color="#FFFFFF" />
              <View
                style={[
                  styles.iconEditBadge,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <Ionicons name="pencil" size={10} color={theme.text} />
              </View>
            </Pressable>

            {/* Habit Name and Motivation Inputs */}
            <View style={styles.identityInputsColumn}>
              <TextInput
                placeholder="اسم العادة (مثلاً: قراءة، مشي...)"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                style={[
                  styles.nameInput,
                  typography.subMedium,
                  {
                    color: theme.text,
                    fontWeight: '700',
                  },
                ]}
              />

              <View style={[styles.inlineDivider, { backgroundColor: theme.borderSubtle }]} />

              <TextInput
                placeholder="ملاحظة أو الدافع (اختياري)..."
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
                style={[
                  styles.descInput,
                  typography.caption,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Color Palette Selector */}
          <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.paletteHeaderRow}>
            <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
              لون العادة
            </Text>
            {currentPal && (
              <Text style={[typography.caption, { color: selectedColor, fontWeight: '700' }]}>
                {currentPal.label}
              </Text>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorPaletteScroll}
            style={{ marginTop: 8 }}
          >
            {HABIT_PALETTES.map((colorItem) => {
              const isSelected = selectedColor.toLowerCase() === colorItem.hex.toLowerCase();
              return (
                <Pressable
                  key={colorItem.id}
                  accessibilityRole="button"
                  accessibilityLabel={colorItem.label}
                  onPress={() => {
                    triggerLightHaptic();
                    setSelectedColor(colorItem.hex);
                  }}
                  style={({ pressed }) => [
                    styles.colorCircleWrapper,
                    {
                      borderColor: isSelected ? colorItem.hex : 'transparent',
                      transform: [{ scale: pressed ? 0.92 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      {
                        backgroundColor: colorItem.hex,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* المجموعة 2: نظام التكرار والهدف (Schedule & Target Stepper)        */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <Card style={styles.insetGroupCard}>
          <View style={styles.groupHeaderRow}>
            <View style={[styles.groupHeaderIcon, { backgroundColor: `${selectedColor}18`, borderRadius: radius.sm }]}>
              <Ionicons name="calendar" size={16} color={selectedColor} />
            </View>
            <Text style={[typography.subMedium, { color: theme.text, fontWeight: '700', marginRight: 8 }]}>
              الجدول والتكرار
            </Text>
          </View>

          {/* Smooth iOS Segmented Control */}
          <View
            style={[
              styles.segmentedContainer,
              {
                backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary,
                borderColor: theme.border,
                borderRadius: radius.md,
              },
            ]}
          >
            {(['daily', 'weekly', 'monthly'] as const).map((tab) => {
              const isSelected = freqTab === tab;
              const label = tab === 'daily' ? 'يومية' : tab === 'weekly' ? 'أسبوعية' : 'شهرية';
              return (
                <Pressable
                  key={tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    triggerLightHaptic();
                    setFreqTab(tab);
                    if (tab === 'daily') setFrequency('daily');
                    if (tab === 'weekly') setFrequency(weeklyMode === 'target' ? 'weekly_target' : 'specific_days');
                    if (tab === 'monthly') setFrequency(monthlyMode === 'day' ? 'monthly_day' : 'monthly_target');
                  }}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: isSelected
                        ? isDark ? '#2D323B' : '#FFFFFF'
                        : 'transparent',
                      borderRadius: radius.sm,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isSelected ? (isDark ? 0.3 : 0.08) : 0,
                      shadowRadius: 2,
                      elevation: isSelected ? 2 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isSelected ? theme.text : theme.textMuted,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 13,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Daily Sub-Options */}
          {freqTab === 'daily' && (
            <View style={{ marginTop: 14 }}>
              <View
                style={{
                  backgroundColor: `${selectedColor}12`,
                  borderColor: `${selectedColor}30`,
                  borderWidth: 1,
                  borderRadius: radius.md,
                  padding: spacing.md,
                }}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="sunny-outline" size={16} color={selectedColor} style={{ marginLeft: 6 }} />
                  <Text style={[typography.subMedium, { color: theme.text, fontWeight: '700' }]}>
                    عادة يومية مستمرة
                  </Text>
                </View>
                <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', fontSize: 12, lineHeight: 18 }]}>
                  تتكرر هذه العادة يومياً طوال أيام الأسبوع.
                </Text>
              </View>
            </View>
          )}

          {/* Weekly Sub-Options */}
          {freqTab === 'weekly' && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.subPillsRow}>
                <Pressable
                  onPress={() => {
                    triggerLightHaptic();
                    setWeeklyMode('specific_days');
                    setFrequency('specific_days');
                  }}
                  style={[
                    styles.subPill,
                    {
                      backgroundColor: weeklyMode === 'specific_days' ? `${selectedColor}18` : theme.cardSecondary,
                      borderColor: weeklyMode === 'specific_days' ? selectedColor : theme.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: weeklyMode === 'specific_days' ? selectedColor : theme.textSecondary,
                        fontWeight: weeklyMode === 'specific_days' ? '700' : '500',
                      },
                    ]}
                  >
                    أيام محددة في الأسبوع
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerLightHaptic();
                    setWeeklyMode('target');
                    setFrequency('weekly_target');
                  }}
                  style={[
                    styles.subPill,
                    {
                      backgroundColor: weeklyMode === 'target' ? `${selectedColor}18` : theme.cardSecondary,
                      borderColor: weeklyMode === 'target' ? selectedColor : theme.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: weeklyMode === 'target' ? selectedColor : theme.textSecondary,
                        fontWeight: weeklyMode === 'target' ? '700' : '500',
                      },
                    ]}
                  >
                    هدف مرن (مرات في الأسبوع)
                  </Text>
                </Pressable>
              </View>

              {weeklyMode === 'specific_days' && (
                <View style={styles.daysContainer}>
                  <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 8, fontSize: 11 }]}>
                    اختر أيام التكرار:
                  </Text>
                  <View style={styles.daysRow}>
                    {DAYS_OF_WEEK_AR.map((day) => {
                      const isSelected = frequencyDays.includes(day.index);
                      return (
                        <Pressable
                          key={day.index}
                          accessibilityRole="button"
                          accessibilityLabel={day.name}
                          onPress={() => toggleDay(day.index)}
                          style={[
                            styles.dayCircle,
                            {
                              backgroundColor: isSelected ? selectedColor : theme.cardSecondary,
                              borderColor: isSelected ? selectedColor : theme.border,
                              borderRadius: radius.full,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isSelected ? '#FFFFFF' : theme.textSecondary,
                                fontWeight: isSelected ? '700' : '500',
                                fontSize: 12,
                              },
                            ]}
                          >
                            {day.short}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginTop: 8, fontSize: 11 }]}>
                    تكون العادة مستحقة في الأيام المحددة فقط.
                  </Text>
                </View>
              )}

              {weeklyMode === 'target' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 8 }]}>
                    كم مرة في الأسبوع؟
                  </Text>
                  <View style={styles.numberRow}>
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const isSel = weeklyTargetCount === String(num);
                      return (
                        <Pressable
                          key={num}
                          onPress={() => {
                            triggerLightHaptic();
                            setWeeklyTargetCount(String(num));
                          }}
                          style={[
                            styles.numberPill,
                            {
                              backgroundColor: isSel ? selectedColor : theme.cardSecondary,
                              borderColor: isSel ? selectedColor : theme.border,
                              borderRadius: radius.md,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isSel ? '#FFFFFF' : theme.text,
                                fontWeight: isSel ? '700' : '500',
                                fontSize: 13,
                              },
                            ]}
                          >
                            {num}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Monthly Sub-Options */}
          {freqTab === 'monthly' && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.subPillsRow}>
                <Pressable
                  onPress={() => {
                    triggerLightHaptic();
                    setMonthlyMode('day');
                    setFrequency('monthly_day');
                  }}
                  style={[
                    styles.subPill,
                    {
                      backgroundColor: monthlyMode === 'day' ? `${selectedColor}18` : theme.cardSecondary,
                      borderColor: monthlyMode === 'day' ? selectedColor : theme.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: monthlyMode === 'day' ? selectedColor : theme.textSecondary,
                        fontWeight: monthlyMode === 'day' ? '700' : '500',
                      },
                    ]}
                  >
                    يوم محدد في الشهر
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerLightHaptic();
                    setMonthlyMode('target');
                    setFrequency('monthly_target');
                  }}
                  style={[
                    styles.subPill,
                    {
                      backgroundColor: monthlyMode === 'target' ? `${selectedColor}18` : theme.cardSecondary,
                      borderColor: monthlyMode === 'target' ? selectedColor : theme.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: monthlyMode === 'target' ? selectedColor : theme.textSecondary,
                        fontWeight: monthlyMode === 'target' ? '700' : '500',
                      },
                    ]}
                  >
                    هدف مرن في الشهر
                  </Text>
                </Pressable>
              </View>

              {monthlyMode === 'day' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 8 }]}>
                    اختر يوم الشهر (مثلاً: 1 أو 25):
                  </Text>
                  <View style={styles.numberRow}>
                    {[1, 5, 10, 15, 20, 25, 28].map((num) => {
                      const isSel = monthlyDay === String(num);
                      return (
                        <Pressable
                          key={num}
                          onPress={() => {
                            triggerLightHaptic();
                            setMonthlyDay(String(num));
                          }}
                          style={[
                            styles.numberPill,
                            {
                              backgroundColor: isSel ? selectedColor : theme.cardSecondary,
                              borderColor: isSel ? selectedColor : theme.border,
                              borderRadius: radius.md,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isSel ? '#FFFFFF' : theme.text,
                                fontWeight: isSel ? '700' : '500',
                                fontSize: 13,
                              },
                            ]}
                          >
                            {num}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {monthlyMode === 'target' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 8 }]}>
                    عدد المرات شهرياً:
                  </Text>
                  <View style={styles.numberRow}>
                    {[2, 4, 8, 12, 15, 20].map((num) => {
                      const isSel = monthlyTargetCount === String(num);
                      return (
                        <Pressable
                          key={num}
                          onPress={() => {
                            triggerLightHaptic();
                            setMonthlyTargetCount(String(num));
                          }}
                          style={[
                            styles.numberPill,
                            {
                              backgroundColor: isSel ? selectedColor : theme.cardSecondary,
                              borderColor: isSel ? selectedColor : theme.border,
                              borderRadius: radius.md,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isSel ? '#FFFFFF' : theme.text,
                                fontWeight: isSel ? '700' : '500',
                                fontSize: 13,
                              },
                            ]}
                          >
                            {num}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Interactive Stepper & Unit (Apple Fitness Style) */}
          <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.groupHeaderRow}>
            <View style={[styles.groupHeaderIcon, { backgroundColor: `${selectedColor}18`, borderRadius: radius.sm }]}>
              <Ionicons name="flag" size={16} color={selectedColor} />
            </View>
            <View style={{ marginRight: 8, flex: 1 }}>
              <Text style={[typography.subMedium, { color: theme.text, fontWeight: '700', textAlign: 'right' }]}>
                الهدف اليومي والوحدة
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11, textAlign: 'right' }]}>
                الحد الأدنى المطلوب لإتمام العادة
              </Text>
            </View>
          </View>

          <View style={styles.stepperContainer}>
            {/* Stepper Controls */}
            <View
              style={[
                styles.stepperCard,
                {
                  backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary,
                  borderColor: theme.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إنقاص الهدف"
                onPress={() => handleStepperChange(-1)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.card,
                    borderRadius: radius.sm,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="remove" size={18} color={theme.text} />
              </Pressable>

              <TextInput
                value={targetCount}
                onChangeText={(v) => setTargetCount(toArabicNumerals(v))}
                keyboardType="number-pad"
                style={[
                  styles.stepperInput,
                  typography.h3,
                  {
                    color: theme.text,
                    fontWeight: '800',
                  },
                ]}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="زيادة الهدف"
                onPress={() => handleStepperChange(1)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.card,
                    borderRadius: radius.sm,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="add" size={18} color={theme.text} />
              </Pressable>
            </View>

            {/* Unit Input */}
            <View style={{ flex: 1 }}>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="الوحدة (مرة...)"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.unitInput,
                  typography.subMedium,
                  {
                    backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.md,
                    color: theme.text,
                    minHeight: touchTarget,
                    textAlign: 'right',
                  },
                ]}
              />
            </View>
          </View>

          {/* Quick Unit Pills */}
          <View style={styles.quickUnitsRow}>
            {commonUnits.map((u) => {
              const isSelected = unit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => {
                    triggerLightHaptic();
                    setUnit(u);
                  }}
                  style={[
                    styles.quickUnitPill,
                    {
                      backgroundColor: isSelected ? selectedColor : theme.cardSecondary,
                      borderColor: isSelected ? selectedColor : theme.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isSelected ? '#FFFFFF' : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 11,
                        textAlign: 'center',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {u}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* المجموعة 3: التذكيرات والتفضيلات (iOS Inset Grouped Rows)          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <Card style={styles.insetGroupCard}>
          {/* Row 1: Reminder */}
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceRightGroup}>
              <View style={[styles.prefIconBox, { backgroundColor: `${selectedColor}18`, borderRadius: radius.sm }]}>
                <Ionicons name="notifications" size={16} color={selectedColor} />
              </View>
              <View style={{ marginRight: 10, flex: 1 }}>
                <Text style={[typography.bodyMedium, { color: theme.text, fontWeight: '600', textAlign: 'right' }]}>
                  تذكير يومي
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11, textAlign: 'right' }]}>
                  إشعار ينبهك في الوقت المناسب
                </Text>
              </View>
            </View>

            <View style={styles.preferenceLeftGroup}>
              <AppSwitch
                value={hasReminder}
                onValueChange={(val) => setHasReminder(val)}
                activeColor={selectedColor}
                accessibilityLabel="تفعيل التذكير اليومي"
              />
            </View>
          </View>

          {hasReminder && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderSubtle }}>
              <ClockTimePicker
                value={reminderTime}
                color={selectedColor}
                onChange={(newTime) => {
                  triggerLightHaptic();
                  setReminderTime(newTime);
                }}
              />
            </View>
          )}

          <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Row 2: Pin to Top */}
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceRightGroup}>
              <View style={[styles.prefIconBox, { backgroundColor: `${selectedColor}18`, borderRadius: radius.sm }]}>
                <Ionicons name="pin" size={16} color={selectedColor} />
              </View>
              <View style={{ marginRight: 10, flex: 1 }}>
                <Text style={[typography.bodyMedium, { color: theme.text, fontWeight: '600', textAlign: 'right' }]}>
                  تثبيت في أعلى القائمة
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11, textAlign: 'right' }]}>
                  تظهر في مقدمة عاداتك اليومية دائماً
                </Text>
              </View>
            </View>

            <View style={styles.preferenceLeftGroup}>
              <AppSwitch
                value={isPinned}
                onValueChange={(val) => setIsPinned(val)}
                activeColor={selectedColor}
                accessibilityLabel="تثبيت في أعلى القائمة"
              />
            </View>
          </View>
        </Card>

        {/* Delete Habit (Only in Edit mode) */}
        {isEditing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="حذف العادة نهائيًا"
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteCard,
              {
                backgroundColor: isDark ? '#2C1517' : '#FEF2F2',
                borderColor: isDark ? '#5C2226' : '#FEE2E2',
                borderRadius: radius.md,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginLeft: 8 }} />
            <Text style={[typography.caption, { color: '#EF4444', fontWeight: '700' }]}>
              حذف العادة نهائيًا
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* الشريط السفلي الثابت (Floating Sticky Action CTA)                  */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <View
        style={[
          styles.stickyBottomBar,
          {
            backgroundColor: isDark ? '#16181B' : '#FFFFFF',
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 14),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: isDark ? 0.4 : 0.06,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isEditing ? 'تحديث العادة' : 'إنشاء العادة'}
          disabled={isSaving}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.primarySaveCta,
            {
              backgroundColor: selectedColor,
              borderRadius: radius.md,
              opacity: isSaving ? 0.6 : pressed ? 0.85 : 1,
              shadowColor: selectedColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            },
          ]}
        >
          <Ionicons
            name={isSaving ? 'sync' : isEditing ? 'checkmark-circle' : 'add-circle'}
            size={20}
            color="#FFFFFF"
            style={{ marginLeft: 8 }}
          />
          <Text style={[typography.subMedium, { color: '#FFFFFF', fontWeight: '800' }]}>
            {isSaving ? 'جارٍ الحفظ...' : isEditing ? 'تحديث العادة' : 'إنشاء العادة'}
          </Text>
        </Pressable>
      </View>

      {/* Modals */}
      <HabitIconPickerModal
        visible={isIconModalVisible}
        selectedIcon={selectedIcon}
        selectedColor={selectedColor}
        onSelectIcon={(iconName) => setSelectedIcon(iconName)}
        onClose={() => setIsIconModalVisible(false)}
      />

      <HabitTemplateModal
        visible={isTemplateModalVisible}
        onClose={() => setIsTemplateModalVisible(false)}
        onSelectTemplate={applyTemplate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  templatesHeaderContainer: {
    marginBottom: 14,
  },
  templatesTitleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templatesTextGroup: {
    flex: 1,
  },
  browseTemplatesBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  quickChipsContent: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  quickTemplateChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  quickChipIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  insetGroupCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
  },
  identityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  iconAvatarBtn: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 14,
  },
  iconEditBadge: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  identityInputsColumn: {
    flex: 1,
  },
  nameInput: {
    textAlign: 'right',
    paddingVertical: 4,
    fontSize: 16,
  },
  inlineDivider: {
    height: 1,
    marginVertical: 4,
  },
  descInput: {
    textAlign: 'right',
    paddingVertical: 4,
    fontSize: 12,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 14,
  },
  paletteHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  colorPaletteScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  colorCircleWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupHeaderIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedContainer: {
    flexDirection: 'row-reverse',
    padding: 3,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPillsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  subPill: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  daysContainer: {
    marginTop: 12,
  },
  daysRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCircle: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    maxWidth: 44,
  },
  numberRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  numberPill: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepperContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  stepperCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 6,
    height: 48,
    borderWidth: 1,
    width: 140,
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    textAlign: 'center',
    fontSize: 18,
    minWidth: 40,
  },
  unitInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  quickUnitsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  quickUnitPill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  preferenceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceRightGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  preferenceLeftGroup: {
    marginLeft: 10,
  },
  prefIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  primarySaveCta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  draftBanner: {
    borderWidth: 1,
  },
  discardDraftBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
});
