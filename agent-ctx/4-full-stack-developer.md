---
Task ID: 4
Agent: full-stack-developer
Task: Create GitHub Actions workflow for building Android APK

Work Log:
- Created `.github/workflows/build-android.yml` with full CI/CD pipeline
- Created `.github/dependabot.yml` for automated dependency updates
- Updated `.gitignore` with Android, database, and build artifact entries
- Did NOT add `capacitor.config.ts` to gitignore (needed for builds)

Stage Summary:
- Workflow triggers on push to `main` and manual dispatch
- Pipeline: Checkout → Bun setup → Install deps → Java 17 → Android SDK → Gradle cache → Capacitor → Build APK
- Uploads both debug and release APKs as artifacts
- Creates GitHub releases automatically with versioned tags (v1.0.{run_number})
- Release signing uses secrets (KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD)
- Dependabot monitors: GitHub Actions (weekly), npm packages (weekly), Docker (monthly)
- Core framework major bumps ignored (Next.js, React, Prisma) to prevent breaking changes
