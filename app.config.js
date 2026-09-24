/**
 * Dynamic Expo App Configuration
 *
 * Reads sensitive environment variables (DATABASE_URL) from EAS Secrets at build time.
 * This prevents credentials from being hardcoded in source code or committed to Git.
 *
 * EAS Secrets are injected via `process.env` during `eas build`.
 * For local development, use the `.env` file (which is gitignored).
 *
 * @see https://docs.expo.dev/build-reference/variables/
 */

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  return {
    ...config,
    name: 'إنجاز - تتبع العادات',
    slug: 'enjaz-habit-tracker',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.enjaz.habittracker',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F6F5F0',
      },
      permissions: [
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-sqlite',
      'expo-notifications',
      'expo-font',
      'expo-localization',
      'expo-status-bar',
      [
        'expo-splash-screen',
        {
          image: './assets/icon.png',
          resizeMode: 'contain',
          backgroundColor: '#F6F5F0',
        },
      ],
      [
        'expo-audio',
        {
          recordAudioAndroid: false,
          enableBackgroundPlayback: false,
          enableBackgroundRecording: false,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'd0a6b8f4-ebb5-4510-ac3d-047a8145898f',
      },
      // DATABASE_URL is injected from EAS Secrets at build time.
      // Never hardcode credentials here — use `eas env:set` to manage them.
      databaseUrl: process.env.DATABASE_URL ?? null,
    },
    owner: 'sultanalhabsi',
  };
};
