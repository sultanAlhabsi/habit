# سجل التطوير الذاتي (Autonomous Development Log)

## الدورة الأولى (Cycle 1) - استقرار الحسابات، تصحيح واجهات RTL، استدامة الإعدادات، وحزمة الاختبارات الآلية
- **التاريخ:** 10 سبتمبر 2026
- **المطور:** Ziryab (زرياب) - Autonomous AI Developer
- **الحالة:** مكتملة وناجحة بنسبة 100%

---

### 1. ملخص حالة المشروع قبل الدورة
- **المنصة والتقنيات:** React Native 0.81.5 مع Expo SDK 54 و Hermes Engine و TypeScript 5.9 و Zustand و SQLite (`expo-sqlite`).
- **اللغة والاتجاه:** تطبيق عربي موجه بالكامل لليمين (RTL).
- **الفحص الأولي:** التطبيق كان يبنى عبر TypeScript بدون أخطاء تركيبية، ولكن كان يحتوي على:
  - أخطاء منطقية حرجة في محرك حساب السلاسل (Streaks) ونسب الإنجاز.
  - انعكاسات بصرية في الواجهة العربية RTL (شريط رأس الشاشة الرئيسية + تقويم الخريطة الحرارية الشهري).
  - عدم استدامة إعدادات المستخدم (المظهر الليلي/النهاري والاهتزاز اللمسي) عند إعادة تشغيل التطبيق.
  - غياب كامل للاختبارات الآلية للتحقق من الدوال الأساسية.

---

### 2. المشاكل المكتشفة وتصنيفها

| المعرّف | التصنيف | الموقع | وصف المشكلة | التأثير |
|---|---|---|---|---|
| BUG-01 | حرج (Logical / Data Loss) | `src/utils/habitUtils.ts` | تصفير السلسلة التاريخية ونسبة الإنجاز للعادات المتوقفة مؤقتاً (`isActive: false`) عند فحص الإحصائيات لأن `isHabitDueOnDate` ترجع دائماً `false`. | فقدان المستخدم لسلسلة إنجازه التاريخية وإحصائياته بمجرد إيقاف العادة مؤقتاً. |
| BUG-02 | متوسط (Logical) | `src/utils/habitUtils.ts` | تكرار كود حساب السلسلة الحالية داخل فرعي الشرط `if (completedDates.has(yesterday))` و `else`. | كود ميت وتكرار منطقي غير مبرر. |
| BUG-03 | حرج (Mathematical Model) | `src/utils/habitUtils.ts` | حساب أفضل سلسلة (`bestStreak`) كان يتراجع للخلف من تاريخ اليوم، مما يكسر السلسلة القصوى إذا لم يتم إنجاز اليوم بعد، متجاهلاً السلاسل الأطول في الماضي. | عدم دقة الإحصائيات وعدم احتساب السلاسل التاريخية الكبرى بشكل سليم. |
| BUG-04 | متوسط (UI/UX - RTL) | `src/screens/HomeScreen.tsx` | وضع زر الإضافة `+` قبل عنوان الشاشة في الحاوية ذات `flexDirection: 'row-reverse'`، مما جعل الزر على أقصى اليمين والعنوان على اليسار. | تشوه بصري ومخالفة لمعايير الواجهة العربية التي تضع العنوان في البداية (يمين) والأكشن في النهاية (يسار). |
| BUG-05 | متوسط (UI/UX - RTL & Theming) | `src/components/details/HabitHeatmap.tsx` | استخدام `flexDirection: 'row'` في شبكة أيام الشهر وعناوين الأسبوع، مما جعل الأحد في أقصى اليسار والسبت في اليمين، بالإضافة لتجاهل لون العادة المخصص `habitColor`. | عكس ترتيب أيام الأسبوع في التقويم العربي، وعرض كل العادات باللون الافتراضي بدلاً من لونها المخصص. |
| BUG-06 | منخفض (UI/UX Data Display) | `src/components/stats/WeeklyChart.tsx` | عرض `-` في شريط اليوم إذا كانت النسبة `0%` حتى لو كانت هناك عادات مستحقة. | عدم تفريق المستخدم بين "لا توجد عادات مجدولة" وبين "0% إنجاز". |
| BUG-07 | متوسط (Persistence) | `src/theme/ThemeContext.tsx` & `src/store/useHabitStore.ts` | جدول `meta` كان منشأ في SQLite لكن لم يكن مستخدماً؛ تفضيلات المظهر (فاتح/داكن/تلقائي) والاهتزاز كانت تفقد فور إغلاق التطبيق. | إعادة ضبط تفضيلات المستخدم مع كل تشغيل. |
| BUG-08 | متوسط (Quality & CI) | `tests/` | عدم وجود أي اختبارات وحدة برمجية مؤتمتة لضمان استقرار التطبيق وحسابات السلاسل. | خطر حدوث انتكاسات (Regressions) مستقبلية. |

