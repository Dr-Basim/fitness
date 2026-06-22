# 🏋️ Fitness Tracker — Dr. Basim

تطبيق ويب محلي (HTML/CSS/JS) لإدارة برنامج لياقة بدنية متسلسل 5 أيام مع تتبّع الأوزان والتقدّم الصحي.

- **الإصدار:** v5.0 (الصفحة الموحّدة)
- **الواجهة:** عربية كاملة RTL
- **الخط:** ToshA Taiba (موجود في `assets/`)
- **التشغيل:** افتح [`personal_trainer.html`](./personal_trainer.html) في أي متصفح

---

## 📁 بنية الملفات

```
fitness/
├── personal_trainer.html  ← نقطة الدخول (صفحة موحّدة، 4 تبويبات)
├── index.html             ← redirect إلى personal_trainer.html
│
├── pages.css              ← كل التنسيقات
├── app.js                 ← منطق التطبيق + initPersonalTrainer()
├── data-inline.js         ← بيانات البرنامج الكامل (96 تمرين، 5 أيام)
├── data.json              ← نسخة احتياطية من البيانات
│
├── assets/
│   ├── fonts.css          ← تسجيل خط ToshA Taiba
│   ├── ToshA-Regular.ttf
│   ├── ToshA-Medium.ttf
│   └── ToshA-Bold.ttf
│
├── README.md
├── .gitignore
├── افتح_الصفحة.bat       ← تشغيل سريع (Windows)
└── افتح_الصفحة.sh        ← تشغيل سريع (WSL/Linux)
```

---

## 🚀 التشغيل السريع

### مباشر (file://)
افتح `personal_trainer.html` في أي متصفح حديث (Chrome/Edge/Safari).

### عبر سيرفر محلي (مُوصى به)
```bash
# من Windows
افتح_الصفحة.bat

# من WSL/Linux
./افتح_الصفحة.sh
```

ثم افتح: `http://localhost:8766/`

---

## 🎨 الأقسام الأربعة

| القسم | الوظيفة | المحتوى |
|-------|---------|---------|
| **📖 البرنامج التدريبي** | شرح + فيديوهات | 5 أيام × phases × 96 تمرين + 95 رابط YouTube |
| **🏋️ المتابعة اليومية** | تسجيل الأوزان | checklist + 3 خانات S1/S2/S3 لكل تمرين مقاومة |
| **🫀 الصحة** | مؤشرات + InBody + رسوم | 6 بطاقات إحصائيات + جدول 12 أسبوع + 3 رسوم بيانية |
| **⚙️ الإعدادات** | مزامنة + نسخ احتياطي | GitHub Gist + QR + Export/Import + Reset |

---

## 🗓️ البرنامج

| اليوم | العنوان | المدة | التركيز |
|-------|---------|-------|---------|
| 1 | Full Body A | 55–60 د | علوي (A1+A2 = 14 تمرين مقاومة) + Zone 2 |
| 2 | HIIT + كارديو | 50–55 د | Norwegian 4×4 · VO₂max |
| 3 | Full Body B | 55–65 د | سفلي (B1+B2 = 12 تمرين مقاومة) + Zone 1 |
| 4 | Zone 2 طويل | 55–60 د | Active Recovery + Mobility |
| 5 | موبيليتي شاملة | 55–60 د | مرونة + Core (Dead Bug + Bird Dog) + سونا |

**التفاصيل الكاملة:** [`personal-trainer/SKILL.md`](https://github.com/Dr-Basim/personal-trainer) (مهارة Hermes منفصلة)

---

## 💾 الحفظ والمزامنة

- **localStorage** (المتصفح): cache سريع للتعديلات
- **GitHub Gist** (اختياري): مزامنة بين الجوال والكمبيوتر
- **Export JSON**: نسخ احتياطي يدوي

---

## 🛡️ قاعدة سلامة الظهر

- ❌ ممنوع: Barbell Squat، Bench Press، RDL، Shoulder Press واقف، Hanging، Pull-Ups
- ✅ مسموح: أجهزة فقط + جلوس + دعم ظهر كامل
- **التفاصيل الكاملة:** [`personal-trainer/SKILL.md`](https://github.com/Dr-Basim/personal-trainer)

---

## 📱 شبكة النادي تحجب YouTube

عند الفتح من داخل Fitness Time Pro، قد لا تعمل روابط الفيديو. افتح الصفحة على جوالك عبر بيانات 4G/5G قبل الذهاب للنادي.

---

## 🎯 الصفحة المرجعية للتعديل

**كل التعديلات المستقبلية تجري على `personal_trainer.html` فقط** (مع `pages.css` و `app.js` و `data-inline.js`).

---

**آخر تحديث:** 2026-06-22 (v5.0 — الصفحة الموحّدة + برنامج كامل 96 تمرين)
