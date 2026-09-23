import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../common/AppText';
import { Button } from '../common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { parseReminderTime, formatReminderTime } from '../../utils/notificationUtils';
import { triggerLightHaptic } from '../../utils/haptics';

interface TimePickerModalProps {
  visible: boolean;
  initialTime?: string; // "HH:mm" e.g. "21:00"
  onSave: (timeStr: string) => void;
  onClose: () => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime = '21:00',
  onSave,
  onClose,
}) => {
  const { isDark, theme, radius, typography } = useTheme();

  const [selectedHour, setSelectedHour] = useState(9); // 1-12
  const [selectedMinute, setSelectedMinute] = useState(0); // 0-55
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

  useEffect(() => {
    if (visible && initialTime) {
      const parsed = parseReminderTime(initialTime);
      if (parsed) {
        const isPM = parsed.hour >= 12;
        const h12 = parsed.hour % 12 === 0 ? 12 : parsed.hour % 12;
        setSelectedHour(h12);
        setSelectedMinute(Math.floor(parsed.minute / 5) * 5); // Round to nearest 5 min
        setSelectedPeriod(isPM ? 'PM' : 'AM');
      }
    }
  }, [visible, initialTime]);

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handleConfirm = () => {
    triggerLightHaptic();
    let h24 = selectedHour % 12;
    if (selectedPeriod === 'PM') {
      h24 += 12;
    }
    const resultTime = formatReminderTime(h24, selectedMinute);
    onSave(resultTime);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: radius.lg || 18,
            },
          ]}
        >
          {/* Header: Title on Right (Leading), Close button on Left (Trailing) */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginLeft: 6 }} />
              <Text style={[typography.h3, { color: theme.text }]}>
                تحديد موعد التذكير المسائي
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="close-circle-outline" size={24} color={theme.textMuted} />
            </Pressable>
          </View>

          {/* Period Selector (AM / PM) */}
          <View style={styles.periodRow}>
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                setSelectedPeriod('PM');
              }}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === 'PM' ? theme.primary : isDark ? '#23272E' : theme.cardSecondary,
                  borderColor: selectedPeriod === 'PM' ? theme.primary : theme.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: selectedPeriod === 'PM' ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: selectedPeriod === 'PM' ? '700' : '500',
                  },
                ]}
              >
                مساءً (م)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerLightHaptic();
                setSelectedPeriod('AM');
              }}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === 'AM' ? theme.primary : isDark ? '#23272E' : theme.cardSecondary,
                  borderColor: selectedPeriod === 'AM' ? theme.primary : theme.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: selectedPeriod === 'AM' ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: selectedPeriod === 'AM' ? '700' : '500',
                  },
                ]}
              >
                صباحاً (ص)
              </Text>
            </Pressable>
          </View>

          {/* Time Picker Columns: Hour on Right (Leading in RTL), Minute on Left (Trailing in RTL) */}
          <View style={styles.pickerColumnsContainer}>
            {/* Hour Column */}
            <View style={styles.columnWrapper}>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginBottom: 8 }]}>
                الساعة
              </Text>
              <ScrollView
                style={[
                  styles.columnScroll,
                  {
                    borderColor: theme.border,
                    backgroundColor: isDark ? '#181A1F' : theme.cardSecondary,
                    borderRadius: radius.md,
                  },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((hr) => {
                  const isSelected = selectedHour === hr;
                  return (
                    <Pressable
                      key={hr}
                      onPress={() => {
                        triggerLightHaptic();
                        setSelectedHour(hr);
                      }}
                      style={[
                        styles.pickerItem,
                        isSelected && {
                          backgroundColor: theme.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.bodyMedium,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {hr.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Text style={[typography.h2, { color: theme.textMuted, alignSelf: 'center', marginTop: 14 }]}>
              :
            </Text>

            {/* Minute Column */}
            <View style={styles.columnWrapper}>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginBottom: 8 }]}>
                الدقيقة
              </Text>
              <ScrollView
                style={[
                  styles.columnScroll,
                  {
                    borderColor: theme.border,
                    backgroundColor: isDark ? '#181A1F' : theme.cardSecondary,
                    borderRadius: radius.md,
                  },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map((min) => {
                  const isSelected = selectedMinute === min;
                  return (
                    <Pressable
                      key={min}
                      onPress={() => {
                        triggerLightHaptic();
                        setSelectedMinute(min);
                      }}
                      style={[
                        styles.pickerItem,
                        isSelected && {
                          backgroundColor: theme.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.bodyMedium,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {min.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Button
              title="تأكيد الموعد"
              variant="primary"
              size="md"
              onPress={handleConfirm}
              style={{ flex: 1, marginLeft: 8 }}
            />
            <Button
              title="إلغاء"
              variant="outline"
              size="md"
              onPress={onClose}
              style={{ flex: 0.45 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  periodRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 14,
  },
  periodButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pickerColumnsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  columnWrapper: {
    flex: 1,
  },
  columnScroll: {
    height: 160,
    borderWidth: 1,
  },
  pickerItem: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
});
