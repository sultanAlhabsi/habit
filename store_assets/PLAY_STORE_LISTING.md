# دليل إعداد ونشر التطبيق على Google Play Console 🚀
## تطبيق "إنجاز" (Enjaz Habit Tracker)

هذا المستند أعدّه لك مهندس الإطلاق (Ziryab) ليحتوي على كافة النصوص الإعلانية، وبيانات النماذج والاستبيانات القانونية والأمنية المطلوبة لملء صفحة التطبيق في **Google Play Console** بدقة وتوافق تام 100% مع أحدث متطلبات وسياسات Google Play (لعام 2024 - 2026).

---

## 1. أصول المتجر الرسومية المجهزة (Store Graphic Assets)

جميع الأصول تم إنتاجها بالمقاسات والأوزان المعتمدة في مجلد [`store_assets/`](file:///home/sultan/Documents/projects/habit/store_assets/):

| الأصل (Asset) | المسار | الأبعاد | المتطلبات | الحالة |
| :--- | :--- | :--- | :--- | :--- |
| **أيقونة التطبيق** (App Icon) | [`store_assets/icon_512x512.png`](file:///home/sultan/Documents/projects/habit/store_assets/icon_512x512.png) | 512 × 512 px | PNG 32-bit, < 1MB | جاهز ✅ |
| **الرسم المميز** (Feature Graphic) | [`store_assets/feature_graphic_1024x500.png`](file:///home/sultan/Documents/projects/habit/store_assets/feature_graphic_1024x500.png) | 1024 × 500 px | PNG/JPEG, < 15MB | جاهز ✅ |
| **لقطة هاتف 1 - الرئيسية** | [`store_assets/screenshots/phone_1_home.png`](file:///home/sultan/Documents/projects/habit/store_assets/screenshots/phone_1_home.png) | 1080 × 2400 px | 9:20 Ratio | جاهز ✅ |
| **لقطة هاتف 2 - الإحصائيات** | [`store_assets/screenshots/phone_2_statistics.png`](file:///home/sultan/Documents/projects/habit/store_assets/screenshots/phone_2_statistics.png) | 1080 × 2400 px | 9:20 Ratio | جاهز ✅ |
| **لقطة هاتف 3 - إضافة عادة** | [`store_assets/screenshots/phone_3_add_habit.png`](file:///home/sultan/Documents/projects/habit/store_assets/screenshots/phone_3_add_habit.png) | 1080 × 2400 px | 9:20 Ratio | جاهز ✅ |
| **لقطة هاتف 4 - الخصوصية** | [`store_assets/screenshots/phone_4_privacy_offline.png`](file:///home/sultan/Documents/projects/habit/store_assets/screenshots/phone_4_privacy_offline.png) | 1080 × 2400 px | 9:20 Ratio | جاهز ✅ |
| **لقطة جهاز لوحي 1 (Tablet)** | [`store_assets/screenshots/tablet_1.png`](file:///home/sultan/Documents/projects/habit/store_assets/screenshots/tablet_1.png) | 1600 × 2560 px | 7-inch & 10-inch | جاهز ✅ |
| **لقطة جهاز لوحي 2 (Tablet)** | [`store_assets/screenshots/tablet_2.png`](file:///home/sultan/Documents/projects/habit/store_assets/screenshots/tablet_2.png) | 1600 × 2560 px | 7-inch & 10-inch | جاهز ✅ |

---

## 2. تفاصيل بطاقة التطبيق باللغة العربية (Arabic Store Listing)

### اسم التطبيق (App Name) — [28 حرفاً من أصل 30]:
```text
إنجاز - تتبع العادات اليومية
```

### الوصف المختصر (Short Description) — [75 حرفاً من أصل 80]:
```text
تتبع عاداتك اليومية بهدوء وبخصوصية تامة، محلي 100% وبدون أي إعلانات أو تسجيل.
```

### الوصف الكامل (Full Description):
```text
هل تبحث عن بناء عادات إيجابية جديدة أو التخلص من عادات قديمة دون تشتيت وبخصوصية تامة؟
تطبيق "إنجاز" هو رفيقك البسيط والمثالي لتتبع أهدافك اليومية وتنظيم حياتك بخطوات ثابتة وواضحة.

صُمم "إنجاز" وفق فلسفة (Local-First): بياناتك ملكك وحدك، وتبقى محفوظة داخل جهازك دون الحاجة إلى خوادم سحابية، ودون أي تسجيل دخول أو جمع لأي بيانات شخصية.

🌿 أبرز مميزات تطبيق إنجاز:

1. تتبع مرن وسهل:
- أنشئ عاداتك اليومية أو الأسبوعية وحدد أوقات إنجازها بكل سهولة.
- سجل إنجاز العادة بضغطة زر واحدة واشعر بالرضا عند إتمام أهدافك اليومية.

2. إحصائيات دقيقة وسلاسل إنجاز (Streaks):
- تابع مدى استمرارك في كل عادة عبر سلاسل الإنجاز الحالية وأطول سلسلة حققتها.
- رسوم بيانية ومعدلات إنجاز أسبوعية وشهرية توضح تقدمك الفعلي وتحفزك على المتابعة.

3. تذكيرات وتنبيهات ذكية:
- خصص وقتاً لكل عادة مع تنبيه محلي هادئ يذكرك في الوقت المناسب دون إزعاج.

4. خصوصية مطلقة 100% ومحلي بالكامل:
- لا حاجة لإنشاء حساب أو إدخال بريد إلكتروني.
- التطبيق يعمل بالكامل دون الحاجة إلى اتصال بالإنترنت (Offline-First).
- لا نجمع أي بيانات ولا نشاركها مع أي طرف ثالث.

5. خالي تماماً من الإعلانات:
- تجربة استخدام نقية وهادئة خالية 100% من الإعلانات والنوافذ المنبثقة المشتتة.

6. النسخ الاحتياطي واستعادة البيانات:
- يمكنك تصدير بياناتك واستيرادها بأمان تام في أي وقت وبصيغة JSON مفتوحة.

7. تصميم عصري ومريح للعين:
- يدعم الوضع الفاتح والوضع الليلي المريح للعين تلقائياً، مع دعم كامل ومتقن للغة العربية والإنجليزية.

ابدأ اليوم خطوتك الأولى نحو حياة أكثر تنظيماً وإنجازاً مع "إنجاز".
```

---

## 3. تفاصيل بطاقة التطبيق باللغة الإنجليزية (English Store Listing)

### App Name — [26 characters of 30]:
```text
Enjaz: Daily Habit Tracker
```

### Short Description — [71 characters of 80]:
```text
Track your daily habits peacefully with 100% offline privacy and no ads.
```

### Full Description:
```text
Looking to build lasting positive habits or break bad ones peacefully and with total privacy?
"Enjaz" is your minimalist, distraction-free companion to organize your daily routine and achieve your personal goals.

Engineered with a strict Local-First privacy approach: your data belongs to you alone, stored 100% locally on your device with no cloud servers, no account registration, and zero data tracking.

🌿 Why Choose Enjaz?

1. Simple & Intuitive Habit Tracking:
- Create daily or weekly habits with custom targets in seconds.
- Mark habits complete with a single tap and celebrate daily consistency.

2. Streaks & Visual Statistics:
- Keep the momentum alive with streak counters (Current and Best Streaks).
- Weekly and monthly completion charts that give clear insight into your personal growth.

3. Local Smart Reminders:
- Set customizable scheduled notifications to remind you at the right time without spam.

4. 100% Offline & Absolute Privacy:
- No account registration or sign-in required.
- Works entirely offline without requiring an internet connection.
- Zero analytics, zero trackers, and zero third-party data sharing.

5. Completely Ad-Free:
- Enjoy a clean, distraction-free environment with no ads or interruptions.

6. Backup & Export:
- Effortlessly export and import your habit history anytime via JSON format.

7. Clean & Elegant Design:
- Full support for Light and Dark themes, with native RTL Arabic and English localization.

Start your journey towards a more organized and disciplined life today with Enjaz.
```

---

## 4. إجابات استبيانات Google Play Console (Policy & Declarations)

عند إعداد محتوى التطبيق في تبويب **App Content** في لوحة Google Play Console، اتبع الإجابات المحددة التالية:

### أ) سياسة الخصوصية (Privacy Policy)
- **الرابط المطلوب وضعه**:
  ```text
  https://sultanAlhabsi.github.io/habit/privacy.html
  ```
  *(تأكد من عمل `git push` لمجلد `docs/` وتفعيل GitHub Pages من إعدادات مستودعك).*

---

### ب) الوصول إلى التطبيق (App Access)
- **السؤال**: هل تتطلب أي أجزاء من تطبيقك تسجيل دخول أو بيانات اعتماد للوصول إليها؟
- **الاختيار**:
  - ✅ **All functionality is available without special access** (جميع الوظائف متاحة بدون قيود أو اسم مستخدم).

---

### ج) الإعلانات (Ads)
- **السؤال**: هل يحتوي تطبيقك على إعلانات؟
- **الاختيار**:
  - ✅ **No, my app does not contain ads** (لا يحتوي تطبيقي على إعلانات).

---

### د) تصنيف المحتوى (IARC Content Rating Questionnaire)
- **البريد الإلكتروني**: أدخل بريدك الإلكتروني الشخصي/المهني للتواصل.
- **فئة التطبيق (Category)**:
  - اختر: **Utility, Productivity, Communication or Other** (أدوات / إنتاجية).
- **الأسئلة**:
  - هل يحتوي التطبيق على محتوى عنيف؟ ⬅️ **No**
  - هل يحتوي على محتوى جنسي أو عري؟ ⬅️ **No**
  - هل يحتوي على ألفاظ مسيئة أو شتائم؟ ⬅️ **No**
  - هل يشجع أو يناقش المواد الخاضعة للرقابة (مخدرات/كحول)؟ ⬅️ **No**
  - هل يسمح للمستخدمين بالتفاعل أو تبادل النصوص/الصور؟ ⬅️ **No**
  - هل يشارك التطبيق الموقع الجغرافي الدقيق للمستخدم؟ ⬅️ **No**
  - هل يتيح التطبيق شراء سلع رقمية أو اشتراكات؟ ⬅️ **No**
- **النتيجة المتوقعة**: تصنيف **PEGI 3** / **Everyone** لجميع الفئات العمرية.

---

### هـ) أمان البيانات (Data Safety Section) — [أهم قسم]
- **السؤال 1**: هل يجمع تطبيقك أو يشارك أيًا من أنواع بيانات المستخدم المطلوبة؟
  - ✅ **No** (كلا، لا يتم جمع أو مشاركة أي بيانات).
- **ملاحظة توضيحية**: بما أن التطبيق يعمل بنظام محلي 100% (Local-First SQLite/AsyncStorage) ولا يتصل بأي خوادم خارجية، فإن الإجابة الرسمية هي **No Data Collected and No Data Shared**.
- **السؤال 2**: هل توفر آلية للمستخدم لحذف بياناته؟
  - ✅ **Yes** (نعم، يستطيع المستخدم حذف عاداته أو إعادة ضبط التطبيق أو مسح بيانات التطبيق من إعدادات الهاتف مباشرة).

---

### و) الجمهور المستهدف والمحتوى (Target Audience and Content)
- **الفئات العمرية المستهدفة**:
  - اختر: **13-15**, **16-17**, **18 and over** (13 سنة فما فوق).
  *(نصيحة مهندس الإصدار: اختيار 13+ يجنبك الخضوع لبرنامج "Designed for Families" الصارم الخاص بالأطفال والذي يتطلب مراجعات مطولة وتعقيدات لا داعي لها لتطبيقات الإنتاجية).*
- **هل يجذب التطبيق الأطفال بدون قصد؟**
  - ✅ **No** (كلا).

---

### ز) التطبيقات الإخبارية (News Apps)
- هل تطبيقك تطبيق إخباري؟
  - ✅ **No**.

---

### ح) تطبيقات كوفيد-19 (COVID-19 Contact Tracing or Status Apps)
- هل يختص بتتبع كوفيد أو التطعيمات؟
  - ✅ **My app is not a publicly available contact tracing or COVID-19 status app**.

---

### ط) ميزات الذكاء الاصطناعي التوليدي (Generative AI)
- هل ينشئ تطبيقك محتوى بواسطة الذكاء الاصطناعي التوليدي؟
  - ✅ **No**.

---

### ي) الميزات والتطبيقات المالية (Financial Features)
- هل يوفر التطبيق ميزات مالية أو قروض أو خدمات بنكية؟
  - ✅ **My app does not provide financial features**.

---

## 5. خطوات الرفع النهائية على Google Play Console

1. **إنشاء الإصدار (Create Release)**:
   - في قسم **Production** (أو Closed Testing):
   - اضغط **Create new release**.
   - ارفع ملف الـ Android App Bundle الناتج: `app-release.aab`.
   - في خانة **Release notes** ضع:
     ```text
     <ar>الإصدار الأول من تطبيق إنجاز: تتبع عاداتك اليومية بكل سهولة وخصوصية تامة، محلي 100% وبدون إعلانات.</ar>
     <en-US>Initial release of Enjaz: Track your daily habits easily with 100% offline privacy and no ads.</en-US>
     ```

2. **رفع الصور (Store Presence -> Main store listing)**:
   - ارفع الأيقونة: `store_assets/icon_512x512.png`.
   - ارفع البانر المميز: `store_assets/feature_graphic_1024x500.png`.
   - ارفع لقطات الهاتف من مجلد `store_assets/screenshots/` (Phone screenshots).
   - ارفع لقطات الجهاز اللوحي من مجلد `store_assets/screenshots/` (7-inch & 10-inch screenshots).

3. **حفظ وإرسال للمراجعة (Send for Review)**:
   - راجع قائمة التحقق في Console، وتأكد من اكتمال كافة الأقسام الخضراء ثم اضغط **Submit for review**.