---

### 3. التغييرات المنفذة بالتفصيل

#### أ. إصلاح وتطوير محرك الحسابات (`src/utils/habitUtils.ts`):
1. **معيار النشاط المتكيف (`requireActive`):**
   - تم تحديث `isHabitDueOnDate(habit, dateStr, requireActive = true)`. في القوائم اليومية، العادات المتوقفة أو المؤرشفة لا تظهر، بينما في شاشات الإحصائيات (`requireActive = false`) يتم فحص الجدول الزمني الحقيقي دون تصفير التاريخ.
   - دعم كامل لخاصية الأرشفة `archivedAt`؛ التواريخ اللاحقة للأرشفة لا تعتبر مستحقة.
2. **إعادة بناء خوارزمية السلسلة الحالية وأفضل سلسلة (`calculateHabitStats`):**
   - حساب السلسلة الحالية بدقة بحيث تحافظ على قيمتها إذا كان المستخدم قد أنجز بالأمس ولم ينجز اليوم بعد (فترة الصباح/أثناء اليوم).
   - احتساب أفضل سلسلة تاريخية (`bestStreak`) بمسح زمني تتابعي متصاعد من تاريخ الإنشاء، مما يضمن اكتشاف القمة التاريخية بدقة رياضية 100%.
   - الحفاظ الكامل على إحصائيات العادات الموقفة مؤقتاً وعرض إنجازاتها السابقة بدقة.

#### ب. تصحيح الواجهات العربية والتنسيق (`HomeScreen`, `HabitHeatmap`, `WeeklyChart`):
1. **شريط العنوان في `HomeScreen.tsx`:**
   - نقل عنوان "العادات" ليكون العنصر الأول وزر `+` العنصر الثاني مع الحفاظ على `row-reverse`، مما وضع العنوان في أقصى اليمين وزر الإضافة في أقصى اليسار وفقاً لمعايير التصميم العربي الطبيعية.
2. **التقويم الشهري في `HabitHeatmap.tsx`:**
   - تحويل `weekDaysRow` و `calendarGrid` إلى `flexDirection: 'row-reverse'`.
   - محاذاة أيام الأسبوع: يبدأ الأسبوع بيوم الأحد في أقصى اليمين وينتهي بالسبت في أقصى اليسار، وتوزيع خلايا الشهر يتوافق تماماً مع الترويسة.
   - تفعيل خاصية `habitColor` لتلوين أيام الإنجاز بلون العادة المختار بدلاً من فرض لون التطبيق الأساسي فقط.
3. **الرسم البياني الأسبوعي في `WeeklyChart.tsx`:**
   - تعديل منطق العرض ليعرض `0%` إذا كانت هناك عادات مستحقة ولم تنجز، ويعرض `-` فقط إذا كان اليوم بدون عادات مجدولة.

#### ج. استدامة الإعدادات والاهتزاز اللمسي (`database.ts`, `ThemeContext.tsx`, `useHabitStore.ts`):
1. **إدارة التفضيلات عبر SQLite:**
   - إضافة دوال `getPreference(key, defaultValue)` و `setPreference(key, value)` مع طبقة تخزين احتياطية في الذاكرة.
   - إضافة دالة `archiveHabitRecord` للتعامل مع أرشفة العادات في قاعدة البيانات.
2. **استدامة المظهر (`ThemeContext.tsx`):**
   - قراءة خيار المظهر (`light` / `dark` / `system`) من قاعدة البيانات عند الإقلاع وحفظه تلقائياً عند تغييره.
