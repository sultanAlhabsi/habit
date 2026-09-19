import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { appAlert } from '../services/alertService';
import { Text } from '../components/common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useHabitStore } from '../store/useHabitStore';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import {
  AVAILABLE_ICONS,
  DAYS_OF_WEEK_AR,
  HABIT_CATEGORIES,
  HabitFrequency,
} from '../types/habit';
import { HABIT_PALETTES } from '../theme/colors';
import { isValidReminderTime } from '../utils/notificationUtils';
import { normalizeArabicNumerals, toArabicNumerals } from '../utils/habitUtils';
import { HabitTemplateModal } from '../components/habits/HabitTemplateModal';
import {
  HabitTemplate,
  getHabitTemplateById,
} from '../utils/habitTemplates';


interface AddEditHabitScreenProps {
  route: any;
  navigation: any;
}

export const AddEditHabitScreen: React.FC<AddEditHabitScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, radius, typography, touchTarget } = useTheme();
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
  const [iconCategoryFilter, setIconCategoryFilter] = useState<string>('الكل');
  const [selectedColor, setSelectedColor] = useState(
    templateHabit?.color || initialTemplate?.color || HABIT_PALETTES[0].hex
  );
  const initialFreq = templateHabit?.frequency || initialTemplate?.frequency || 'daily';
  const getInitialTab = (): 'daily' | 'weekly' | 'monthly' => {
    if (initialFreq === 'weekly_target') return 'weekly';
    if (initialFreq === 'monthly_day' || initialFreq === 'monthly_target') return 'monthly';
    return 'daily';
  };

  const [freqTab, setFreqTab] = useState<'daily' | 'weekly' | 'monthly'>(getInitialTab());
  const [weeklyMode, setWeeklyMode] = useState<'target' | 'specific_day'>(
    initialFreq === 'specific_days' && (templateHabit?.frequencyDays?.length === 1)
      ? 'specific_day'
      : 'target'
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
  const [isSaving, setIsSaving] = useState(false);

  const applyTemplate = (template: HabitTemplate) => {
    setName(template.name);
    setDescription(template.description);
    setSelectedIcon(template.icon);
    setSelectedColor(template.color);
    setFrequency(template.frequency);
    setFrequencyDays(template.frequencyDays);
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
    ].filter(Boolean) as HabitTemplate[];
  }, []);

  const commonUnits = ['مرة', 'دقيقة', 'لتر', 'صفحة', 'خطوة', 'كوب'];

  const quickReminderTimes = [
    { time: '06:30', label: '٠٦:٣٠ ص' },
    { time: '08:00', label: '٠٨:٠٠ ص' },
    { time: '13:30', label: '٠١:٣٠ م' },
    { time: '18:00', label: '٠٦:٠٠ م' },
    { time: '21:30', label: '٠٩:٣٠ م' },
  ];

  const toggleDay = (dayIndex: number) => {
    if (frequencyDays.includes(dayIndex)) {
      if (frequencyDays.length === 1) {
        appAlert('تنبيه', 'يجب اختيار يوم واحد على الأقل للعادة');
        return;
      }
      setFrequencyDays(frequencyDays.filter((d) => d !== dayIndex));
    } else {
      setFrequencyDays([...frequencyDays, dayIndex].sort());
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      appAlert('تنبيه', 'يرجى إدخال اسم العادة');
      return;
    }

    const normalizedReminderTime = normalizeArabicNumerals(reminderTime);
    if (hasReminder) {
      if (!isValidReminderTime(normalizedReminderTime)) {
        appAlert(
          'تنبيه',
          'يرجى إدخال وقت صحيح للتنبيه بصيغة 24 ساعة (مثال: 08:30 أو 20:00)'
        );
        return;
      }
    }

    const normalizedTargetStr = normalizeArabicNumerals(targetCount);
    const parsedTarget = parseInt(normalizedTargetStr, 10);
    const validTarget = isNaN(parsedTarget) || parsedTarget < 1 ? 1 : parsedTarget;

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
      }
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
            navigation.goBack();
            await deleteHabit(existingHabit.id);
          },
        },
      ]
    );
  };

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
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="حفظ"
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.headerSaveBtn,
              { opacity: isSaving ? 0.4 : pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[typography.subMedium, { color: theme.text, fontWeight: '600' }]}>
              {isSaving ? 'جارٍ الحفظ...' : 'حفظ'}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.base,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Curated Habit Templates Quick Picker */}
        {!isEditing && !isDuplicating && (
          <Card
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: theme.border,
                marginBottom: spacing.base,
              },
            ]}
          >
            <View style={styles.templateCardHeaderRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تصفح جميع نماذج العادات الجاهزة"
                onPress={() => setIsTemplateModalVisible(true)}
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

              <View style={styles.templateCardTitleGroup}>
                <Text style={[typography.subMedium, { color: theme.text, textAlign: 'right', fontWeight: '700' }]}>
                  نماذج عادات جاهزة ✨
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', fontSize: 11 }]}>
                  اختر نموذجًا لتعبئة الإعدادات تلقائيًا
                </Text>
              </View>
            </View>

            {/* Quick Chips of popular habits */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsContent}
              style={{ marginTop: 10 }}
            >
              {featuredTemplates.map((template) => {
                return (
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
                        borderRadius: radius.md,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.quickChipIcon,
                        {
                          backgroundColor: `${template.color}15`,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Ionicons name={template.icon as any} size={15} color={template.color} />
                    </View>
                    <Text style={[typography.caption, { color: theme.text, fontWeight: '600', marginRight: 6 }]}>
                      {template.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card>
        )}

        {/* Basic Info */}
        <Card style={styles.sectionCard}>
          <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6 }]}>
            اسم العادة
          </Text>
          <TextInput
            placeholder="قراءة كتاب، شرب ماء، مشي..."
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
            style={[
              styles.input,
              typography.body,
              {
                color: theme.text,
                borderColor: theme.border,
                borderRadius: radius.sm,
                backgroundColor: theme.background,
                minHeight: touchTarget,
              },
            ]}
          />

          <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginTop: 14, marginBottom: 6 }]}>
            ملاحظات أو الدافع (اختياري)
          </Text>
          <TextInput
            placeholder="ملاحظة تذكيرية..."
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            style={[
              styles.input,
              typography.body,
              {
                color: theme.text,
                borderColor: theme.border,
                borderRadius: radius.sm,
                backgroundColor: theme.background,
                minHeight: touchTarget,
              },
            ]}
          />
        </Card>

        {/* Color Palette (Subtle & Earthy) */}
        <Card style={styles.sectionCard}>
          <View
            style={{
              flexDirection: 'row-reverse',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              اللون
            </Text>
            {(() => {
              const currentPal = HABIT_PALETTES.find(
                (p) => p.hex.toLowerCase() === selectedColor.toLowerCase()
              );
              return currentPal ? (
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '600' }]}>
                  {currentPal.label}
                </Text>
              ) : null;
            })()}
          </View>
          <View style={styles.colorRow}>
            {HABIT_PALETTES.map((colorItem) => {
              const isSelected = selectedColor === colorItem.hex;
              return (
                <Pressable
                  key={colorItem.id}
                  accessibilityRole="button"
                  accessibilityLabel={colorItem.label}
                  onPress={() => setSelectedColor(colorItem.hex)}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: colorItem.hex,
                      borderColor: isSelected ? theme.text : 'transparent',
                      borderWidth: isSelected ? 2.5 : 0,
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Icons Grid */}
        <Card style={styles.sectionCard}>
          <View
            style={{
              flexDirection: 'row-reverse',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              الأيقونة
            </Text>
            {(() => {
              const currentOpt = AVAILABLE_ICONS.find((i) => i.name === selectedIcon);
              return currentOpt ? (
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '600' }]}>
                  {currentOpt.label} • {currentOpt.category}
                </Text>
              ) : null;
            })()}
          </View>
          {/* Category Filter Chips for Icons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsContainer}
            style={{ marginBottom: 12 }}
          >
            {HABIT_CATEGORIES.map((cat) => {
              const isCatSelected = iconCategoryFilter === cat;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityLabel={`تصنيف ${cat}`}
                  onPress={() => setIconCategoryFilter(cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isCatSelected ? theme.primary : theme.cardSecondary,
                      borderColor: isCatSelected ? theme.primary : theme.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isCatSelected ? '#FFFFFF' : theme.textSecondary,
                        fontWeight: isCatSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.iconGrid}>
            {(iconCategoryFilter === 'الكل'
              ? AVAILABLE_ICONS
              : AVAILABLE_ICONS.filter((item) => item.category === iconCategoryFilter)
            ).map((item) => {
              const isSelected = selectedIcon === item.name;
              return (
                <Pressable
                  key={item.name}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => setSelectedIcon(item.name)}
                  style={[
                    styles.iconBox,
                    {
                      borderRadius: radius.sm,
                      backgroundColor: isSelected ? theme.text : 'transparent',
                      borderColor: theme.border,
                      borderWidth: isSelected ? 0 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.name as any}
                    size={20}
                    color={isSelected ? theme.background : theme.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Frequency & Schedule */}
        <Card style={styles.sectionCard}>
          <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 10 }]}>
            نظام تكرار العادة
          </Text>

          {/* 3 Main Tabs: Daily / Weekly / Monthly */}
          <View style={styles.mainTabRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="عادة يومية"
              onPress={() => {
                setFreqTab('daily');
                setFrequency('daily');
              }}
              style={[
                styles.mainTabBtn,
                {
                  backgroundColor: freqTab === 'daily' ? theme.text : theme.background,
                  borderColor: theme.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: freqTab === 'daily' ? theme.background : theme.text,
                    fontWeight: freqTab === 'daily' ? '700' : '500',
                  },
                ]}
              >
                يومية
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="عادة أسبوعية"
              onPress={() => {
                setFreqTab('weekly');
                setFrequency(weeklyMode === 'target' ? 'weekly_target' : 'specific_days');
              }}
              style={[
                styles.mainTabBtn,
                {
                  backgroundColor: freqTab === 'weekly' ? theme.text : theme.background,
                  borderColor: theme.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: freqTab === 'weekly' ? theme.background : theme.text,
                    fontWeight: freqTab === 'weekly' ? '700' : '500',
                  },
                ]}
              >
                أسبوعية
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="عادة شهرية"
              onPress={() => {
                setFreqTab('monthly');
                setFrequency(monthlyMode === 'day' ? 'monthly_day' : 'monthly_target');
              }}
              style={[
                styles.mainTabBtn,
                {
                  backgroundColor: freqTab === 'monthly' ? theme.text : theme.background,
                  borderColor: theme.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: freqTab === 'monthly' ? theme.background : theme.text,
                    fontWeight: freqTab === 'monthly' ? '700' : '500',
                  },
                ]}
              >
                شهرية
              </Text>
            </Pressable>
          </View>

          {/* Sub-options for DAILY */}
          {freqTab === 'daily' && (
            <View style={{ marginTop: 8 }}>
              <View style={styles.frequencyTypeRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setFrequency('daily')}
                  style={[
                    styles.freqBtn,
                    {
                      backgroundColor: frequency === 'daily' ? theme.cardSecondary : theme.background,
                      borderColor: frequency === 'daily' ? theme.primary : theme.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: frequency === 'daily' ? theme.primary : theme.textSecondary,
                        fontWeight: frequency === 'daily' ? '600' : '400',
                      },
                    ]}
                  >
                    كل يوم
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setFrequency('specific_days')}
                  style={[
                    styles.freqBtn,
                    {
                      backgroundColor: frequency === 'specific_days' ? theme.cardSecondary : theme.background,
                      borderColor: frequency === 'specific_days' ? theme.primary : theme.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: frequency === 'specific_days' ? theme.primary : theme.textSecondary,
                        fontWeight: frequency === 'specific_days' ? '600' : '400',
                      },
                    ]}
                  >
                    أيام محددة
                  </Text>
                </Pressable>
              </View>

              {frequency === 'specific_days' && (
                <View style={styles.daysSelectorRow}>
                  {DAYS_OF_WEEK_AR.map((day) => {
                    const isDaySelected = frequencyDays.includes(day.index);
                    return (
                      <Pressable
                        key={day.index}
                        accessibilityRole="button"
                        accessibilityLabel={day.name}
                        onPress={() => toggleDay(day.index)}
                        style={[
                          styles.daySelectPill,
                          {
                            borderRadius: radius.sm,
                            backgroundColor: isDaySelected ? theme.text : theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isDaySelected ? theme.background : theme.textSecondary,
                              fontWeight: isDaySelected ? '600' : '400',
                              fontSize: 11,
                            },
                          ]}
                        >
                          {day.short}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Sub-options for WEEKLY */}
          {freqTab === 'weekly' && (
            <View style={{ marginTop: 8 }}>
              <View style={styles.frequencyTypeRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setWeeklyMode('target');
                    setFrequency('weekly_target');
                  }}
                  style={[
                    styles.freqBtn,
                    {
                      backgroundColor: weeklyMode === 'target' ? theme.cardSecondary : theme.background,
                      borderColor: weeklyMode === 'target' ? theme.primary : theme.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: weeklyMode === 'target' ? theme.primary : theme.textSecondary,
                        fontWeight: weeklyMode === 'target' ? '600' : '400',
                      },
                    ]}
                  >
                    هدف مرن (مرات في الأسبوع)
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setWeeklyMode('specific_day');
                    setFrequency('specific_days');
                    if (frequencyDays.length !== 1) {
                      setFrequencyDays([5]); // الجمعة كافتراضي
                    }
                  }}
                  style={[
                    styles.freqBtn,
                    {
                      backgroundColor: weeklyMode === 'specific_day' ? theme.cardSecondary : theme.background,
                      borderColor: weeklyMode === 'specific_day' ? theme.primary : theme.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: weeklyMode === 'specific_day' ? theme.primary : theme.textSecondary,
                        fontWeight: weeklyMode === 'specific_day' ? '600' : '400',
                      },
                    ]}
                  >
                    يوم محدد في الأسبوع
                  </Text>
                </Pressable>
              </View>

              {weeklyMode === 'target' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6 }]}>
                    عدد المرات المطلوبة أسبوعيًا
                  </Text>
                  <View style={styles.numberRow}>
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const isSel = weeklyTargetCount === String(num);
                      return (
                        <Pressable
                          key={num}
                          accessibilityRole="button"
                          onPress={() => setWeeklyTargetCount(String(num))}
                          style={[
                            styles.numPill,
                            {
                              backgroundColor: isSel ? theme.text : theme.background,
                              borderColor: theme.border,
                              borderRadius: radius.sm,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isSel ? theme.background : theme.text,
                                fontWeight: isSel ? '700' : '500',
                              },
                            ]}
                          >
                            {num}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginTop: 10, marginBottom: 6 }]}>
                    أيام التنبيه المقترحة (اختياري)
                  </Text>
                  <View style={styles.daysSelectorRow}>
                    {DAYS_OF_WEEK_AR.map((day) => {
                      const isDaySelected = frequencyDays.includes(day.index);
                      return (
                        <Pressable
                          key={day.index}
                          accessibilityRole="button"
                          accessibilityLabel={day.name}
                          onPress={() => toggleDay(day.index)}
                          style={[
                            styles.daySelectPill,
                            {
                              borderRadius: radius.sm,
                              backgroundColor: isDaySelected ? theme.text : theme.background,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isDaySelected ? theme.background : theme.textSecondary,
                                fontWeight: isDaySelected ? '600' : '400',
                                fontSize: 11,
                              },
                            ]}
                          >
                            {day.short}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {weeklyMode === 'specific_day' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6 }]}>
                    اختر يوم الأسبوع للعادة
                  </Text>
                  <View style={styles.daysSelectorRow}>
                    {DAYS_OF_WEEK_AR.map((day) => {
                      const isDaySelected = frequencyDays.length === 1 && frequencyDays[0] === day.index;
                      return (
                        <Pressable
                          key={day.index}
                          accessibilityRole="button"
                          accessibilityLabel={day.name}
                          onPress={() => setFrequencyDays([day.index])}
                          style={[
                            styles.daySelectPill,
                            {
                              borderRadius: radius.sm,
                              backgroundColor: isDaySelected ? theme.text : theme.background,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isDaySelected ? theme.background : theme.textSecondary,
                                fontWeight: isDaySelected ? '600' : '400',
                                fontSize: 11,
                              },
                            ]}
                          >
                            {day.short}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Sub-options for MONTHLY */}
          {freqTab === 'monthly' && (
            <View style={{ marginTop: 8 }}>
              <View style={styles.frequencyTypeRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setMonthlyMode('day');
                    setFrequency('monthly_day');
                  }}
                  style={[
                    styles.freqBtn,
                    {
                      backgroundColor: monthlyMode === 'day' ? theme.cardSecondary : theme.background,
                      borderColor: monthlyMode === 'day' ? theme.primary : theme.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: monthlyMode === 'day' ? theme.primary : theme.textSecondary,
                        fontWeight: monthlyMode === 'day' ? '600' : '400',
                      },
                    ]}
                  >
                    يوم محدد في الشهر
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setMonthlyMode('target');
                    setFrequency('monthly_target');
                  }}
                  style={[
                    styles.freqBtn,
                    {
                      backgroundColor: monthlyMode === 'target' ? theme.cardSecondary : theme.background,
                      borderColor: monthlyMode === 'target' ? theme.primary : theme.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: monthlyMode === 'target' ? theme.primary : theme.textSecondary,
                        fontWeight: monthlyMode === 'target' ? '600' : '400',
                      },
                    ]}
                  >
                    هدف مرن في الشهر
                  </Text>
                </Pressable>
              </View>

              {monthlyMode === 'day' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6 }]}>
                    اختر يوم الشهر (مثلاً: 1 أو 25)
                  </Text>
                  <View style={styles.numberRow}>
                    {[1, 5, 10, 15, 20, 25, 28].map((num) => {
                      const isSel = monthlyDay === String(num);
                      return (
                        <Pressable
                          key={num}
                          accessibilityRole="button"
                          onPress={() => setMonthlyDay(String(num))}
                          style={[
                            styles.numPill,
                            {
                              backgroundColor: isSel ? theme.text : theme.background,
                              borderColor: theme.border,
                              borderRadius: radius.sm,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isSel ? theme.background : theme.text,
                                fontWeight: isSel ? '700' : '500',
                              },
                            ]}
                          >
                            {num}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={[styles.customInputRow, { marginTop: 8 }]}>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      يوم محدد آخر (1 - 31):
                    </Text>
                    <TextInput
                      value={monthlyDay}
                      onChangeText={(v) => setMonthlyDay(toArabicNumerals(v))}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={[
                        styles.inlineInput,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                          color: theme.text,
                          borderRadius: radius.sm,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {monthlyMode === 'target' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6 }]}>
                    عدد المرات المطلوبة خلال الشهر
                  </Text>
                  <View style={styles.numberRow}>
                    {[2, 4, 8, 12, 15, 20].map((num) => {
                      const isSel = monthlyTargetCount === String(num);
                      return (
                        <Pressable
                          key={num}
                          accessibilityRole="button"
                          onPress={() => setMonthlyTargetCount(String(num))}
                          style={[
                            styles.numPill,
                            {
                              backgroundColor: isSel ? theme.text : theme.background,
                              borderColor: theme.border,
                              borderRadius: radius.sm,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: isSel ? theme.background : theme.text,
                                fontWeight: isSel ? '700' : '500',
                              },
                            ]}
                          >
                            {num}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={[styles.customInputRow, { marginTop: 8 }]}>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      عدد مرات مخصص:
                    </Text>
                    <TextInput
                      value={monthlyTargetCount}
                      onChangeText={(v) => setMonthlyTargetCount(toArabicNumerals(v))}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={[
                        styles.inlineInput,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                          color: theme.text,
                          borderRadius: radius.sm,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Target and Unit */}
        <Card style={styles.sectionCard}>
          <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6 }]}>
            الحد الأدنى اليومي للإنجاز
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 10, fontSize: 11 }]}>
            إذا حددت كمية (مثل: 10 صفحات)، يمكنك تسجيل أي عدد يومياً ولن تُعتبر العادة مكتملة إلا عند بلوغ الحد الأدنى.
          </Text>

          <View style={styles.targetRow}>
            {/* Number on right in RTL */}
            <View style={{ width: 80 }}>
              <TextInput
                value={targetCount}
                onChangeText={(v) => setTargetCount(toArabicNumerals(v))}
                keyboardType="numeric"
                style={[
                  styles.input,
                  typography.body,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    borderRadius: radius.sm,
                    backgroundColor: theme.background,
                    textAlign: 'center',
                    minHeight: touchTarget,
                  },
                ]}
              />
            </View>

            {/* Unit on left in RTL */}
            <View style={{ flex: 1 }}>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="الوحدة (مرة، دقيقة...)"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  typography.body,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    borderRadius: radius.sm,
                    backgroundColor: theme.background,
                    textAlign: 'right',
                    minHeight: touchTarget,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.quickUnitsRow}>
            {commonUnits.map((u) => (
              <Pressable
                key={u}
                onPress={() => setUnit(u)}
                style={[
                  styles.unitPill,
                  {
                    backgroundColor: unit === u ? theme.text : theme.background,
                    borderColor: theme.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: unit === u ? theme.background : theme.textSecondary,
                      fontSize: 11,
                    },
                  ]}
                >
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Reminder */}
        <Card style={styles.sectionCard}>
          <View style={styles.reminderHeader}>
            <Pressable
              onPress={() => setHasReminder(!hasReminder)}
              style={[
                styles.togglePill,
                {
                  backgroundColor: hasReminder ? theme.text : theme.cardSecondary,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: hasReminder ? theme.background : theme.textSecondary, fontWeight: '500' },
                ]}
              >
                {hasReminder ? 'مفعّل' : 'معطل'}
              </Text>
            </Pressable>

            <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right' }]}>
              تذكير يومي
            </Text>
          </View>

          {hasReminder && (
            <View style={{ marginTop: 10 }}>
              <TextInput
                value={reminderTime}
                onChangeText={(v) => setReminderTime(toArabicNumerals(v))}
                placeholder="08:00"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  typography.body,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    borderRadius: radius.sm,
                    backgroundColor: theme.background,
                    textAlign: 'center',
                    minHeight: touchTarget,
                  },
                ]}
              />

              <View style={styles.quickReminderRow}>
                {quickReminderTimes.map((item) => (
                  <Pressable
                    key={item.time}
                    onPress={() => setReminderTime(item.time)}
                    style={[
                      styles.unitPill,
                      {
                        backgroundColor:
                          reminderTime === item.time ? theme.text : theme.background,
                        borderColor: theme.border,
                        borderRadius: radius.sm,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color:
                            reminderTime === item.time
                              ? theme.background
                              : theme.textSecondary,
                          fontSize: 11,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Cornerstone Habit / Pin to Top */}
        <Card style={styles.sectionCard}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isPinned }}
            accessibilityLabel="تثبيت العادة في أعلى القائمة"
            onPress={() => setIsPinned(!isPinned)}
            style={styles.pinToggleRow}
          >
            <View
              style={[
                styles.togglePill,
                {
                  backgroundColor: isPinned ? theme.text : theme.cardSecondary,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: isPinned ? theme.background : theme.textSecondary, fontWeight: '500' },
                ]}
              >
                {isPinned ? 'مثبتة' : 'عادية'}
              </Text>
            </View>

            <View style={styles.pinTextSide}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <Ionicons
                  name="pin"
                  size={15}
                  color={isPinned ? theme.primary : theme.textSecondary}
                  style={{ marginLeft: 6 }}
                />
                <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'right' }]}>
                  تثبيت في أعلى القائمة
                </Text>
              </View>
              <Text
                style={[
                  typography.caption,
                  { color: theme.textSecondary, textAlign: 'right', marginTop: 2 },
                ]}
              >
                عادة أساسية تظهر دائمًا في مقدمة قائمة عاداتك اليومية
              </Text>
            </View>
          </Pressable>
        </Card>

        {/* Save Button */}
        <View style={{ marginTop: spacing.md }}>
          <Button
            title={isEditing ? 'تحديث العادة' : 'إنشاء العادة'}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            variant="primary"
            size="md"
          />
        </View>

        {/* Delete Habit Button (When Editing) */}
        {isEditing && (
          <View style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
            <Button
              title="حذف العادة نهائيًا"
              onPress={handleDelete}
              variant="destructive"
              iconName="trash-outline"
              size="md"
            />
          </View>
        )}
      </ScrollView>

      {/* Curated Habit Templates Modal */}
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
  headerSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginBottom: 12,
    padding: 14,
  },
  input: {
    borderWidth: 1,
    textAlign: 'right',
    paddingHorizontal: 12,
  },
  colorRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChipsContainer: {
    flexDirection: 'row-reverse',
    gap: 6,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTabRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 10,
  },
  mainTabBtn: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  numberRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  numPill: {
    minWidth: 40,
    height: 34,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  customInputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  inlineInput: {
    width: 64,
    height: 34,
    borderWidth: 1,
    textAlign: 'center',
    paddingHorizontal: 6,
    fontSize: 14,
  },
  frequencyTypeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 8,
  },
  freqBtn: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  daysSelectorRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  daySelectPill: {
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  targetRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  quickUnitsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  quickReminderRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  unitPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  reminderHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  togglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinToggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinTextSide: {
    flex: 1,
    paddingLeft: 12,
  },
  templateCardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateCardTitleGroup: {
    flex: 1,
    paddingRight: 6,
  },
  browseTemplatesBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  quickChipsContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  quickTemplateChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  quickChipIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

