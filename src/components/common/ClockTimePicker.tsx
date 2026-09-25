import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { useTheme } from '../../theme/ThemeContext';
import {
  parseReminderTime,
  formatReminderTime,
} from '../../utils/notificationUtils';
import { toArabicNumerals } from '../../utils/habitUtils';
import { triggerLightHaptic } from '../../utils/haptics';

export interface ClockPreset {
  time: string;
  label: string;
  desc?: string;
}

export interface ClockTimePickerProps {
  value: string; // "HH:mm" e.g. "08:00"
  onChange: (timeStr: string) => void;
  color?: string;
  presets?: ClockPreset[];
}

const DIAL_SIZE = 220;
const CENTER = DIAL_SIZE / 2; // 110
const RADIUS = 78;
const ITEM_SIZE = 34;
const HALF_ITEM = ITEM_SIZE / 2;

const HOURS_LIST = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES_LIST = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const PRESETS: ClockPreset[] = [
  { time: '06:30', label: '٠٦:٣٠ ص', desc: 'باكراً' },
  { time: '08:00', label: '٠٨:٠٠ ص', desc: 'صباحاً' },
  { time: '13:30', label: '٠١:٣٠ م', desc: 'ظهراً' },
  { time: '18:00', label: '٠٦:٠٠ م', desc: 'مساءً' },
  { time: '21:30', label: '٠٩:٣٠ م', desc: 'ليلاً' },
];