3. **استدامة الاهتزاز والملاحظات اللمسية (`useHabitStore.ts`):**
   - قراءة وحفظ خيار `haptics_enabled`.
   - تفعيل نبضة اهتزازية خفيفة (`Vibration.vibrate(12)`) فور إتمام العادة بنجاح لإعطاء المستخدم شعوراً فورياً بالإنجاز.

#### د. حزمة الاختبارات الآلية (`tests/habitUtils.test.ts` & `package.json`):
- إنشاء ملف اختبار متكامل يشمل 9 حالات اختبار صارمة:
  1. التحقق من استحقاق العادة اليومية بعد تاريخ الإنشاء.
  2. التحقق من استحقاق عادات الأيام المحددة حصراً في أيامها.
  3. التحقق من سلوك `requireActive` مع العادات المتوقفة.
  4. التحقق من عدم استحقاق العادات المؤرشفة بعد تاريخ أرشفتها.
  5. الحفاظ على السلسلة إذا كان اليوم قيد التنفيذ ولم ينتهِ بعد.
  6. زيادة السلسلة عند تسجيل إنجاز اليوم.
  7. احتفاظ العادات المتوقفة مؤقتاً بإحصائياتها التاريخية كاملة.
  8. دقة حساب نسب الإنجاز الإجمالية ومصفوفة الالتزام الأسبوعي.
  9. صحة تنسيق التاريخ باللغة العربية.
- ربط سكريبت `npm test` بمشغل الاختبارات الأصلي في Node 22 مع دعم TypeScript المباشر.

---

### 4. نتائج الفحص والاختبار

```bash
# 1. نتائج اختبارات الوحدة (npm test):
✔ isHabitDueOnDate: daily habit is due every day after creation (17.6ms)
✔ isHabitDueOnDate: specific days habit is only due on scheduled days (2.2ms)
✔ isHabitDueOnDate: inactive habit respects requireActive parameter (1.6ms)
✔ isHabitDueOnDate: archived habit is not due after archive date (1.7ms)
✔ calculateHabitStats: preserves streak if today is not yet completed (6.4ms)
✔ calculateHabitStats: increments streak when today is completed (8.7ms)
✔ calculateHabitStats: paused habit retains historical stats (4.6ms)
✔ calculateOverallStats: computes accurate rates and weekly adherence (12.7ms)
✔ formatArabicDate: formats correctly in Arabic (1.7ms)
ℹ tests 9 | pass 9 | fail 0 | cancelled 0 | duration_ms 572ms

# 2. فحص الأنواع (npm run typecheck):
tsc --noEmit -> 0 errors

# 3. بناء الحزمة التجريبي (Hermes Android Export):
Android Bundled 1350ms dist/_expo/static/js/android/AppEntry-*.hbc (1349 modules)
Export was successful! (0 errors, 0 warnings)
```

---

### 5. القرارات الهندسية وأسبابها
1. **استخدام Node Native Test Runner مع Strip-Types:** تم تجنب تثبيت مكتبات اختبار خارجية ضخمة مثل Jest/Babel للحفاظ على خفة الحزمة والاعتماد على قدرات Node v22 الأصلية، مما سرّع وقت تنفيذ الاختبارات إلى أقل من ثانية واحدة بدون استهلاك موارد إضافية.
2. **استبعاد مجلد `tests/` في `tsconfig.json` الخاص بـ Expo:** لمنع تعارض مواصفات Node ESM للاختبارات مع محول TypeScript في بيئة React Native/Expo.
3. **تفعيل جدول `meta` بدلاً من إضافة مكتبة ثقيلة:** تم استثمار جدول `meta` الموجود بالفعل في كود SQLite المبدئي لحفظ الإعدادات بدلاً من الاعتماد على AsyncStorage إضافي، لتوحيد طبقة التخزين في محرك واحد مستقر.

---

## الدورة الثانية (Cycle 2) - نظام الإشعارات المحلية، إدارة الأرشيف، النسخ الاحتياطي والاستعادة، وتصحيحات RTL
- **التاريخ:** 10 سبتمبر 2026
- **المطور:** Ziryab (زرياب) - Autonomous AI Developer
- **الحالة:** مكتملة وناجحة بنسبة 100%

---

