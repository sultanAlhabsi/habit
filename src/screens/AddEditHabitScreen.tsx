import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
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
import { normalizeArabicNumerals } from '../utils/habitUtils';


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
  const { habits, addHabit, updateHabit } = useHabitStore();

  const habitId = route.params?.habitId;
  const duplicateFromId = route.params?.duplicateFromId;
  const existingHabit = habitId ? habits.find((h) => h.id === habitId) : null;
  const duplicateSourceHabit = duplicateFromId ? habits.find((h) => h.id === duplicateFromId) : null;
  const isEditing = Boolean(existingHabit);
  const isDuplicating = Boolean(duplicateSourceHabit && !existingHabit);

  const templateHabit = existingHabit || duplicateSourceHabit;

  const [name, setName] = useState(
    existingHabit?.name || (duplicateSourceHabit ? `${duplicateSourceHabit.name} (نسخة)` : '')
  );
  const [description, setDescription] = useState(templateHabit?.description || '');
  const [selectedIcon, setSelectedIcon] = useState(templateHabit?.icon || 'fitness-outline');
  const [iconCategoryFilter, setIconCategoryFilter] = useState<string>('الكل');
  const [selectedColor, setSelectedColor] = useState(templateHabit?.color || HABIT_PALETTES[0].hex);
  const [frequency, setFrequency] = useState<HabitFrequency>(templateHabit?.frequency || 'daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>(
    templateHabit?.frequencyDays || [0, 1, 2, 3, 4, 5, 6]
  );
  const [targetCount, setTargetCount] = useState(String(templateHabit?.targetCount || '1'));
  const [unit, setUnit] = useState(templateHabit?.unit || 'مرة');
  const [reminderTime, setReminderTime] = useState(templateHabit?.reminderTime || '08:00');
  const [hasReminder, setHasReminder] = useState(Boolean(templateHabit?.reminderTime));
  const [isPinned, setIsPinned] = useState(Boolean(templateHabit?.isPinned));

  const commonUnits = ['مرة', 'دقيقة', 'لتر', 'صفحة', 'خطوة', 'كوب'];

  const quickReminderTimes = [
    { time: '06:30', label: '06:30 ص' },
    { time: '08:00', label: '08:00 ص' },
    { time: '13:30', label: '01:30 م' },
    { time: '18:00', label: '06:00 م' },
    { time: '21:30', label: '09:30 م' },
  ];

  const toggleDay = (dayIndex: number) => {
    if (frequencyDays.includes(dayIndex)) {
      if (frequencyDays.length === 1) {
        Alert.alert('تنبيه', 'يجب اختيار يوم واحد على الأقل للعادة');
        return;
      }
      setFrequencyDays(frequencyDays.filter((d) => d !== dayIndex));
    } else {
      setFrequencyDays([...frequencyDays, dayIndex].sort());
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم العادة');
      return;
    }

    const normalizedReminderTime = normalizeArabicNumerals(reminderTime);
    if (hasReminder) {
      if (!isValidReminderTime(normalizedReminderTime)) {
        Alert.alert(
          'تنبيه',
          'يرجى إدخال وقت صحيح للتنبيه بصيغة 24 ساعة (مثال: 08:30 أو 20:00)'
        );
        return;
      }
    }

    const normalizedTargetStr = normalizeArabicNumerals(targetCount);
    const parsedTarget = parseInt(normalizedTargetStr, 10);
    const validTarget = isNaN(parsedTarget) || parsedTarget < 1 ? 1 : parsedTarget;

    const finalReminder = hasReminder ? normalizedReminderTime : null;

    if (isEditing && existingHabit) {
      await updateHabit({
        ...existingHabit,
        name: trimmedName,
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
        frequency,
        frequencyDays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : frequencyDays,
        targetCount: validTarget,
        unit: unit.trim() || 'مرة',
        reminderTime: finalReminder,
        isPinned,
      });
    } else {
      await addHabit({
        name: trimmedName,
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
        frequency,
        frequencyDays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : frequencyDays,
        targetCount: validTarget,
        unit: unit.trim() || 'مرة',
        isActive: true,
        reminderTime: finalReminder,
        isPinned,
      });
    }

    navigation.goBack();
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
            onPress={handleSave}
            style={({ pressed }) => [
              styles.headerSaveBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[typography.subMedium, { color: theme.text, fontWeight: '600' }]}>
              حفظ
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

        {/* Frequency & Days */}
        <Card style={styles.sectionCard}>
          <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 10 }]}>
            التكرار
          </Text>

          <View style={styles.frequencyTypeRow}>
            <Pressable
              onPress={() => setFrequency('daily')}
              style={[
                styles.freqBtn,
                {
                  backgroundColor: frequency === 'daily' ? theme.text : theme.background,
                  borderRadius: radius.sm,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: frequency === 'daily' ? theme.background : theme.text,
                    fontWeight: '500',
                  },
                ]}
              >
                يوميًا
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFrequency('specific_days')}
              style={[
                styles.freqBtn,
                {
                  backgroundColor: frequency === 'specific_days' ? theme.text : theme.background,
                  borderRadius: radius.sm,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: frequency === 'specific_days' ? theme.background : theme.text,
                    fontWeight: '500',
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
        </Card>

        {/* Target and Unit */}
        <Card style={styles.sectionCard}>
          <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 10 }]}>
            الهدف اليومي
          </Text>

          <View style={styles.targetRow}>
            {/* Number on right in RTL */}
            <View style={{ width: 80 }}>
              <TextInput
                value={targetCount}
                onChangeText={setTargetCount}
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
                onChangeText={setReminderTime}
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
            variant="primary"
            size="md"
          />
        </View>
      </ScrollView>
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
});

