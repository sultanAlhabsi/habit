import type { Ionicons } from '@expo/vector-icons';

export type AlertType = 'info' | 'success' | 'warning' | 'destructive' | 'error' | 'settings';

export interface AlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  icon?: keyof typeof Ionicons.glyphMap;
  buttons?: AlertButton[];
  cancelable?: boolean;
  onDismiss?: () => void;
}

type AlertListener = (alert: AlertOptions | null) => void;

let currentAlert: AlertOptions | null = null;
const listeners = new Set<AlertListener>();

export function subscribeAlert(listener: AlertListener): () => void {
  listeners.add(listener);
  listener(currentAlert);
  return () => {
    listeners.delete(listener);
  };
}

export function showAppAlert(options: AlertOptions) {
  // Infer type and icon if not explicitly provided
  const inferred = inferTypeAndIcon(options);
  currentAlert = {
    ...options,
    type: options.type || inferred.type,
    icon: options.icon || inferred.icon,
  };
  listeners.forEach((listener) => listener(currentAlert));
}

export function hideAppAlert() {
  if (currentAlert?.onDismiss) {
    try {
      currentAlert.onDismiss();
    } catch (e) {
      console.warn('Error in alert onDismiss:', e);
    }
  }
  currentAlert = null;
  listeners.forEach((listener) => listener(null));
}

function inferTypeAndIcon(options: AlertOptions): { type: AlertType; icon: keyof typeof Ionicons.glyphMap } {
  const title = options.title || '';
  const message = options.message || '';
  const fullText = `${title} ${message}`.toLowerCase();

  const hasDestructiveBtn = options.buttons?.some((b) => b.style === 'destructive');
  if (hasDestructiveBtn || fullText.includes('حذف') || fullText.includes('مسح') || fullText.includes('إعادة تعيين')) {
    return { type: 'destructive', icon: 'trash-outline' };
  }

  if (fullText.includes('خطأ') || fullText.includes('فشل') || fullText.includes('تعذر')) {
    return { type: 'error', icon: 'alert-circle-outline' };
  }

  if (fullText.includes('نجاح') || fullText.includes('تمت') || fullText.includes('تم ')) {
    return { type: 'success', icon: 'checkmark-circle-outline' };
  }

  if (fullText.includes('إذن') || fullText.includes('إشعار') || fullText.includes('تنبيهات')) {
    return { type: 'settings', icon: 'notifications-outline' };
  }

  if (fullText.includes('تنبيه') || fullText.includes('تحذير') || fullText.includes('تأكيد')) {
    return { type: 'warning', icon: 'warning-outline' };
  }

  return { type: 'info', icon: 'information-circle-outline' };
}

/**
 * Drop-in helper matching React Native's Alert.alert(title, message, buttons, options) signature
 */
export function appAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: { cancelable?: boolean; type?: AlertType; icon?: keyof typeof Ionicons.glyphMap }
) {
  showAppAlert({
    title,
    message,
    buttons,
    cancelable: options?.cancelable,
    type: options?.type,
    icon: options?.icon,
  });
}

/**
 * Convenience helper for confirmation dialogs
 */
export function showConfirmAlert(options: {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: AlertType;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  showAppAlert({
    title: options.title,
    message: options.message,
    type: options.type ?? (options.isDestructive ? 'destructive' : 'warning'),
    icon: options.icon ?? (options.isDestructive ? 'trash-outline' : 'alert-circle-outline'),
    buttons: [
      {
        text: options.cancelText || 'إلغاء',
        style: 'cancel',
        onPress: options.onCancel,
      },
      {
        text: options.confirmText || 'تأكيد',
        style: options.isDestructive ? 'destructive' : 'default',
        onPress: options.onConfirm,
      },
    ],
  });
}
