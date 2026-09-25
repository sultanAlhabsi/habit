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
import {
  HabitTemplate,
  HABIT_TEMPLATE_CATEGORIES,
  searchHabitTemplates,
  getHabitTemplates,
} from '../../utils/habitTemplates';
import { formatArabicCount, toArabicNumerals } from '../../utils/habitUtils';

interface HabitTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: HabitTemplate) => void;
}

export const HabitTemplateModal: React.FC<HabitTemplateModalProps> = ({
  visible,
  onClose,
  onSelectTemplate,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, radius, typography } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categoriesScrollRef = useRef<ScrollView>(null);

  const filteredTemplates = useMemo(() => {
    return searchHabitTemplates(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleSelect = (template: HabitTemplate) => {
    onSelectTemplate(template);
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
              paddingTop: Math.max(insets.top, spacing.base),
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
                نماذج العادات الجاهزة
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right' }]}>
                اختر نموذجًا متقنًا لبدء رحلة التزامك بضغطة واحدة
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق نافذة النماذج"
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
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBarContainer,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                borderRadius: radius.md,
                marginTop: spacing.sm,
              },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginLeft: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ابحث في النماذج (ماء، قرآن، قراءة، تركيز...)"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.searchInput,
                typography.body,
                { color: theme.text, textAlign: 'right' },
              ]}
            />
            {Boolean(searchQuery) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="مسح البحث"
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ paddingHorizontal: 6 }}
              >
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Category Filter Chips */}
          <ScrollView
            ref={categoriesScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onContentSizeChange={() => {
              categoriesScrollRef.current?.scrollToEnd({ animated: false });
            }}
            contentContainerStyle={styles.categoriesScrollContent}
            style={{ marginTop: spacing.sm }}
          >
            {HABIT_TEMPLATE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'الكل'
                  ? getHabitTemplates().length
                  : getHabitTemplates(cat).length;

              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityLabel={`تصنيف ${cat}`}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.cardSecondary,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderRadius: radius.full,
                      marginRight: 6,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isSelected ? '#FFFFFF' : theme.textSecondary,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {cat} ({toArabicNumerals(count)})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Templates List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: spacing.base,
            paddingBottom: insets.bottom + 40,
          }}
        >
          {filteredTemplates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={36} color={theme.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[typography.h3, { color: theme.text, textAlign: 'center', marginBottom: 4 }]}>
                لم يتم العثور على نماذج
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center' }]}>
                جرّب البحث بكلمة مختلفة أو اختر تصنيفًا آخر
              </Text>
            </View>
          ) : (
            filteredTemplates.map((item) => {
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`اختيار نموذج ${item.name}`}
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.templateCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      borderRadius: radius.md,
                      padding: spacing.base,
                      marginBottom: spacing.sm,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.templateTextContainer}>
                      <View style={styles.titleRow}>
                        <Text style={[typography.bodyMedium, { color: theme.text, fontWeight: '700', textAlign: 'right' }]}>
                          {item.name}
                        </Text>
                        <View
                          style={[
                            styles.categoryBadge,
                            {
                              backgroundColor: `${item.color}15`,
                              borderColor: `${item.color}40`,
                              borderRadius: radius.full,
                            },
                          ]}
                        >
                          <Text style={[typography.caption, { color: item.color, fontSize: 10, fontWeight: '600' }]}>
                            {item.category}
                          </Text>
                        </View>
                      </View>

                      <Text
                        numberOfLines={2}
                        style={[
                          typography.caption,
                          {
                            color: theme.textSecondary,
                            textAlign: 'right',
                            marginTop: 3,
                            lineHeight: 18,
                          },
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>

                    {/* Icon Box */}
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: `${item.color}18`,
                          borderColor: `${item.color}35`,
                          borderRadius: radius.md,
                          marginLeft: spacing.sm,
                        },
                      ]}
                    >
                      <Ionicons name={item.icon as any} size={22} color={item.color} />
                    </View>
                  </View>

                  {/* Meta Badges */}
                  <View style={[styles.metaRow, { borderTopColor: theme.borderSubtle, borderTopWidth: 1, marginTop: 10, paddingTop: 8 }]}>
                    <View style={styles.metaItem}>
                      <Ionicons name="flag-outline" size={13} color={theme.textMuted} style={{ marginLeft: 4 }} />
                      <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                        الهدف: {toArabicNumerals(item.targetCount)} {item.unit}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="repeat-outline" size={13} color={theme.textMuted} style={{ marginLeft: 4 }} />
                      <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                        {item.frequency === 'daily'
                          ? 'يوميًا'
                          : formatArabicCount(item.frequencyDays.length, 'يوم محدد', 'يومان محددين', 'أيام محددة', 'يوم محدد')}
                      </Text>
                    </View>

                    {Boolean(item.reminderTime) && (
                      <View style={styles.metaItem}>
                        <Ionicons name="alarm-outline" size={13} color={theme.textMuted} style={{ marginLeft: 4 }} />
                        <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                          {toArabicNumerals(item.reminderTime!)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })
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
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    paddingLeft: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 6,
  },
  categoriesScrollContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  templateCard: {
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  templateTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
});
