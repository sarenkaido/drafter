Unicode true
ManifestDPIAware true
SetCompressor /SOLID lzma
!include "LogicLib.nsh"
!include "common.nsh"
!define APP "Daftar"
!define VER "1.0.0"
Name "Daftar"
OutFile "Daftar-Portable-${VER}.exe"
Icon "icon.ico"
RequestExecutionLevel user
SilentInstall silent
VIProductVersion "${VER}.0"
VIAddVersionKey "ProductName" "${APP}"
VIAddVersionKey "FileDescription" "${APP} Portable"
VIAddVersionKey "FileVersion" "${VER}"
VIAddVersionKey "ProductVersion" "${VER}"
VIAddVersionKey "LegalCopyright" "${APP}"

Section
  !insertmacro CheckWebView2
  ; unpack next to the user's temp, run, clean up when the app closes
  InitPluginsDir
  SetOutPath "$PLUGINSDIR\app"
  File "..\dist-win\${APP}.exe"
  File "..\dist-win\WebView2Loader.dll"
  ExecWait '"$PLUGINSDIR\app\${APP}.exe"'
  SetOutPath "$TEMP"
SectionEnd
