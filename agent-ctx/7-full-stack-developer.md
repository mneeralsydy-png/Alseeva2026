---
Task ID: 7
Agent: full-stack-developer
Task: Major improvements to the Al-Shifa Quran Center app

Work Log:
- Updated Prisma schema with CenterInfo model (key, value, type, section)
- Pushed schema to database with `bun run db:push`
- Created `/api/center-info/route.ts` with full CRUD operations (GET, POST, PUT, DELETE)
- Updated `/api/public/route.ts` to return media (12 recent), centerInfo, and attendanceStats
- Updated `/api/auth/login/route.ts` to return `role` field (admin/viewer based on username)
- Updated `/api/auth/seed/route.ts` to seed public viewer user (public/public123)
- Replaced all BookOpen logo icons with center-logo.png across:
  - Loading screen
  - Login page hero
  - Admin navbar (32x32 with gold border)
  - Dashboard welcome card
  - PublicDisplayView header and hero banner (80x80)
- Removed LandingView from flow entirely (kept file but not imported)
- Rewrote page.tsx authentication flow:
  - Removed landing page view completely
  - Single login page with credential hints (admin and public)
  - Role-based routing: admin → dashboard, viewer → PublicDisplayView
  - Role stored in localStorage alongside auth data
  - Auto-restore role on page reload
- Completely rewrote PublicDisplayView.tsx:
  - Changed prop from `onBack` to `onLogout`
  - Added header with logo, badge, and logout button
  - Added tab navigation (الحلقات, الوسائط, معلومات عامة)
  - Media tab: grid of images from public API with album badges
  - Info tab: center info organized by sections with image/link/text support
  - Kept existing stats, branches, categories sections
  - Added attendance stats (حاضرون اليوم) to stats cards
- Added Center Info tab ("معلومات المركز") to admin dashboard
  - Full CRUD: add, edit, delete center info items
  - Type dropdown: نص, صورة, رابط
  - Section dropdown: عام, عن المركز, أوقات الدوام, تواصل
  - Items grouped by section with table display
  - Image preview for type=image items
  - Edit dialog for modifying items

Stage Summary:
- All 9 changes implemented successfully
- ESLint: 0 errors, 2 warnings (false positives from Lucide Image icon)
- TypeScript: no app-level errors
- Authentication flow simplified to single login with role-based routing
- Public viewer mode accessible via public/public123 credentials
- Center info management fully integrated into admin panel
