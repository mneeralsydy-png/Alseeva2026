---
Task ID: 1
Agent: Main Agent
Task: Fix login issue in Android app (APK) - website works but app doesn't

Work Log:
- Diagnosed the issue: Capacitor detection in `api.ts` relied only on `window.Capacitor?.isNativePlatform()` which may not be available
- Enhanced `isCapacitorNative()` with 3 detection methods:
  1. URL protocol check (`capacitor://` or `ionic://`) - most reliable
  2. `Capacitor.isNativePlatform()` global check
  3. `Capacitor.platform` check (android/ios)
- Added caching to avoid repeated checks
- Added `NEXT_PUBLIC_API_BASE=https://abualzahracom.online` as env var during APK build
- Fixed APK build process (Next.js 16 static export conflicts with API routes)
- Used `BUILD_TYPE=apk` with API routes temporarily moved during export
- Rebuilt APK with `JAVA_HOME=/home/z/jdk-21.0.10`
- Fixed deployment script to properly copy hidden files (`cp -ra .../.`) in standalone build
- Deployed standalone build to VPS via SSH/SCP
- Uploaded new APK to server

Stage Summary:
- Server deployment: ✅ All endpoints working
- Admin login (Am2026/A777A777): ✅ Returns role:admin
- Viewer login (Hi/Hi123): ✅ Returns role:viewer  
- Website: ✅ HTTP 200
- New APK: ✅ https://abualzahracom.online/alshifa-debug.apk (21.5MB)
- Key fix: Protocol-based Capacitor detection (`capacitor://`) ensures API calls go to `https://abualzahracom.online` even if Capacitor runtime isn't loaded yet
