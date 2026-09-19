# دليل ومسار تحسين الأداء الشامل لتطبيق "إنجاز"
## (Enjaz Habit Tracker - End-to-End Performance Pipeline)

**إعداد:** زرياب (Ziryab) - مهندس المنتج والمستشار التقني  
**التاريخ:** سبتمبر 2026  
**البيئة التقنية:** React Native 0.86 | Expo SDK 57 | TypeScript | Zustand 5 | Expo SQLite | Reanimated 4  

---

## 📑 الفهرس
1. [الرؤية العامة ومراحل الـ Pipeline الخمس](#1-الرؤية-العامة-ومراحل-ال--pipeline-الخمس)
2. [التشخيص والتدقيق الفعلي لكود "إنجاز" (Current Bottlenecks Audit)](#2-التشخيص-والتدقيق-الفعلي-لكود-إنجاز-current-bottlenecks-audit)
3. [المرحلة الأولى: تسريع الإقلاع وحجم الحزمة (Startup Time & Bundle Size)](#3-المرحلة-الأولى-تسريع-الإقلاع-وحجم-الحزمة-startup-time--bundle-size)
4. [المرحلة الثانية: سلاسة الواجهات والعرض (UI Responsiveness & 60/120 FPS)](#4-المرحلة-الثانية-سلاسة-الواجهات-والعرض-ui-responsiveness--60120-fps)
5. [المرحلة الثالثة: طبقة البيانات والذاكرة (SQLite Architecture & Memory Caching)](#5-المرحلة-الثالثة-طبقة-البيانات-والذاكرة-sqlite-architecture--memory-caching)
6. [المرحلة الرابعة: بروتوكول القياس بالأدوات القياسية (Profiling & Diagnostic Protocol)](#6-المرحلة-الرابعة-بروتوكول-القياس-بالأدوات-القياسية-profiling--diagnostic-protocol)
7. [المرحلة الخامسة: خارطة طريق التنفيذ التدريجي (Actionable Roadmap)](#7-المرحلة-الخامسة-خارطة-طريق-التنفيذ-التدريجي-actionable-roadmap)

---

## 1. الرؤية العامة ومراحل الـ Pipeline الخمس

يهدف هذا الـ Pipeline إلى تحويل تطبيق "إنجاز" إلى تجربة فائقة السرعة والاستجابة (Instant & Butter-smooth)، من خلال مسار هندسي منتظم ومستدام مقسم إلى 5 مراحل متتالية:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 1. Profiling &  │ ──>│ 2. Startup &    │ ──>│ 3. UI/Lists &   │ ──>│ 4. SQLite &     │ ──>│ 5. Verification │
│ Baseline Metrics│    │ Bundle Trimming │    │ 60fps Rendering │    │ State Windowing │    │ & Regression Prot│
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. التشخيص والتدقيق الفعلي لكود "إنجاز" (Current Bottlenecks Audit)

بعد فحص الكود المصدري للمشروع، تم تحديد 5 نقاط اختناق جوهرية تؤثر مباشرة على زمن الإقلاع (TTI)، استهلاك الذاكرة (RAM)، وسلاسة التمرير (FPS):

### 🔴 النقطة الحرجة 1: استيراد ملف بيانات ضخم بحجم 1.3MB داخل حزمة الـ JS
- **الموقع:** [`src/screens/SettingsScreen.tsx`](file:///home/sultan/Documents/projects/habit/src/screens/SettingsScreen.tsx#L38)
- **الكود الحالي:**
  ```typescript
  import loopBackupPreloaded from '../services/loopBackupPreloaded.json';
  ```
- **الأثر السلبي:** يتم تضمين هذا الملف (1,328,987 بايت) بالكامل داخل ملف الـ JS Bundle النهائي المحزوم بواسطة Metro، مما يزيد من حجم كود Hermes، ويضاعف وقت التحليل والتفسير (Parsing & Bytecode Execution) عند فتح التطبيق لأول مرة.

### 🔴 النقطة الحرجة 2: عرض جميع كروت العادات داخل `ScrollView` بدلاً من Virtualization
- **الموقع:** [`src/screens/HomeScreen.tsx`](file:///home/sultan/Documents/projects/habit/src/screens/HomeScreen.tsx#L624)
- **الكود الحالي:**
  ```tsx
  <ScrollView ...>
    {sortedFilteredHabits.map((habit) => (
      <HabitCard key={habit.id} ... />
    ))}
  </ScrollView>
  ```
- **الأثر السلبي:** لا يتم التخلص من العناصر خارج الشاشة (No Unmounting or Recycling). إذا كان لدى المستخدم 25-50 عادة، يقوم React Native بإنشاء مئات الـ Native Views والعقد التفاعلية بالتزامن، مما يسبب هبوطاً حاداً في معدل الإطارات (Frame Drops) وتأخيراً في التمرير.

### 🔴 النقطة الحرجة 3: شلال تهيئة متسلسل (Waterfall Execution) أثناء الإقلاع
- **الموقع:** [`src/store/useHabitStore.ts`](file:///home/sultan/Documents/projects/habit/src/store/useHabitStore.ts#L121) دالة `init()`
- **الكود الحالي:**
  ```typescript
  await initDatabase();
  const habits = await fetchAllHabits();
  const checkins = await fetchAllCheckins();
  const allPrefs = await getAllPreferences();
  const lastSync = await getLastSyncTime();
  await rescheduleAllHabitReminders(...); // يحظر الـ UI
  get().syncWithCloud();
  ```
- **الأثر السلبي:** تنفيذ العمليات بشكل تسلسلي يُبقي شاشة التحميل `isLoading: true` أو شاشة البداية وقتاً طويلاً. بالإضافة إلى أن جدولة الإشعارات تتم قبل أن يستجيب التطبيق للمستخدم.

### 🔴 النقطة الحرجة 4: استعلام تاريخ الإنجاز الكامل لجميع العادات دفعة واحدة
- **الموقع:** [`src/services/database.ts`](file:///home/sultan/Documents/projects/habit/src/services/database.ts#L401)
- **الكود الحالي:**
  ```sql
  SELECT * FROM checkins ORDER BY date DESC;
  ```
- **الأثر السلبي:** عند استخدام التطبيق لفترة طويلة أو استيراد قاعدة بيانات (مثل Loop Backup)، يتم سحب آلاف السجلات وتحويلها لكائنات JavaScript في ذاكرة الـ RAM، مما يثقل الذاكرة ويبطئ الـ Garbage Collector.

### 🔴 النقطة الحرجة 5: إعادة بناء الـ Look-up Map لجميع الإنجازات عند كل تفاعل
- **الموقع:** [`src/screens/HomeScreen.tsx`](file:///home/sultan/Documents/projects/habit/src/screens/HomeScreen.tsx#L121)
- **الكود الحالي:**
  ```typescript
  const checkinsMap = useMemo(() => {
    const map = new Map<string, typeof checkins[0]>();
    for (const c of checkins) {
      map.set(`${c.habitId}:${c.date}`, c);
    }
    return map;
  }, [checkins]);
  ```
- **الأثر السلبي:** في كل مرة يضغط فيها المستخدم علامة إنجاز، تتغير مصفوفة `checkins`، مما يعيد المرور على كامل الآلاف من السجلات لبناء الـ Map وإعادة رسم كل الشاشة.

---

## 3. المرحلة الأولى: تسريع الإقلاع وحجم الحزمة (Startup Time & Bundle Size)

### 3.1 استخراج الملفات الضخمة وتحميلها بشكل كسلان (Lazy / On-Demand Loading)
**الحل الهندسي:**
إزالة الـ Static Import لملف `loopBackupPreloaded.json` من `SettingsScreen.tsx`. نقله إلى مجلد الأصول واستدعاؤه كسلاناً (Lazy-load) فقط عندما يضغط المستخدم على "استعراض بيانات تجريبية":

```typescript
// قبل (تضمين 1.3MB في الحزمة الأساسية):
import loopBackupPreloaded from '../services/loopBackupPreloaded.json';

// بعد (استدعاء ديناميكي عند الحاجة فقط):
const loadPreloadedData = async () => {
  const data = await import('../services/loopBackupPreloaded.json');
  setLoopDataPreview(data.default as unknown as ConvertedLoopData);
};
```

### 3.2 فك تشابك شلال الإقلاع (Parallelizing Init Waterfall)
**الحل الهندسي:**
تشغيل استعلامات التهيئة المتوازية، وتأجيل المهام الثقيلة (إعادة جدولة الإشعارات والمزامنة السحابية) إلى ما بعد رسم الشاشة الأولى باستخدام `InteractionManager`:

```typescript
import { InteractionManager } from 'react-native';

init: async () => {
  try {
    set({ isLoading: true });
    await initDatabase();

    // تشغيل القراءات المستقلة بالتوازي
    const [habits, checkins, allPrefs, lastSync] = await Promise.all([
      fetchAllHabits(),
      fetchRecentCheckins(90), // قراءة آخر 90 يوماً فقط للإقلاع السريع
      getAllPreferences(),
      getLastSyncTime().catch(() => null),
    ]);

    // عرض الواجهة فوراً للمستخدم
    set({
      habits,
      checkins,
      isLoading: false,
      lastCloudSyncTime: lastSync,
      ...
    });

    // تأجيل المهام الخلفية لما بعد تفاعل المستخدم واستقرار الواجهة
    InteractionManager.runAfterInteractions(() => {
      rescheduleAllHabitReminders(habits, ...).catch(console.warn);
      get().syncWithCloud().catch(() => {});
    });
  } catch (err) {
    set({ isLoading: false });
  }
}
```

---

## 4. المرحلة الثانية: سلاسة الواجهات والعرض (UI Responsiveness & 60/120 FPS)

### 4.1 الترحيل إلى `@shopify/flash-list` لإعادة تدوير العناصر (Cell Recycling)
بدلاً من رندرة جميع العادات داخل `ScrollView` أو استخدام `FlatList` الافتراضية، نستخدم `@shopify/flash-list` التي توفر:
- إعادة استخدام نفس مكونات الـ Views عند التمرير (Recycling) بدلاً من الحذف وإعادة البناء.
- استهلاك ذاكرة ثابت ومستقر حتى مع مئات العادات.
- الحفاظ التام على 60 أو 120 إطار في الثانية (FPS).

```bash
# خطوة التثبيت
npx expo install @shopify/flash-list
```

**طريقة الهيكلة في `HomeScreen.tsx`:**

```tsx
import { FlashList } from '@shopify/flash-list';

// تحويل كروت العادات إلى عنصر مستقر ومُذكر (Memoized)
const renderHabitItem = useCallback(({ item: habit }: { item: Habit }) => {
  return (
    <MemoizedHabitCardItem
      habit={habit}
      selectedDate={selectedDate}
      onToggle={handleToggle}
      onIncrement={handleIncrement}
      onPressDetails={handleDetails}
      onQuickAction={handleQuickAction}
    />
  );
}, [selectedDate, handleToggle, handleIncrement, handleDetails, handleQuickAction]);

// استخدام FlashList كعنصر القائمة الأساسي
<FlashList
  data={sortedFilteredHabits}
  renderItem={renderHabitItem}
  keyExtractor={(item) => item.id}
  estimatedItemSize={92} // الارتفاع التقريبي لكرت العادة بالبكسل
  ListHeaderComponent={HomeScreenHeaderContent} // كروت التقدم وشريط الأيام والتصنيفات
  ListFooterComponent={OffScheduleHabitsSection}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
/>
```

### 4.2 العزل الدقيق لإعادة الرسم (Granular Selectors & Component Isolation)
- عزل كل `HabitCard` بحيث لا يستمع للمتجر كاملاً، بل يستمع فقط لحالة الإنجاز الخاصة به لتلك العادة وتاريخ اليوم.
- استخدام `React.memo` مع دالة مقارنة مخصصة `areEqual`:

```typescript
export const MemoizedHabitCard = React.memo(HabitCard, (prev, next) => {
  return (
    prev.habit.id === next.habit.id &&
    prev.habit.name === next.habit.name &&
    prev.habit.color === next.habit.color &&
    prev.habit.targetCount === next.habit.targetCount &&
    prev.isCompleted === next.isCompleted &&
    prev.currentCount === next.currentCount &&
    prev.isDue === next.isDue &&
    prev.streak === next.streak
  );
});
```

---

## 5. المرحلة الثالثة: طبقة البيانات والذاكرة (SQLite Architecture & Memory Caching)

### 5.1 نافذة البيانات الذكية (Time-Windowing Query Pattern)
بدلاً من سحب كافة الإنجازات السابقة منذ إنشاء التطبيق:
1. **أثناء الإقلاع اليومي وعرض الشاشة الرئيسية:** سحب إنجازات نافذة زمنية مرنة (مثلاً: آخر 60 إلى 90 يوماً).
2. **عند الدخول لشاشة الإحصائيات أو السجل الشامل:** يتم سحب السجل التاريخي أو استعلام الإحصائيات مباشرة عبر SQLite Aggregate Functions (`COUNT`, `SUM`, `MAX`) بدلاً من حسابها بلغة JavaScript.

```sql
-- استعلام مخصص وسريع لنافذة العرض الرئيسية
SELECT * FROM checkins 
WHERE date >= date('now', '-90 days') 
ORDER BY date DESC;
```

### 5.2 حساب الإحصائيات التراكمية في قاعدة البيانات (SQL Aggregations)
بدلاً من حساب السلاسل ونسب الإنجاز بـ `calculateOverallStats` عبر حلقة دوران JavaScript على كل الإنجازات، يمكن الاستفادة من قوة محرك SQLite:

```typescript
export const fetchStatsSummaryForDate = async (date: string) => {
  return runSerialized(async (db) => {
    const row = await db.getFirstAsync<{ total: number; completed: number }>(`
      SELECT 
        COUNT(c.id) as total,
        SUM(CASE WHEN c.completed = 1 THEN 1 ELSE 0 END) as completed
      FROM checkins c
      WHERE c.date = ?;
    `, [date]);
    return row;
  }, () => ({ total: 0, completed: 0 }));
};
```

---

## 6. المرحلة الرابعة: بروتوكول القياس بالأدوات القياسية (Profiling & Diagnostic Protocol)

للقياس وتجنب التراجع دون الحاجة لمكتبات خارجية ثقيلة، نعتمد على الأدوات المدمجة في بيئة التطوير:

### 6.1 مراقب الأداء الفوري (React Native In-App Perf Monitor)
1. افتح قائمة المطور في التطبيق (`Ctrl + M` في الأندرويد، أو هز الجهاز في بيئة التطوير).
2. اختر **"Show Perf Monitor"**.
3. **المؤشرات المستهدفة:**
   - **UI Thread FPS:** يجب أن يظل ثابتاً بين **58 - 60 FPS** (أو 120 FPS للشاشات ذات التردد العالي) أثناء التمرير السريع.
   - **JS Thread FPS:** يجب ألا ينخفض عن **55 FPS** أثناء الضغط على علامات الإنجاز أو التنقل بين الأيام.
   - **RAM Usage:** يجب ألا يتجاوز استهلاك التطبيق **80 - 110 MB** كحد أقصى أثناء العمليات الكثيفة.

### 6.2 تحليل إعادة الرسم باستخدام React DevTools Profiler
1. شغّل:
   ```bash
   npx react-devtools
   ```
2. من تبويب **Settings -> Profiler**، فعّل خيار:
   `Record why each component rendered while profiling`.
3. اضغط **Record**، ثم قم بالتالي:
   - اضغط زر إنجاز لعادة واحدة.
   - تنقل بين الأيام في شريط `DateStrip`.
   - مرر القائمة لأعلى ولأسفل.
4. أوقف التسجيل وافحص **Flamegraph**:
   - تأكد أن الكرت الذي ضُغط عليه فقط هو الذي أعيد رسمه (`MemoizedHabitCardItem`).
   - تأكد أن باقي الكروت الـ 30 في الشاشة تظهر بلون رمادي (Did not render).

### 6.3 فحص أزمنة التنفيذ ومسارات Hermes عبر Chrome DevTools
1. افتح المتصفح على `chrome://inspect` أثناء تشغيل التطبيق في وضع التطوير.
2. اتصل بجلسة Hermes JS Engine.
3. التقط **CPU Profile** أثناء إقلاع التطبيق (Cold Start):
   - حدد أي دوال تأخذ أكثر من 16ms (التي تسبب إسقاط إطارات).
   - تأكد أن `initDatabase` و `fetchRecentCheckins` لا تحظر الـ Main Thread.

---

## 7. المرحلة الخامسة: خارطة طريق التنفيذ التدريجي (Actionable Roadmap)

| الخطوة | المجال | الإجراء التقني | الفائدة المتوقعة | درجة الأولوية |
|---|---|---|---|---|
| **1** | حجم الحزمة والإقلاع | إزالة الـ Static Import لـ `loopBackupPreloaded.json` واستدعاؤه ديناميكياً | تقليص حجم الحزمة بـ **1.3MB** وتسريع الإقلاع | 🟢 أولوية قصوى (سريعة وعالية الأثر) |
| **2** | سرعة الإقلاع | موازنة استعلامات دالة `init()` في `useHabitStore` ونقل المهام الثقيلة لـ `InteractionManager` | انخفاض زمن ظهور الشاشة الأولى بنسبة **~45%** | 🟢 أولوية قصوى |
| **3** | سلاسة الواجهات | تثبيت `@shopify/flash-list` وترحيل قائمة العادات في `HomeScreen` | استقرار معدل الإطارات عند **60 FPS** ومنع الـ Memory Leaks | 🟡 أولوية رئيسية |
| **4** | تفادي الـ Re-renders | حصر `MemoizedHabitCard` وضبط دالة المقارنة `areEqual` مع عزل دوال الاستدعاء `useCallback` | منع إعادة رسم كل الكروت عند تعديل عادة واحدة | 🟡 أولوية رئيسية |
| **5** | قاعدة البيانات | إدخال استعلام نافذة الأيام الأخيرة (`date >= now - 90 days`) واستخراج الإحصائيات عبر SQL | تحرير ذاكرة الـ RAM واستجابة فورية للقاعدة | 🔵 تحسين متقدم |

---

> 💡 **ملاحظة تشغيلية:** هذا الدليل يمثل المرجع الهيكلي المعتمد لتحسينات الأداء في "إنجاز". يمكن استخدامه لتنفيذ التحسينات خطوة بخطوة والتأكد من مطابقة التطبيق لأعلى معايير السرعة والكفاءة في بيئة الإنتاج.
