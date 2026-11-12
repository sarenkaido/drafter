# Building Daftar

## Requirements

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (stable)
- [NSIS](https://nsis.sourceforge.io) 3.x, only for building the installers

## Automatic release builds

`.github/workflows/release.yml` builds every platform on GitHub's machines:

| Job | Output |
|---|---|
| Windows | `Daftar-Windows-Setup.exe`, `Daftar-Windows-Portable.exe` |
| Linux (Ubuntu 22.04) | `Daftar-Linux-x86_64.AppImage`, `Daftar-Linux-amd64.deb` |
| Android | `Daftar-Android.apk` (arm64 + armv7) |

The workflow runs in three ways:

- **Publishing a release** on GitHub builds the tagged code and attaches the files.
- **Actions → Build & release → Run workflow** with *publish* checked builds the latest `main`, creates the release for the tag you enter if it doesn't exist yet, and uploads the files.
- The same run with *publish* unchecked is a test build. The files are kept as workflow artifacts, and the APK is also launched on an Android emulator, which uploads screenshots.

### Android signing key

Android only installs updates that are signed with the same key as the installed app. The workflow reads the key from two repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE` | the `.jks` keystore file, base64-encoded (`base64 -w0 daftar-release.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore and key password (key alias: `daftar`) |

Without these secrets the APK is signed with a throwaway key and is **not** published. Keep the keystore and password backed up outside the repo. If they are lost, existing users can't update without uninstalling.

To create a new key:

```bash
keytool -genkeypair -keystore daftar-release.jks -storetype PKCS12 -alias daftar \
  -keyalg RSA -keysize 4096 -validity 36500 -dname "CN=Daftar"
```

## On Windows

```bash
npm install
npm run build
```

The app is written to `src-tauri/target/release/Daftar.exe`. It needs `WebView2Loader.dll` only when built with the GNU toolchain. The default MSVC toolchain links the loader statically.

### Installers

The NSIS scripts read their input files from `dist-win/`:

```bash
mkdir dist-win
copy src-tauri\target\release\Daftar.exe dist-win\
cd installer
makensis setup.nsi       # -> Daftar-Setup-<version>.exe
makensis portable.nsi    # -> Daftar-Portable-<version>.exe
```

The scripts include `WebView2Loader.dll` only when it is present in `dist-win/` (GNU builds), so the same scripts work for MSVC and GNU builds. Pass `/DVER=1.2.3` to `makensis` to set the version.

## On Linux

```bash
sudo apt install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf
npm install
npx tauri build --bundles deb appimage
```

Packages are written to `src-tauri/target/release/bundle/`.

## Android

Needs Java 17, the Android SDK and NDK, with `ANDROID_HOME` and `NDK_HOME` set, plus the Rust Android targets:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
npx tauri android init          # generates src-tauri/gen/android (not committed)
npx tauri icon assets/icon.png  # app icons for Android
npx tauri android dev           # run on a connected phone or emulator
npx tauri android build --apk --target aarch64 --target armv7
```

The release APK is unsigned. Sign it with `zipalign` and `apksigner` from the SDK build-tools, the same way the workflow's *Sign APK* step does.

## Cross-compiling Windows builds from Linux (x86_64-pc-windows-gnu)

```bash
sudo apt install mingw-w64 nsis
rustup target add x86_64-pc-windows-gnu

npx tauri build --no-bundle --target x86_64-pc-windows-gnu -- \
  --config ../scripts/cross-windows-gnu.toml

mkdir -p dist-win
cp src-tauri/target/x86_64-pc-windows-gnu/release/{Daftar.exe,WebView2Loader.dll} dist-win/
(cd installer && makensis setup.nsi && makensis portable.nsi)
```

`scripts/cross-windows-gnu.toml` sets the mingw linker and links the C runtime statically. It also contains an `[unstable] build-std` section. That section is only needed when you can't install the prebuilt Windows standard library with `rustup target add`, and it requires `RUSTC_BOOTSTRAP=1` plus the `rust-src` component. Delete it if `rustup target add` works for you.

Debian/Ubuntu's NSIS names the Persian language file `Farsi`, and the installer scripts use that name.

## Where user data lives

| Platform | Folder |
|---|---|
| Windows | `%APPDATA%\ir.daftar.app\` |
| Linux | `~/.local/share/ir.daftar.app/` |
| Android | the app's private storage (removed when the app is uninstalled) |

Contents:

- `daftar-data.json` holds all transactions, categories and settings.
- `backups\backup-YYYY-MM-DD.json` holds one automatic backup per day, and the latest 14 are kept.

On first run the app migrates data from the old Electron version (`%APPDATA%\Daftar\daftar-data.json`) if it finds one.
