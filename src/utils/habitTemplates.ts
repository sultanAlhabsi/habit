import type { HabitCategory } from '../types/habit';

const normalizeArabicText = (text: string): string => {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .toLowerCase()
    .trim();
};

export interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  category: Exclude<HabitCategory, 'الكل'>;
  icon: string;
  color: string;
  frequency: 'daily' | 'specific_days';
  frequencyDays: number[];
  targetCount: number;
  unit: string;
  reminderTime?: string;
  tags: string[];
}

export const HABIT_TEMPLATE_CATEGORIES: HabitCategory[] = [
  'الكل',
  'صحة',
  'روحانية',
  'تطوير',
  'إنتاجية',
  'روتين',
];

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // --- صحة ورياضة ---
  {
    id: 'template_water',
    name: 'شرب 2 لتر ماء',
    description: 'ترطيب الجسم وتجديد النشاط والحفاظ على الحيوية والتركيز',
    category: 'صحة',
    icon: 'water-outline',
    color: '#0369A1', // أزرق بحري
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 8,
    unit: 'كوب',
    reminderTime: '08:30',
    tags: ['ماء', 'صحة', 'ترطيب', 'نشاط', 'حيوية'],
  },
  {
    id: 'template_steps',
    name: 'المشي 5000 خطوة',
    description: 'تنشيط الدورة الدموية ومكافحة الخمول والجلوس المكتبي الطويل',
    category: 'صحة',
    icon: 'walk-outline',
    color: '#15803D', // عشبي نضر
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 5000,
    unit: 'خطوة',
    reminderTime: '17:00',
    tags: ['مشي', 'رياضة', 'حركة', 'خطوات', 'لياقة'],
  },
  {
    id: 'template_workout',
    name: 'تمرين رياضي أو لياقة',
    description: 'تقوية العضلات ورفع معدل اللياقة البدنية ومستوى الطاقة الإيجابية',
    category: 'صحة',
    icon: 'barbell-outline',
    color: '#9A3412', // طوبي هادئ
    frequency: 'specific_days',
    frequencyDays: [0, 1, 2, 3, 4], // الأحد إلى الخميس
    targetCount: 30,
    unit: 'دقيقة',
    reminderTime: '18:00',
    tags: ['تمارين', 'جيم', 'لياقة', 'حديد', 'رياضة'],
  },
  {
    id: 'template_sleep_early',
    name: 'نوم صحي ومبكر',
    description: 'النوم قبل 11:00 م لإراحة الجهاز العصبي وتجديد خلايا الجسم',
    category: 'صحة',
    icon: 'moon-outline',
    color: '#581C87', // خزامي هادئ
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    reminderTime: '22:30',
    tags: ['نوم', 'راحة', 'استرخاء', 'صحة', 'بكور'],
  },
  {
    id: 'template_stretching',
    name: 'تمارين إطالة ومرونة',
    description: 'فك تشنجات الرقبة والظهر وتحسين مرونة المفاصل بعد الاستيقاظ',
    category: 'صحة',
    icon: 'body-outline',
    color: '#0F766E', // زمردي هادئ
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 10,
    unit: 'دقيقة',
    reminderTime: '07:15',
    tags: ['إطالة', 'مرونة', 'يوغا', 'ظهر', 'استرخاء'],
  },
  {
    id: 'template_healthy_meal',
    name: 'تناول خضار وفواكه طازجة',
    description: 'تغذية الجسم بالفيتامينات والمعادن والألياف الغذائية الطبيعية',
    category: 'صحة',
    icon: 'nutrition-outline',
    color: '#3F6212', // طحلبي دافئ
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 3,
    unit: 'حصص',
    reminderTime: '13:00',
    tags: ['أكل صحي', 'خضار', 'فواكه', 'تغذية', 'صحة'],
  },

  // --- روحانية وسكينة ---
  {
    id: 'template_quran',
    name: 'ورد القرآن الكريم',
    description: 'تلاوة صفحات بتدبر وسكينة لراحة القلب وبركة الوقت',
    category: 'روحانية',
    icon: 'book-outline',
    color: '#2A4B3A', // أخضر غابي
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 10,
    unit: 'صفحات',
    reminderTime: '05:30',
    tags: ['قرآن', 'تلاوة', 'عبادة', 'تدبر', 'بركة'],
  },
  {
    id: 'template_adhkar',
    name: 'أذكار الصباح والمساء',
    description: 'حصن المسلم والتحصين اليومي وبداية اليوم وختامه بذكر الله',
    category: 'روحانية',
    icon: 'sparkles-outline',
    color: '#B45309', // كهرماني
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 2,
    unit: 'مرة',
    reminderTime: '06:30',
    tags: ['أذكار', 'دعاء', 'صباح', 'مساء', 'حصن'],
  },
  {
    id: 'template_fajr',
    name: 'صلاة الفجر في وقتها',
    description: 'بركة اليوم والبداية النورانية والانضباط الإيماني الصباحي',
    category: 'روحانية',
    icon: 'sunny-outline',
    color: '#1E3A8A', // أزرق كحلي
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'صلاة',
    reminderTime: '04:45',
    tags: ['صلاة', 'فجر', 'عبادة', 'بركة', 'نور'],
  },
  {
    id: 'template_istighfar',
    name: 'الاستغفار والتسبيح',
    description: 'الذكر المستمر وراحة البال وانشراح الصدر وتفريج الهموم',
    category: 'روحانية',
    icon: 'heart-half-outline',
    color: '#0E7490', // فيروزي داكن
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 100,
    unit: 'مرة',
    reminderTime: '09:00',
    tags: ['استغفار', 'تسبيح', 'ذكر', 'طمأنينة', 'دعاء'],
  },
  {
    id: 'template_charity',
    name: 'صدقة أو عمل إحسان',
    description: 'بذل العطاء ومساعدة محتاج أو إدخال سرور على قلب مسلم',
    category: 'روحانية',
    icon: 'leaf-outline',
    color: '#4D533C', // زيتي وقور
    frequency: 'specific_days',
    frequencyDays: [5], // يوم الجمعة
    targetCount: 1,
    unit: 'مرة',
    reminderTime: '11:00',
    tags: ['صدقة', 'إحسان', 'جمعة', 'عطاء', 'خير'],
  },

  // --- تطوير وتعلم ---
  {
    id: 'template_reading',
    name: 'قراءة كتاب مفيد',
    description: 'توسيع المدارك وتنمية المعرفة والعقل وبناء الفكر الرصين',
    category: 'تطوير',
    icon: 'library-outline',
    color: '#78350F', // رملي غامق
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 15,
    unit: 'صفحة',
    reminderTime: '20:30',
    tags: ['قراءة', 'كتب', 'ثقافة', 'معرفة', 'تطوير'],
  },
  {
    id: 'template_language',
    name: 'تعلم لغة جديدة',
    description: 'حفظ كلمات جديدة وممارسة التحدث والاستماع اليومي المستمر',
    category: 'تطوير',
    icon: 'language-outline',
    color: '#4338CA', // نيلي هادئ
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 15,
    unit: 'دقيقة',
    reminderTime: '19:00',
    tags: ['لغات', 'إنجليزي', 'مفردات', 'تعلم', 'مهارات'],
  },
  {
    id: 'template_journaling',
    name: 'كتابة وتدوين الخواطر',
    description: 'تفريغ الأفكار والتأمل الذاتي وتوثيق الإنجازات اليومية',
    category: 'تطوير',
    icon: 'journal-outline',
    color: '#475569', // رمادي فولاذي
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 10,
    unit: 'دقائق',
    reminderTime: '21:30',
    tags: ['كتابة', 'يوميات', 'تأمل', 'تدوين', 'خواطر'],
  },
  {
    id: 'template_podcast',
    name: 'استماع لبودكاست معرفي',
    description: 'تغذية الفكر بمحتوى قيّم ومحادثات ملهمة أثناء التنقل أو الراحة',
    category: 'تطوير',
    icon: 'headset-outline',
    color: '#854D0E', // عسلي دافئ
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 20,
    unit: 'دقيقة',
    reminderTime: '16:30',
    tags: ['بودكاست', 'استماع', 'معرفة', 'محاضرة', 'ثقافة'],
  },
  {
    id: 'template_family_contact',
    name: 'صلة الرحم والتواصل العائلي',
    description: 'مكالمة هاتفية أو زيارة للأهل والأصدقاء وتفقد أحوالهم',
    category: 'تطوير',
    icon: 'people-outline',
    color: '#9F1239', // وردي كلاسيكي
    frequency: 'specific_days',
    frequencyDays: [4, 5], // الخميس والجمعة
    targetCount: 1,
    unit: 'تواصل',
    reminderTime: '17:30',
    tags: ['عائلة', 'صلة رحم', 'أهل', 'تواصل', 'محبة'],
  },

  // --- إنتاجية وعمل ---
  {
    id: 'template_pomodoro',
    name: 'جلسات تركيز عميق (بومودورو)',
    description: 'العمل بتركيز تام 25 دقيقة لكل جلسة دون أي مشتتات أو مقاطعات',
    category: 'إنتاجية',
    icon: 'timer-outline',
    color: '#C2410C', // نحاسي دافئ
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 4,
    unit: 'جلسات',
    reminderTime: '09:30',
    tags: ['تركيز', 'بومودورو', 'إنتاجية', 'عمل', 'إنجاز'],
  },
  {
    id: 'template_plan_tomorrow',
    name: 'التخطيط ليوم الغد',
    description: 'تحديد أهم 3 مهام في المساء لاستقبال الصباح بذهن مرتب وخطة واضحة',
    category: 'إنتاجية',
    icon: 'calendar-outline',
    color: '#1E3A8A', // أزرق كحلي
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    reminderTime: '21:45',
    tags: ['تخطيط', 'أهداف', 'تنظيم', 'مهام', 'جدول'],
  },
  {
    id: 'template_budget',
    name: 'تسجيل وتتبع المصاريف',
    description: 'متابعة النفقات اليومية وتعزيز الوعي المالي وتحقيق أهداف الادخار',
    category: 'إنتاجية',
    icon: 'wallet-outline',
    color: '#0F766E', // زمردي هادئ
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    reminderTime: '21:00',
    tags: ['مصاريف', 'مالية', 'ادخار', 'ميزانية', 'توفير'],
  },
  {
    id: 'template_inbox_zero',
    name: 'تنظيم البريد وقائمة المهام',
    description: 'فرز الرسائل الجديدة وتنظيف صندوق الوارد وتحديث الأولويات',
    category: 'إنتاجية',
    icon: 'briefcase-outline',
    color: '#334155', // رمادي حجري
    frequency: 'specific_days',
    frequencyDays: [0, 1, 2, 3, 4], // الأحد إلى الخميس
    targetCount: 15,
    unit: 'دقيقة',
    reminderTime: '10:00',
    tags: ['بريد', 'مهام', 'تنظيم', 'عمل', 'مكتب'],
  },

  // --- روتين وتنظيم ---
  {
    id: 'template_early_rise',
    name: 'الاستيقاظ المبكر بانتظام',
    description: 'بدء اليوم بنشاط قبل صخب الحياة واستثمار ساعات البكور الأولى',
    category: 'روتين',
    icon: 'alarm-outline',
    color: '#B45309', // كهرماني
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    reminderTime: '06:00',
    tags: ['استيقاظ', 'صباح', 'بكور', 'نشاط', 'روتين'],
  },
  {
    id: 'template_tidy_room',
    name: 'ترتيب السرير ومساحة العمل',
    description: 'مساحة منظمة تعزز صفاء الذهن وتقلل التشتت والتوتر اليومي',
    category: 'روتين',
    icon: 'home-outline',
    color: '#57534E', // برونزي هادئ
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'مرة',
    reminderTime: '07:30',
    tags: ['ترتيب', 'منزل', 'نظافة', 'تنظيم', 'مكتب'],
  },
  {
    id: 'template_mindful_coffee',
    name: 'استراحة هادئة بدون شاشات',
    description: 'شرب مشروبك المفضل بتأمل وهدوء بعيدًا عن الهاتف ومواقع التواصل',
    category: 'روتين',
    icon: 'cafe-outline',
    color: '#78350F', // رملي غامق
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 15,
    unit: 'دقيقة',
    reminderTime: '15:30',
    tags: ['قهوة', 'استراحة', 'هدوء', 'ديتوكس', 'صفاء'],
  },
  {
    id: 'template_dental_care',
    name: 'العناية بالأسنان والنظافة الشخصية',
    description: 'تنظيف الأسنان مرتين يوميًا واستخدام الخيط الطبي للحفاظ على صحة الفم',
    category: 'روتين',
    icon: 'brush-outline',
    color: '#0284C7', // سماوي رصين
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 2,
    unit: 'مرتان',
    reminderTime: '22:00',
    tags: ['نظافة', 'عناية', 'أسنان', 'روتين', 'صحة'],
  },
];

/**
 * Returns filtered templates by category ('الكل' returns all).
 */
export const getHabitTemplates = (category?: string): HabitTemplate[] => {
  if (!category || category === 'الكل') {
    return HABIT_TEMPLATES;
  }
  return HABIT_TEMPLATES.filter((t) => t.category === category);
};

/**
 * Find a specific template by its ID.
 */
export const getHabitTemplateById = (id: string): HabitTemplate | undefined => {
  return HABIT_TEMPLATES.find((t) => t.id === id);
};

/**
 * Search templates across name, description, tags, and category.
 */
export const searchHabitTemplates = (query: string, category?: string): HabitTemplate[] => {
  const normQuery = normalizeArabicText(query.trim());
  let list = getHabitTemplates(category);

  if (!normQuery) {
    return list;
  }

  return list.filter((t) => {
    const normName = normalizeArabicText(t.name);
    const normDesc = normalizeArabicText(t.description);
    const matchTags = t.tags.some((tag) => normalizeArabicText(tag).includes(normQuery));
    const matchCat = normalizeArabicText(t.category).includes(normQuery);

    return (
      normName.includes(normQuery) ||
      normDesc.includes(normQuery) ||
      matchTags ||
      matchCat
    );
  });
};
