import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import {
  AlertOptions,
  AlertButton,
  subscribeAlert,
  hideAppAlert,
} from '../../services/alertService';

export const CustomAlertModal: React.FC = () => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const { theme, isDark, radius, spacing, typography } = useTheme();

  useEffect(() => {
    const unsubscribe = subscribeAlert((newAlert) => {
      setAlert(newAlert);
    });
    return unsubscribe;
  }, []);

  if (!alert) {
    return null;
  }

  const buttons: AlertButton[] =
    alert.buttons && alert.buttons.length > 0
      ? alert.buttons
      : [{ text: 'حسناً', style: 'default' }];

  const handleButtonPress = async (button: AlertButton) => {
    hideAppAlert();
    if (button.onPress) {
      try {
        await button.onPress();
      } catch (err) {
        console.error('Error executing alert action:', err);
      }
    }
  };

  const handleBackdropPress = () => {
    if (alert.cancelable !== false) {
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      if (cancelBtn) {
        handleButtonPress(cancelBtn);
      } else {
        hideAppAlert();
      }
    }
  };

  // Determine icon and color tokens
  const type = alert.type || 'info';

  const getTypeStyle = () => {
    switch (type) {
      case 'destructive':
        return {
          iconColor: theme.destructive,
          iconBg: theme.destructiveLight,
          defaultIcon: 'trash-outline' as const,
        };
      case 'error':
        return {
          iconColor: theme.destructive,
          iconBg: theme.destructiveLight,
          defaultIcon: 'alert-circle-outline' as const,
        };
      case 'warning':
        return {
          iconColor: isDark ? '#F59E0B' : '#D97706',
          iconBg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
          defaultIcon: 'warning-outline' as const,
        };
      case 'success':
        return {
          iconColor: theme.primary,
          iconBg: theme.primaryLight,
          defaultIcon: 'checkmark-circle-outline' as const,
        };
      case 'settings':
        return {
          iconColor: isDark ? '#38BDF8' : '#0284C7',
          iconBg: isDark ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
          defaultIcon: 'notifications-outline' as const,
        };
      case 'info':
      default:
        return {
          iconColor: isDark ? '#818CF8' : '#4F46E5',
          iconBg: isDark ? 'rgba(79, 70, 229, 0.16)' : '#EEF2FF',
          defaultIcon: 'information-circle-outline' as const,
        };
    }
  };

  const typeStyle = getTypeStyle();
  const iconName = alert.icon || typeStyle.defaultIcon;

  // Determine layout style for buttons (row for 2 buttons, column for 1 or >2)
  const isTwoButtons = buttons.length === 2;

  return (
    <Modal
      visible={Boolean(alert)}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
          accessibilityLabel="إغلاق التنبيه"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: radius.xl,
              padding: spacing.xl,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.45 : 0.14,
            },
          ]}
        >
          {/* Header Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: typeStyle.iconBg,
                borderRadius: radius.full,
              },
            ]}
          >
            <Ionicons name={iconName} size={30} color={typeStyle.iconColor} />
          </View>

          {/* Title & Message */}
          <Text
            style={[
              typography.h3,
              styles.title,
              { color: theme.text, marginTop: spacing.md },
            ]}
          >
            {alert.title}
          </Text>

          {alert.message ? (
            <ScrollView
              style={styles.messageScrollView}
              contentContainerStyle={styles.messageContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text
                style={[
                  typography.body,
                  styles.message,
                  { color: theme.textSecondary },
                ]}
              >
                {alert.message}
              </Text>
            </ScrollView>
          ) : (
            <View style={{ height: spacing.sm }} />
          )}

          {/* Action Buttons */}
          <View
            style={[
              isTwoButtons ? styles.buttonsRow : styles.buttonsColumn,
              { marginTop: spacing.lg },
            ]}
          >
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              let btnBg = theme.primary;
              let textColor = '#FFFFFF';
              let btnBorderColor = 'transparent';

              if (isDestructive) {
                btnBg = theme.destructive;
                textColor = '#FFFFFF';
              } else if (isCancel) {
                btnBg = theme.cardSecondary;
                textColor = theme.text;
                btnBorderColor = theme.border;
              }

              return (
                <Pressable
                  key={`alert-btn-${index}`}
                  onPress={() => handleButtonPress(btn)}
                  style={({ pressed }) => [
                    styles.button,
                    isTwoButtons && styles.buttonFlex,
                    {
                      backgroundColor: btnBg,
                      borderColor: btnBorderColor,
                      borderWidth: isCancel ? 1 : 0,
                      borderRadius: radius.lg,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.md,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.body,
                      styles.buttonText,
                      {
                        color: textColor,
                        fontWeight: isCancel ? '600' : '700',
                      },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    paddingHorizontal: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  messageScrollView: {
    maxHeight: 180,
    width: '100%',
    marginTop: 8,
  },
  messageContent: {
    paddingHorizontal: 4,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  buttonsColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFlex: {
    flex: 1,
  },
  buttonText: {
    textAlign: 'center',
  },
});
