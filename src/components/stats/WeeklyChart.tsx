import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DayAdherence } from '../../types/habit';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';

interface WeeklyChartProps {
  data: DayAdherence[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  const { theme, radius, spacing, typography } = useTheme();

  return (
    <Card style={{ padding: spacing.base, marginBottom: spacing.base }}>
      <View style={styles.header}>
        <Text style={[typography.h3, { color: theme.text, textAlign: 'right' }]}>
          الالتزام الأسبوعي
        </Text>
        <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, textAlign: 'right' }]}>
          نسبة إنجاز العادات لكل يوم
        </Text>
      </View>

      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const barHeight = Math.max(4, (item.rate / 100) * 80);

          return (
            <View key={index} style={styles.barColumn}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: item.rate > 0 ? theme.text : theme.textMuted,
                    fontSize: 10,
                    marginBottom: 6,
                  },
                ]}
              >
                {item.totalCount > 0 ? `${item.rate}%` : '-'}
              </Text>

              {/* Slim sleek bar track */}
              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor: theme.text,
                      borderRadius: radius.full,
                    },
                  ]}
                />
              </View>

              {/* Day label */}
              <Text
                style={[
                  typography.caption,
                  {
                    color: item.totalCount > 0 ? theme.textSecondary : theme.textMuted,
                    fontSize: 11,
                    marginTop: 6,
                  },
                ]}
              >
                {item.dayShort}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 14,
  },
  chartArea: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 6,
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
  },
});
