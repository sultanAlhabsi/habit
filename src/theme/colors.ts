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
  textSecondary: '#57534E', // Stone-600 (WCAG AA pass on light backgrounds)
  textMuted: '#78716C', // Stone-500 (crisp legible muted text)
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
  tabInactive: '#78716C',
  tabPill: '#EBF2EE', // Identical to Settings icon containers (primaryLight)
  tabPillActiveIcon: '#2A4B3A', // Deep forest green icon (primary)
  tabActiveLabel: '#1C1917', // High-contrast active label text
  shadow: 'rgba(0, 0, 0, 0.02)', // Ultra subtle, almost flat
};

export const DARK_THEME = {
  isDark: true,
  background: '#0D0E10', // Deep obsidian slate (pure, neutral, OLED-friendly)
  card: '#16181B', // Elevated charcoal card
  cardSecondary: '#202327', // Crisp secondary surface for chips/badges
  cardHover: '#282C31',
  text: '#F8FAFC', // Slate-50 clean crisp text
  textSecondary: '#CBD5E1', // Slate-300 clear neutral text
  textMuted: '#94A3B8', // Slate-400 balanced legible muted text
  border: '#262A30', // Crisp hairline border for card definition
  borderSubtle: '#1C1F24',
  primary: '#10B981', // Luminous, elegant emerald green
  primaryLight: 'rgba(16, 185, 129, 0.15)',
  primaryForeground: '#FFFFFF',
  accent: '#10B981',
  accentLight: 'rgba(16, 185, 129, 0.15)',
  destructive: '#EF4444',
  destructiveLight: '#3B1212',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  tabBar: '#0D0E10',
  tabBarBorder: '#1F2227',
  tabActive: '#F8FAFC',
  tabInactive: '#94A3B8',
  tabPill: 'rgba(16, 185, 129, 0.15)', // Identical to primaryLight in Dark mode
  tabPillActiveIcon: '#10B981', // Luminous emerald green icon (primary)
  tabActiveLabel: '#F8FAFC', // Slate-50 clean active label text
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export type ThemeColors = typeof LIGHT_THEME;
