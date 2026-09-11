import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  StatisticsTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  AddEditHabit: { habitId?: string; duplicateFromId?: string };
  HabitDetails: { habitId: string; date?: string };
  ArchivedHabits: undefined;
};

