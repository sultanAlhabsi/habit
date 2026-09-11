export type HabitFrequency = 'daily' | 'specific_days' | 'weekly_target';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  frequencyDays: number[]; // 0: Sun, 1: Mon, ..., 6: Sat
  targetCount: number;
  unit: string;
  isActive: boolean;
  reminderTime?: string | null;
  createdAt: string;
  archivedAt?: string | null;
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
  { name: 'book-outline', label: 'قراءة وتعلم', category: 'تطوير' },
  { name: 'water-outline', label: 'شرب ماء', category: 'صحة' },
  { name: 'fitness-outline', label: 'رياضة ولياقة', category: 'صحة' },
  { name: 'moon-outline', label: 'نوم مبكر', category: 'صحة' },
  { name: 'heart-outline', label: 'صحة وعناية', category: 'صحة' },
  { name: 'sunny-outline', label: 'استيقاظ باكر', category: 'روتين' },
  { name: 'walk-outline', label: 'مشي', category: 'صحة' },
  { name: 'bicycle-outline', label: 'دراجة', category: 'صحة' },
  { name: 'barbell-outline', label: 'تمارين قوة', category: 'صحة' },
  { name: 'sparkles-outline', label: 'عبادة وذكر', category: 'روحانية' },
  { name: 'journal-outline', label: 'كتابة ويوميات', category: 'تطوير' },
  { name: 'laptop-outline', label: 'برمجة وعمل', category: 'إنتاجية' },
  { name: 'alarm-outline', label: 'التزام بالمواعيد', category: 'روتين' },
  { name: 'leaf-outline', label: 'تأمل وطبيعة', category: 'روحانية' },
  { name: 'cafe-outline', label: 'قهوة وتركيز', category: 'روتين' },
  { name: 'trophy-outline', label: 'تحدي وهدف', category: 'إنتاجية' },
  { name: 'bed-outline', label: 'راحة واسترخاء', category: 'صحة' },
  { name: 'pulse-outline', label: 'نشاط وحيوية', category: 'صحة' },
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

export type HabitSortOption = 'default' | 'pending_first' | 'reminder_time' | 'streak';

export interface HabitSortOptionItem {
  id: HabitSortOption;
  label: string;
  icon: string;
}

export const HABIT_SORT_OPTIONS: HabitSortOptionItem[] = [
  { id: 'default', label: 'الافتراضي', icon: 'reorder-four-outline' },
  { id: 'pending_first', label: 'المتبقية أولاً', icon: 'hourglass-outline' },
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

