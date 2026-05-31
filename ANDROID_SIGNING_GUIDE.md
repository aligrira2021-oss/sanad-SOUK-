# دليل توقيع تطبيق أندرويد (APK Signing Guide) - سوق سند 🛒

هذا الدليل مخصص لمساعدتك في توقيع ملف الـ **APK** للتطبيق رقمياً ليتجاوز نظام الحماية **Google Play Protect** عند التثبيت على الهواتف الذكية.

---

## 🔍 لماذا تظهر رسالة "App blocked to protect your device"؟
تظهر رسالة الحماية لأن نظام أندرويد يكتشف أن ملف الـ APK:
1. **غير موقّع** أو موقّع بمفتاح تجريبي افتراضي (`debug.keystore`).
2. **تم تثبيته من خارج متجر Google Play** وليس له هوية مطور مسجلة لدى جوجل.

### 🛠️ لتخطي الحظر وتجربة التطبيق فوراً على جهازك:
1. اضغط على خيار **"More details" (المزيد من التفاصيل)** في الرسالة التي ظهرت لك.
2. اختر **"Install anyway" (التثبيت على أي حال)** وسيتم تثبيت التطبيق بشكل طبيعي.

---

## 🗝️ الجزء الأول: إنشاء ملف المفاتيح الخاص بك (Android KeyStore)

لإنشاء ملف توقيع مخصص وصالح للإنتاج بصيغة (`.jks`)، تحتاج إلى استخدام أداة `keytool` المرفقة مع الـ Java JDK.

قم بفتح **Terminal** أو **CMD** على جهازك واكتب الأمر التالي:

```bash
keytool -genkey -v -keystore sanad-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sanad-alias
```

### 📝 تفاصيل الأمر:
* `sanad-release-key.jks`: اسم الملف التوقيع النهائي الذي سيتم إنشاؤه.
* `sanad-alias`: الاسم المستعار (Alias) للمفتاح داخل الملف.
* `-validity 10000`: صلاحية المفتاح بالأيام (تمثل حوالي 27 سنة).
* سيطلب منك النظام إدخال **كلمة مرور** (تأكد من حفظها جيداً، ستحتاجها في كل مرة تقوم بالبناء والتوقيع).
* سيطرح عليك بعض الأسئلة المعتادة (اسمك، اسم المنظمة، البلد إلخ..)؛ يمكنك ملؤها أو الضغط على Enter لتجاوزها.

---

## 📂 الجزء الثاني: ربط الملف بـ `build.gradle` (إذا كنت تستخدم Capacitor أو Cordova)

إذا قمت بإضافة بيئة الأندرويد لمشروعك (باستخدام Capacitor مثلاً)، فإنه يتوفر لديك ملف `build.gradle` بداخل المجلد `android/app/build.gradle`.

يمكنك إعداد التوقيع التلقائي لنسخة الـ Release عن طريق فتح ملف `android/app/build.gradle` وتعديله كالتالي:

### 1. أضف إعدادات التوقيع (signingConfigs):
ضع ملف `sanad-release-key.jks` بداخل المجلد `android/app/` ثم اكتب الإعداد التالي:

```groovy
android {
    ...
    defaultConfig { ... }

    signingConfigs {
        release {
            storeFile file("sanad-release-key.jks")
            storePassword "اكتب_كلمة_مرور_الملف_هنا"
            keyAlias "sanad-alias"
            keyPassword "اكتب_كلمة_مرور_المفتاح_هنا"
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // ربط نسخة الإنتاج بالتوقيع الذي أنشأناه
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 🛠️ الجزء الثالث: التوقيع اليدوي للملف النهائي (بدون حاجة لـ Gradle)

إذا كنت تبني ملف الـ APK عبر مواقع خارجية أو أداة بناء ويب تفاعلية، يمكنك توقيع الـ APK النهائي بشكل مستقل باستخدام الأداة الرسمية **apksigner** المرفقة مع حزمة أندرويد SDK:

```bash
apksigner sign --ks sanad-release-key.jks --out sanad-signed.apk sanad-unsigned.apk
```

ثم يمكنك التحقق من صحة التوقيع باستخدام الأمر التالي:
```bash
apksigner verify sanad-signed.apk
```

---

> ⚠️ **ملاحظة أمنية بالغة الأهمية:**
> * لا تقم بمشاركة ملف `.jks` أو كلمات المرور الخاصة به مع أي شخص أو رفعها على مستودعات الأكواد العامة مثل Github.
> * احفظ هذا الملف وكلمة المرور في مكان آمن، لأنه بدون هذا الملف لن تتمكن من تحديث تطبيقك في وقت لاحق.