### 1. ملخص أهداف الدورة الثانية
ركزت هذه الدورة على تحويل تطبيق "إنجاز" من تطبيق تتبع محلي صامت إلى مساعد شخصي متفاعل يحافظ على استمرارية المستخدم وبياناته، من خلال:
1. **تفعيل نظام التذكيرات المحلية الذكية (Local Push Notifications)** باستخدام `expo-notifications`.
2. **إنشاء شاشة ونظام إدارة متكامل للعادات المؤرشفة (Archived Habits Management)**.
3. **بناء خدمة النسخ الاحتياطي والاستعادة (JSON Data Backup & Restore)** بآليتي الدمج الذكي والاستبدال الكامل.
4. **تصحيح ترتيب مدخلات الهدف اليومي في الواجهة العربية (RTL Fix)** وتوفير أوقات تنبيه جاهزة.
5. **توسيع حزمة الاختبارات المؤتمتة** لتشمل خدمات الإشعارات والنسخ الاحتياطي بجانب الحسابات الرياضية.

---

### 2. التغييرات والإضافات المنجزة

#### أ. نظام التنبيهات والإشعارات المحلية (`notificationUtils.ts` & `notificationService.ts`):
1. **دوال الفحص والتحليل الصارم (`src/utils/notificationUtils.ts`):**
   - بناء دوال نقية لا تعتمد على الـ Runtime لفحص صيغ الوقت بنظام 24 ساعة (`isValidReminderTime`) وتفكيكها إلى ساعات ودقائق (`parseReminderTime`).
   - دالة `formatReminderTimeArabic` لتنسيق الوقت عربياً بنظام 12 ساعة (مثال: `08:30 ص` أو `06:00 م`).
   - خوارزمية `generateHabitReminderTriggers` لتحويل جدول كل عادة (يومي أو أيام محددة من الأسبوع) إلى محددات تكرار متوافقة مع محرك Expo (`SchedulableTriggerInputTypes.DAILY` و `WEEKLY`)، مع تحويل الفهرس العربي (الأحد=0) إلى معيار Expo (الأحد=1).
2. **محرك جدولة الإشعارات (`src/services/notificationService.ts`):**
   - إعداد معالج الإشعارات أثناء عمل التطبيق في الواجهة (`setNotificationHandler`).
   - إنشاء قناة إشعارات نظام أندرويد الرسمية (`habit-reminders`) بصوت وتنبيه وأولوية مرتفعة.
   - جدولة التذكيرات تلقائياً للعادات النشطة عند إضافتها أو تعديلها، وإلغائها فور إيقاف العادة أو أرشفتها أو حذفها.
   - دالة إرسال إشعار تجريبي فوري (`sendTestNotification`) لاختبار سلامة الأذونات والتنبيهات.

#### ب. شاشة ونظام العادات المؤرشفة (`ArchivedHabitsScreen.tsx`):
1. **شاشة متخصصة للأرشيف:**
   - استعراض العادات المؤرشفة في بطاقات أنيقة توضح تاريخ الأرشفة، إجمالي الإنجازات المحققة، وأطول سلسلة مسجلة.
   - أزرار مباشرة للاستعادة الفورية إلى القائمة النشطة (`restoreHabit`) أو الحذف النهائي من قاعدة البيانات (`deleteHabit`).
   - إمكانية الضغط على البطاقة للانتقال إلى شاشة التفاصيل الكاملة والتقويم الحراري.
   - حالة فارغة (Empty State) معبرة عند عدم وجود عادات مؤرشفة.
2. **التكامل مع شاشتي التفاصيل والإعدادات:**
   - شارة توضيحية أعلى `HabitDetailsScreen` للعادات المؤرشفة وزر أرشفة/استعادة واضح.
   - صف تنقل في `SettingsScreen` يعرض عدد العادات المؤرشفة الحالي مع سهم انتقال مخصص للـ RTL.
   - تسجيل المسار رسمياً في `RootStackParamList` و `AppNavigator.tsx`.

#### ج. النسخ الاحتياطي والاستعادة (`backupUtils.ts` & `backupService.ts`):
1. **هيكل بيانات موحد وآمن (Envelope Schema v1):**
   - حزمة JSON تحتوي على رقم الإصدار، واسم التطبيق (`enjaz-habits`)، وتاريخ التصدير، وقائمة العادات، وسجلات الإنجاز، والتفضيلات الشخصية.
