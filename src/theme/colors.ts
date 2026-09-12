// Refined, human-curated palette for calm, everyday habit tracking
// Avoids neon/saturated colors in favor of grounded, earthy, understated tones
export const HABIT_PALETTES = [
  // درجات الأخضر والطبيعة
  { id: 'sage', hex: '#2A4B3A', label: 'أخضر غابي' },
  { id: 'olive', hex: '#4D533C', label: 'زيتي وقور' },
  { id: 'emerald', hex: '#0F766E', label: 'زمردي هادئ' },
  { id: 'mint', hex: '#15803D', label: 'عشبي نضر' },
  { id: 'moss', hex: '#3F6212', label: 'طحلبي دافئ' },

  // درجات الأزرق والنيلي
  { id: 'navy', hex: '#1E3A8A', label: 'أزرق كحلي' },
  { id: 'ocean', hex: '#0369A1', label: 'أزرق بحري' },
  { id: 'indigo', hex: '#4338CA', label: 'نيلي هادئ' },
  { id: 'teal', hex: '#0E7490', label: 'فيروزي داكن' },
  { id: 'sky', hex: '#0284C7', label: 'سماوي رصين' },

  // درجات التراب والعسل
  { id: 'terracotta', hex: '#9A3412', label: 'طوبي هادئ' },
  { id: 'ochre', hex: '#854D0E', label: 'عسلي دافئ' },
  { id: 'amber', hex: '#B45309', label: 'كهرماني' },
  { id: 'copper', hex: '#C2410C', label: 'نحاسي دافئ' },
  { id: 'sand', hex: '#78350F', label: 'رملي غامق' },

  // درجات البنفسجي والوردي والخمري
  { id: 'plum', hex: '#581C87', label: 'خزامي هادئ' },
  { id: 'violet', hex: '#6D28D9', label: 'بنفسجي وقور' },
  { id: 'berry', hex: '#831843', label: 'توتي دافئ' },
  { id: 'rose', hex: '#9F1239', label: 'وردي كلاسيكي' },
  { id: 'burgundy', hex: '#881337', label: 'عنابي داكن' },

  // درجات الرمادي والفحم والبرونز
  { id: 'slate', hex: '#334155', label: 'رمادي حجري' },
  { id: 'steel', hex: '#475569', label: 'رمادي فولاذي' },
  { id: 'charcoal', hex: '#1C1917', label: 'فحمي عميق' },
  { id: 'bronze', hex: '#57534E', label: 'برونزي هادئ' },
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
