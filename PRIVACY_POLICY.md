# سياسة الخصوصية وأمان البيانات — تطبيق إنجاز (Enjaz Habit Tracker)
**آخر تحديث:** 24 سبتمبر 2026

تطبيق **"إنجاز"** مبني وفق مبدأ أساسي: **الخصوصية أولاً (Privacy-First)** والتخزين المحلي المباشر (**Local-First**). نحن نؤمن بأن عاداتك اليومية وسجلاتك وأفكارك هي بياناتك الشخصية البحتة التي لا يحق لأحد الاطلاع عليها.

---

## 1. ما البيانات التي يجمعها التطبيق؟

- **البيانات المحلية:** جميع العادات المسجلة، التواريخ، السجلات اليومية، الملاحظات والخواطر، تُخزن محلياً داخل جهازك بشكل كامل في قاعدة بيانات SQLite في المساحة المعزولة الخاصة بالتطبيق (App Sandboxed Storage).
- **لا توجد بيانات شخصية إلزامية:** لا يتطلب التطبيق منك تسجيل الاسم، البريد الإلكتروني، رقم الهاتف، أو إنشاء حساب للبدء في استخدامه.
- **لا تتبع ولا إعلانات:** التطبيق خالٍ تماماً 100% من أي برمجيات إعلانية (No Advertising SDKs)، أو برمجيات تتبع سلوكي (No Third-Party Analytics)، أو أدوات جمع البيانات التعريفية للأجهزة (No Device Fingerprinting).

---

## 2. لا توجد خوادم ولا مزامنة سحابية (100% Offline & Local-First)

- **تطبيق محلي بالكامل:** يعمل تطبيق "إنجاز" بشكل مستقل ومحلي بنسبة 100% على جهازك دون الحاجة إلى أي خوادم سحابية (No Cloud Servers) أو قواعد بيانات خارجية.
- **عاداتك لا تغادر هاتفك:** لا يتم إرسال أو رفع أو تخزين أي من عاداتك، سجلاتك، تواريخك، أو ملاحظاتك الشخصية على أي سيرفر أو خادم إطلاقاً.
- **لا توجد معالجة خارجية:** جميع العمليات الحسابية، تتبع السلاسل (Streaks)، والإحصائيات تتم معالجتها بالكامل داخل معالج جهازك وبشكل فوري.

---

## 3. الأذونات والصلاحيات (Permissions)

يطلب التطبيق فقط الحد الأدنى الصارم من الأذونات التي تخدم وظائفه التشغيلية المباشرة:

| الإذن | الغرض |
| :--- | :--- |
| **الإشعارات (`POST_NOTIFICATIONS`)** | لإرسال تنبيهات تذكير العادات ومراجعة المساء التي تحددها بنفسك. يتم توليد التنبيهات ومعالجتها محلياً داخل جهازك. |
| **الاهتزاز (`VIBRATE`)** | لتقديم التغذية اللمسية (Haptic Feedback) المريحة عند إنجاز العادة. |
| **الإنترنت (`INTERNET`)** | فقط لفتح الروابط الخارجية (مثل مستودع المشروع والتواصل) عبر المتصفح الخارجي عند طلب المستخدم، ولا يُستخدم لنقل أي بيانات عادات. |

> 🚫 **تأكيد:** التطبيق **لا يطلب ولا يستخدم** أذونات التخزين المشترك (`READ/WRITE_EXTERNAL_STORAGE`)، ولا إذن تعديل إعدادات الصوت (`MODIFY_AUDIO_SETTINGS`)، ولا إذن الميكروفون (`RECORD_AUDIO`)، ولا يطلب موقعك الجغرافي (`ACCESS_FINE_LOCATION`)، ولا جهات اتصالك، ولا يطلب صلاحية النوافذ العائمة (`SYSTEM_ALERT_WINDOW`).

---

## 4. ملكية البيانات والتحكم الكامل

- **تصدير البيانات:** يتيح لك التطبيق في أي وقت تصدير نسخة كاملة من عاداتك وسجلاتك بصيغة **JSON** أو جداول **CSV** ومشاركتها أو حفظها أينما شئت.
- **حذف البيانات نهائياً:** يمكنك من شاشة "الإعدادات > مسح كافة البيانات نهائياً" مسح كل عاداتك وسجلاتك بنقرة واحدة من جهازك بشكل فوري ودائم لا رجعة فيه.

---

## 5. خصوصية الأطفال

التطبيق مناسب لجميع الفئات العمرية ولا يجمع أي معلومات شخصية موجهة للأطفال أو القاصرين.

---

## 6. التواصل والاستفسارات

إذا كان لديك أي سؤال أو استفسار حول سياسة الخصوصية وأمان البيانات في تطبيق "إنجاز"، يمكنك التواصل معنا عبر:
- **البريد الإلكتروني للمطور:** `ssultan.j2@gmail.com`
- **مستودع المشروع:** [GitHub: sultanAlhabsi/habit](https://github.com/sultanAlhabsi/habit)

---

# Privacy Policy — Enjaz Habit Tracker (English Summary)
**Last Updated:** September 24, 2026

**Enjaz** is designed with a **100% Offline, Privacy-First, Local-First** architecture.

1. **Data Storage & Collection:** All habits, checkins, streaks, and personal notes are stored strictly and locally on your device in a sandboxed SQLite database. No registration, login, phone number, or email is required.
2. **Zero Cloud & Zero Tracking:** The application operates completely offline with NO cloud servers, NO cloud databases, 0% ads, and 0% tracking SDKs. Your personal habits never leave your phone.
3. **Permissions:**
   - `POST_NOTIFICATIONS`: To deliver your locally-scheduled habit reminders and evening reviews.
   - `VIBRATE`: For subtle tactile confirmation upon habit completion.
   - `INTERNET`: Standard network access solely for launching external documentation/support links in the device browser.
   - *No microphone access, no location tracking, and no background services.*
4. **Data Ownership & Deletion:** You can export your data anytime (JSON/CSV) and permanently erase all records with one click via Settings.
5. **Contact:** For questions or feedback, reach out to `ssultan.j2@gmail.com`.