2. **فحص وصلاحية البيانات الصارمة (`validateBackupJson`):**
   - التحقق من سلامة النص والتأكد من مطابقة الكائنات، ووجود الحقول الإلزامية لكل عادة وسجل إنجاز لمنع انهيار التطبيق من الملفات التالفة.
3. **الدمج الذكي ومنع التكرار (`mergeBackupData`):**
   - دمج العادات الجديدة مع الحالية بدون تكرار.
   - مقارنة سجلات الإنجاز لنفس العادة والتاريخ والاعتماد على السجل ذي التحديث الأحدث (`updatedAt`).
4. **واجهة التصدير والاستيراد:**
   - تصدير فوري ومباشر عبر نافذة المشاركة الأصلية لنظام التشغيل (`Share.share`).
   - نافذة استيراد تفاعلية داخل `SettingsScreen` تتيح للمستخدم لصق النص واختيار آلية الاستعادة: (الدمج الذكي أو الاستبدال الكامل).
   - تنفيذ عملية الاستيراد في قاعدة بيانات SQLite عبر `importDatabaseRecords` مع دعم كامل لنمط التخزين الاحتياطي في الذاكرة.

#### د. تحسينات الواجهة وتجربة المستخدم RTL (`AddEditHabitScreen.tsx`):
1. **تصحيح ترتيب حقول الهدف اليومي:**
   - في الواجهة العربية الموجهة من اليمين لليسار، تم ترتيب حقول الإدخال لتظهر بصرياً: `[العدد] [الوحدة]` (مثال: `[ 1 ] [ مرة ]`) باستخدام `gap: 8` بدلاً من هوامش الاتجاه المعاكس.
2. **أزرار التذكير السريعة:**
   - إضافة خيارات سريعة شائعة لاختيار وقت التنبيه بلمسة واحدة (`06:30 ص`، `08:00 ص`، `01:30 م`، `06:00 م`، `09:30 م`).
   - التحقق الفوري من صحة إدخال الوقت قبل الحفظ وإظهار تنبيه توجيهي في حال وجود خطأ بصيغة الوقت.

---

### 3. الاختبارات والتحقق البرمجي

تمت إضافة وتوسيع حزم الاختبارات لتصل إلى **21 اختبار وحدة مؤتمت**:
- **`tests/habitUtils.test.ts` (9 اختبارات):** اختبارات السلاسل ونسب الإنجاز واستحقاق الأيام.
- **`tests/notificationUtils.test.ts` (7 اختبارات):** التحقق من صيغ الوقت، وفصل الساعات والدقائق، والتنسيق العربي، وتحويل أيام الأسبوع إلى معيار Expo، وتوليد المشغلات لجميع أنواع التردد.
- **`tests/backupUtils.test.ts` (5 اختبارات):** بناء الحزمة القياسية، التحقق من صحة JSON، رفض الحزم التالفة وغير المطابقة، والدمج الذكي بدون تكرار وتحديث السجلات بالأحدث.

```bash
# نتائج تشغيل حزمة الاختبارات الكاملة:
✔ isHabitDueOnDate: daily habit is due every day after creation (15.9ms)
✔ isHabitDueOnDate: specific days habit is only due on scheduled days (5.3ms)
✔ isHabitDueOnDate: inactive habit respects requireActive parameter (1.8ms)
✔ isHabitDueOnDate: archived habit is not due after archive date (2.0ms)
✔ calculateHabitStats: preserves streak if today is not yet completed (9.0ms)
✔ calculateHabitStats: increments streak when today is completed (8.9ms)
✔ calculateHabitStats: paused habit retains historical stats (5.8ms)
✔ calculateOverallStats: computes accurate rates and weekly adherence (11.3ms)
✔ formatArabicDate: formats correctly in Arabic (1.8ms)
✔ isValidReminderTime: accurately validates 24-hour time format (6.1ms)
✔ parseReminderTime: correctly extracts numeric hour and minute (4.3ms)
✔ formatReminderTimeArabic: formats 12-hour AM/PM in Arabic (1.1ms)
✔ mapDayIndexToExpoWeekday: converts Sunday=0 to Expo Sunday=1 (0.8ms)
✔ generateHabitReminderTriggers: returns daily trigger for daily habit (1.4ms)
✔ generateHabitReminderTriggers: returns weekly triggers for specific days (1.1ms)
✔ generateHabitReminderTriggers: returns empty array for paused or archived habits (0.9ms)
✔ createBackupPayload: constructs standard schema envelope (8.7ms)
✔ validateBackupJson: validates well-formed JSON string (1.7ms)
✔ validateBackupJson: rejects malformed or invalid backups (1.5ms)
✔ mergeBackupData: deduplicates habits and preserves existing ones (1.7ms)
✔ mergeBackupData: merges checkins updating to newer timestamps (6.4ms)
ℹ tests 21 | suites 0 | pass 21 | fail 0 | cancelled 0 | duration_ms 558ms

# نتائج الفحص الثابت للأنواع (TypeScript):
npm run typecheck -> tsc --noEmit -> 0 errors!
```

