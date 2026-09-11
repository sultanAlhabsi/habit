import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { Habit, HabitCheckin } from '../../types/habit';
import { formatArabicDate, formatHabitNotesForShare } from '../../utils/habitUtils';

interface HabitNotesSectionProps {
  habit: Habit;
  selectedDate: string;
  currentCheckin?: HabitCheckin;
  allNotes: HabitCheckin[];
  onSaveNote: (date: string, note: string) => Promise<void>;
  onDeleteNote: (date: string) => Promise<void>;
}

export const HabitNotesSection: React.FC<HabitNotesSectionProps> = ({
  habit,
  selectedDate,
  currentCheckin,
  allNotes,
  onSaveNote,
  onDeleteNote,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();

  const [isComposing, setIsComposing] = useState(false);
  const [composingDate, setComposingDate] = useState(selectedDate);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const activeNote = currentCheckin?.note?.trim();

  const startEditing = (date: string, initialText = '') => {
    setComposingDate(date);
    setNoteText(initialText);
    setIsComposing(true);
  };

  const handleCancel = () => {
    setIsComposing(false);
    setNoteText('');
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await onSaveNote(composingDate, noteText);
      setIsComposing(false);
      setNoteText('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (date: string) => {
    Alert.alert(
      'حذف الملاحظة',
      'هل تريد بالتأكيد حذف هذه الخاطرة من سجل العادة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await onDeleteNote(date);
          },
        },
      ]
    );
  };

  const handleShareAll = async () => {
    try {
      const shareMessage = formatHabitNotesForShare(habit, allNotes);
      await Share.share({ message: shareMessage });
    } catch (_) {}
  };

  // Past notes excluding current selectedDate note
  const pastNotes = allNotes.filter((n) => n.date !== selectedDate);

  return (
    <Card style={[styles.container, { marginBottom: spacing.base, padding: spacing.base }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: `${habit.color || theme.primary}18`,
                borderRadius: radius.full,
              },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={18}
              color={habit.color || theme.primary}
            />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
              يوميات وملاحظات العادة
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right' }]}>
              دوّن مشاعرك وإنجازاتك اليومية المرتبطة بهذه العادة
            </Text>
          </View>
        </View>

        {allNotes.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="مشاركة سجل الخواطر والمذكرات"
            onPress={handleShareAll}
            style={({ pressed }) => [
              styles.shareBtn,
              {
                minWidth: touchTarget,
                minHeight: touchTarget,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="share-outline" size={19} color={theme.text} />
          </Pressable>
        )}
      </View>

      {/* Selected Day Note Box / Composer */}
      <View style={{ marginTop: spacing.md }}>
        {isComposing ? (
          /* Editor Box */
          <View
            style={[
              styles.composerBox,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: habit.color || theme.primary,
                borderRadius: radius.md,
                padding: spacing.sm,
              },
            ]}
          >
            <View style={styles.composerHeader}>
              <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
                {composingDate === selectedDate ? 'خاطرة اليوم' : formatArabicDate(composingDate)}
              </Text>
              <Text
                style={[
                  typography.caption,
                  {
                    color: noteText.length > 220 ? theme.destructive : theme.textMuted,
                    fontSize: 11,
                  },
                ]}
              >
                {noteText.length}/250 حرف
              </Text>
            </View>

            <TextInput
              multiline
              maxLength={250}
              placeholder="ما الذي ساعدك على الإنجاز اليوم؟ أو أي فكرة تود تذكرها..."
              placeholderTextColor={theme.textMuted}
              value={noteText}
              onChangeText={setNoteText}
              style={[
                styles.textInput,
                {
                  color: theme.text,
                  minHeight: 80,
                  textAlign: 'right',
                },
              ]}
              autoFocus
            />

            <View style={styles.composerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إلغاء كتابة الملاحظة"
                onPress={handleCancel}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[typography.caption, { color: theme.textMuted, fontWeight: '600' }]}>
                  إلغاء
                </Text>
              </Pressable>

              <Button
                title={isSaving ? 'جارٍ الحفظ...' : 'حفظ الخاطرة'}
                variant="primary"
                size="sm"
                onPress={handleSave}
                loading={isSaving}
                disabled={!noteText.trim() || isSaving}
                iconName="checkmark-outline"
              />
            </View>
          </View>
        ) : activeNote ? (
          /* Current Note Display */
          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: theme.cardSecondary,
                borderRightColor: habit.color || theme.primary,
                borderRadius: radius.md,
                padding: spacing.sm,
              },
            ]}
          >
            <View style={styles.noteTopRow}>
              <View style={styles.quoteBadge}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={14}
                  color={habit.color || theme.primary}
                />
                <Text
                  style={[
                    typography.caption,
                    { color: habit.color || theme.primary, fontWeight: '700', fontSize: 11 },
                  ]}
                >
                  خاطرة إنجاز اليوم
                </Text>
              </View>

              <View style={styles.noteButtons}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تعديل ملاحظة اليوم"
                  onPress={() => startEditing(selectedDate, activeNote)}
                  style={({ pressed }) => [
                    styles.actionIconBtn,
                    { opacity: pressed ? 0.5 : 1 },
                  ]}
                >
                  <Ionicons name="pencil-outline" size={16} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="حذف ملاحظة اليوم"
                  onPress={() => handleDelete(selectedDate)}
                  style={({ pressed }) => [
                    styles.actionIconBtn,
                    { opacity: pressed ? 0.5 : 1 },
                  ]}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.destructive} />
                </Pressable>
              </View>
            </View>

            <Text
              style={[
                typography.body,
                styles.noteBodyText,
                { color: theme.text, marginTop: spacing.xs },
              ]}
            >
              "{activeNote}"
            </Text>
          </View>
        ) : (
          /* Button to add note */
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تدوين خاطرة أو ملاحظة لإنجاز اليوم"
            onPress={() => startEditing(selectedDate, '')}
            style={({ pressed }) => [
              styles.addNoteBtn,
              {
                borderColor: theme.border,
                borderRadius: radius.md,
                backgroundColor: pressed ? theme.cardSecondary : 'transparent',
                padding: spacing.sm,
              },
            ]}
          >
            <Ionicons name="create-outline" size={18} color={habit.color || theme.primary} />
            <Text
              style={[
                typography.caption,
                { color: theme.text, fontWeight: '600', marginRight: 6 },
              ]}
            >
              تدوين خاطرة أو ملاحظة لإنجاز اليوم ✍️
            </Text>
          </Pressable>
        )}
      </View>

      {/* Past Notes History */}
      {pastNotes.length > 0 && (
        <View style={{ marginTop: spacing.base }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="عرض سجل الخواطر السابقة"
            onPress={() => setShowHistory((prev) => !prev)}
            style={({ pressed }) => [
              styles.historyToggleRow,
              {
                paddingVertical: spacing.xs,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.historyToggleTitle}>
              <Ionicons
                name={showHistory ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.textSecondary}
              />
              <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
                سجل الخواطر السابقة ({pastNotes.length})
              </Text>
            </View>
          </Pressable>

          {showHistory && (
            <View style={{ marginTop: spacing.xs, gap: spacing.xs }}>
              {pastNotes.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.pastNoteItem,
                    {
                      backgroundColor: theme.cardSecondary,
                      borderRadius: radius.sm,
                      padding: spacing.xs + 2,
                    },
                  ]}
                >
                  <View style={styles.pastNoteHeader}>
                    <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                      {formatArabicDate(item.date)}
                    </Text>

                    <View style={styles.pastNoteActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`تعديل خاطرة ${formatArabicDate(item.date)}`}
                        onPress={() => startEditing(item.date, item.note || '')}
                        style={({ pressed }) => [
                          styles.smallActionBtn,
                          { opacity: pressed ? 0.5 : 1 },
                        ]}
                      >
                        <Ionicons name="pencil-outline" size={14} color={theme.textSecondary} />
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`حذف خاطرة ${formatArabicDate(item.date)}`}
                        onPress={() => handleDelete(item.date)}
                        style={({ pressed }) => [
                          styles.smallActionBtn,
                          { opacity: pressed ? 0.5 : 1 },
                        ]}
                      >
                        <Ionicons name="trash-outline" size={14} color={theme.destructive} />
                      </Pressable>
                    </View>
                  </View>

                  <Text
                    style={[
                      typography.caption,
                      { color: theme.text, textAlign: 'right', marginTop: 3, lineHeight: 18 },
                    ]}
                  >
                    "{item.note?.trim()}"
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  shareBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerBox: {
    borderWidth: 1,
  },
  composerHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  textInput: {
    fontSize: 14,
    textAlignVertical: 'top',
    padding: 6,
  },
  composerActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noteCard: {
    borderRightWidth: 3,
  },
  noteTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  noteButtons: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 4,
  },
  noteBodyText: {
    lineHeight: 22,
    textAlign: 'right',
  },
  addNoteBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyToggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyToggleTitle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  pastNoteItem: {
    marginVertical: 2,
  },
  pastNoteHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastNoteActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  smallActionBtn: {
    padding: 3,
  },
});
