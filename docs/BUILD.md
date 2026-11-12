# Building Daftar

## Requirements

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (stable)
- [NSIS](https://nsis.sourceforge.io) 3.x, only for building the installers

## Automatic release builds

Publishing a release on GitHub runs `.github/workflows/release.yml`. It builds the app on a Windows runner, creates both installers and attaches them to the release. To rebuild the files for an existing release, open **Actions → Build & attach installers → Run workflow** and enter the tag.

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

## Cross-compiling from Linux (x86_64-pc-windows-gnu)

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

`%APPDATA%\ir.daftar.app\`:

- `daftar-data.json` holds all transactions, categories and settings.
- `backups\backup-YYYY-MM-DD.json` holds one automatic backup per day, and the latest 14 are kept.

On first run the app migrates data from the old Electron version (`%APPDATA%\Daftar\daftar-data.json`) if it finds one.
