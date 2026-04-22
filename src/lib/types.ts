// ── Shared Types ──────────────────────────────────────────────
export interface Halaka {
  id: string
  name: string
  teacher: string
  time: string
  location: string
  branch: string
  description?: string
  createdAt: string
  _count?: { students: number }
}

export interface Student {
  id: string
  name: string
  age?: number
  surah: string
  category: string
  parentName: string
  parentPhone: string
  level: string
  halakaId?: string
  halaka?: Halaka | null
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  date: string
  status: string
  notes?: string
  studentId: string
  student?: Student
  halakaId?: string
  halaka?: Halaka | null
}

export interface MediaImage {
  id: string
  album: string
  filename: string
  url: string
  createdAt: string
}

export interface Activity {
  id: string
  title: string
  description?: string
  date: string
  type: string
  createdAt: string
}

export interface CenterInfoItem {
  id: string
  key: string
  value: string
  type: string
  section: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalHalakat: number
  totalStudents: number
  todayAttendance: number
  totalPresent: number
  totalImages: number
  totalActivities: number
  recentStudents: { name: string; createdAt: string }[]
  recentHalakat: { name: string; createdAt: string }[]
  recentActivities: { title: string; createdAt: string }[]
}

// ── Constants ──────────────────────────────────────────────────
export const BRANCHES = ['السرور', 'المركز العام', 'الوادي', 'وبرة', 'ضية', 'المنعم']
export const LEVELS = ['مبتدئ', 'متوسط', 'متقدم']
export const CATEGORIES = ['1-10', '10-20', '20-30', '30-20', 'محو الامية']
export const ACTIVITY_TYPES = ['عامة', 'قرآنية', 'ثقافية', 'رياضية', 'اجتماعية']

export const BRANCH_COLORS: Record<string, string> = {
  'السرور': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'المركز العام': 'bg-amber-100 text-amber-700 border-amber-300',
  'الوادي': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  'وبرة': 'bg-teal-100 text-teal-700 border-teal-300',
  'ضية': 'bg-rose-100 text-rose-700 border-rose-300',
  'المنعم': 'bg-violet-100 text-violet-700 border-violet-300',
}

export const CATEGORY_COLORS: Record<string, string> = {
  '1-10': 'bg-green-100 text-green-700',
  '10-20': 'bg-blue-100 text-blue-700',
  '20-30': 'bg-amber-100 text-amber-700',
  '30-20': 'bg-orange-100 text-orange-700',
  'محو الامية': 'bg-purple-100 text-purple-700',
}

export const STATUS_COLORS: Record<string, string> = {
  حاضر: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  غائب: 'bg-red-100 text-red-800 border-red-300',
  متأخر: 'bg-amber-100 text-amber-800 border-amber-300',
}

export const ALBUMS = [
  'حلقات تحفيظية',
  'سرد قرآني',
  'دورات سنوية',
  'مسابقات سنوية',
  'تكريم',
  'احتفالات خريجين',
  'متميزين',
  'خريجون',
  'أخرى',
]

export const INFO_TYPES = [
  { value: 'text', label: 'نص' },
  { value: 'image', label: 'صورة' },
  { value: 'link', label: 'رابط' },
]

export const INFO_SECTIONS = ['عام', 'عن المركز', 'أوقات الدوام', 'تواصل']
