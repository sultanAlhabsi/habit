export type ThemeMode = 'light' | 'dark' | 'system';

export type HabitFrequency = 'daily' | 'specific_days' | 'weekly_target' | 'monthly_day' | 'monthly_target';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  frequencyDays: number[]; // 0: Sun, 1: Mon, ..., 6: Sat
  targetCount: number;
  weeklyTargetCount?: number; // Target completions per week (e.g. 3 times/week)
  monthlyTargetCount?: number; // Target completions per month (e.g. 4 times/month)
  monthlyDay?: number; // 1 - 31 for specific day of month
  unit: string;
  isActive: boolean;
  reminderTime?: string | null;
  isPinned?: boolean;
  order?: number;
  createdAt: string;
  archivedAt?: string | null;
  updatedAt?: string;
}

export interface HabitCheckin {
  id: string; // chk_habitId_date
  habitId: string;
  date: string; // YYYY-MM-DD
  count: number; // For multi-target habits
  completed: boolean;
  updatedAt: string; // ISO date
  note?: string; // Daily reflection note / achievement diary entry
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0 - 100
  totalDueDays: number;
}

export interface OverallStats {
  totalHabits: number;
  activeHabits: number;
  todayCompletionRate: number;
  todayCompletedCount: number;
  todayTotalCount: number;
  bestOverallStreak: number;
  totalCheckinsEver: number;
  hasEverHadPerfectDay: boolean;
  weeklyAdherence: DayAdherence[];
}

export interface DayAdherence {
  dayName: string;
  dayShort: string;
  date: string; // YYYY-MM-DD
  dayIndex: number; // 0-6
  completedCount: number;
  totalCount: number;
  rate: number; // 0-100
  isFuture: boolean;
  isToday: boolean;
}

export interface HabitIconOption {
  name: string;
  label: string;
  category: string;
}

