# Task 3: Monthly Memorization Rate (معدل الحفظ الشهري)

## Summary
Added a "معدل الحفظ الشهري" (Monthly Memorization Rate) feature to the existing Al-Shifa Quran Center admin panel. This feature computes and displays monthly attendance/memorization rate statistics for each student, grouped by branch.

## Files Created

### 1. `/home/z/my-project/src/app/api/monthly-rate/route.ts` (NEW)
- **GET** endpoint accepting optional `month` query param (format `YYYY-MM`, defaults to current month)
- Fetches `Attendance`, `Student`, and `Halaka` tables from Supabase
- Computes per-student rate: `(presentDays / totalDays) * 100`
- Groups results by branch with aggregate rates
- Returns structured JSON with `month`, `totalStudents`, `overallRate`, and `branches[]` (each containing `name`, `rate`, and `students[]`)

## Files Modified

### 2. `/home/z/my-project/src/app/page.tsx`
Changes made (5 edits):

1. **Line ~1014**: Added new navTab entry `{ value: 'monthlyrate', label: 'معدل الحفظ', icon: TrendingUp }`
2. **Lines ~281-283**: Added state variables `monthlyRate` and `monthlyMonth` (defaults to current month in YYYY-MM format)
3. **Lines ~436-448**: Added `loadMonthlyRate` useCallback that fetches from `/api/monthly-rate?month=...`
4. **Lines ~469-473**: Added `useEffect` that triggers `loadMonthlyRate` when `activeTab === 'monthlyrate'`
5. **Lines ~1213-1221**: Added rendering block for MonthlyRateTab in the `<main>` content area
6. **Lines ~3157-3464**: Added full `MonthlyRateTab` component (new, ~300 lines)

### MonthlyRateTab Component Features
- **Month selector** (type="month" input) with dark theme styling
- **Overall stats cards**: Total students, overall rate (with progress bar), branch count
- **Branch cards**: Color-coded by rate (green ≥80%, amber ≥60%, orange ≥40%, red <40%), with progress bars
- **Detailed tables**: Per-branch student tables showing name, halaka, present days, total days, rate%
- **Rate color coding**: Consistent color system across all elements
- **Responsive**: Mobile-first with `sm:`, `lg:` breakpoints, hidden columns on mobile
- **Loading states**: Skeleton placeholders while data loads
- **Empty states**: Graceful handling when no data exists
- **Style consistency**: Uses same color scheme (green #1a5f4a, gold #d4af37), card styles (border-0, shadow-sm, borderRadius 0.8rem)

## Technical Notes
- Uses existing `TrendingUp`, `Users`, `MapPin`, `Award`, `ClipboardCheck` icons (already imported)
- Uses existing `BRANCH_COLORS` constant for branch badge styling
- API route uses `sbGet` from `@/lib/supabase` for Supabase queries
- Uses `NextResponse` from `next/server` for response handling
- No new imports added to page.tsx
- ESLint passes with 0 new errors (only pre-existing warnings)