---

### 4. القرارات الهندسية في الدورة الثانية
1. **فصل المعالجة الصرفة عن مشغلات Native (`backupUtils.ts` و `notificationUtils.ts`):** تم عزل منطق التحقق والدمج وتوليد المشغلات في ملفات دوال نقية (Pure Functions) منفصلة عن مشغلات النظام (`expo-notifications` و `Share`). هذا مكّن تشغيل اختبارات شاملة وسريعة عبر Node Test Runner دون الحاجة لمحاكاة (Mocking) معقدة لبيئات الهواتف.
2. **المزامنة التلقائية للإشعارات مع دورة حياة العادة في Zustand:** تم ربط استدعاءات `scheduleHabitReminder` و `cancelHabitReminder` مباشرة داخل أفعال الـ Store (`addHabit`, `updateHabit`, `deleteHabit`, `archiveHabit`, `toggleHabitActive`) لضمان عدم وجود أي إشعار يتيم أو غير متزامن مع حالة العادة.
3. **نافذة استيراد النسخ الاحتياطي عبر Modal تفاعلي بدلاً من `Alert.prompt`:** نظراً لأن `Alert.prompt` مقتصرة على منصة iOS فقط، تم بناء Modal مخصص ومتجاوب يدعم لصق النصوص الكبيرة على أندرويد و iOS معاً بسلاسة تامة.

---

### 5. الرؤية المستقبلية (Cycle 3 وما بعدها)
1. **تحديات أو أهداف أسبوعية وشهرية (Habit Challenges / Milestones):** إتاحة ربط العادة بهدف دوري أسبوعي/شهري لتشجيع الاستمرارية وتقديم أوسمة إنجاز مصغرة.
2. **تصفية متقدمة في شاشة الإحصائيات:** إضافة إمكانية المقارنة بين فترات زمنية سابقة ومتابعة معدل الالتزام لكل شهر على حدة.
3. **تحسينات إضافية على إمكانية الوصول (Accessibility & Screen Readers):** تدقيق علامات `accessibilityLabel` لجميع المكونات لتيسير الاستخدام لذوي الاحتياجات الخاصة.

---

## الدورة الثالثة (Cycle 3) - تحصين الإحصائيات، ديمومة الأوسمة، التصفح الأسبوعي، وحفظ التاريخ الماضي
- **التاريخ:** 10 سبتمبر 2026
- **المطور:** Ziryab (زرياب) - Autonomous AI Developer
- **الحالة:** مكتملة وناجحة بنسبة 100%

---

### 1. ملخص أهداف الدورة الثالثة
ركزت هذه الدورة على معالجة دقيقة للثغرات الحسابية والمنطقية، وتعزيز تجربة المستخدم البصرية والتحفيزية:
1. **معالجة تسريب التاريخ (Data Leak) في شاشة الإحصائيات:** منع تسريب التاريخ المحدد من الشاشة الرئيسية إلى مؤشرات الأداء الحالية (KPIs).
2. **تحقيق ديمومة الأوسمة ومحطات الالتزام (Milestone Permanence):** تحويل وسام "اليوم المكتمل" والأوسمة الأخرى لتعتمد على الإنجاز التاريخي التراكمي، بحيث لا يفقد المستخدم وسامه بحلول منتصف الليل.
3. **منع الإنجاز المستقبلي وتصحيح الرسم البياني:** حظر تسجيل إنجاز لتواريخ مستقبلية في المتجر والواجهة، وتمييز الأيام القادمة في الرسم البياني بعلامة انتظار `-` بدلاً من إظهارها كإخفاق بنسبة 0%.
4. **الحفاظ على تاريخ العادات المتوقفة (Paused Habits History):** منع اختفاء العادات المنجزة تاريخياً عند تصفح الأيام السابقة في حال تم إيقافها مؤقتاً لاحقاً.
5. **إتاحة تصفح الأسابيع السابقة (Weekly Navigation):** تمكين المستخدم من استعراض الالتزام الأسبوعي للأسابيع الماضية ومقارنة الأداء.
6. **إضافة زر العودة السريعة لليوم وبطاقة الاحتفال بالإنجاز الكامل.**
7. **إضافة عدادات التقدم للمحطات والأوسمة الجديدة ("الخطوة الأولى" و"نادي المئة").**

