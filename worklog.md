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

---
Task ID: 2
Agent: Main Agent
Task: Fix media loading in APK + diagnose bot service issue

Work Log:
- Analyzed media loading flow: URLs stored as tg:file_id in Supabase
- Root cause: getTelegramFileUrl() needs BOT_TOKEN, which is empty in APK build
- Found existing /api/telegram/image-proxy server endpoint that proxies Telegram images
- Updated usePublicData.ts resolveMediaUrls() to use apiUrl('/api/telegram/image-proxy?file_id=...')
- Updated MediaResolver.tsx useMediaUrl() to use server proxy instead of direct Telegram API
- Pushed fix, rebuilt APK v1.2 (20260422-1840) via GitHub Actions
- Bot service issue: alshifa-bot PM2 process on port 3030 appears to be stopped on server
- Cannot SSH from sandbox - need user to restart manually

Stage Summary:
- Media fix: APK now uses server proxy at abualzahracom.online/api/telegram/image-proxy
- Bot issue: User needs to restart PM2 alshifa-bot process on server

---
Task ID: 3
Agent: Main Agent
Task: Add direct viewer entry button + configure live server loading

Work Log:
- Modified src/app/page.tsx: Added "دخول إلى العرض العام" button on splash screen
- handleDirectViewer() bypasses login entirely — directly sets view='viewer' in localStorage
- Admin login moved to collapsible "دخول لوحة التحكم" section (ShieldCheck icon)
- Added new Lucide icons: Eye, ShieldCheck, ChevronDown, ChevronUp
- Configured capacitor.config.ts with server.url: 'https://abualzahracom.online'
- This means APK loads from live server — future UI changes won't need Google Play updates
- Bumped Android version to 1.3 (versionCode 4)
- Deployed new build to server via SSH (paramiko): uploaded standalone build + static files + public
- Restarted PM2 alshifa website process
- Verified both services online: alshifa (port 3000) and alshifa-bot (port 3030)
- Pushed to GitHub — triggered APK v1.3 build via GitHub Actions

Stage Summary:
- Website now shows direct "دخول إلى العرض العام" button on login screen
- Admin login accessible via "دخول لوحة التحكم" toggle (no longer primary UI)
- Capacitor configured to load from live server URL (one-time APK update needed)
- After v1.3 APK is installed, all future server-side UI changes auto-reflect in app
- Both server services confirmed online and working
