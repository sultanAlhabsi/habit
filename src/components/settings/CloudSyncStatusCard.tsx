import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Text } from '../common/AppText';
import { useTheme } from '../../theme/ThemeContext';
import { triggerLightHaptic } from '../../utils/haptics';
import { SyncState } from '../../services/syncService';

interface CloudSyncStatusCardProps {
  cloudSyncState: SyncState;
  lastCloudSyncTime: string | null;
  isManualSyncing: boolean;
  onSyncPress: () => void;
}

export const CloudSyncStatusCard: React.FC<CloudSyncStatusCardProps> = ({
  cloudSyncState,
  lastCloudSyncTime,
  isManualSyncing,
  onSyncPress,
}) => {
  const { isDark, theme, radius, typography } = useTheme();
  const isBusy = isManualSyncing || cloudSyncState === 'syncing';

  // Brand-aligned colors: uses theme.primary (Forest Sage in Light, Emerald in Dark)
  const statusColor = isBusy
    ? '#F59E0B'
    : cloudSyncState === 'synced'
    ? theme.primary
    : cloudSyncState === 'error'
    ? '#EF4444'
    : theme.textMuted;

  const statusBg = isBusy
    ? isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7'
    : cloudSyncState === 'synced'
    ? isDark ? 'rgba(16, 185, 129, 0.12)' : theme.primaryLight
    : cloudSyncState === 'error'
    ? isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2'
    : isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6';

  const statusText = isBusy
    ? 'جارٍ المزامنة الآن...'
    : cloudSyncState === 'synced'
    ? 'متصل ومتزامن مع السحابة'
    : cloudSyncState === 'error'
    ? 'تعذرت المزامنة'
    : cloudSyncState === 'offline'
    ? 'وضع عدم الاتصال (محلياً)'
    : 'المزامنة السحابية متوقفة مؤقتاً';

  const formattedTime = lastCloudSyncTime
    ? dayjs(lastCloudSyncTime).format('YYYY/MM/DD hh:mm A')
    : 'لم تتم المزامنة بعد';

  const handlePress = () => {
    if (isBusy) return;
    triggerLightHaptic();
    onSyncPress();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1C1F24' : theme.cardSecondary,
          borderColor: theme.border,
          borderRadius: radius.md,
        },
      ]}
    >
      {/* Right side in RTL (Leading): Icon + Status text + timestamp */}
      <View style={styles.infoRow}>
        <View style={[styles.statusIconBox, { backgroundColor: statusBg }]}>
          <Ionicons
            name={
              cloudSyncState === 'synced'
                ? 'cloud-done-outline'
                : cloudSyncState === 'error'
                ? 'alert-circle-outline'
                : cloudSyncState === 'offline'
                ? 'cloud-offline-outline'
                : 'cloud-outline'
            }
            size={18}
            color={statusColor}
          />
        </View>

        <View style={styles.textColumn}>
          <View style={styles.titleWithDot}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text
              style={[
                typography.bodyMedium,
                {
                  color: theme.text,
                  fontWeight: '600',
                  fontSize: 13,
                  lineHeight: 18,
                  marginRight: 6,
                },
              ]}
            >
              {statusText}
            </Text>
          </View>
          <Text
            style={[
              typography.caption,
              {
                color: theme.textSecondary,
                fontSize: 11,
                lineHeight: 15,
                textAlign: 'right',
                marginTop: 2,
              },
            ]}
          >
            آخر مزامنة: {formattedTime}
          </Text>
        </View>
      </View>

      {/* Left side in RTL (Trailing): Quick Sync Action Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="مزامنة سحابية يدوية"
        onPress={handlePress}
        disabled={isBusy}
        style={({ pressed }) => [
          styles.syncButton,
          {
            backgroundColor: isDark ? '#262A30' : '#FFFFFF',
            borderColor: theme.border,
            opacity: isBusy ? 0.7 : pressed ? 0.75 : 1,
          },
        ]}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Ionicons name="sync-outline" size={17} color={theme.primary} />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  statusIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleWithDot: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
