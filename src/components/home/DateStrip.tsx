import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import dayjs from 'dayjs';
import { useTheme } from '../../theme/ThemeContext';

interface DateStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DateStrip: React.FC<DateStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const { theme, radius, spacing, typography, touchTarget } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // Generate 14 days around today (7 days before, today, 6 days ahead)
  const today = dayjs();
  const days = Array.from({ length: 14 }).map((_, index) => {
    const d = today.subtract(7 - index, 'day');
    return {
      dateStr: d.format('YYYY-MM-DD'),
      dayNum: d.date(),
      dayShort: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'][d.day()],
      isToday: d.isSame(today, 'day'),
    };
  });

  const selectedIndex = days.findIndex((d) => d.dateStr === selectedDate);

  useEffect(() => {
    if (selectedIndex >= 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: Math.max(0, selectedIndex * 52 - 120),
          animated: true,
        });
      }, 100);
    }
  }, [selectedIndex]);

  return (
    <View style={[styles.container, { marginBottom: spacing.sm }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          flexDirection: 'row-reverse',
          alignItems: 'center',
        }}
      >
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;

          return (
            <Pressable
              key={item.dateStr}
              accessibilityRole="button"
              accessibilityLabel={`${item.dayShort} ${item.dayNum}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectDate(item.dateStr)}
              style={({ pressed }) => [
                styles.dayItem,
                {
                  minWidth: 44,
                  minHeight: touchTarget + 4,
                  borderRadius: radius.md,
                  marginHorizontal: 3,
                  backgroundColor: isSelected
                    ? theme.text
                    : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected
                      ? theme.background
                      : theme.textSecondary,
                    fontSize: 11,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {item.dayShort}
              </Text>

              <Text
                style={[
                  typography.subMedium,
                  {
                    color: isSelected
                      ? theme.background
                      : item.isToday
                      ? theme.primary
                      : theme.text,
                    fontWeight: isSelected || item.isToday ? '600' : '400',
                    marginTop: 2,
                  },
                ]}
              >
                {item.dayNum}
              </Text>

              {item.isToday ? (
                <View
                  style={[
                    styles.todayDot,
                    {
                      backgroundColor: isSelected
                        ? theme.background
                        : theme.primary,
                    },
                  ]}
                />
              ) : (
                <View style={{ height: 4, marginTop: 3 }} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
