'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { usePublicData } from '@/hooks/usePublicData'
import MediaViewerModal from '@/components/MediaViewerModal'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpen,
  Users,
  MapPin,
  ChevronDown,
  ChevronUp,
  LogOut,
  Image as ImageIcon,
  Info,
  Clock,
  GraduationCap,
  Star,
  ExternalLink,
  ClipboardCheck,
  Calendar,
  X,
  FolderOpen,
  UserCheck,
  UserX,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Menu,
  ChevronLeft,
  TrendingUp,
  Play,
  RefreshCw,
  Trophy,
  Crown,
  Award,
} from 'lucide-react'
import { registerBackAction } from '@/lib/capacitor-bridge'

interface PublicStudent {
  name: string
  age: number
  surah: string
  category: string
}

interface PublicHalaka {
  id: string
  name: string
  teacher: string
  branch: string
  _count: { students: number }
  students: PublicStudent[]
}

interface PublicBranch {
  name: string
  halakatCount: number
  studentsCount: number
}

interface PublicMediaImage {
  id: string
  album: string
  filename: string
  url: string
  createdAt: string
}

interface PublicAlbum {
  name: string
  count: number
  images: PublicMediaImage[]
}

interface PublicCenterInfo {
  id: string
  key: string
  value: string
  type: string
  section: string
}

interface AttendanceStats {
  present: number
  absent: number
  late: number
  total: number
}

interface AttendanceGroup {
  halakaName: string
  branch: string
  teacher: string
  present: number
  absent: number
  late: number
  total: number
  records: { studentName: string; status: string; notes?: string }[]
}

interface PublicData {
  centerName: string
  totalHalakat: number
  totalStudents: number
  totalActivities: number
  totalImages: number
  halakat: PublicHalaka[]
  branches: PublicBranch[]
  categories: { name: string; count: number }[]
  activities: { id: string; title: string; description?: string; date: string; type: string }[]
  media: PublicMediaImage[]
  albums: PublicAlbum[]
  centerInfo: PublicCenterInfo[]
  attendanceStats: AttendanceStats
  attendanceByHalaka: AttendanceGroup[]
  todayDate: string
  monthlyRate?: Record<string, { halakaId: string; halakaName: string; currentRate: number; prevRate: number; change: number }>
}

type TabValue = 'home' | 'halakat' | 'media' | 'attendance' | 'activities' | 'competitions' | 'graduates' | 'info' | 'branches'

const BRANCH_STYLES: Record<string, { bg: string; accent: string; border: string; icon: string; gradient: string }> = {
  السرور: { bg: 'bg-emerald-50', accent: '#059669', border: '#a7f3d0', icon: '#10b981', gradient: 'linear-gradient(135deg, #059669, #047857)' },
  'المركز العام': { bg: 'bg-amber-50', accent: '#d97706', border: '#fde68a', icon: '#f59e0b', gradient: 'linear-gradient(135deg, #d97706, #b45309)' },
  الوادي: { bg: 'bg-cyan-50', accent: '#0891b2', border: '#a5f3fc', icon: '#06b6d4', gradient: 'linear-gradient(135deg, #0891b2, #0e7490)' },
  وبرة: { bg: 'bg-teal-50', accent: '#0d9488', border: '#99f6e4', icon: '#14b8a6', gradient: 'linear-gradient(135deg, #0d9488, #0f766e)' },
  ضية: { bg: 'bg-rose-50', accent: '#e11d48', border: '#fecdd3', icon: '#f43f5e', gradient: 'linear-gradient(135deg, #e11d48, #be123c)' },
  المنعم: { bg: 'bg-violet-50', accent: '#7c3aed', border: '#ddd6fe', icon: '#8b5cf6', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
}

const CATEGORY_STYLES: Record<string, string> = {
  '1-10': 'bg-green-100 text-green-700',
  '10-20': 'bg-blue-100 text-blue-700',
  '20-30': 'bg-amber-100 text-amber-700',
  '30-20': 'bg-orange-100 text-orange-700',
  'محو الامية': 'bg-purple-100 text-purple-700',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof UserCheck }> = {
  'حاضر': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: UserCheck },
  'غائب': { bg: 'bg-red-50', text: 'text-red-700', icon: UserX },
  'متأخر': { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertCircle },
}

const SECTION_TITLES: Record<string, string> = {
  'عام': 'معلومات عامة',
  'عن المركز': 'عن المركز',
  'أوقات الدوام': 'أوقات الدوام',
  'تواصل': 'تواصل معنا',
}

const ACTIVITY_TYPE_STYLES: Record<string, string> = {
  'عامة': 'bg-gray-100 text-gray-700 border-gray-300',
  'قرآنية': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'ثقافية': 'bg-blue-100 text-blue-700 border-blue-300',
  'رياضية': 'bg-amber-100 text-amber-700 border-amber-300',
  'اجتماعية': 'bg-purple-100 text-purple-700 border-purple-300',
}

// Check if a URL is a video
function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.avi') ||
    lower.includes('.webm') || lower.includes('.mkv') || lower.includes('.3gp') ||
    lower.includes('video')
}

// Resolve media URL for display
// For tg: references (Telegram file IDs), they should already be resolved by usePublicData hook
// For direct URLs (Telegram CDN, etc.), return as-is
function resolveMediaUrl(url: string): string {
  if (!url) return ''
  // tg: references should be resolved by the hook - return empty if not yet resolved
  if (url.startsWith('tg:')) return ''
  // Direct URLs - return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url
}

