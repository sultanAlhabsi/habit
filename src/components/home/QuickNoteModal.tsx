import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text } from '../common/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../common/Button';
import { formatArabicDate } from '../../utils/habitUtils';

interface QuickNoteModalProps {
  visible: boolean;
  habit: Habit | null;
  date: string;
  initialNote?: string;
  onClose: () => void;
  onSave: (note: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  visible,
  habit,
  date,
  initialNote = '',
  onClose,
  onSave,
  onDelete,
}) => {
  const { theme, radius, spacing, typography } = useTheme();
  const [noteText, setNoteText] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setNoteText(initialNote);
      setIsSaving(false);
    }
  }, [visible, initialNote]);

  if (!habit) return null;

  const handleSave = () => {
    onClose();
    Promise.resolve(onSave(noteText.trim())).catch(() => {});
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onClose();
    Promise.resolve(onDelete()).catch(() => {});
  };

  const hasExistingNote = Boolean(initialNote && initialNote.trim().length > 0);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.habitMeta}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: habit.color ? `${habit.color}18` : theme.cardSecondary,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name={(habit.icon as any) || 'ellipse-outline'}
                    size={20}
                    color={habit.color || theme.text}
                  />
                </View>

                <View style={styles.titlesBox}>
                  <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
                    {habit.name}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginTop: 2 }]}>
                    ملاحظة يوم: {formatArabicDate(date)}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إغلاق نافذة الملاحظة"
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderRadius: radius.full,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Input area */}
            <View style={{ marginTop: spacing.md }}>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="سجل خاطرتك، فكرة، أو تأملاً حول إنجاز اليوم..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlign="right"
                textAlignVertical="top"
                style={[
                  styles.noteInput,
                  typography.body,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    borderRadius: radius.md,
                    color: theme.text,
                  },
                ]}
              />

              <View style={styles.charCounterRow}>
                <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                  {noteText.length}/٥٠٠ حرف
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={[styles.actionsContainer, { marginTop: spacing.md }]}>
              <Button
                title={isSaving ? 'جارٍ الحفظ...' : 'حفظ الملاحظة'}
                variant="primary"
                onPress={handleSave}
                disabled={isSaving}
                style={{ marginBottom: spacing.xs }}
              />

              {hasExistingNote && (
                <Button
                  title="حذف الملاحظة"
                  variant="destructive"
                  onPress={handleDelete}
                  disabled={isSaving}
                  style={{ marginBottom: spacing.xs }}
                />
              )}

              <Button
                title="إلغاء"
                variant="outline"
                onPress={onClose}
                disabled={isSaving}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  titlesBox: {
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteInput: {
    minHeight: 110,
    padding: 12,
    borderWidth: 1,
  },
  charCounterRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  actionsContainer: {
    width: '100%',
  },
});
