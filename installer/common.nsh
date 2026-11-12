!define WV2_GUID "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
!macro CheckWebView2
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\${WV2_GUID}" "pv"
  StrCmp $0 "" 0 +2
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\${WV2_GUID}" "pv"
  StrCmp $0 "" 0 +2
  ReadRegStr $0 HKCU "Software\Microsoft\EdgeUpdate\Clients\${WV2_GUID}" "pv"
  ${If} $0 == ""
  ${OrIf} $0 == "0.0.0.0"
    MessageBox MB_YESNO|MB_ICONEXCLAMATION|MB_RIGHT|MB_RTLREADING "برای اجرای برنامه، «Microsoft Edge WebView2» لازم است و روی این ویندوز پیدا نشد.$\n$\nصفحه دانلود رایگان آن باز شود؟" IDNO +2
    ExecShell "open" "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
  ${EndIf}
!macroend
