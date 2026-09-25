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

const safeRead = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
};

// 1. Patch warnOfExpoGoPushUsage.js to not throw Error on Android in Expo Go
let warnContent = safeRead(warnFile);
if (warnContent && warnContent.includes("throw new Error(message);")) {
  warnContent = warnContent.replace(
    /if \(Platform\.OS === 'android'\) \{\s*throw new Error\(message\);\s*\}\s*else if \(__DEV__\) \{\s*didWarn = true;\s*console\.warn\(message\);\s*\}/,
    "didWarn = true;\n        if (__DEV__) {\n            console.warn(message);\n        }"
  );
  fs.writeFileSync(warnFile, warnContent, 'utf8');
  console.log('[patch-expo-notifications] Patched warnOfExpoGoPushUsage.js successfully.');
}

// 2. Patch DevicePushTokenAutoRegistration.fx.js to bypass in Expo Go
let autoRegContent = safeRead(autoRegFile);
if (autoRegContent && !autoRegContent.includes("isRunningInExpoGo")) {
  autoRegContent = autoRegContent.replace(
    "import { UnavailabilityError } from 'expo-modules-core';",
    "import { isRunningInExpoGo } from 'expo';\nimport { UnavailabilityError } from 'expo-modules-core';"
  );
  autoRegContent = autoRegContent.replace(
    "if (ServerRegistrationModule.getRegistrationInfoAsync) {",
    "if (!isRunningInExpoGo() && ServerRegistrationModule.getRegistrationInfoAsync) {"
  );
  autoRegContent = autoRegContent.replace(
    "}\nelse {",
    "}\nelse if (!isRunningInExpoGo()) {"
  );
  fs.writeFileSync(autoRegFile, autoRegContent, 'utf8');
  console.log('[patch-expo-notifications] Patched DevicePushTokenAutoRegistration.fx.js successfully.');
}

// 3. Patch TopicSubscriptionModule.android.js for Expo Go missing module
let topicContent = safeRead(topicFile);
if (topicContent && topicContent.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
  const content = `import { requireOptionalNativeModule } from 'expo-modules-core';

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

// 4. Patch PushTokenManager.native.js for Expo Go missing module
let pushTokenContent = safeRead(pushTokenFile);
if (pushTokenContent && pushTokenContent.includes("requireNativeModule('ExpoPushTokenManager')")) {
  const content = `import { requireOptionalNativeModule } from 'expo-modules-core';

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

// 5. Patch ServerRegistrationModule.native.js for Expo Go missing module
let serverRegContent = safeRead(serverRegFile);
if (serverRegContent && serverRegContent.includes("requireNativeModule('NotificationsServerRegistrationModule')")) {
  const content = `import { requireOptionalNativeModule } from 'expo-modules-core';

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
