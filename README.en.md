<div align="center">

<img src="assets/icon.png" width="96" alt="Daftar icon">

# Daftar

[فارسی](README.md) | **English**

**A simple income & expense notebook for Windows, Android and Linux**

See how much money came in and how much went out. That's it.

English and Persian · Gregorian and Persian calendars

<img src="docs/screenshot-en.png" alt="Daftar on desktop" height="360">&nbsp;&nbsp;<img src="docs/screenshot-mobile-en.png" alt="Daftar on Android" height="360">

</div>


---

## Download

| Device | File | Size |
|---|---|---|
| Windows | [Installer](https://github.com/sarenkaido/drafter/releases/latest/download/Daftar-Windows-Setup.exe) | ~1.5 MB |
| Windows (no install) | [Portable](https://github.com/sarenkaido/drafter/releases/latest/download/Daftar-Windows-Portable.exe) | ~1.5 MB |
| Android | [APK](https://github.com/sarenkaido/drafter/releases/latest/download/Daftar-Android.apk) | ~10 MB |
| Linux (any distro) | [AppImage](https://github.com/sarenkaido/drafter/releases/latest/download/Daftar-Linux-x86_64.AppImage) | ~80 MB |
| Linux (Ubuntu / Debian) | [.deb](https://github.com/sarenkaido/drafter/releases/latest/download/Daftar-Linux-amd64.deb) | ~2 MB |

All versions: [Releases page](https://github.com/sarenkaido/drafter/releases) · [Support the project](#support-daftar)

## Use it in 4 steps

### 1. Download
Click the file for your device in the table above.

### 2. Install

**Windows:**
**Double-click** the file, then click **Next → Next → Finish**.
A **Daftar** icon appears on your desktop.

> If Windows shows a blue screen saying "Windows protected your PC",
> click **More info**, then **Run anyway**.

**Android:**
Open the APK file and tap **Install**.

> If your phone says installing from this source isn't allowed, tap **Settings**,
> turn on **Allow from this source**, then go back and tap **Install**.
> If Play Protect shows a warning, tap **More details → Install anyway**.

**Linux:**
- **AppImage:** right-click the file, open **Properties**, turn on **Allow executing as program**, then double-click it.
- **.deb:** double-click it to open your software installer, or run:
  `sudo apt install ./Daftar-Linux-amd64.deb`

### 3. Choose
The first time you open the app it asks for your **language**, **calendar** and **currency**. Pick them and tap **Start**.

### 4. Write it down
- Tap the purple **"+"** button (on a computer: **"+ New transaction"**).
- Pick **Expense** (red) or **Income** (green).
- Type the **amount**.
- Pick a **category**, for example Groceries.
- Tap **Save**. Done!

---

## What it does

- Log daily income and expenses
- **English** and **Persian** interface
- **Gregorian** or **Persian (Jalali)** calendar, independent of the language
- Any currency: US dollar, euro, pound, toman, rial and more, or your own label; amounts with cents where the currency uses them
- **Categories** with your own icons and colors
- Daily and monthly **charts**, plus a yearly report
- **Search** and filter your transactions
- **Export** to Excel (CSV) or a full backup file
- **Import** from an Excel (CSV) or backup file
- **Automatic daily backup** (the last 14 days are kept)
- **Dark** and **light** themes
- Fully **offline**: nothing is ever sent to the internet

## Keyboard shortcuts (computer)

| Key | Action |
|---|---|
| `Ctrl` + `N` | New transaction |
| `Enter` | Save |
| `Esc` | Close the window |
| `Ctrl` + `F` | Search (on the transactions page) |

## FAQ

**How do I change the language, calendar or currency?**
They're all in **Settings**. On a computer you can also switch the language with the **EN** / **فا** button at the bottom of the sidebar.
The three are independent; for example, you can use English with the Persian calendar.

**Where is my data saved?**
Only on your own device. On a computer, **Settings → Open folder** shows the folder.

**How do I move my data to another device (for example, from a laptop to a phone)?**
On the old device, go to **Settings → Full backup export**.
Send the file to the new device and use **Settings → Import from file**.
This works between Windows, Android and Linux too.

**A new version is out. Will I lose my data?**
No. Install the new version over the old one and your data stays.

**Will uninstalling delete my data?**
Not on Windows or Linux. On Android, uninstalling the app also deletes its data, so export a full backup first.

**Windows says "Could not find the WebView2 Runtime".**
Open [this link](https://go.microsoft.com/fwlink/p/?LinkId=2124703), install the small app it downloads, then open Daftar again.
(It is usually already installed on Windows 10 and 11.)

**What should a CSV file for import look like?**
These columns are enough, in any order. Persian or English headers both work:

| date | type | category | amount | note |
|---|---|---|---|---|
| 1405/08/10 | expense | Groceries | 250000 | Fruit |
| 1405/08/11 | income | Salary | 40000000 | |

Dates can be Persian (`1405/08/10`) or Gregorian (`2026-11-01`).

---

## For developers

Built with [Tauri 2](https://tauri.app) (Rust) and plain HTML/CSS/JS. There's no framework and no build step for the UI. The same code runs on Windows, Linux and Android.

```
ui/          the app UI (HTML, CSS, JS, font), responsive for phones
             i18n.js holds all English and Persian text, calendar.js the calendars
src-tauri/   Rust backend: saves data, file dialogs, backups
installer/   NSIS scripts for the Windows setup and portable .exe
scripts/     cargo config for cross-compiling Windows builds from Linux
```

Quick start (needs [Node.js](https://nodejs.org) and [Rust](https://rustup.rs)):

```bash
npm install
npm run dev      # run on your computer with live reload
npm run build    # build the desktop app
```

Publishing a GitHub release builds every platform automatically and attaches the files.
Building locally, Android and signing are covered in [docs/BUILD.md](docs/BUILD.md).

## Security and changes

- The app never sends anything over the internet. To report a security problem, see [SECURITY.md](SECURITY.md).
- What changed in each version: [CHANGELOG.md](CHANGELOG.md)

## Credits

- Font: [Vazirmatn](https://github.com/rastikerdar/vazirmatn), SIL Open Font License ([ui/fonts/OFL.txt](ui/fonts/OFL.txt))
- Jalali calendar math adapted from [jalaali-js](https://github.com/jalaali/jalaali-js) (MIT)

## License

[MIT](LICENSE)

---

## Support Daftar

Daftar is **free**, **open source** and **ad-free**, and it will stay that way. It collects nothing about you and sells nothing.

If it has made your money a little easier to keep track of and you'd like to say thanks, any amount helps, however small. It buys time for new versions, new features and bug fixes.

<div align="center">

| Ethereum & BNB Smart Chain | Solana | Tron |
|:---:|:---:|:---:|
| <img src="docs/donate/evm.png" width="170" alt="Ethereum / BNB address QR"> | <img src="docs/donate/solana.png" width="170" alt="Solana address QR"> | <img src="docs/donate/tron.png" width="170" alt="Tron address QR"> |
| ETH · BNB · USDT · USDC | SOL · USDT · USDC | TRX · USDT (TRC-20) |

</div>

**Ethereum (ERC-20) and BNB Smart Chain (BEP-20):**

```
0x92D262062d36688261032051b2B9Ae08F3644b89
```

**Solana:**

```
4oWwKYuiEfaTWvTPu3isGSqHtsKydTy5oLD3qo5PRpKR
```

**Tron (TRC-20):**

```
TCbk4NGW57Wiy6YJXQmx1pPV2hsw1SQndY
```

> **Important:** send each coin only on its own network. Transfers on the wrong network can't be reversed.
> Before sending, compare the first and last few characters of the address with this page.

**Free ways to help are just as welcome:**
- **Star** this repository so more people can find it.
- Tell a friend about Daftar.
- Found a bug or have an idea? Open an [issue](https://github.com/sarenkaido/drafter/issues).

Thank you for choosing Daftar.
