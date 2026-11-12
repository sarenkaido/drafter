<div align="center">

<img src="assets/icon.png" width="96" alt="Daftar icon">

# Daftar

**دفتر ساده‌ی دخل و خرج برای ویندوز**

ببین چقدر پول اومد، چقدر رفت. همین. 🙂

<img src="docs/screenshot-dark.png" alt="Daftar screenshot" width="820">

[⬇️ دانلود نسخه‌ی نصبی](https://github.com/sarenkaido/drafter/releases/latest/download/Daftar-Setup-1.0.0.exe) &nbsp;·&nbsp;
[⬇️ دانلود نسخه‌ی بدون نصب](https://github.com/sarenkaido/drafter/releases/latest/download/Daftar-Portable-1.0.0.exe)

</div>

---

<div dir="rtl">

## 🧸 استفاده در ۳ قدم

### ۱. دانلود کن
روی دکمه‌ی **«⬇️ دانلود نسخه‌ی نصبی»** بالای همین صفحه بزن.
حجمش فقط حدود ۱٫۵ مگابایت است.

### ۲. نصب کن
فایلی که دانلود شد را **دو بار کلیک** کن، بعد **بعدی ← بعدی ← پایان** را بزن.
یک آیکون **Daftar** روی دسکتاپ ظاهر می‌شود. 🎉

> 🛡️ اگر ویندوز یک صفحه‌ی آبی نشان داد که می‌گوید «Windows protected your PC»،
> روی **More info** و بعد **Run anyway** بزن. این پیام برای همه‌ی برنامه‌های تازه می‌آید.

### ۳. بنویس
- دکمه‌ی بنفش **«+ تراکنش جدید»** را بزن.
- **هزینه** (قرمز) یا **درآمد** (سبز) را انتخاب کن.
- **مبلغ** را بنویس.
- **دسته** را انتخاب کن، مثلاً 🛒 خوراک.
- **ذخیره** را بزن. تمام! ✅

</div>

---

<div dir="rtl">

## ✨ چه کارهایی می‌کند؟

| | |
|---|---|
| 📝 | ثبت دخل و خرج روزانه، با تقویم **شمسی** |
| 🗂️ | **دسته‌بندی** با آیکون و رنگ دلخواه |
| 📊 | **نمودار** روزانه و ماهانه و گزارش سالانه |
| 🔍 | **جستجو** و فیلتر تراکنش‌ها |
| ⬇️ | **خروجی** اکسل (CSV) و فایل پشتیبان |
| ⬆️ | **ورود** اطلاعات از فایل اکسل یا پشتیبان |
| 💾 | **پشتیبان خودکار** هر روز (۱۴ روز آخر نگه داشته می‌شود) |
| 🌙 | تم **تیره** و **روشن** |
| 📴 | کاملاً **آفلاین**: هیچ اطلاعاتی به اینترنت فرستاده نمی‌شود |

## ⌨️ میان‌برها

| کلید | کار |
|---|---|
| `Ctrl` + `N` | تراکنش جدید |
| `Enter` | ذخیره |
| `Esc` | بستن پنجره |
| `Ctrl` + `F` | جستجو (در صفحه‌ی تراکنش‌ها) |

## ❓ سؤال‌های رایج

**اطلاعاتم کجا ذخیره می‌شود؟**
فقط روی کامپیوتر خودت. در برنامه برو به **تنظیمات ← باز کردن پوشه**.

**می‌خواهم به لپ‌تاپ دیگری ببرم. چه کنم؟**
در لپ‌تاپ قدیمی برو به **تنظیمات ← خروجی پشتیبان کامل**.
فایل را به لپ‌تاپ جدید ببر و آنجا **تنظیمات ← ورود از فایل** را بزن.

**پیام «WebView2 پیدا نشد» آمد.**
[این لینک](https://go.microsoft.com/fwlink/p/?LinkId=2124703) را باز کن، برنامه‌ی کوچکی که دانلود می‌شود را نصب کن و دوباره Daftar را باز کن.
(در ویندوز ۱۰ و ۱۱ معمولاً از قبل نصب است.)

**اگر برنامه را حذف کنم، اطلاعاتم پاک می‌شود؟**
نه. اطلاعات سر جایش می‌ماند تا اگر دوباره نصب کردی برگردد.

**فایل اکسل برای ورود چه شکلی باشد؟**
این ستون‌ها کافی است (ترتیب مهم نیست):

| تاریخ | نوع | دسته | مبلغ | توضیحات |
|---|---|---|---|---|
| 1405/08/10 | هزینه | خوراک | 250000 | خرید میوه |
| 1405/08/11 | درآمد | حقوق | 40000000 | |

</div>

---

## 🛠️ For developers

Built with [Tauri 2](https://tauri.app) (Rust) and plain HTML/CSS/JS. No framework, no build step for the UI.

```
ui/          the app UI (HTML, CSS, JS, font)
src-tauri/   Rust backend: saves data, file dialogs, backups
installer/   NSIS scripts for the setup and portable .exe
scripts/     cargo config for cross-compiling from Linux
```

Quick start on Windows (needs [Node.js](https://nodejs.org) and [Rust](https://rustup.rs)):

```bash
npm install
npm run dev      # run with live reload
npm run build    # build src-tauri/target/release/Daftar.exe
```

Building the installers and cross-compiling from Linux are covered in [docs/BUILD.md](docs/BUILD.md).

## Credits

- Font: [Vazirmatn](https://github.com/rastikerdar/vazirmatn), SIL Open Font License ([ui/fonts/OFL.txt](ui/fonts/OFL.txt))
- Jalali calendar math adapted from [jalaali-js](https://github.com/jalaali/jalaali-js) (MIT)

## License

[MIT](LICENSE)