---

### 2. التغييرات والإضافات المنجزة

#### أ. إصلاحات الحسابات والمنطق الرياضي (`habitUtils.ts`):
1. **دالة `hasEverHadPerfectDay`:** فحص السجل التراكمي للتأكد مما إذا كان المستخدم قد أنجز 100% من عاداته المجدولة في أي يوم سابق، لحفظ وسام "يوم مكتمل" بشكل دائم.
2. **دالة `getHabitsForDate`:** جلب العادات النشطة المستحقة لليوم المحدد، بالإضافة إلى أي عادة كانت منجزة في ذلك اليوم حتى لو تم إيقافها لاحقاً (مع استبعاد العادات المؤرشفة قبل ذلك التاريخ).
3. **دالة `calculateWeekAdherence` مع دعم الأيام المستقبلية:** تمييز اليوم الحالي (`isToday`)، والأيام المستقبلية (`isFuture`) بحيث لا تحتسب نسبة إخفاق للأيام التي لم تأتِ بعد.
4. **دالة `formatWeekRangeArabic`:** تنسيق نطاقات الأسابيع عربياً بدقة مع مراعاة الانتقال بين الشهور (مثال: `10 - 16 سبتمبر 2026`).
5. **تصحيح الفرص المحتسبة (`effectiveOpportunities`):** تصحيح احتساب نسبة الإنجاز عند إتمام عادة في يوم إجازة غير مجدول (`Math.max(totalDueDays, totalCompletions)`).
6. **تجاهل التواريخ المستقبلية في حساب السلاسل:** تصفية أي سجل يحمل تاريخاً مستقبلياً لضمان دقة السلاسل الحالية والقصوى.

#### ب. المتجر والتحكم بالبيانات (`useHabitStore.ts`):
1. **حظر تسجيل الإنجاز المستقبلي في `toggleCheckin`:** رفض تسجيل إنجاز إذا كان التاريخ يتجاوز تاريخ اليوم الحالي (`isAfter(today)`).
2. **طلب أذونات الإشعارات عند التفعيل في `toggleNotifications`:** فحص الأذونات عبر `requestNotificationPermissions()` فور تفعيل التنبيهات من الإعدادات.

#### ج. واجهة المستخدم وتجربة التفاعل:
1. **`WeeklyChart.tsx`:**
   - إضافة زري تنقل بين الأسابيع (الأسبوع السابق والتالي حتى الأسبوع الحالي).
   - تمييز اليوم الحالي بنقطة ملونة وعنوان عريض.
   - إظهار علامة `-` للأيام المستقبلية بدلاً من نسبة 0%.
2. **`BadgeList.tsx`:**
   - شارة إجمالية بعدد المحطات المفتوحة (مثال: `٤ من ٨ محطات`).
   - مؤشرات نصية لتقدم كل وسام مغلق (مثال: `٤/٧ أيام` أو `٢٤/٥٠ إنجاز`).
   - إضافة وسام "الخطوة الأولى" (أول إنجاز) ووسام "نادي المئة" (100 إنجاز).
3. **`DailyProgressCard.tsx` و `HomeScreen.tsx`:**
   - زر مصغر "اليوم" للقفز السريع إلى تاريخ اليوم عند استعراض تواريخ ماضية أو قادمة.
   - بطاقة احتفالية ملهمة عند إتمام 100% من عادات اليوم الحالي.
   - تعطيل زر تسجيل الإنجاز في بطاقة العادة `HabitCard` عند استعراض تواريخ مستقبلية مع تلميح وصولي ملائم.
