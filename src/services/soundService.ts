import { requireOptionalNativeModule } from 'expo-modules-core';

let player: any = null;
let isInitializing = false;

const isAudioSupported = (): boolean => {
  try {
    if (typeof requireOptionalNativeModule === 'function') {
      return !!requireOptionalNativeModule('ExpoAudio');
    }
  } catch (_e) {}
  return false;
};

/**
 * Preload the habit completion chime audio player to ensure instant, zero-latency playback.
 */
export const initSound = async (): Promise<void> => {
  if (player || isInitializing) return;
  isInitializing = true;

  try {
    if (!isAudioSupported()) return;

    const { createAudioPlayer } = require('expo-audio');
    const soundAsset = require('../../assets/sounds/complete.wav');
    player = createAudioPlayer(soundAsset);
  } catch (_err) {
    // Non-fatal fallback
    player = null;
  } finally {
    isInitializing = false;
  }
};

/**
 * Play the crisp Pop & Chime celebration sound.
 * Designed to be non-blocking and fail-safe.
 */
export const playCompletionSound = async (): Promise<void> => {
  try {
    if (!isAudioSupported()) return;

    if (!player) {
      await initSound();
    }
    if (player) {
      if (player.currentTime > 0) {
        await player.seekTo(0);
      }
      player.play();
    }
  } catch (_err) {
    // Non-blocking fail-safe
  }
};
