Unicode true
ManifestDPIAware true
SetCompressor /SOLID lzma
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "common.nsh"

!define APP "Daftar"
!define APPFA "Daftar"
!define OLDFA "دفتر دخل و خرج"
!ifndef VER
  !define VER "1.3.0"
!endif
!define UNKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}"

Name "${APPFA}"
OutFile "Daftar-Setup-${VER}.exe"
InstallDir "$LOCALAPPDATA\Programs\${APP}"
InstallDirRegKey HKCU "Software\${APP}" "InstallDir"
RequestExecutionLevel user
BrandingText "${APPFA} ${VER}"
VIProductVersion "${VER}.0"
VIAddVersionKey "ProductName" "${APP}"
VIAddVersionKey "FileDescription" "${APP} Setup"
VIAddVersionKey "FileVersion" "${VER}"
VIAddVersionKey "ProductVersion" "${VER}"
VIAddVersionKey "LegalCopyright" "${APP}"

!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP}.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run ${APPFA}"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Farsi"

Function .onInit
  ; close a running copy so files can be replaced on update
  nsExec::Exec 'taskkill /IM ${APP}.exe /F'
FunctionEnd

Section "Install"
  Delete "$DESKTOP\${OLDFA}.lnk"
  RMDir /r "$SMPROGRAMS\${OLDFA}"
  SetOutPath "$INSTDIR"
  File "..\dist-win\${APP}.exe"
  !if /FileExists "../dist-win/WebView2Loader.dll"
    File "..\dist-win\WebView2Loader.dll"
  !endif
  File "icon.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\${APPFA}.lnk" "$INSTDIR\${APP}.exe" "" "$INSTDIR\icon.ico"
  CreateDirectory "$SMPROGRAMS\${APPFA}"
  CreateShortcut "$SMPROGRAMS\${APPFA}\${APPFA}.lnk" "$INSTDIR\${APP}.exe" "" "$INSTDIR\icon.ico"
  CreateShortcut "$SMPROGRAMS\${APPFA}\Uninstall Daftar.lnk" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\${APP}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNKEY}" "DisplayName" "${APPFA}"
  WriteRegStr HKCU "${UNKEY}" "DisplayVersion" "${VER}"
  WriteRegStr HKCU "${UNKEY}" "Publisher" "${APP}"
  WriteRegStr HKCU "${UNKEY}" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "${UNKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNKEY}" "NoRepair" 1
  WriteRegDWORD HKCU "${UNKEY}" "EstimatedSize" 4200
  !insertmacro CheckWebView2
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /IM ${APP}.exe /F'
  Delete "$INSTDIR\${APP}.exe"
  Delete "$INSTDIR\WebView2Loader.dll"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\${APPFA}.lnk"
  RMDir /r "$SMPROGRAMS\${APPFA}"
  DeleteRegKey HKCU "${UNKEY}"
  DeleteRegKey HKCU "Software\${APP}"
  ; user data in %APPDATA%\ir.daftar.app is intentionally kept
SectionEnd