4. **`StatisticsScreen.tsx`:**
   - معالجة تسريب التاريخ عبر تثبيت احتساب مؤشرات اليوم على تاريخ اليوم الفعلي `dayjs().format('YYYY-MM-DD')`.
   - استبعاد العادات المؤرشفة من قائمة أكثر العادات التزاماً لحصرها على العادات النشطة فقط.

---

### 3. الاختبارات والتحقق البرمجي

تم توسيع حزمة الاختبارات المؤتمتة لتصل إلى **26 اختبار وحدة**:
```bash
# نتائج تشغيل حزمة الاختبارات الكاملة:
✔ createBackupPayload: constructs standard schema envelope (5.6ms)
✔ validateBackupJson: validates well-formed JSON string (1.2ms)
✔ validateBackupJson: rejects malformed or invalid backups (0.9ms)
✔ mergeBackupData: deduplicates habits and preserves existing ones (1.0ms)
✔ mergeBackupData: merges checkins updating to newer timestamps (2.0ms)
✔ isHabitDueOnDate: daily habit is due every day after creation (15.9ms)
✔ isHabitDueOnDate: specific days habit is only due on scheduled days (2.3ms)
✔ isHabitDueOnDate: inactive habit respects requireActive parameter (0.9ms)
✔ isHabitDueOnDate: archived habit is not due after archive date (1.4ms)
✔ calculateHabitStats: preserves streak if today is not yet completed (5.9ms)
✔ calculateHabitStats: increments streak when today is completed (6.8ms)
✔ calculateHabitStats: ignores future date checkins and calculates capped completion rate (4.7ms)
✔ calculateHabitStats: paused habit retains historical stats (3.8ms)
✔ getHabitsForDate: returns active due habits and preserved completed paused habits (2.3ms)
✔ calculateWeekAdherence: identifies future days, today, and adherence rates (4.6ms)
✔ hasEverHadPerfectDay: correctly detects past 100% completion days (1.8ms)
✔ calculateOverallStats: computes accurate rates, permanent perfect day, and weekly adherence (11.5ms)
✔ formatArabicDate: formats correctly in Arabic (0.7ms)
✔ formatWeekRangeArabic: formats range with Arabic month and year (0.5ms)
✔ isValidReminderTime: accurately validates 24-hour time format (4.0ms)
✔ parseReminderTime: correctly extracts numeric hour and minute (2.8ms)
✔ formatReminderTimeArabic: formats 12-hour AM/PM in Arabic (0.7ms)
✔ mapDayIndexToExpoWeekday: converts Sunday=0 to Expo Sunday=1 (0.5ms)
✔ generateHabitReminderTriggers: returns daily trigger for daily habit (0.9ms)
✔ generateHabitReminderTriggers: returns weekly triggers for specific days (0.7ms)
✔ generateHabitReminderTriggers: returns empty array for paused or archived habits (0.6ms)
ℹ tests 26 | suites 0 | pass 26 | fail 0 | duration_ms 475ms

# نتائج الفحص الثابت للأنواع (TypeScript):
npm run typecheck -> tsc --noEmit -> 0 errors!

# نتائج بناء الحزمة لبيئة أندرويد (Hermes Export):
Android Bundled 6327ms index.ts (1488 modules) -> 0 errors, 0 warnings!
```

---

### 4. القرارات الهندسية في الدورة الثالثة
1. **الحفاظ على ديمومة البيانات التحفيزية (Gamification Invariance):** يجب ألا يتراجع المستخدم في مكتسباته التحفيزية بمجرد مرور منتصف الليل. اعتماد الدوال التاريخية التراكمية يوفر تجربة إيجابية ومحفزة.
2. **حماية السجلات من التلاعب أو الخطأ الزمني:** منع تسجيل الإنجازات المستقبلية على مستوى واجهة المستخدم ومستوى المتجر معاً (Defense in Depth) يحافظ على سلامة حسابات السلاسل ونسب الإنجاز.
3. **التنقل الزمني الصرف دون تغيير حالة التطبيق الرئيسية:** التنقل بين الأسابيع في شاشة الإحصائيات تم تصميمه كحالة محلية (`useState`) تعتمد على إزاحة الأسابيع (`weekOffset`)، مما يفصل تصفح الإحصائيات الأسبوعية عن التاريخ المحدد في الشاشة الرئيسية.


