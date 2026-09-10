import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_THEME, LIGHT_THEME, ThemeColors } from './colors';
import { SPACING, RADIUS, TOUCH_TARGET } from './spacing';
import { TYPOGRAPHY } from './typography';
import { getPreference, setPreference } from '../services/database';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  typography: typeof TYPOGRAPHY;
  touchTarget: number;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: LIGHT_THEME,
  themeMode: 'system',
  isDark: false,
  setThemeMode: () => {},
  spacing: SPACING,
  radius: RADIUS,
  typography: TYPOGRAPHY,
  touchTarget: TOUCH_TARGET,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialMode?: ThemeMode }> = ({
  children,
  initialMode = 'system',
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    getPreference('theme_mode', initialMode).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
      }
    });
  }, [initialMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    setPreference('theme_mode', mode);
  }, []);

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDark,
        setThemeMode,
        spacing: SPACING,
        radius: RADIUS,
        typography: TYPOGRAPHY,
        touchTarget: TOUCH_TARGET,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