export const ClockTimePicker: React.FC<ClockTimePickerProps> = ({
  value,
  onChange,
  color,
  presets = PRESETS,
}) => {
  const { isDark, theme, radius, typography } = useTheme();
  const activeColor = color || theme.primary;
  const [internalTime, setInternalTime] = useState(value);
  const [clockMode, setClockMode] = useState<'hour' | 'minute'>('hour');
  const [isDragging, setIsDragging] = useState(false);
  const autoSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHapticValue = useRef<number | null>(null);
  const dragStart = useRef({ startX: 0, startY: 0, pageX: 0, pageY: 0 });

  useEffect(() => {
    setInternalTime(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (autoSwitchTimer.current) {
        clearTimeout(autoSwitchTimer.current);
      }
    };
  }, []);

  const parsed = useMemo(() => {
    return parseReminderTime(internalTime) || { hour: 8, minute: 0 };
  }, [internalTime]);

  const { hour12, minute, isPM } = useMemo(() => {
    const h = parsed.hour;
    const m = parsed.minute;
    const pm = h >= 12;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { hour12: h12, minute: m, isPM: pm };
  }, [parsed]);

  // Keep latest state for gesture responders
  const stateRef = useRef({ clockMode, hour12, minute, isPM });
  useEffect(() => {
    stateRef.current = { clockMode, hour12, minute, isPM };
  }, [clockMode, hour12, minute, isPM]);

  // Update time helper
  const updateTime = (newH12: number, newMin: number, newIsPM: boolean) => {
    let h24 = newH12 % 12;
    if (newIsPM) {
      h24 += 12;
    }
    const formatted = formatReminderTime(h24, newMin);
    setInternalTime(formatted);
    onChange(formatted);
  };

  const processTouchCoords = (x: number, y: number) => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Ignore touches too close to center pin
    if (dist < 15) return;

    // Convert standard Cartesian to Clock degrees (12 o'clock = 0 deg, clockwise)
    const clockDeg = (Math.atan2(dy, dx) * (180 / Math.PI) + 90 + 360) % 360;
    const { clockMode: mode, hour12: curH, minute: curM, isPM: curPM } = stateRef.current;

    if (mode === 'hour') {
      const rawHour = Math.round(clockDeg / 30) % 12;
      const targetHour = rawHour === 0 ? 12 : rawHour;
      if (targetHour !== lastHapticValue.current) {
        lastHapticValue.current = targetHour;
        triggerLightHaptic();
        updateTime(targetHour, curM, curPM);
      }
    } else {
      // minute mode: 5-minute increments
      const targetMin = (Math.round(clockDeg / 30) * 5) % 60;
      if (targetMin !== lastHapticValue.current) {
        lastHapticValue.current = targetMin;
        triggerLightHaptic();
        updateTime(curH, targetMin, curPM);
      }
    }
  };

  const processTouchRef = useRef(processTouchCoords);
  processTouchRef.current = processTouchCoords;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: (evt) => {
          setIsDragging(true);
          lastHapticValue.current = null;
          dragStart.current = {
            startX: evt.nativeEvent.locationX,
            startY: evt.nativeEvent.locationY,
            pageX: evt.nativeEvent.pageX,
            pageY: evt.nativeEvent.pageY,
          };
          processTouchRef.current(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },

        onPanResponderMove: (evt) => {
          const deltaX = evt.nativeEvent.pageX - dragStart.current.pageX;
          const deltaY = evt.nativeEvent.pageY - dragStart.current.pageY;
          const currentX = dragStart.current.startX + deltaX;
          const currentY = dragStart.current.startY + deltaY;
          processTouchRef.current(currentX, currentY);
        },

        onPanResponderRelease: () => {
          setIsDragging(false);
          lastHapticValue.current = null;
          if (stateRef.current.clockMode === 'hour') {
            if (autoSwitchTimer.current) clearTimeout(autoSwitchTimer.current);
            autoSwitchTimer.current = setTimeout(() => {
              setClockMode('minute');
            }, 300);
          }
        },

        onPanResponderTerminate: () => {
          setIsDragging(false);
          lastHapticValue.current = null;
        },
      }),
    []
  );

  const handleTogglePeriod = (targetPM: boolean) => {
    if (targetPM === isPM) return;
    triggerLightHaptic();
    updateTime(hour12, minute, targetPM);
  };

  const handleStepMinute = (delta: number) => {
    triggerLightHaptic();
    const newMin = (minute + delta + 60) % 60;
    updateTime(hour12, newMin, isPM);
  };

  // Rotation angles for the clock hand
  const hourAngle = hour12 * 30; // 12 -> 360/0, 1 -> 30, ...
  const minuteAngle = minute * 6; // 0 -> 0, 15 -> 90, 30 -> 180, ...
  const currentHandAngle = clockMode === 'hour' ? hourAngle : minuteAngle;

  // Compute position on circle
  const getDialPosition = (index: number) => {
    // index 0 is at top (-90 degrees)
    const angleDeg = index * 30 - 90;
    const rad = (angleDeg * Math.PI) / 180;
    const x = CENTER + RADIUS * Math.cos(rad) - HALF_ITEM;
    const y = CENTER + RADIUS * Math.sin(rad) - HALF_ITEM;
    return { x, y };
  };

  return (
    <View style={styles.container}>
      {/* 1. Digital Time & Period Display Header */}
      <View style={styles.digitalRow}>
        {/* Hour Digit Box */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`الساعة ${hour12}`}
          onPress={() => {
            triggerLightHaptic();
            setClockMode('hour');
          }}
          style={[
            styles.digitalBox,
            {
              backgroundColor: clockMode === 'hour' ? `${activeColor}18` : isDark ? '#1C1F24' : theme.background,
              borderColor: clockMode === 'hour' ? activeColor : theme.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Text
            style={[
              typography.h2,
              {
                color: clockMode === 'hour' ? activeColor : theme.text,
                fontWeight: '700',
                fontSize: 26,
              },
            ]}
          >
            {toArabicNumerals(String(hour12).padStart(2, '0'))}
          </Text>
          <Text
            style={[
              typography.caption,
              {
                color: clockMode === 'hour' ? activeColor : theme.textMuted,
                fontSize: 10,
                marginTop: -2,
                fontWeight: '600',
              },
            ]}
          >
            الساعة
          </Text>
        </Pressable>

        <Text style={[typography.h2, { color: theme.textMuted, marginHorizontal: 6 }]}>
          :
        </Text>

        {/* Minute Digit Box */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`الدقيقة ${minute}`}
          onPress={() => {
            triggerLightHaptic();
            setClockMode('minute');
          }}
          style={[
            styles.digitalBox,
            {
              backgroundColor: clockMode === 'minute' ? `${activeColor}18` : isDark ? '#1C1F24' : theme.background,
              borderColor: clockMode === 'minute' ? activeColor : theme.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Text
            style={[
              typography.h2,
              {
                color: clockMode === 'minute' ? activeColor : theme.text,
                fontWeight: '700',
                fontSize: 26,
              },
            ]}
          >
            {toArabicNumerals(String(minute).padStart(2, '0'))}
          </Text>
          <Text
            style={[
              typography.caption,
              {
                color: clockMode === 'minute' ? activeColor : theme.textMuted,
                fontSize: 10,
                marginTop: -2,
                fontWeight: '600',
              },
            ]}
          >
            الدقيقة
          </Text>
        </Pressable>

        {/* AM / PM Toggle Pills */}
        <View style={styles.periodCol}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="صباحاً"
            onPress={() => handleTogglePeriod(false)}
            style={[
              styles.periodPill,
              {
                backgroundColor: !isPM ? activeColor : isDark ? '#23272E' : theme.background,
                borderColor: !isPM ? activeColor : theme.border,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: !isPM ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: !isPM ? '700' : '500',
                  fontSize: 11,
                },
              ]}
            >
              صباحاً (ص)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="مساءً"
            onPress={() => handleTogglePeriod(true)}
            style={[
              styles.periodPill,
              {
                backgroundColor: isPM ? activeColor : isDark ? '#23272E' : theme.background,
                borderColor: isPM ? activeColor : theme.border,
                borderRadius: radius.sm,
                marginTop: 4,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: isPM ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: isPM ? '700' : '500',
                  fontSize: 11,
                },
              ]}
            >
              مساءً (م)
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Mode Selector Bar (Hours vs Minutes) */}
      <View style={styles.modeTabsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            triggerLightHaptic();
            setClockMode('hour');
          }}
          style={[
            styles.modeTabBtn,
            {
              backgroundColor: clockMode === 'hour' ? theme.card : 'transparent',
              borderColor: clockMode === 'hour' ? activeColor : 'transparent',
              borderRadius: radius.full,
            },
          ]}
        >
          <Ionicons
            name="time"
            size={14}
            color={clockMode === 'hour' ? activeColor : theme.textMuted}
            style={{ marginLeft: 4 }}
          />
          <Text
            style={[
              typography.caption,
              {
                color: clockMode === 'hour' ? activeColor : theme.textMuted,
                fontWeight: clockMode === 'hour' ? '700' : '500',
              },
            ]}
          >
            قرص الساعات
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            triggerLightHaptic();
            setClockMode('minute');
          }}
          style={[
            styles.modeTabBtn,
            {
              backgroundColor: clockMode === 'minute' ? theme.card : 'transparent',
              borderColor: clockMode === 'minute' ? activeColor : 'transparent',
              borderRadius: radius.full,
            },
          ]}
        >
          <Ionicons
            name="stopwatch"
            size={14}
            color={clockMode === 'minute' ? activeColor : theme.textMuted}
            style={{ marginLeft: 4 }}
          />
          <Text
            style={[
              typography.caption,
              {
                color: clockMode === 'minute' ? activeColor : theme.textMuted,
                fontWeight: clockMode === 'minute' ? '700' : '500',
              },
            ]}
          >
            قرص الدقائق
          </Text>
        </Pressable>

        {/* Stepper +/- for fine-tuning minute */}
        {clockMode === 'minute' && (
          <View style={styles.stepperGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تقليل دقيقة"
              onPress={() => handleStepMinute(-1)}
              hitSlop={8}
              style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            >
              <Ionicons name="remove" size={14} color={theme.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="زيادة دقيقة"
              onPress={() => handleStepMinute(1)}
              hitSlop={8}
              style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.card, marginRight: 4 }]}
            >
              <Ionicons name="add" size={14} color={theme.text} />
            </Pressable>
          </View>
        )}
      </View>

      {/* 3. The Circular Analog Clock Face (قرص الساعة) */}
      <View style={styles.dialWrapper}>
        <View
          style={[
            styles.dialContainer,
            {
              width: DIAL_SIZE,
              height: DIAL_SIZE,
              borderRadius: DIAL_SIZE / 2,
              backgroundColor: isDark ? '#191B20' : '#F1F5F9',
              borderColor: isDragging ? activeColor : theme.border,
            },
          ]}
        >
          {/* Visual Elements Layer (Clock Hand, Center Pin, Numbers) */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* Clock Hand line pointing to active selection */}
            <View
              style={[
                styles.handLineContainer,
                {
                  left: CENTER - 1.25,
                  top: CENTER - RADIUS,
                  width: 2.5,
                  height: RADIUS * 2,
                  transform: [{ rotate: `${currentHandAngle}deg` }],
                },
              ]}
            >
              {/* Hand Tip Highlight Bubble */}
              <View
                style={[
                  styles.handTipCircle,
                  {
                    backgroundColor: activeColor,
                    transform: [{ scale: isDragging ? 1.15 : 1 }],
                  },
                ]}
              />
              <View
                style={{
                  width: 2.5,
                  height: RADIUS,
                  backgroundColor: activeColor,
                  borderRadius: 1.5,
                }}
              />
              <View style={{ width: 2.5, height: RADIUS, backgroundColor: 'transparent' }} />
            </View>

            {/* Clock Center Pin */}
            <View
              style={[
                styles.centerPin,
                {
                  left: CENTER - 5,
                  top: CENTER - 5,
                  backgroundColor: activeColor,
                  shadowColor: activeColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isDragging ? 0.6 : 0.25,
                  shadowRadius: isDragging ? 6 : 3,
                  elevation: 4,
                },
              ]}
            />

            {/* Numbers around the clock face */}
            {clockMode === 'hour'
              ? HOURS_LIST.map((hr, idx) => {
                  const { x, y } = getDialPosition(idx);
                  const isSelected = hour12 === hr;

                  return (
                    <View
                      key={hr}
                      style={[
                        styles.dialNumberBtn,
                        {
                          left: x,
                          top: y,
                          backgroundColor: isSelected ? activeColor : 'transparent',
                          borderColor: isSelected ? activeColor : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontWeight: isSelected ? '700' : '600',
                            fontSize: 13,
                          },
                        ]}
                      >
                        {toArabicNumerals(String(hr))}
                      </Text>
                    </View>
                  );
                })
              : MINUTES_LIST.map((minVal, idx) => {
                  const { x, y } = getDialPosition(idx);
                  // Highlight if minute is close or exact
                  const isSelected = Math.floor(minute / 5) * 5 === minVal;

                  return (
                    <View
                      key={minVal}
                      style={[
                        styles.dialNumberBtn,
                        {
                          left: x,
                          top: y,
                          backgroundColor: isSelected ? activeColor : 'transparent',
                          borderColor: isSelected ? activeColor : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontWeight: isSelected ? '700' : '600',
                            fontSize: 12,
                          },
                        ]}
                      >
                        {toArabicNumerals(String(minVal).padStart(2, '0'))}
                      </Text>
                    </View>
                  );
                })}
          </View>

          {/* Transparent Touch & Pan Drag Gesture Overlay */}
          <View
            style={[StyleSheet.absoluteFill, { zIndex: 30 }]}
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel={
              clockMode === 'hour'
                ? `قرص الساعات، محدد حالياً: الساعة ${toArabicNumerals(String(hour12))}`
                : `قرص الدقائق، محدد حالياً: الدقيقة ${toArabicNumerals(String(minute).padStart(2, '0'))}`
            }
          />
        </View>
      </View>

      {/* 4. Quick Smart Presets */}
      <View style={styles.presetsContainer}>
        <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'right', marginBottom: 6, fontSize: 11 }]}>
          مواعيد شائعة سريعة
        </Text>
        <View style={styles.presetsRow}>
          {presets.map((item) => {
            const isSelected = value === item.time;
            return (
              <Pressable
                key={item.time}
                accessibilityRole="button"
                accessibilityLabel={`تحديد موعد ${item.desc ? `${item.desc} ` : ''}${item.label}`}
                onPress={() => {
                  triggerLightHaptic();
                  onChange(item.time);
                }}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isSelected ? activeColor : isDark ? '#1C1F24' : theme.background,
                    borderColor: isSelected ? activeColor : theme.border,
                    borderRadius: radius.sm,
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
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? `${theme.background}B3` : theme.textMuted,
                      fontSize: 9.5,
                      marginTop: 1,
                    },
                  ]}
                >
                  {item.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 10,
  },
  digitalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  digitalBox: {
    width: 76,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  periodCol: {
    marginRight: 10,
    justifyContent: 'center',
  },
  periodPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modeTabBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  stepperGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginLeft: 6,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dialContainer: {
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  handLineContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerPin: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    zIndex: 10,
  },
  handTipCircle: {
    position: 'absolute',
    top: -HALF_ITEM,
    left: 1.25 - HALF_ITEM,
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: HALF_ITEM,
    opacity: 0.18,
  },
  dialNumberBtn: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: HALF_ITEM,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  presetsContainer: {
    marginTop: 14,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
});