export default function PublicDisplayView({ onLogout }: { onLogout: () => void }) {
  // ── Direct Supabase data fetching (NO SERVER NEEDED!) ──
  const { data, loading, isOffline, lastUpdate, msg, refresh, showMsg } = usePublicData()

  const [expandedHalakat, setExpandedHalakat] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<TabValue>('home')
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<PublicMediaImage | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  // Scroll to top on tab change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab])

  // Close sidebar on mobile when tab changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false)
  }, [activeTab])

  // ── Back navigation: handle hardware back for viewer ──
  useEffect(() => {
    return registerBackAction(() => {
      // Priority 1: close any lightbox
      // Priority 2: close sidebar on mobile  
      if (sidebarOpen) { setSidebarOpen(false); return true }
      // Priority 3: go to home from other tabs
      if (activeTab !== 'home') { setActiveTab('home'); return true }
      return false
    })
  }, [activeTab, sidebarOpen])

  const toggleHalaka = (id: string) => {
    setExpandedHalakat((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleNavClick = (tab: TabValue) => {
    setActiveTab(tab)
    setSelectedAlbum(null)
    setSelectedBranch(null)
    setSidebarOpen(false)
  }

  // Group halakat by branch (memoized to prevent flickering)
  const halakatByBranch = useMemo(() => {
    return data?.halakat.reduce<Record<string, PublicHalaka[]>>((acc, h) => {
      if (!acc[h.branch]) acc[h.branch] = []
      acc[h.branch].push(h)
      return acc
    }, {}) || {}
  }, [data?.halakat])

  // Group center info by section (memoized)
  const infoBySection = useMemo(() => {
    return data?.centerInfo?.reduce<Record<string, PublicCenterInfo[]>>((acc, item) => {
      if (!acc[item.section]) acc[item.section] = []
      acc[item.section].push(item)
      return acc
    }, {}) || {}
  }, [data?.centerInfo])

  // Memoize filtered media to prevent flickering when data reference changes
  const filteredMedia = useMemo(() => {
    if (selectedAlbum) {
      return data?.albums?.find(a => a.name === selectedAlbum)?.images || []
    }
    return data?.media || []
  }, [selectedAlbum, data?.albums, data?.media])

  // Show loading skeleton only if no data at all (no cache either)
  if (loading && !data) return <LoadingSkeleton />

  const tabs: { value: TabValue; label: string; icon: typeof BookOpen; count?: number }[] = [
    { value: 'home', label: 'الرئيسية', icon: GraduationCap },
    { value: 'halakat', label: 'الحلقات', icon: BookOpen, count: data?.totalHalakat },
    { value: 'media', label: 'الوسائط', icon: ImageIcon, count: data?.totalImages },
    { value: 'attendance', label: 'الحضور', icon: ClipboardCheck },
    { value: 'activities', label: 'الأنشطة', icon: Calendar, count: data?.totalActivities },
    { value: 'competitions', label: 'المسابقات', icon: Trophy, count: data?.competitions?.length },
    { value: 'graduates', label: 'الخريجين', icon: GraduationCap, count: data?.graduates?.length },
    { value: 'branches', label: 'الفروع', icon: MapPin, count: data?.branches?.length },
    { value: 'info', label: 'عن المركز', icon: Info },
  ]

  const activeTabInfo = tabs.find(t => t.value === activeTab)

  const statCards = [
    { label: 'الحلقات', value: data?.totalHalakat || 0, icon: BookOpen, color: '#1a5f4a', gradient: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)', tab: 'halakat' as TabValue },
    { label: 'الطلاب', value: data?.totalStudents || 0, icon: Users, color: '#059669', gradient: 'linear-gradient(135deg, #059669, #047857)', tab: 'halakat' as TabValue },
    { label: 'حاضرون اليوم', value: data?.attendanceStats?.present || 0, icon: Clock, color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2, #0e7490)', tab: 'attendance' as TabValue },
    { label: 'الوسائط', value: data?.totalImages || 0, icon: ImageIcon, color: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)', tab: 'media' as TabValue },
    { label: 'الأنشطة', value: data?.totalActivities || 0, icon: Star, color: '#d97706', gradient: 'linear-gradient(135deg, #d97706, #b45309)', tab: 'activities' as TabValue },
    { label: 'الفروع', value: data?.branches?.length || 0, icon: MapPin, color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', tab: 'branches' as TabValue },
  ]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f4f3' }}>
      {/* ── Mobile Overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════
          SIDEBAR (Right side for RTL)
      ═══════════════════════════════════════════════ */}
      <aside
        className={`
          fixed top-0 right-0 h-full z-50 w-72 min-w-[18rem]
          flex flex-col transition-transform duration-300 ease-in-out
          lg:sticky lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
        style={{ background: 'linear-gradient(180deg, #0d3d2e 0%, #1a5f4a 50%, #0d3d2e 100%)' }}
      >
        {/* ── Sidebar Close Button (mobile) ──────────── */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 left-3 lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Sidebar Header ─────────────────────────── */}
        <div className="px-5 pt-6 pb-4 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
            border: '2px solid rgba(212,175,55,0.4)',
          }}>
            <img src="/center-logo.png" alt="مركز الشفاء" className="w-9 h-9 object-contain" />
          </div>
          <h2 className="text-base font-bold text-white mb-0.5">مركز الشفاء</h2>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>العرض العام</p>
        </div>

        {/* ── Sidebar Navigation ─────────────────────── */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => handleNavClick(tab.value)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: isActive ? '#d4af37' : 'rgba(255,255,255,0.6)',
                  borderRight: isActive ? '3px solid #d4af37' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isActive ? '#d4af37' : undefined }} />
                <span className="flex-1 text-right">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: isActive ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#d4af37' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* ── Sidebar Footer ─────────────────────────── */}
        <div className="px-5 pb-4">
          {/* Gold separator */}
          <div className="mb-4" style={{ borderTop: '1px solid rgba(212,175,55,0.3)' }} />

          {/* User info badge */}
          <div className="flex items-center gap-2.5 mb-3 px-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <GraduationCap className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">زائر</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>العرض العام</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: 'rgba(220,38,38,0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(220,38,38,0.25)',
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* ── Top Header Bar ─────────────────────────────── */}
        <header className="sticky top-0 z-30 shadow-sm" style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between h-14 px-4 max-w-5xl">
            <div className="flex items-center gap-3">
              {/* Back button — goes to home from any tab */}
              {activeTab !== 'home' && (
                <button
                  onClick={() => setActiveTab('home')}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: '#f3f4f6' }}
                  title="الرجوع للرئيسية"
                >
                  <ArrowRight className="w-5 h-5" style={{ color: '#374151' }} />
                </button>
              )}

              {/* Hamburger menu (mobile only) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#f3f4f6' }}
              >
                <Menu className="w-5 h-5" style={{ color: '#374151' }} />
              </button>

              {/* Page title */}
              <div className="flex items-center gap-2.5">
                {activeTabInfo && (
                  <>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1a5f4a0f' }}>
                      <activeTabInfo.icon className="w-4.5 h-4.5" style={{ color: '#1a5f4a' }} />
                    </div>
                    <div>
                      <h1 className="text-sm font-bold" style={{ color: '#1a5f4a' }}>{activeTabInfo.label}</h1>
                      {activeTabInfo.count !== undefined && (
                        <p className="text-[10px]" style={{ color: '#9ca3af' }}>{activeTabInfo.count} عنصر</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Offline indicator */}
              {isOffline && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  غير متصل
                </span>
              )}
              {/* Last update time */}
              {lastUpdate && !isOffline && (
                <span className="hidden sm:flex items-center gap-1 text-[10px]" style={{ color: '#9ca3af' }}>
                  <Clock className="w-3 h-3" />
                  {lastUpdate}
                </span>
              )}
              {/* Refresh button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refresh()}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: '#6b7280' }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </Button>
            </div>
          </div>
        </header>

        {/* ── Scrollable Content ──────────────────────── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

            {/* ═══════════════════════════════════════════════
                HOME TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'home' && (
              <div className="space-y-5">
                {/* ── Logo Hero ─────────────────────────── */}
                <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 40%, #071f19 100%)' }}>
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                  {/* Gold accent line at top */}
                  <div className="absolute top-0 inset-x-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
                  <div className="relative py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-5 shadow-2xl" style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                      border: '2px solid rgba(212,175,55,0.4)',
                    }}>
                      <img src="/center-logo.png" alt="مركز الشفاء" className="w-22 h-22 sm:w-24 sm:h-24 object-contain" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-cairo)', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      مركز الشفاء لتحفيظ القرآن الكريم
                    </h2>
                    <p className="text-white/70 text-sm sm:text-base" style={{ fontFamily: 'var(--font-amiri)' }}>
                      ﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾
                    </p>
                  </div>
                  {/* Gold accent line at bottom */}
                  <div className="absolute bottom-0 inset-x-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
                </div>

                {/* ── Stats Grid ─────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <button
                        key={stat.label}
                        onClick={() => setActiveTab(stat.tab)}
                        className="group relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
                        style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                      >
                        {/* Color bar on top */}
                        <div className="absolute top-0 inset-x-0 h-1 transition-all duration-300 group-hover:h-1.5" style={{ background: stat.gradient }} />
                        <div className="w-12 h-12 rounded-xl mx-auto mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: stat.color + '12' }}>
                          <Icon className="w-5 h-5" style={{ color: stat.color }} />
                        </div>
                        <p className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="text-[11px] font-medium mt-0.5" style={{ color: '#6b7280' }}>{stat.label}</p>
                        {/* Arrow indicator */}
                        <ArrowLeft className="w-3 h-3 absolute bottom-2 left-2 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: stat.color }} />
                      </button>
                    )
                  })}
                </div>

                {/* ── Branches Quick View ────────────────── */}
                {data?.branches && data.branches.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                        <MapPin className="w-5 h-5" style={{ color: '#d4af37' }} />
                        الفروع
                      </h3>
                      <button
                        onClick={() => setActiveTab('branches')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                        style={{ color: '#1a5f4a', backgroundColor: '#1a5f4a0a' }}
                      >
                        عرض الكل
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {data.branches.map((branch) => {
                        const style = BRANCH_STYLES[branch.name] || BRANCH_STYLES['السرور']
                        return (
                          <button
                            key={branch.name}
                            onClick={() => { setActiveTab('branches'); setSelectedBranch(branch.name) }}
                            className="group text-right rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] overflow-hidden relative"
                            style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                          >
                            <div className="absolute top-0 left-0 w-16 h-16 rounded-full opacity-5 -translate-x-4 -translate-y-4 transition-transform duration-300 group-hover:scale-150" style={{ background: style.gradient }} />
                            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: style.accent + '12' }}>
                              <MapPin className="w-5 h-5" style={{ color: style.icon }} />
                            </div>
                            <h4 className="text-sm font-bold mb-2" style={{ color: style.accent }}>{branch.name}</h4>
                            <div className="flex justify-center gap-4">
                              <div>
                                <p className="text-lg font-extrabold" style={{ color: style.accent }}>{branch.halakatCount}</p>
                                <p className="text-[10px]" style={{ color: '#9ca3af' }}>حلقات</p>
                              </div>
                              <div style={{ width: '1px', backgroundColor: '#e5e7eb' }} />
                              <div>
                                <p className="text-lg font-extrabold" style={{ color: style.accent }}>{branch.studentsCount}</p>
                                <p className="text-[10px]" style={{ color: '#9ca3af' }}>طالب</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* ── Categories Quick View ───────────────── */}
                {data?.categories && data.categories.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                      <Users className="w-5 h-5" style={{ color: '#d4af37' }} />
                      توزيع الطلاب حسب الفئة
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {data.categories.map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => { setActiveTab('halakat') }}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                          style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                        >
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${CATEGORY_STYLES[cat.name] || 'bg-gray-100 text-gray-700'}`}>
                            {cat.name}
                          </span>
                          <span className="text-lg font-extrabold" style={{ color: '#1a5f4a' }}>{cat.count}</span>
                          <span className="text-xs" style={{ color: '#9ca3af' }}>طالب</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* ── Monthly Memorization Rate per Halqa ───────────────── */}
                {data?.monthlyRate && Object.keys(data.monthlyRate).length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                        <TrendingUp className="w-5 h-5" style={{ color: '#d4af37' }} />
                        مقدار الحفظ الشهري
                      </h3>
                      <button
                        onClick={() => setActiveTab('halakat')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                        style={{ color: '#1a5f4a', backgroundColor: '#1a5f4a0a' }}
                      >
                        عرض التفاصيل
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(data.monthlyRate)
                        .filter(([, val]) => val.currentRate > 0 || val.prevRate > 0)
                        .map(([halakaId, rateData]) => (
                          <div
                            key={halakaId}
                            className="rounded-2xl p-4 transition-all hover:scale-[1.01] hover:shadow-md"
                            style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#d4af3712' }}>
                                  <TrendingUp className="w-4 h-4" style={{ color: '#d4af37' }} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold" style={{ color: '#1a5f4a' }}>{rateData.halakaName}</p>
                                  <p className="text-[10px]" style={{ color: '#9ca3af' }}>هذا الشهر</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-extrabold" style={{ color: '#1a5f4a' }}>{rateData.currentRate}%</span>
                                {rateData.change !== 0 && (
                                  <div className="flex items-center gap-0.5 px-2 py-1 rounded-full" style={{
                                    backgroundColor: rateData.change > 0 ? '#ecfdf5' : '#fef2f2',
                                  }}>
                                    {rateData.change > 0 ? (
                                      <ChevronUp className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                                    )}
                                    <span className="text-xs font-bold" style={{ color: rateData.change > 0 ? '#059669' : '#dc2626' }}>
                                      {rateData.change > 0 ? '+' : ''}{rateData.change}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(rateData.currentRate, 100)}%`,
                                  background: rateData.currentRate >= 80
                                    ? 'linear-gradient(90deg, #059669, #34d399)'
                                    : rateData.currentRate >= 60
                                      ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                                      : 'linear-gradient(90deg, #dc2626, #f87171)',
                                }}
                              />
                            </div>
                            {rateData.prevRate > 0 && (
                              <p className="text-[10px] mt-1.5" style={{ color: '#9ca3af' }}>
                                الشهر الماضي: {rateData.prevRate}%
                                {rateData.change > 0 ? ' — تحسّن' : rateData.change < 0 ? ' — تراجع' : ' — ثابت'}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </section>
                )}

                {/* ── Recent Activities Preview ───────────── */}
                {data?.activities && data.activities.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                        <Calendar className="w-5 h-5" style={{ color: '#d4af37' }} />
                        آخر الأنشطة
                      </h3>
                      <button
                        onClick={() => setActiveTab('activities')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                        style={{ color: '#1a5f4a', backgroundColor: '#1a5f4a0a' }}
                      >
                        عرض الكل
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.activities.slice(0, 4).map((activity) => (
                        <Card key={activity.id} className="border-0 transition-all duration-300 hover:shadow-md hover:scale-[1.01]" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#d4af3712' }}>
                                <Star className="w-5 h-5" style={{ color: '#d4af37' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm mb-1" style={{ color: '#1a5f4a' }}>{activity.title}</h4>
                                {activity.description && (
                                  <p className="text-xs mb-1.5 line-clamp-1" style={{ color: '#9ca3af' }}>{activity.description}</p>
                                )}
                                <div className="flex items-center gap-2">
                                  <Badge className="text-[10px]" variant="outline" style={{ borderColor: ACTIVITY_TYPE_STYLES[activity.type]?.split(' ')[2] || '#e5e7eb', color: ACTIVITY_TYPE_STYLES[activity.type]?.split(' ')[1] || '#6b7280' }}>
                                    {activity.type}
                                  </Badge>
                                  <span className="text-[10px] flex items-center gap-1" style={{ color: '#9ca3af' }}>
                                    <Clock className="w-3 h-3" />
                                    {activity.date}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                HALAKAT TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'halakat' && (
              <div className="space-y-5">
                {/* Tab Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1a5f4a12' }}>
                    <BookOpen className="w-5 h-5" style={{ color: '#1a5f4a' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>الحلقات التحفيظية</h2>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{data?.halakat?.length || 0} حلقة — {data?.totalStudents || 0} طالب</p>
                  </div>
                </div>

                {Object.entries(halakatByBranch).length === 0 ? (
                  <EmptyState icon={BookOpen} message="لا توجد حلقات مسجلة بعد" />
                ) : (
                  Object.entries(halakatByBranch).map(([branchName, branchHalakat]) => {
                    const branchStyle = BRANCH_STYLES[branchName] || BRANCH_STYLES['السرور']
                    const isBranchSelected = selectedBranch === branchName
                    return (
                      <section key={branchName}>
                        <button
                          onClick={() => setSelectedBranch(isBranchSelected ? null : branchName)}
                          className="w-full flex items-center justify-between mb-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                          style={{ background: branchStyle.accent + '08', border: `1px solid ${branchStyle.accent}15` }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-8 rounded-full" style={{ background: branchStyle.gradient }} />
                            <h3 className="text-base font-bold" style={{ color: branchStyle.accent }}>
                              فرع {branchName}
                            </h3>
                            <Badge className="text-xs font-semibold" style={{ backgroundColor: branchStyle.accent + '12', color: branchStyle.accent, border: `1px solid ${branchStyle.accent}25` }}>
                              {branchHalakat.length} حلقات
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
                              {branchHalakat.reduce((sum, h) => sum + h.students.length, 0)} طالب
                            </span>
                            {isBranchSelected ? (
                              <ChevronUp className="w-4 h-4" style={{ color: branchStyle.accent }} />
                            ) : (
                              <ChevronDown className="w-4 h-4" style={{ color: branchStyle.accent }} />
                            )}
                          </div>
                        </button>

                        {isBranchSelected && (
                          <div className="space-y-3 mb-4">
                            {branchHalakat.map((halaka) => {
                              const isExpanded = expandedHalakat.has(halaka.id)
                              return (
                                <Card key={halaka.id} className="border-0 overflow-hidden transition-all duration-300 hover:shadow-md" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                  <button
                                    onClick={() => toggleHalaka(halaka.id)}
                                    className="w-full text-right p-4 hover:bg-gray-50/50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: branchStyle.accent + '12' }}>
                                          <GraduationCap className="w-5 h-5" style={{ color: branchStyle.icon }} />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-sm" style={{ color: '#1a5f4a' }}>{halaka.teacher}</h4>
                                          <p className="text-xs" style={{ color: '#9ca3af' }}>{halaka.students.length} طالب</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4" style={{ color: '#9ca3af' }} />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" style={{ color: '#9ca3af' }} />
                                        )}
                                      </div>
                                    </div>
                                  </button>

                                  {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3">
                                      {/* Student table */}
                                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #f3f4f6' }}>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr style={{ backgroundColor: '#f9fafb' }}>
                                                <th className="text-right p-2.5 font-semibold text-xs" style={{ color: '#374151' }}>الاسم</th>
                                                <th className="text-center p-2.5 font-semibold text-xs" style={{ color: '#374151' }}>العمر</th>
                                                <th className="text-center p-2.5 font-semibold text-xs" style={{ color: '#374151' }}>السورة</th>
                                                <th className="text-center p-2.5 font-semibold text-xs" style={{ color: '#374151' }}>الفئة</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {halaka.students.map((student, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }} className="hover:bg-gray-50/50">
                                                  <td className="p-2.5 font-medium whitespace-nowrap" style={{ color: '#1a5f4a' }}>{student.name}</td>
                                                  <td className="p-2.5 text-center text-xs" style={{ color: '#9ca3af' }}>{student.age}</td>
                                                  <td className="p-2.5 text-center text-xs" style={{ color: '#374151' }}>{student.surah}</td>
                                                  <td className="p-2.5 text-center">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[student.category] || 'bg-gray-100 text-gray-700'}`}>
                                                      {student.category}
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                      {/* Monthly rate statistics */}
                                      {data?.monthlyRate?.[halaka.id] && (
                                        <div className="mt-3 p-3 rounded-xl flex items-center justify-between gap-3" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                          <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" style={{ color: '#d4af37' }} />
                                            <span className="text-xs font-semibold" style={{ color: '#1a5f4a' }}>معدل الحفظ الشهري</span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="text-center">
                                              <p className="text-[9px]" style={{ color: '#9ca3af' }}>هذا الشهر</p>
                                              <p className="text-sm font-bold" style={{ color: '#1a5f4a' }}>{data.monthlyRate[halaka.id].currentRate}%</p>
                                            </div>
                                            <div className="w-px h-8" style={{ backgroundColor: '#e5e7eb' }} />
                                            <div className="flex items-center gap-1">
                                              {data.monthlyRate[halaka.id].change > 0 ? (
                                                <ChevronUp className="w-3 h-3" style={{ color: '#059669' }} />
                                              ) : data.monthlyRate[halaka.id].change < 0 ? (
                                                <ChevronDown className="w-3 h-3" style={{ color: '#dc2626' }} />
                                              ) : null}
                                              <span className="text-xs font-bold" style={{ color: data.monthlyRate[halaka.id].change > 0 ? '#059669' : data.monthlyRate[halaka.id].change < 0 ? '#dc2626' : '#9ca3af' }}>
                                                {data.monthlyRate[halaka.id].change > 0 ? '+' : ''}{data.monthlyRate[halaka.id].change}%
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Card>
                              )
                            })}
                          </div>
                        )}
                      </section>
                    )
                  })
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                MEDIA TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#dc262612' }}>
                    <ImageIcon className="w-5 h-5" style={{ color: '#dc2626' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>الوسائط</h2>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{filteredMedia.length} عنصر</p>
                  </div>
                </div>

                {/* Album filter buttons */}
                {data?.albums && data.albums.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedAlbum(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: !selectedAlbum ? '#1a5f4a' : 'white',
                        color: !selectedAlbum ? 'white' : '#374151',
                        boxShadow: !selectedAlbum ? '0 2px 8px rgba(26,95,74,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      الكل
                    </button>
                    {data.albums.map((album) => (
                      <button
                        key={album.name}
                        onClick={() => setSelectedAlbum(selectedAlbum === album.name ? null : album.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: selectedAlbum === album.name ? '#1a5f4a' : 'white',
                          color: selectedAlbum === album.name ? 'white' : '#374151',
                          boxShadow: selectedAlbum === album.name ? '0 2px 8px rgba(26,95,74,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        {album.name}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: selectedAlbum === album.name ? 'rgba(255,255,255,0.2)' : '#f3f4f6' }}>
                          {album.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {filteredMedia.length === 0 ? (
                  <EmptyState icon={ImageIcon} message="لا توجد وسائط مرفوعة بعد" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredMedia.map((img, idx) => {
                      const video = isVideoUrl(img.url)
                      const displayUrl = resolveMediaUrl(img.url)
                      const isUnresolved = !displayUrl || displayUrl.startsWith('tg:')
                      // Use a stable key based on id + resolved status to prevent flickering
                      const itemKey = `${img.id}-${displayUrl ? 'r' : 'u'}`
                      return (
                        <button
                          key={itemKey}
                          onClick={() => !isUnresolved && setSelectedImage(img)}
                          className="block rounded-2xl overflow-hidden transition-all duration-300 group hover:shadow-xl hover:scale-[1.02] text-right"
                          style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', opacity: isUnresolved ? 0.5 : 1 }}
                          disabled={isUnresolved}
                        >
                          <div className="aspect-square bg-gray-100 relative overflow-hidden">
                            {isUnresolved ? (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                                <ImageIcon className="w-6 h-6 text-gray-300" />
                                <span className="text-[10px] text-gray-400">جاري التحميل...</span>
                              </div>
                            ) : video ? (
                              <video
                                src={displayUrl}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={displayUrl}
                                alt={img.album}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                            {/* Video play overlay */}
                            {video && !isUnresolved && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                  <Play className="w-6 h-6" style={{ color: '#1a5f4a', marginRight: '-2px' }} />
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                          </div>
                          <div className="p-2.5 flex items-center gap-1.5">
                            {video && <Play className="w-3 h-3 flex-shrink-0" style={{ color: '#dc2626' }} />}
                            <Badge className="text-[10px] flex-1 justify-center font-semibold" variant="outline" style={{ borderColor: '#d4af3730', color: '#b8860b' }}>
                              {img.album}
                            </Badge>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                ATTENDANCE TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'attendance' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0891b212' }}>
                    <ClipboardCheck className="w-5 h-5" style={{ color: '#0891b2' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>الحضور</h2>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{data?.todayDate || new Date().toISOString().split('T')[0]}</p>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl p-4 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: '#05966912' }}>
                      <UserCheck className="w-6 h-6" style={{ color: '#059669' }} />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: '#059669' }}>{data?.attendanceStats?.present || 0}</p>
                    <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>حاضر</p>
                  </div>
                  <div className="rounded-2xl p-4 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: '#dc262612' }}>
                      <UserX className="w-6 h-6" style={{ color: '#dc2626' }} />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: '#dc2626' }}>{data?.attendanceStats?.absent || 0}</p>
                    <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>غائب</p>
                  </div>
                  <div className="rounded-2xl p-4 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: '#d9770612' }}>
                      <AlertCircle className="w-6 h-6" style={{ color: '#d97706' }} />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: '#d97706' }}>{data?.attendanceStats?.late || 0}</p>
                    <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>متأخر</p>
                  </div>
                </div>

                {/* Attendance per halaka */}
                {(!data?.attendanceByHalaka || data.attendanceByHalaka.length === 0) ? (
                  <EmptyState icon={ClipboardCheck} message="لا يوجد سجل حضور لليوم" />
                ) : (
                  <div className="space-y-3">
                    {data.attendanceByHalaka.map((group, idx) => {
                      const branchStyle = BRANCH_STYLES[group.branch] || BRANCH_STYLES['السرور']
                      return (
                        <Card key={idx} className="border-0 overflow-hidden transition-all hover:shadow-md" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: branchStyle.accent + '12' }}>
                                  <GraduationCap className="w-4 h-4" style={{ color: branchStyle.accent }} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm" style={{ color: branchStyle.accent }}>{group.halakaName}</h4>
                                  <p className="text-[11px]" style={{ color: '#9ca3af' }}>{group.teacher} — {group.branch}</p>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <Badge className="text-[10px] font-semibold px-2" style={{ backgroundColor: '#ecfdf5', color: '#059669', border: 'none' }}>
                                  {group.present} حاضر
                                </Badge>
                                <Badge className="text-[10px] font-semibold px-2" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: 'none' }}>
                                  {group.absent} غائب
                                </Badge>
                                <Badge className="text-[10px] font-semibold px-2" style={{ backgroundColor: '#fffbeb', color: '#d97706', border: 'none' }}>
                                  {group.late} متأخر
                                </Badge>
                              </div>
                            </div>
                            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #f3f4f6' }}>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr style={{ backgroundColor: '#f9fafb' }}>
                                      <th className="text-right p-2.5 font-semibold text-xs" style={{ color: '#374151' }}>اسم الطالب</th>
                                      <th className="text-center p-2.5 font-semibold text-xs" style={{ color: '#374151' }}>الحالة</th>
                                      <th className="text-center p-2.5 font-semibold text-xs" style={{ color: '#374151' }}>ملاحظات</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.records.map((record, i) => {
                                      const statusStyle = STATUS_STYLES[record.status] || STATUS_STYLES['حاضر']
                                      const StatusIcon = statusStyle.icon
                                      return (
                                        <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }} className="hover:bg-gray-50/50">
                                          <td className="p-2.5 font-medium whitespace-nowrap" style={{ color: '#1a5f4a' }}>{record.studentName}</td>
                                          <td className="p-2.5 text-center">
                                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                              <StatusIcon className="w-3 h-3" />
                                              {record.status}
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-center text-xs" style={{ color: '#9ca3af' }}>{record.notes || '—'}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                ACTIVITIES TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'activities' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#d9770612' }}>
                    <Calendar className="w-5 h-5" style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>الأنشطة</h2>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{data?.activities?.length || 0} نشاط</p>
                  </div>
                </div>

                {(!data?.activities || data.activities.length === 0) ? (
                  <EmptyState icon={Calendar} message="لا توجد أنشطة مسجلة بعد" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.activities.map((activity) => (
                      <Card key={activity.id} className="border-0 transition-all duration-300 hover:shadow-md hover:scale-[1.01]" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#d4af3712' }}>
                              <Star className="w-5 h-5" style={{ color: '#d4af37' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm mb-1" style={{ color: '#1a5f4a' }}>{activity.title}</h4>
                              {activity.description && (
                                <p className="text-xs mb-2 line-clamp-2" style={{ color: '#9ca3af' }}>{activity.description}</p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="text-[10px] font-semibold" variant="outline" style={{ borderColor: ACTIVITY_TYPE_STYLES[activity.type]?.split(' ')[2] || '#e5e7eb', color: ACTIVITY_TYPE_STYLES[activity.type]?.split(' ')[1] || '#6b7280' }}>
                                  {activity.type}
                                </Badge>
                                <span className="text-[11px] flex items-center gap-1" style={{ color: '#9ca3af' }}>
                                  <Clock className="w-3 h-3" />
                                  {activity.date}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                COMPETITIONS TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'competitions' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#d4af3712' }}>
                    <Trophy className="w-5 h-5" style={{ color: '#d4af37' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>المسابقات القرآنية</h2>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{data?.competitions?.length || 0} مسابقة</p>
                  </div>
                </div>

                {(!data?.competitions || data.competitions.length === 0) ? (
                  <EmptyState icon={Trophy} message="لا توجد مسابقات مسجلة بعد" />
                ) : (
                  <>
                    {/* Internal Competitions */}
                    {(() => {
                      const internal = data.competitions.filter((c: any) => c.type === 'داخلية')
                      if (internal.length === 0) return null
                      return (
                        <section>
                          <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                            <Trophy className="w-5 h-5" style={{ color: '#1a5f4a' }} />
                            المسابقات السنوية داخل المركز
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {internal.map((comp: any) => (
                              <Card key={comp.id} className="border-0 transition-all duration-300 hover:shadow-md hover:scale-[1.01]" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #a7f3d0' }}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
                                      <Trophy className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-sm mb-1" style={{ color: '#1a5f4a' }}>{comp.title}</h4>
                                      <span className="text-[10px] flex items-center gap-1" style={{ color: '#9ca3af' }}>
                                        <Clock className="w-3 h-3" />
                                        {comp.date}
                                      </span>
                                    </div>
                                  </div>
                                  {comp.participants?.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#6b7280' }}>
                                        <Users className="w-3 h-3" />
                                        المشاركون ({comp.participants.length})
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {comp.participants.map((p: string, i: number) => (
                                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
                                            {p}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {comp.winners?.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#b8860b' }}>
                                        <Crown className="w-3 h-3" />
                                        الفائزون
                                      </p>
                                      <div className="space-y-1">
                                        {comp.winners.map((w: any, i: number) => (
                                          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{
                                            background: i === 0 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : i === 1 ? 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' : i === 2 ? 'linear-gradient(135deg, #fed7aa, #fdba74)' : '#f9fafb',
                                          }}>
                                            <Award className="w-3 h-3 flex-shrink-0" style={{ color: i === 0 ? '#d4af37' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#6b7280' }} />
                                            <span className="text-xs font-semibold flex-1">{w.name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0 rounded-full" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>
                                              {w.rank}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </section>
                      )
                    })()}

                    {/* External Competitions */}
                    {(() => {
                      const external = data.competitions.filter((c: any) => c.type === 'خارجية')
                      if (external.length === 0) return null
                      return (
                        <section>
                          <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: '#92400e' }}>
                            <ExternalLink className="w-5 h-5" style={{ color: '#d97706' }} />
                            المسابقات الخارجية
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {external.map((comp: any) => (
                              <Card key={comp.id} className="border-0 transition-all duration-300 hover:shadow-md hover:scale-[1.01]" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #fde68a' }}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #92400e, #78350f)' }}>
                                      <Trophy className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-sm mb-1" style={{ color: '#92400e' }}>{comp.title}</h4>
                                      <span className="text-[10px] flex items-center gap-1" style={{ color: '#9ca3af' }}>
                                        <Clock className="w-3 h-3" />
                                        {comp.date}
                                      </span>
                                    </div>
                                  </div>
                                  {comp.participants?.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#6b7280' }}>
                                        <Users className="w-3 h-3" />
                                        المشاركون ({comp.participants.length})
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {comp.participants.map((p: string, i: number) => (
                                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                                            {p}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {comp.winners?.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#b8860b' }}>
                                        <Crown className="w-3 h-3" />
                                        الفائزون
                                      </p>
                                      <div className="space-y-1">
                                        {comp.winners.map((w: any, i: number) => (
                                          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{
                                            background: i === 0 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : i === 1 ? 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' : i === 2 ? 'linear-gradient(135deg, #fed7aa, #fdba74)' : '#f9fafb',
                                          }}>
                                            <Award className="w-3 h-3 flex-shrink-0" style={{ color: i === 0 ? '#d4af37' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#6b7280' }} />
                                            <span className="text-xs font-semibold flex-1">{w.name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0 rounded-full" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>
                                              {w.rank}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </section>
                      )
                    })()}
                  </>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                GRADUATES TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'graduates' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#d4af3712' }}>
                    <GraduationCap className="w-5 h-5" style={{ color: '#d4af37' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>الخريجون</h2>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>
                      {data?.graduates?.length || 0} دفعة — {data?.graduates?.reduce((s: number, g: any) => s + (g.graduateCount || 0), 0) || 0} خريج
                    </p>
                  </div>
                </div>

                {(!data?.graduates || data.graduates.length === 0) ? (
                  <div className="text-center py-16">
                    <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: '#1a5f4a' }} />
                    <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>لا توجد دفوعات خريجين مسجلة بعد</p>
                  </div>
                ) : (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl p-4 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-extrabold" style={{ color: '#1a5f4a' }}>{data.graduates.length}</p>
                        <p className="text-[11px]" style={{ color: '#6b7280' }}>دفعة تخرج</p>
                      </div>
                      <div className="rounded-2xl p-4 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)' }}>
                          <Users className="w-6 h-6" style={{ color: '#0d3d2e' }} />
                        </div>
                        <p className="text-2xl font-extrabold" style={{ color: '#0d3d2e' }}>{data.graduates.reduce((s: number, g: any) => s + (g.graduateCount || 0), 0)}</p>
                        <p className="text-[11px]" style={{ color: '#6b7280' }}>إجمالي الخريجين</p>
                      </div>
                    </div>

                    {/* Batch cards */}
                    {data.graduates.map((batch: any) => (
                      <Card key={batch.id} className="border-0 transition-all duration-300 hover:shadow-md" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <CardContent className="p-5">
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
                              <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-base mb-0.5" style={{ color: '#1a5f4a' }}>{batch.title}</h4>
                              <div className="flex items-center gap-3 text-xs" style={{ color: '#9ca3af' }}>
                                <span className="flex items-center gap-1">
                                  <Award className="w-3 h-3" style={{ color: '#d4af37' }} />
                                  الدفعة رقم {batch.batchNumber}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {batch.date}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>
                              {batch.graduateCount} خريج
                            </span>
                          </div>

                          {/* Graduates names */}
                          {batch.graduates?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#6b7280' }}>
                                <Users className="w-3 h-3" />
                                أسماء الخريجين
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {batch.graduates.map((name: string, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                    style={{
                                      background: i % 2 === 0 ? '#f9fafb' : 'white',
                                      border: '1px solid #f3f4f6',
                                    }}
                                  >
                                    <span
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                      style={{
                                        background: i === 0
                                          ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                                          : '#e5e7eb',
                                        color: i === 0 ? '#92400e' : '#374151',
                                      }}
                                    >
                                      {i + 1}
                                    </span>
                                    <span className="text-xs font-medium" style={{ color: '#1a1a1a' }}>{name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {batch.notes && (
                            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                              <p className="text-xs" style={{ color: '#374151' }}>{batch.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                BRANCHES TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'branches' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7c3aed12' }}>
                    <MapPin className="w-5 h-5" style={{ color: '#7c3aed' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>الفروع</h2>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{data?.branches?.length || 0} فرع</p>
                  </div>
                </div>

                {(!data?.branches || data.branches.length === 0) ? (
                  <EmptyState icon={MapPin} message="لا توجد فروع مسجلة بعد" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.branches.map((branch) => {
                      const style = BRANCH_STYLES[branch.name] || BRANCH_STYLES['السرور']
                      const branchHalakat = data?.halakat?.filter(h => h.branch === branch.name) || []
                      const isExpanded = selectedBranch === branch.name
                      return (
                        <div key={branch.name}>
                          <button
                            onClick={() => setSelectedBranch(isExpanded ? null : branch.name)}
                            className="w-full rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] relative overflow-hidden group"
                            style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                          >
                            {/* Decorative gradient */}
                            <div className="absolute top-0 left-0 w-24 h-24 rounded-full opacity-5 -translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" style={{ background: style.gradient }} />
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: style.accent + '12' }}>
                                <MapPin className="w-7 h-7" style={{ color: style.icon }} />
                              </div>
                              <h4 className="text-lg font-extrabold mb-3" style={{ color: style.accent }}>{branch.name}</h4>
                              <div className="flex justify-center gap-8 mb-2">
                                <div>
                                  <p className="text-2xl font-extrabold" style={{ color: style.accent }}>{branch.halakatCount}</p>
                                  <p className="text-xs" style={{ color: '#9ca3af' }}>حلقات</p>
                                </div>
                                <div style={{ width: '1px', backgroundColor: '#e5e7eb' }} />
                                <div>
                                  <p className="text-2xl font-extrabold" style={{ color: style.accent }}>{branch.studentsCount}</p>
                                  <p className="text-xs" style={{ color: '#9ca3af' }}>طالب</p>
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 mx-auto mt-2" style={{ color: style.accent }} />
                              ) : (
                                <ChevronDown className="w-5 h-5 mx-auto mt-2" style={{ color: '#9ca3af' }} />
                              )}
                            </div>
                          </button>

                          {isExpanded && branchHalakat.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {branchHalakat.map((halaka) => {
                                const isHExpanded = expandedHalakat.has(halaka.id)
                                return (
                                  <Card key={halaka.id} className="border-0 overflow-hidden" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                    <button
                                      onClick={() => toggleHalaka(halaka.id)}
                                      className="w-full text-right p-3.5 hover:bg-gray-50/50 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: style.accent + '12' }}>
                                            <GraduationCap className="w-4 h-4" style={{ color: style.icon }} />
                                          </div>
                                          <div>
                                            <h4 className="font-bold text-sm" style={{ color: '#1a5f4a' }}>{halaka.teacher}</h4>
                                            <p className="text-[11px]" style={{ color: '#9ca3af' }}>{halaka.students.length} طالب</p>
                                          </div>
                                        </div>
                                        {isHExpanded ? <ChevronUp className="w-4 h-4" style={{ color: '#9ca3af' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9ca3af' }} />}
                                      </div>
                                    </button>
                                    {isHExpanded && halaka.students.length > 0 && (
                                      <div className="px-3.5 pb-3.5">
                                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #f3f4f6' }}>
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr style={{ backgroundColor: '#f9fafb' }}>
                                                <th className="text-right p-2 font-semibold" style={{ color: '#374151' }}>الاسم</th>
                                                <th className="text-center p-2 font-semibold" style={{ color: '#374151' }}>السورة</th>
                                                <th className="text-center p-2 font-semibold" style={{ color: '#374151' }}>الفئة</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {halaka.students.map((s, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                                                  <td className="p-2 font-medium" style={{ color: '#1a5f4a' }}>{s.name}</td>
                                                  <td className="p-2 text-center" style={{ color: '#374151' }}>{s.surah}</td>
                                                  <td className="p-2 text-center">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_STYLES[s.category] || ''}`}>{s.category}</span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </Card>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                INFO TAB
            ═══════════════════════════════════════════════ */}
            {activeTab === 'info' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1a5f4a12' }}>
                    <Info className="w-5 h-5" style={{ color: '#1a5f4a' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>عن المركز</h2>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>معلومات وتفاصيل المركز</p>
                  </div>
                </div>

                {Object.keys(infoBySection).length === 0 ? (
                  <EmptyState icon={Info} message="لا توجد معلومات عن المركز بعد" />
                ) : (
                  Object.entries(infoBySection).map(([section, items]) => (
                    <Card key={section} className="border-0" style={{ borderRadius: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                          <Info className="w-5 h-5" style={{ color: '#d4af37' }} />
                          {SECTION_TITLES[section] || section}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2.5">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-gray-50/50" style={{ backgroundColor: '#f9fafb' }}>
                              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#d4af37' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: '#1a5f4a' }}>{item.key}</p>
                                {item.type === 'image' ? (
                                  <div className="mt-2">
                                    <img src={item.value} alt={item.key} className="max-w-full max-h-48 rounded-xl object-cover" />
                                  </div>
                                ) : item.type === 'link' ? (
                                  <a
                                    href={item.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm mt-1 flex items-center gap-1 hover:underline"
                                    style={{ color: '#0891b2' }}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {item.value}
                                  </a>
                                ) : (
                                  <p className="text-sm mt-1" style={{ color: '#4b5563' }}>{item.value}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

          </div>
        </main>

        {/* ── Media Viewer Modal (Direct Telegram + Native) ── */}
        {selectedImage && (
          <MediaViewerModal
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            showMsg={showMsg}
          />
        )}

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="text-center py-4 text-sm" style={{ backgroundColor: 'white', color: '#9ca3af', borderTop: '1px solid #e5e7eb' }}>
          © 2025 مركز الشفاء لتحفيظ القرآن الكريم
        </footer>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: typeof BookOpen; message: string }) {
  return (
    <div className="text-center py-14" style={{ color: '#9ca3af' }}>
      <Icon className="w-14 h-14 mx-auto mb-3 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f4f3' }}>
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-72 min-w-[18rem] flex-shrink-0" style={{ background: 'linear-gradient(180deg, #0d3d2e 0%, #1a5f4a 50%, #0d3d2e 100%)' }} />
      {/* Content skeleton */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="h-14" style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }} />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 space-y-5">
          <Skeleton className="w-full h-72 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
