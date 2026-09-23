import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { AVAILABLE_ICONS, HABIT_CATEGORIES } from '../../types/habit';
import { triggerLightHaptic } from '../../utils/haptics';

interface HabitIconPickerModalProps {
  visible: boolean;
  selectedIcon: string;
  selectedColor: string;
  onSelectIcon: (iconName: string) => void;
  onClose: () => void;
}

export const HabitIconPickerModal: React.FC<HabitIconPickerModalProps> = ({
  visible,
  selectedIcon,
  selectedColor,
  onSelectIcon,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, radius, typography } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categoriesScrollRef = useRef<ScrollView>(null);

  const filteredIcons = useMemo(() => {
    let list = AVAILABLE_ICONS;
    if (selectedCategory !== 'الكل') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const handleSelect = (iconName: string) => {
    triggerLightHaptic();
    onSelectIcon(iconName);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingHorizontal: spacing.base,
              paddingBottom: spacing.sm,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
              backgroundColor: theme.card,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
                اختر أيقونة العادة
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right' }]}>
                اختر الرمز البصري الذي يمثّل هويّة عادتك
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: theme.cardSecondary,
                  borderRadius: radius.full,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={theme.text} />
            </Pressable>
          </View>

          {/* Search Input */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: theme.border,
                borderRadius: radius.md,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={17}
              color={theme.textMuted}
              style={{ marginLeft: 8 }}
            />
            <TextInput
              placeholder="ابحث عن أيقونة (ماء، كتاب، رياضة...)"
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                styles.searchInput,
                typography.caption,
                { color: theme.text, textAlign: 'right' },
              ]}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS !== 'ios' && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Category Chips */}
          <ScrollView
            ref={categoriesScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsContainer}
            style={{ marginTop: 10 }}
          >
            {HABIT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityLabel={`تصنيف ${cat}`}
                  onPress={() => {
                    triggerLightHaptic();
                    setSelectedCategory(cat);
                  }}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? theme.text : theme.cardSecondary,
                      borderColor: isSelected ? theme.text : theme.border,
                      borderRadius: radius.full,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isSelected ? theme.background : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 12,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Icons Grid Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: spacing.base,
            paddingBottom: insets.bottom + 30,
          }}
        >
          {filteredIcons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={theme.textMuted} />
              <Text style={[typography.subMedium, { color: theme.text, marginTop: 10 }]}>
                لم يتم العثور على أيقونات
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
                جرّب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً
              </Text>
            </View>
          ) : (
            <View style={styles.iconsGrid}>
              {filteredIcons.map((item) => {
                const isSelected = selectedIcon === item.name;
                return (
                  <Pressable
                    key={item.name}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => handleSelect(item.name)}
                    style={({ pressed }) => [
                      styles.iconTile,
                      {
                        backgroundColor: isSelected
                          ? `${selectedColor}18`
                          : theme.card,
                        borderColor: isSelected ? selectedColor : theme.border,
                        borderWidth: isSelected ? 2 : 1,
                        borderRadius: radius.md,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isSelected
                            ? selectedColor
                            : `${theme.cardSecondary}`,
                          borderRadius: radius.full,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.name as any}
                        size={22}
                        color={isSelected ? '#FFFFFF' : theme.text}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        typography.caption,
                        {
                          color: isSelected ? theme.text : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '400',
                          fontSize: 11,
                          marginTop: 6,
                          textAlign: 'center',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
  },
  categoryChipsContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  iconsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconTile: {
    width: '22.5%', // 4 columns
    aspectRatio: 0.95,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  iconCircle: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