export const AVAILABLE_ICONS: HabitIconOption[] = [
  // تطوير (Learning, Skills & Self-Development)
  { name: 'book-outline', label: 'قراءة وتعلم', category: 'تطوير' },
  { name: 'journal-outline', label: 'كتابة ويوميات', category: 'تطوير' },
  { name: 'school-outline', label: 'دراسة ومذاكرة', category: 'تطوير' },
  { name: 'library-outline', label: 'مطالعة وبحث', category: 'تطوير' },
  { name: 'bulb-outline', label: 'أفكار جديدة وإبداع', category: 'تطوير' },
  { name: 'language-outline', label: 'تعلم لغات', category: 'تطوير' },
  { name: 'pencil-outline', label: 'رسم وتصميم', category: 'تطوير' },
  { name: 'color-palette-outline', label: 'فنون وتلوين', category: 'تطوير' },
  { name: 'musical-notes-outline', label: 'موسيقى وصوتيات', category: 'تطوير' },
  { name: 'camera-outline', label: 'تصوير وتوثيق', category: 'تطوير' },
  { name: 'mic-outline', label: 'إلقاء وبودكاست', category: 'تطوير' },
  { name: 'headset-outline', label: 'كتب صوتية واستماع', category: 'تطوير' },
  { name: 'people-outline', label: 'صلة رحم وتواصل', category: 'تطوير' },
  { name: 'chatbubbles-outline', label: 'حوار ونقاش هادف', category: 'تطوير' },
  { name: 'game-controller-outline', label: 'ألعاب ذكاء وتحدي', category: 'تطوير' },
  { name: 'repeat-outline', label: 'نشر وتكرار ومشاركة', category: 'تطوير' },

  // صحة (Health, Fitness & Wellness)
  { name: 'water-outline', label: 'شرب ماء', category: 'صحة' },
  { name: 'fitness-outline', label: 'رياضة ولياقة', category: 'صحة' },
  { name: 'walk-outline', label: 'مشي وخطوات', category: 'صحة' },
  { name: 'footsteps-outline', label: 'تتبع الخطوات', category: 'صحة' },
  { name: 'bicycle-outline', label: 'ركوب دراجة', category: 'صحة' },
  { name: 'barbell-outline', label: 'تمارين قوة وأثقال', category: 'صحة' },
  { name: 'moon-outline', label: 'نوم مبكر', category: 'صحة' },
  { name: 'bed-outline', label: 'راحة واسترخاء', category: 'صحة' },
  { name: 'heart-outline', label: 'صحة وعناية', category: 'صحة' },
  { name: 'pulse-outline', label: 'نشاط وحيوية', category: 'صحة' },
  { name: 'nutrition-outline', label: 'أكل صحي', category: 'صحة' },
  { name: 'restaurant-outline', label: 'وجبات متوازنة', category: 'صحة' },
  { name: 'medkit-outline', label: 'أدوية وفيتامينات', category: 'صحة' },
  { name: 'body-outline', label: 'إطالة ومرونة', category: 'صحة' },
  { name: 'bandage-outline', label: 'تعافي وعلاج', category: 'صحة' },

  // إنتاجية (Productivity, Work & Finance)
  { name: 'laptop-outline', label: 'برمجة وعمل', category: 'إنتاجية' },
  { name: 'briefcase-outline', label: 'مهام العمل', category: 'إنتاجية' },
  { name: 'code-slash-outline', label: 'برمجة وكود', category: 'إنتاجية' },
  { name: 'trophy-outline', label: 'تحدي وهدف', category: 'إنتاجية' },
  { name: 'rocket-outline', label: 'إنجاز مشاريع', category: 'إنتاجية' },
  { name: 'timer-outline', label: 'جلسات تركيز', category: 'إنتاجية' },
  { name: 'wallet-outline', label: 'ادخار وميزانية', category: 'إنتاجية' },
  { name: 'cash-outline', label: 'توفير مالي', category: 'إنتاجية' },
  { name: 'calculator-outline', label: 'حسابات ومصاريف', category: 'إنتاجية' },
  { name: 'trending-up-outline', label: 'استثمار ونمو', category: 'إنتاجية' },
  { name: 'document-text-outline', label: 'تقارير وتوثيق', category: 'إنتاجية' },
  { name: 'clipboard-outline', label: 'قائمة مهام', category: 'إنتاجية' },
  { name: 'folder-outline', label: 'تنظيم ملفات', category: 'إنتاجية' },
  { name: 'images-outline', label: 'حذف الصور وتنظيم الألبوم', category: 'إنتاجية' },
  { name: 'trash-outline', label: 'تنظيف وترتيب الملفات', category: 'إنتاجية' },
  { name: 'phone-portrait-outline', label: 'تقليل استخدام الهاتف', category: 'إنتاجية' },

  // روتين (Daily Routine & Organization)
  { name: 'sunny-outline', label: 'استيقاظ باكر', category: 'روتين' },
  { name: 'alarm-outline', label: 'التزام بالمواعيد', category: 'روتين' },
  { name: 'cafe-outline', label: 'قهوة وتركيز', category: 'روتين' },
  { name: 'home-outline', label: 'ترتيب المنزل', category: 'روتين' },
  { name: 'brush-outline', label: 'نظافة شخصية وسواك', category: 'روتين' },
  { name: 'shirt-outline', label: 'عناية بالملابس', category: 'روتين' },
  { name: 'calendar-outline', label: 'تخطيط أسبوعي', category: 'روتين' },
  { name: 'cart-outline', label: 'تسوق ومشتريات', category: 'روتين' },
  { name: 'time-outline', label: 'إدارة الوقت', category: 'روتين' },
  { name: 'hourglass-outline', label: 'جلسة هدوء وتنظيم', category: 'روتين' },
  { name: 'car-outline', label: 'تنقل ومشاوير', category: 'روتين' },
  { name: 'cut-outline', label: 'قص الأظافر وعناية', category: 'روتين' },

  // روحانية (Spirituality & Mindfulness)
  { name: 'sparkles-outline', label: 'عبادة وذكر', category: 'روحانية' },
  { name: 'cloud-outline', label: 'استغفار وسحاب', category: 'روحانية' },
  { name: 'star-outline', label: 'تميز وتلاوة وسور', category: 'روحانية' },
  { name: 'gift-outline', label: 'صدقة وإحسان', category: 'روحانية' },
  { name: 'paw-outline', label: 'رأفة بالحيوان والطيور', category: 'روحانية' },
  { name: 'leaf-outline', label: 'تأمل وطبيعة', category: 'روحانية' },
  { name: 'flower-outline', label: 'امتنان وسكينة', category: 'روحانية' },
  { name: 'bonfire-outline', label: 'جلسة صفاء', category: 'روحانية' },
  { name: 'compass-outline', label: 'استقامة وتوجه', category: 'روحانية' },
  { name: 'heart-half-outline', label: 'سلام داخلي', category: 'روحانية' },
  { name: 'planet-outline', label: 'تفكر وتدبر', category: 'روحانية' },
];

