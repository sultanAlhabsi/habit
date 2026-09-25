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

const path = require('path');
const fs = require('fs');
const { withGradleProperties, withDangerousMod } = require('@expo/config-plugins');

/**
 * Custom Expo Config Plugin to harden release builds:
 * 1. Disables dev network inspector in production.
 * 2. Enables R8 minifyEnabled and shrinkResources in release.
 * 3. Appends safe Proguard keep rules for Expo modules and React Native.
 */
const withProductionHardening = (config) => {
  config = withGradleProperties(config, (modConfig) => {
    modConfig.modResults = modConfig.modResults.filter(
      (item) =>
        item.type !== 'property' ||
        ![
          'EX_DEV_CLIENT_NETWORK_INSPECTOR',
          'android.enableMinifyInReleaseBuilds',
          'android.enableShrinkResourcesInReleaseBuilds',
          'android.compileSdkVersion',
          'android.targetSdkVersion',
        ].includes(item.key)
    );
    modConfig.modResults.push(
      {
        type: 'property',
        key: 'EX_DEV_CLIENT_NETWORK_INSPECTOR',
        value: 'false',
      },
      {
        type: 'property',
        key: 'android.enableMinifyInReleaseBuilds',
        value: 'true',
      },
      {
        type: 'property',
        key: 'android.enableShrinkResourcesInReleaseBuilds',
        value: 'true',
      },
      {
        type: 'property',
        key: 'android.compileSdkVersion',
        value: '36',
      },
      {
        type: 'property',
        key: 'android.targetSdkVersion',
        value: '35',
      }
    );
    return modConfig;
  });

  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const proguardPath = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      try {
        const rules = `
# React Native & Expo production keep rules
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.horcrux.svg.** { *; }
-keep class expo.modules.sqlite.** { *; }
-keep class io.requery.android.database.sqlite.** { *; }
`;
        const existing = fs.readFileSync(proguardPath, 'utf8');
        if (!existing.includes('com.swmansion.rnscreens')) {
          fs.appendFileSync(proguardPath, rules);
        }
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }

      // Ensure release signingConfig is present in app/build.gradle
      const buildGradlePath = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'build.gradle');
      try {
        let content = fs.readFileSync(buildGradlePath, 'utf8');
        if (!content.includes('MYAPP_UPLOAD_STORE_FILE')) {
          content = content.replace(
            /signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\}\s*\}/,
            `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            } else if (System.getenv('ANDROID_KEYSTORE_PATH') != null) {
                storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEY_PASSWORD')
            }
        }
    }`
          );
          content = content.replace(
            /signingConfig\s+signingConfigs\.debug/,
            'signingConfig (signingConfigs.release.storeFile != null && signingConfigs.release.storeFile.exists()) ? signingConfigs.release : signingConfigs.debug'
          );
          fs.writeFileSync(buildGradlePath, content, 'utf8');
        }
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }

      return modConfig;
    },
  ]);

  return config;
};

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const baseConfig = {
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
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F6F5F0',
      },
      permissions: [
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-asset',
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
      databaseUrl:
        process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
          ? process.env.DATABASE_URL.trim()
          : null,
    },
    owner: 'sultanalhabsi',
  };

  return withProductionHardening(baseConfig);
};
