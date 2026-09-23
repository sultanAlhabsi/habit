import { Vibration } from 'react-native';

/**
 * Trigger a subtle haptic vibration for UI feedback (switches, tabs, buttons)
 */
export const triggerLightHaptic = () => {
  Vibration.vibrate(20);
};

export const triggerMediumHaptic = () => {
  Vibration.vibrate(40);
};

export const triggerSuccessHaptic = () => {
  Vibration.vibrate([0, 20, 50, 25]);
};
