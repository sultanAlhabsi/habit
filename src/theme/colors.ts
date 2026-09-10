// Refined, human-curated palette for calm, everyday habit tracking
// Avoids neon/saturated colors in favor of grounded, earthy, understated tones
export const HABIT_PALETTES = [
  { id: 'sage', hex: '#2A4B3A', label: 'أخضر غابي' },
  { id: 'slate', hex: '#334155', label: 'رمادي حجري' },
  { id: 'ochre', hex: '#854D0E', label: 'عسلي دافئ' },
  { id: 'navy', hex: '#1E3A8A', label: 'أزرق كحلي' },
  { id: 'terracotta', hex: '#9A3412', label: 'طوبي هادئ' },
  { id: 'plum', hex: '#581C87', label: 'خزامي هادئ' },
];

export const LIGHT_THEME = {
  isDark: false,
  background: '#FAF9F6', // Warm, soft off-white (easy on the eyes)
  card: '#FFFFFF',
  cardSecondary: '#F4F3EF',
  cardHover: '#EBEAE5',
  text: '#1C1917', // Stone-900 (deep warm charcoal)
  textSecondary: '#78716C', // Stone-500
  textMuted: '#A8A29E', // Stone-400
  border: '#EBEAE5', // Crisp hairline border
  borderSubtle: '#F4F3EF',
  primary: '#2A4B3A', // Single serene accent (deep forest sage)
  primaryLight: '#EBF2EE',
  primaryForeground: '#FFFFFF',
  accent: '#2A4B3A',
  accentLight: '#EBF2EE',
  destructive: '#991B1B', // Subdued crimson
  destructiveLight: '#FEE2E2',
  success: '#2A4B3A',
  successLight: '#EBF2EE',
  tabBar: '#FAF9F6',
  tabBarBorder: '#EBEAE5',
  tabActive: '#1C1917',
  tabInactive: '#A8A29E',
  shadow: 'rgba(0, 0, 0, 0.02)', // Ultra subtle, almost flat
};

export const DARK_THEME = {
  isDark: true,
  background: '#141413', // Deep matte dark
  card: '#1C1C1A',
  cardSecondary: '#242422',
  cardHover: '#2E2E2B',
  text: '#F5F5F4', // Stone-100
  textSecondary: '#A8A29E', // Stone-400
  textMuted: '#78716C', // Stone-500
  border: '#282825',
  borderSubtle: '#20201E',
  primary: '#528268', // Muted sage for dark mode
  primaryLight: '#1C2922',
  primaryForeground: '#FFFFFF',
  accent: '#528268',
  accentLight: '#1C2922',
  destructive: '#DC2626',
  destructiveLight: '#3B1212',
  success: '#528268',
  successLight: '#1C2922',
  tabBar: '#141413',
  tabBarBorder: '#242422',
  tabActive: '#F5F5F4',
  tabInactive: '#78716C',
  shadow: 'rgba(0, 0, 0, 0.2)',
};

export type ThemeColors = typeof LIGHT_THEME;
