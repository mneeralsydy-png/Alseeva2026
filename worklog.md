---
Task ID: 1
Agent: Main Agent
Task: Fix APK connectivity, change package name, push to GitHub

Work Log:
- Analyzed project structure: Next.js 16 + Capacitor 8 + Supabase
- Identified APK connectivity root cause: Missing network_security_config.xml and android:usesCleartextTraffic in AndroidManifest
- Created android/app/src/main/res/xml/network_security_config.xml with permissive config
- Updated AndroidManifest.xml with usesCleartextTraffic and networkSecurityConfig references
- Updated capacitor.config.ts: new appId (com.alshifa.hifz.app), added server.allowNavigation, androidScheme: 'https'
- Changed package name from com.alshifa.quran.center to com.alshifa.hifz.app in:
  - capacitor.config.ts (appId)
  - android/app/build.gradle (namespace, applicationId)
  - android/app/src/main/res/values/strings.xml (package_name, custom_url_scheme)
  - android/app/src/main/java/com/alshifa/hifz/app/MainActivity.java (new file with new package)
  - Removed old java directory: com/alshifa/quran/center/
- Updated supabase-direct.ts: added timeout (15s), AbortController, native detection, detailed console logging
- Updated usePublicData.ts: added error logging
- Updated .github/workflows/build-release.yml: version v1.2, pass NEXT_PUBLIC_SUPABASE_URL/KEY during build

Stage Summary:
- APK should now work due to network_security_config.xml and proper manifest settings
- Package name changed to com.alshifa.hifz.app (not registered on Google Play)
- Version bumped to 1.2 (versionCode 3)
- GitHub Actions workflow updated to pass Supabase env vars during static build
- Ready to push to GitHub
