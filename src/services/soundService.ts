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

    const { AudioModule } = require('expo-audio');
    const { resolveSource } = require('expo-audio/build/utils/resolveSource');
    const soundAsset = require('../../assets/sounds/complete.wav');

    if (AudioModule?.AudioPlayer) {
      const resolved = resolveSource ? resolveSource(soundAsset) : soundAsset;
      player = new AudioModule.AudioPlayer(resolved, 500, false, 0);
    }
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
      try {
        if (typeof player.seekTo === 'function') {
          player.seekTo(0);
        }
        if (typeof player.play === 'function') {
          player.play();
        }
      } catch (_playErr) {
        // Fallback: try recreating on next interaction
        player = null;
      }
    }
  } catch (_err) {
    // Non-blocking fail-safe
  }
};
