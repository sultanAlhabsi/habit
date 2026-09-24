import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useHabitStore } from './src/store/useHabitStore';
import { CustomAlertModal, ErrorBoundary } from './src/components/common';
import { AnimatedSplashScreen } from './src/components/splash/AnimatedSplashScreen';

// Prevent native splash screen from auto-hiding before React tree renders
SplashScreen.preventAutoHideAsync().catch(() => {});

const AppContent: React.FC = () => {
  const { isDark } = useTheme();
  const init = useHabitStore((state) => state.init);
  const isLoading = useHabitStore((state) => state.isLoading);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initiate background initialization & habits sync immediately
    init();

    // Hide native static splash screen as soon as React component is mounted
    SplashScreen.hideAsync().catch(() => {});
  }, [init]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <View style={styles.contentContainer}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!isLoading && <AppNavigator />}
      <CustomAlertModal />
      {showSplash && (
        <AnimatedSplashScreen
          isReady={!isLoading}
          onFinish={handleSplashFinish}
        />
      )}
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