export const DAYS_OF_WEEK_AR = [
  { index: 0, name: 'الأحد', short: 'أحد' },
  { index: 1, name: 'الإثنين', short: 'إثن' },
  { index: 2, name: 'الثلاثاء', short: 'ثلا' },
  { index: 3, name: 'الأربعاء', short: 'أرب' },
  { index: 4, name: 'الخميس', short: 'خمي' },
  { index: 5, name: 'الجمعة', short: 'جمع' },
  { index: 6, name: 'السبت', short: 'سبت' },
];

export const HABIT_CATEGORIES = ['الكل', 'صحة', 'إنتاجية', 'روتين', 'روحانية', 'تطوير'] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export type HabitSortOption = 'default' | 'pending_first' | 'alphabetical' | 'reminder_time' | 'streak';

export interface HabitSortOptionItem {
  id: HabitSortOption;
  label: string;
  icon: string;
}

export const HABIT_SORT_OPTIONS: HabitSortOptionItem[] = [
  { id: 'default', label: 'الافتراضي', icon: 'reorder-four-outline' },
  { id: 'pending_first', label: 'المتبقية أولاً', icon: 'hourglass-outline' },
  { id: 'alphabetical', label: 'أبجدي (أ - ي)', icon: 'text-outline' },
  { id: 'reminder_time', label: 'وقت التنبيه', icon: 'time-outline' },
  { id: 'streak', label: 'أعلى سلسلة', icon: 'flame-outline' },
];

export interface MonthAdherenceStats {
  monthLabel: string;
  year: number;
  monthIndex: number;
  totalDueOpportunities: number;
  totalCompletions: number;
  completionRate: number;
  perfectDaysCount: number;
  totalDaysInMonth: number;
  daysPassedInMonth: number;
  activeHabitsCount: number;
}

export interface StreakMilestoneTier {
  id: string;
  name: string;
  days: number;
  icon: string;
  description: string;
}

export interface StreakMilestoneInfo {
  currentStreak: number;
  currentTier: StreakMilestoneTier;
  nextMilestone: {
    tier: StreakMilestoneTier;
    remainingDays: number;
  } | null;
  progressPercent: number; // 0 - 100
  isTopTier: boolean;
}

export interface HabitDayDistribution {
  dayIndex: number; // 0: Sun, ..., 6: Sat
  dayName: string;
  dayShort: string;
  dueCount: number;
  completedCount: number;
  rate: number; // 0 - 100
}

export interface HabitConsistencyPattern {
  days: HabitDayDistribution[];
  bestDay: HabitDayDistribution | null;
  weakestDay: HabitDayDistribution | null;
  insightMessage: string;
}

export interface CategoryPerformanceItem {
  category: Exclude<HabitCategory, 'الكل'>;
  iconName: string;
  color: string;
  totalHabits: number;
  activeHabits: number;
  totalCheckins: number;
  completionRate: number; // 0 - 100
}

export interface CategoryAnalytics {
  categories: CategoryPerformanceItem[];
  topCategory: CategoryPerformanceItem | null;
  focusCategory: CategoryPerformanceItem | null;
  balanceScore: number; // 0 - 100
  insightMessage: string;
}

