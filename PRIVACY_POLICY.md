# سياسة الخصوصية وأمان البيانات — تطبيق إنجاز (Enjaz Habit Tracker)
**آخر تحديث:** 24 سبتمبر 2026

تطبيق **"إنجاز"** مبني وفق مبدأ أساسي: **الخصوصية أولاً (Privacy-First)** والتخزين المحلي المباشر (**Local-First**). نحن نؤمن بأن عاداتك اليومية وسجلاتك وأفكارك هي بياناتك الشخصية البحتة التي لا يحق لأحد الاطلاع عليها.

---

## 1. ما البيانات التي يجمعها التطبيق؟

- **البيانات المحلية:** جميع العادات المسجلة، التواريخ، السجلات اليومية، الملاحظات والخواطر، تُخزن محلياً داخل جهازك بشكل كامل في قاعدة بيانات SQLite في المساحة المعزولة الخاصة بالتطبيق (App Sandboxed Storage).
- **لا توجد بيانات شخصية إلزامية:** لا يتطلب التطبيق منك تسجيل الاسم، البريد الإلكتروني، رقم الهاتف، أو إنشاء حساب للبدء في استخدامه.
- **لا تتبع ولا إعلانات:** التطبيق خالٍ تماماً 100% من أي برمجيات إعلانية (No Advertising SDKs)، أو برمجيات تتبع سلوكي (No Third-Party Analytics)، أو أدوات جمع البيانات التعريفية للأجهزة (No Device Fingerprinting).

---

## 2. المزامنة السحابية (اختيارية)

- يوفر التطبيق خاصية مزامنة سحابية اختيارية للراغبين في حفظ بياناتهم وتحديثها عبر أجهزتهم.
- عند تفعيل المزامنة، يتم تشفير كافة البيانات المنقولة عبر بروتوكولات آمنة ومحمية بالكامل (**HTTPS / TLS**).
- لا يتم بيع أو مشاركة أو تأجير أي سجلات لعاداتك لأي طرف ثالث تحت أي ظرف.

---

## 3. الأذونات والصلاحيات (Permissions)

يطلب التطبيق فقط الحد الأدنى الصارم من الأذونات التي تخدم وظائفه التشغيلية المباشرة:

| الإذن | الغرض |
| :--- | :--- |
| **الإشعارات (`POST_NOTIFICATIONS`)** | لإرسال تنبيهات تذكير العادات ومراجعة المساء التي تحددها بنفسك. يتم توليد التنبيهات ومعالجتها محلياً داخل جهازك. |
| **الاهتزاز (`VIBRATE`)** | لتقديم التغذية اللمسية (Haptic Feedback) المريحة عند إنجاز العادة. |
| **الإنترنت (`INTERNET`)** | فقط لنقل بيانات المزامنة السحابية الاختيارية عبر اتصال مشفر وآمن. |

> 🚫 **تأكيد:** التطبيق **لا يطلب ولا يستخدم** إذن الميكروفون (`RECORD_AUDIO`)، ولا يطلب موقعك الجغرافي (`ACCESS_FINE_LOCATION`)، ولا جهات اتصالك، ولا يطلب صلاحية النوافذ العائمة (`SYSTEM_ALERT_WINDOW`).

---

## 4. ملكية البيانات والتحكم الكامل

- **تصدير البيانات:** يتيح لك التطبيق في أي وقت تصدير نسخة كاملة من عاداتك وسجلاتك بصيغة **JSON** أو جداول **CSV** ومشاركتها أو حفظها أينما شئت.
- **حذف البيانات نهائياً:** يمكنك من شاشة "الإعدادات > مسح كافة البيانات نهائياً" مسح كل عاداتك وسجلاتك بنقرة واحدة من جهازك ومن السحابة بشكل فوري ودائم لا رجعة فيه.

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

**Enjaz** is designed with a **Privacy-First, Local-First** architecture.

1. **Data Storage & Collection:** All habits, checkins, streaks, and personal notes are stored locally on your device in a sandboxed SQLite database. No registration, login, phone number, or email is required to use the app.
2. **No Tracking & No Ads:** The application is 100% ad-free and contains no third-party tracking or behavioral analytics SDKs.
3. **Optional Cloud Sync:** When enabled, data transfer occurs strictly over encrypted HTTPS/TLS channels. We never sell, rent, or share your data with third parties.
4. **Permissions:**
   - `POST_NOTIFICATIONS`: To deliver your locally-scheduled habit reminders and evening reviews.
   - `VIBRATE`: For subtle tactile confirmation upon habit completion.
   - `INTERNET`: Exclusively for optional encrypted cloud sync.
   - *No microphone access, no location tracking, and no overlay permissions.*
5. **Data Ownership & Deletion:** You can export your data anytime (JSON/CSV) and permanently erase all records with one click via Settings.
6. **Contact:** For questions or feedback, reach out to `ssultan.j2@gmail.com`.
