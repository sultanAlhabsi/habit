import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainTabParamList, RootStackParamList } from './types';
import { useTheme } from '../theme/ThemeContext';
import { WhatsAppTabBar } from '../components/navigation/WhatsAppTabBar';

import { HomeScreen } from '../screens/HomeScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AddEditHabitScreen } from '../screens/AddEditHabitScreen';
import { HabitDetailsScreen } from '../screens/HabitDetailsScreen';
import { ArchivedHabitsScreen } from '../screens/ArchivedHabitsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { useHabitStore } from '../store/useHabitStore';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MainTabsNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <WhatsAppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="StatisticsTab" component={StatisticsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const hasCompletedOnboarding = useHabitStore((state) => state.hasCompletedOnboarding);

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          notification: theme.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="AddEditHabit"
          component={AddEditHabitScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="HabitDetails"
          component={HabitDetailsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="ArchivedHabits"
          component={ArchivedHabitsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};


