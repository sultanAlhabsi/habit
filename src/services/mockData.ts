import dayjs from 'dayjs';
import { Habit, HabitCheckin } from '../types/habit';

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'شرب الماء',
    description: 'الحفاظ على رطوبة الجسم طوال اليوم',
    icon: 'water-outline',
    color: '#2A4B3A',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'لتر',
    isActive: true,
    reminderTime: '09:00',
    createdAt: dayjs().subtract(30, 'day').toISOString(),
  },
  {
    id: 'habit-2',
    name: 'القراءة اليومية',
    description: 'قراءة في كتاب نافع',
    icon: 'book-outline',
    color: '#334155',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'دقيقة',
    isActive: true,
    reminderTime: '21:30',
    createdAt: dayjs().subtract(30, 'day').toISOString(),
  },
  {
    id: 'habit-3',
    name: 'تمارين الصباح',
    description: 'تنشيط الجسم والحركة اليومية',
    icon: 'fitness-outline',
    color: '#854D0E',
    frequency: 'specific_days',
    frequencyDays: [0, 1, 2, 3, 4],
    targetCount: 1,
    unit: 'تمرين',
    isActive: true,
    reminderTime: '07:00',
    createdAt: dayjs().subtract(30, 'day').toISOString(),
  },
  {
    id: 'habit-4',
    name: 'أذكار وتأمل',
    description: 'بداية اليوم بذكر وسكينة',
    icon: 'sparkles-outline',
    color: '#1E3A8A',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    isActive: true,
    reminderTime: '06:00',
    createdAt: dayjs().subtract(25, 'day').toISOString(),
  },
  {
    id: 'habit-5',
    name: 'نوم مبكر',
    description: 'النوم الكافي للنشاط والتركيز',
    icon: 'moon-outline',
    color: '#9A3412',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'يوم',
    isActive: true,
    reminderTime: '23:00',
    createdAt: dayjs().subtract(20, 'day').toISOString(),
  },
];

/**
 * Generate 30 days of realistic checkin history for initial habits
 */
export const generateDemoCheckins = (): HabitCheckin[] => {
  const checkins: HabitCheckin[] = [];
  const today = dayjs();

  INITIAL_HABITS.forEach((habit, habitIndex) => {
    // Each habit has a distinct completion pattern so heatmaps look realistic
    const completionProbability = 0.85 - habitIndex * 0.08;

    for (let i = 28; i >= 0; i--) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      const dayOfWeek = today.subtract(i, 'day').day();

      // If specific days, only check if day is in frequencyDays
      if (habit.frequency === 'specific_days' && !habit.frequencyDays.includes(dayOfWeek)) {
        continue;
      }

      // Make recent 5 days completed for habit-1 to have a nice active streak
      const isCompleted = (habitIndex === 0 && i <= 5) ? true : Math.random() < completionProbability;

      if (isCompleted) {
        checkins.push({
          id: `checkin_${habit.id}_${date}`,
          habitId: habit.id,
          date,
          count: habit.targetCount,
          completed: true,
          updatedAt: dayjs().toISOString(),
        });
      }
    }
  });

  return checkins;
};
