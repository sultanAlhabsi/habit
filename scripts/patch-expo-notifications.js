const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const warnFile = path.join(
  rootDir,
  'node_modules/expo-notifications/build/warnOfExpoGoPushUsage.js'
);

const autoRegFile = path.join(
  rootDir,
  'node_modules/expo-notifications/build/DevicePushTokenAutoRegistration.fx.js'
);

const topicFile = path.join(
  rootDir,
  'node_modules/expo-notifications/build/TopicSubscriptionModule.android.js'
);

const pushTokenFile = path.join(
  rootDir,
  'node_modules/expo-notifications/build/PushTokenManager.native.js'
);

const serverRegFile = path.join(
  rootDir,
  'node_modules/expo-notifications/build/ServerRegistrationModule.native.js'
);

// 1. Patch warnOfExpoGoPushUsage.js to not throw Error on Android in Expo Go
if (fs.existsSync(warnFile)) {
  let content = fs.readFileSync(warnFile, 'utf8');
  if (content.includes("throw new Error(message);")) {
    content = content.replace(
      /if \(Platform\.OS === 'android'\) \{\s*throw new Error\(message\);\s*\}\s*else if \(__DEV__\) \{\s*didWarn = true;\s*console\.warn\(message\);\s*\}/,
      "didWarn = true;\n        if (__DEV__) {\n            console.warn(message);\n        }"
    );
    fs.writeFileSync(warnFile, content, 'utf8');
    console.log('[patch-expo-notifications] Patched warnOfExpoGoPushUsage.js successfully.');
  }
}

// 2. Patch DevicePushTokenAutoRegistration.fx.js to bypass in Expo Go
if (fs.existsSync(autoRegFile)) {
  let content = fs.readFileSync(autoRegFile, 'utf8');
  if (!content.includes("isRunningInExpoGo")) {
    content = content.replace(
      "import { UnavailabilityError } from 'expo-modules-core';",
      "import { isRunningInExpoGo } from 'expo';\nimport { UnavailabilityError } from 'expo-modules-core';"
    );
    content = content.replace(
      "if (ServerRegistrationModule.getRegistrationInfoAsync) {",
      "if (!isRunningInExpoGo() && ServerRegistrationModule.getRegistrationInfoAsync) {"
    );
    content = content.replace(
      "}\nelse {",
      "}\nelse if (!isRunningInExpoGo()) {"
    );
    fs.writeFileSync(autoRegFile, content, 'utf8');
    console.log('[patch-expo-notifications] Patched DevicePushTokenAutoRegistration.fx.js successfully.');
  }
}

// 3. Patch TopicSubscriptionModule.android.js for Expo Go missing module
if (fs.existsSync(topicFile)) {
  let content = fs.readFileSync(topicFile, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
    content = `import { requireOptionalNativeModule } from 'expo-modules-core';

const nativeModule = requireOptionalNativeModule('ExpoTopicSubscriptionModule');

const fallbackModule = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default nativeModule ?? fallbackModule;
`;
    fs.writeFileSync(topicFile, content, 'utf8');
    console.log('[patch-expo-notifications] Patched TopicSubscriptionModule.android.js successfully.');
  }
}

// 4. Patch PushTokenManager.native.js for Expo Go missing module
if (fs.existsSync(pushTokenFile)) {
  let content = fs.readFileSync(pushTokenFile, 'utf8');
  if (content.includes("requireNativeModule('ExpoPushTokenManager')")) {
    content = `import { requireOptionalNativeModule } from 'expo-modules-core';

const nativeModule = requireOptionalNativeModule('ExpoPushTokenManager');

const fallbackModule = {
  addListener: () => {},
  removeListeners: () => {},
  getDevicePushTokenAsync: () => Promise.resolve(null),
};

export default nativeModule ?? fallbackModule;
`;
    fs.writeFileSync(pushTokenFile, content, 'utf8');
    console.log('[patch-expo-notifications] Patched PushTokenManager.native.js successfully.');
  }
}

// 5. Patch ServerRegistrationModule.native.js for Expo Go missing module
if (fs.existsSync(serverRegFile)) {
  let content = fs.readFileSync(serverRegFile, 'utf8');
  if (content.includes("requireNativeModule('NotificationsServerRegistrationModule')")) {
    content = `import { requireOptionalNativeModule } from 'expo-modules-core';

const nativeModule = requireOptionalNativeModule('NotificationsServerRegistrationModule');

const fallbackModule = {
  addListener: () => {},
  removeListeners: () => {},
  getRegistrationInfoAsync: () => Promise.resolve(null),
  setRegistrationInfoAsync: () => Promise.resolve(null),
};

export default nativeModule ?? fallbackModule;
`;
    fs.writeFileSync(serverRegFile, content, 'utf8');
    console.log('[patch-expo-notifications] Patched ServerRegistrationModule.native.js successfully.');
  }
}
