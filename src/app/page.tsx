'use client'

// ── Imports (ALL at top, no circular refs) ──────────────────
import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '@/lib/api'
import { toast } from 'sonner'
import PublicDisplayView from '@/components/PublicDisplayView'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpen, Users, ClipboardCheck, Camera, Calendar,
  LayoutDashboard, LogOut, RefreshCw, TrendingUp, Info,
  Lock, User, Menu, X, ChevronLeft, GraduationCap, Building2,
  Send, ArrowRight, Trophy, Award,
} from 'lucide-react'
import { DashboardTab } from '@/components/admin/DashboardTab'
import { HalakatTab } from '@/components/admin/HalakatTab'
import { StudentsTab } from '@/components/admin/StudentsTab'
import { AttendanceTab } from '@/components/admin/AttendanceTab'
import { MediaTab } from '@/components/admin/MediaTab'
import { ActivitiesTab } from '@/components/admin/ActivitiesTab'
import { CenterInfoTab } from '@/components/admin/CenterInfoTab'
import { MonthlyRateTab } from '@/components/admin/MonthlyRateTab'
import { TelegramTab } from '@/components/admin/TelegramTab'
import { CompetitionsTab, emptyForm as emptyCompetitionForm } from '@/components/admin/CompetitionsTab'
import type { Competition, CompetitionForm } from '@/components/admin/CompetitionsTab'
import { GraduatesTab, emptyForm as emptyGraduateForm } from '@/components/admin/GraduatesTab'
import type { GraduateBatch, GraduateForm } from '@/components/admin/GraduatesTab'
import { registerBackAction, initBackButton } from '@/lib/capacitor-bridge'

// ── View type ───────────────────────────────────────────────
type ViewType = 'splash' | 'login' | 'admin' | 'viewer'

// ── Empty form defaults ─────────────────────────────────────
const EMPTY_HALAKA_FORM = { name: '', teacher: '', time: '', location: '', branch: 'السرور', description: '' }
const EMPTY_STUDENT_FORM = { name: '', age: '', surah: '', category: '1-10', parentName: '', parentPhone: '', level: 'مبتدئ', halakaId: '' }
const EMPTY_ACTIVITY_FORM = { title: '', description: '', date: '', type: 'عامة' }
const EMPTY_CENTER_INFO_FORM = { key: '', value: '', type: 'text', section: 'عام' }
const EMPTY_COMPETITION_FORM: CompetitionForm = emptyCompetitionForm
const EMPTY_GRADUATE_FORM: GraduateForm = emptyGraduateForm

// ── Main Component ──────────────────────────────────────────
export default function HomePage() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  )
}

// ── Home Component ──────────────────────────────────────────
function Home() {
  // ── Core state (ALL useState before useEffect) ────────────
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<ViewType>('splash')
  const [loginLoading, setLoginLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')

  // ── Data states ───────────────────────────────────────────
  const [dataLoading, setDataLoading] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [halakat, setHalakat] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [mediaImages, setMediaImages] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [centerInfoItems, setCenterInfoItems] = useState<any[]>([])
  const [monthlyRate, setMonthlyRate] = useState<any>(null)

  // ── Halaka form states ────────────────────────────────────
  const [halakaForm, setHalakaForm] = useState(EMPTY_HALAKA_FORM)
  const [editingHalaka, setEditingHalaka] = useState<any>(null)
  const [halakaDialogOpen, setHalakaDialogOpen] = useState(false)

  // ── Student form states ───────────────────────────────────
  const [studentForm, setStudentForm] = useState(EMPTY_STUDENT_FORM)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)

  // ── Attendance states ─────────────────────────────────────
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceHalakaId, setAttendanceHalakaId] = useState('')
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

  // ── Media states ──────────────────────────────────────────
  const [mediaAlbum, setMediaAlbum] = useState('')
  const [mediaFilter, setMediaFilter] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // ── Activity form states ──────────────────────────────────
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY_FORM)
  const [editingActivity, setEditingActivity] = useState<any>(null)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)

  // ── Center Info form states ───────────────────────────────
  const [centerInfoForm, setCenterInfoForm] = useState(EMPTY_CENTER_INFO_FORM)
  const [centerInfoFile, setCenterInfoFile] = useState<File | null>(null)
  const [centerInfoPreview, setCenterInfoPreview] = useState<string | null>(null)
  const [editingCenterInfo, setEditingCenterInfo] = useState<any>(null)
  const [centerInfoDialogOpen, setCenterInfoDialogOpen] = useState(false)

  // ── Monthly rate states ───────────────────────────────────
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().slice(0, 7))

  // ── Competition states ─────────────────────────────────────
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitionForm, setCompetitionForm] = useState<CompetitionForm>(EMPTY_COMPETITION_FORM)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [competitionDialogOpen, setCompetitionDialogOpen] = useState(false)

  // ── Graduates states ─────────────────────────────────────
  const [graduates, setGraduates] = useState<GraduateBatch[]>([])
  const [graduateForm, setGraduateForm] = useState<GraduateForm>(EMPTY_GRADUATE_FORM)
  const [editingGraduate, setEditingGraduate] = useState<GraduateBatch | null>(null)
  const [graduateDialogOpen, setGraduateDialogOpen] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Helper: formatDate ────────────────────────────────────
  const formatDate = useCallback((dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return dateStr }
  }, [])

  // ── Helper: apiCall ───────────────────────────────────────
  const apiCall = useCallback(async (url: string, options?: RequestInit) => {
    return await fetch(apiUrl(url), options)
  }, [])

  // ── Auth: check stored auth on mount ──────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('alshifa_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.role === 'viewer') {
          setView('viewer')
        } else {
          setView('admin')
        }
      } catch {
        localStorage.removeItem('alshifa_auth')
      }
    }
    setIsLoading(false)
  }, [])

  // ── Auth: login error state ──────────────────────────────
  const [loginError, setLoginError] = useState('')

  // ── Auth: handleLogin ─────────────────────────────────────
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    if (!username.trim() || !password.trim()) {
      setLoginError('اسم المستخدم وكلمة المرور مطلوبان')
      return
    }
    setLoginLoading(true)
    try {
      const loginUrl = apiUrl('/api/auth/login')
      console.log('[Login] Attempting login to:', loginUrl)
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      })
      const data = await res.json()
      console.log('[Login] Response:', res.status, data)
      if (!res.ok) {
        setLoginError(data.error || 'خطأ في تسجيل الدخول')
        toast.error(data.error || 'خطأ في تسجيل الدخول', { duration: 5000 })
        return
      }
      // Store auth data
      localStorage.setItem('alshifa_auth', JSON.stringify(data))
      toast.success(`مرحباً ${data.name}`, { duration: 3000 })
      // Small delay to ensure localStorage is written before state change
      setTimeout(() => {
        if (data.role === 'viewer') {
          setView('viewer')
        } else {
          setView('admin')
        }
      }, 100)
    } catch (err) {
      console.error('[Login] Error:', err)
      setLoginError('حدث خطأ في الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.')
      toast.error('خطأ في الاتصال', { duration: 5000 })
    } finally {
      setLoginLoading(false)
    }
  }, [username, password])

  // ── Auth: handleLogout ────────────────────────────────────
  const handleLogout = useCallback(() => {
    localStorage.removeItem('alshifa_auth')
    setView('splash')
    setActiveTab('dashboard')
    setUsername('')
    setPassword('')
    toast.success('تم تسجيل الخروج')
  }, [])

  // ── Data: loadAllData ─────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setDataLoading(true)
    try {
      const endpoints = ['/api/dashboard', '/api/halakat', '/api/students', '/api/media', '/api/activities', '/api/center-info', '/api/competitions', '/api/graduates']
      const results = await Promise.all(
        endpoints.map((ep) =>
          fetch(apiUrl(ep)).then((r) => {
            if (!r.ok) return null
            return r.json().catch(() => null)
          }).catch(() => null)
        )
      )
      setDashboardStats(results[0] && typeof results[0] === 'object' && !Array.isArray(results[0]) ? results[0] : null)
      setHalakat(Array.isArray(results[1]) ? results[1] : [])
      setStudents(Array.isArray(results[2]) ? results[2] : [])
      const media = results[3]
      setMediaImages(Array.isArray(media) ? media : (media?.images || []))
      setActivities(Array.isArray(results[4]) ? results[4] : [])
      setCenterInfoItems(Array.isArray(results[5]) ? results[5] : [])
      setCompetitions(Array.isArray(results[6]) ? results[6] : [])
      setGraduates(Array.isArray(results[7]) ? results[7] : [])
    } catch { /* ignore */ }
    setDataLoading(false)
  }, [])

  // ── Data: load attendance ─────────────────────────────────
  const loadAttendance = useCallback(async () => {
    if (!attendanceHalakaId) return
    try {
      const params = new URLSearchParams({ date: attendanceDate, halakaId: attendanceHalakaId })
      const r = await fetch(apiUrl(`/api/attendance?${params}`))
      if (r.ok) setAttendance(await r.json())
    } catch { /* ignore */ }
  }, [attendanceDate, attendanceHalakaId])

  // ── Data: load monthly rate ───────────────────────────────
  const loadMonthlyRate = useCallback(async () => {
    try {
      const r = await fetch(apiUrl(`/api/monthly-rate?month=${monthlyMonth}`))
      if (r.ok) setMonthlyRate(await r.json())
    } catch { /* ignore */ }
  }, [monthlyMonth])

  // ── useEffect: load data on admin ─────────────────────────
  useEffect(() => {
    if (view === 'admin') loadAllData()
  }, [view, loadAllData])

  // ── useEffect: load attendance on tab ─────────────────────
  useEffect(() => {
    if (view === 'admin' && activeTab === 'attendance') loadAttendance()
  }, [view, activeTab, loadAttendance])

  // ── useEffect: build attendance records ───────────────────
  useEffect(() => {
    if (activeTab !== 'attendance' || !attendanceHalakaId) { setAttendanceRecords([]); return }
    const halakaStudents = students.filter((s: any) => s.halakaId === attendanceHalakaId)
    const existingMap = new Map(attendance.map((a: any) => [a.studentId, a]))
    setAttendanceRecords(halakaStudents.map((s: any) => ({
      studentId: s.id, status: existingMap.get(s.id)?.status || 'حاضر', notes: existingMap.get(s.id)?.notes || '',
    })))
  }, [attendanceHalakaId, students, attendance, activeTab])

  // ── useEffect: load monthly rate on tab ───────────────────
  useEffect(() => {
    if (view === 'admin' && activeTab === 'monthlyrate') loadMonthlyRate()
  }, [view, activeTab, loadMonthlyRate])

  // ── Back navigation: initialize and register actions ──
  useEffect(() => {
    initBackButton()
  }, [])

  // ── Back navigation: handle hardware back for admin ──
  useEffect(() => {
    if (view !== 'admin') return
    return registerBackAction(() => {
      // Priority 1: close any open dialog
      if (halakaDialogOpen) { setHalakaDialogOpen(false); return true }
      if (studentDialogOpen) { setStudentDialogOpen(false); return true }
      if (activityDialogOpen) { setActivityDialogOpen(false); return true }
      if (centerInfoDialogOpen) { setCenterInfoDialogOpen(false); return true }
      if (competitionDialogOpen) { setCompetitionDialogOpen(false); return true }
      if (graduateDialogOpen) { setGraduateDialogOpen(false); return true }
      // Priority 2: close sidebar on mobile
      if (sidebarOpen) { setSidebarOpen(false); return true }
      // Priority 3: go to dashboard from other tabs
      if (activeTab !== 'dashboard') { setActiveTab('dashboard'); return true }
      // Priority 4: exit app
      return false
    })
  }, [view, activeTab, sidebarOpen, halakaDialogOpen, studentDialogOpen, activityDialogOpen, centerInfoDialogOpen, competitionDialogOpen, graduateDialogOpen])

  // ── Back navigation: handle hardware back for viewer ──
  useEffect(() => {
    if (view !== 'viewer') return
    return registerBackAction(() => {
      return false // Let viewer component handle its own back
    })
  }, [view])

  // ── CRUD: Halaka ──────────────────────────────────────────
  const createHalaka = useCallback(async () => {
    if (!halakaForm.name || !halakaForm.teacher) { toast.error('اسم الحلقة والمعلم مطلوبان'); return }
    const res = await apiCall('/api/halakat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(halakaForm) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم إنشاء الحلقة')
    setHalakaForm(EMPTY_HALAKA_FORM)
    loadAllData()
  }, [halakaForm, apiCall, loadAllData])

  const updateHalaka = useCallback(async () => {
    if (!editingHalaka) return
    const res = await apiCall('/api/halakat', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingHalaka.id, ...halakaForm }) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم التحديث')
    setEditingHalaka(null)
    setHalakaDialogOpen(false)
    setHalakaForm(EMPTY_HALAKA_FORM)
    loadAllData()
  }, [editingHalaka, halakaForm, apiCall, loadAllData])

  const deleteHalaka = useCallback(async (id: string) => {
    if (!confirm('حذف الحلقة؟')) return
    const res = await apiCall(`/api/halakat?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم الحذف')
    loadAllData()
  }, [apiCall, loadAllData])

  const openEditHalaka = useCallback((h: any) => {
    setEditingHalaka(h)
    setHalakaForm({ name: h.name, teacher: h.teacher, time: h.time, location: h.location, branch: h.branch || 'السرور', description: h.description || '' })
    setHalakaDialogOpen(true)
  }, [])

  // ── CRUD: Student ─────────────────────────────────────────
  const createStudent = useCallback(async () => {
    if (!studentForm.name) { toast.error('اسم الطالب مطلوب'); return }
    const res = await apiCall('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentForm) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم إضافة الطالب')
    setStudentForm(EMPTY_STUDENT_FORM)
    loadAllData()
  }, [studentForm, apiCall, loadAllData])

  const updateStudent = useCallback(async () => {
    if (!editingStudent) return
    const res = await apiCall('/api/students', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingStudent.id, ...studentForm }) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم التحديث')
    setEditingStudent(null)
    setStudentDialogOpen(false)
    setStudentForm(EMPTY_STUDENT_FORM)
    loadAllData()
  }, [editingStudent, studentForm, apiCall, loadAllData])

  const deleteStudent = useCallback(async (id: string) => {
    if (!confirm('حذف الطالب؟')) return
    const res = await apiCall(`/api/students?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم الحذف')
    loadAllData()
  }, [apiCall, loadAllData])

  const openEditStudent = useCallback((s: any) => {
    setEditingStudent(s)
    setStudentForm({ name: s.name, age: s.age?.toString() || '', surah: s.surah || '', category: s.category || '1-10', parentName: s.parentName, parentPhone: s.parentPhone, level: s.level, halakaId: s.halakaId || '' })
    setStudentDialogOpen(true)
  }, [])

  // ── CRUD: Attendance ──────────────────────────────────────
  const updateAttendanceRecord = useCallback((studentId: string, field: string, value: string) => {
    setAttendanceRecords((prev: any[]) => prev.map((r: any) => (r.studentId === studentId ? { ...r, [field]: value } : r)))
  }, [])

  const saveAttendance = useCallback(async () => {
    if (attendanceRecords.length === 0) { toast.error('لا يوجد طلاب'); return }
    const res = await apiCall('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: attendanceDate, halakaId: attendanceHalakaId, records: attendanceRecords }) })
    if (!res.ok) { toast.error('خطأ'); return }
    const data = await res.json()
    toast.success(`تم حفظ الحضور (${data.count} سجل)`)
    loadAttendance()
  }, [attendanceRecords, attendanceDate, attendanceHalakaId, apiCall, loadAttendance])

  // ── CRUD: Media ───────────────────────────────────────────
  const uploadMedia = useCallback(async () => {
    if (!mediaAlbum || !mediaFile) { toast.error('الألبوم والملف مطلوبان'); return }
    setUploading(true)
    const formData = new FormData()
    formData.append('album', mediaAlbum)
    formData.append('file', mediaFile)
    const res = await fetch(apiUrl('/api/media'), { method: 'POST', body: formData })
    if (!res.ok) { toast.error('خطأ'); setUploading(false); return }
    toast.success('تم رفع الصورة')
    setMediaAlbum('')
    setMediaFile(null)
    const fi = document.getElementById('media-file') as HTMLInputElement
    if (fi) fi.value = ''
    loadAllData()
    setUploading(false)
  }, [mediaAlbum, mediaFile, loadAllData])

  const deleteMedia = useCallback(async (id: string) => {
    if (!confirm('حذف الصورة؟')) return
    const res = await apiCall(`/api/media?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم الحذف')
    loadAllData()
  }, [apiCall, loadAllData])

  // ── CRUD: Activity ────────────────────────────────────────
  const createActivity = useCallback(async () => {
    if (!activityForm.title || !activityForm.date) { toast.error('العنوان والتاريخ مطلوبان'); return }
    const res = await apiCall('/api/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(activityForm) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم إنشاء النشاط')
    setActivityForm(EMPTY_ACTIVITY_FORM)
    loadAllData()
  }, [activityForm, apiCall, loadAllData])

  const updateActivity = useCallback(async () => {
    if (!editingActivity) return
    const res = await apiCall('/api/activities', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingActivity.id, ...activityForm }) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم التحديث')
    setEditingActivity(null)
    setActivityDialogOpen(false)
    setActivityForm(EMPTY_ACTIVITY_FORM)
    loadAllData()
  }, [editingActivity, activityForm, apiCall, loadAllData])

  const deleteActivity = useCallback(async (id: string) => {
    if (!confirm('حذف النشاط؟')) return
    const res = await apiCall(`/api/activities?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم الحذف')
    loadAllData()
  }, [apiCall, loadAllData])

  const openEditActivity = useCallback((a: any) => {
    setEditingActivity(a)
    setActivityForm({ title: a.title, description: a.description || '', date: a.date, type: a.type })
    setActivityDialogOpen(true)
  }, [])

  // ── CRUD: CenterInfo ──────────────────────────────────────
  const createCenterInfo = useCallback(async () => {
    if (!centerInfoForm.key) { toast.error('المفتاح مطلوب'); return }
    let res: Response
    if (centerInfoForm.type === 'image') {
      if (!centerInfoFile) { toast.error('اختر صورة'); return }
      const fd = new FormData()
      fd.append('key', centerInfoForm.key)
      fd.append('section', centerInfoForm.section)
      fd.append('file', centerInfoFile)
      res = await fetch(apiUrl('/api/center-info'), { method: 'POST', body: fd })
    } else {
      if (!centerInfoForm.value) { toast.error('القيمة مطلوبة'); return }
      res = await apiCall('/api/center-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(centerInfoForm) })
    }
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم الإضافة')
    setCenterInfoForm(EMPTY_CENTER_INFO_FORM)
    setCenterInfoFile(null)
    setCenterInfoPreview(null)
    loadAllData()
  }, [centerInfoForm, centerInfoFile, apiCall, loadAllData])

  const updateCenterInfo = useCallback(async () => {
    if (!editingCenterInfo) return
    let res: Response
    if (centerInfoFile) {
      const fd = new FormData()
      fd.append('id', editingCenterInfo.id)
      fd.append('key', centerInfoForm.key)
      fd.append('section', centerInfoForm.section)
      fd.append('file', centerInfoFile)
      res = await fetch(apiUrl('/api/center-info'), { method: 'PUT', body: fd })
    } else {
      res = await apiCall('/api/center-info', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingCenterInfo.id, ...centerInfoForm }) })
    }
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم التحديث')
    setEditingCenterInfo(null)
    setCenterInfoDialogOpen(false)
    setCenterInfoForm(EMPTY_CENTER_INFO_FORM)
    setCenterInfoFile(null)
    setCenterInfoPreview(null)
    loadAllData()
  }, [editingCenterInfo, centerInfoForm, centerInfoFile, apiCall, loadAllData])

  const deleteCenterInfo = useCallback(async (id: string) => {
    if (!confirm('حذف؟')) return
    const res = await apiCall(`/api/center-info?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم الحذف')
    loadAllData()
  }, [apiCall, loadAllData])

  const openEditCenterInfo = useCallback((item: any) => {
    setEditingCenterInfo(item)
    setCenterInfoForm({ key: item.key, value: item.value, type: item.type, section: item.section })
    setCenterInfoFile(null)
    setCenterInfoPreview(item.type === 'image' ? item.value : null)
    setCenterInfoDialogOpen(true)
  }, [])

  // ── CRUD: Competitions ────────────────────────────────────
  const createCompetition = useCallback(async () => {
    if (!competitionForm.title || !competitionForm.date) { toast.error('عنوان المسابقة والتاريخ مطلوبان'); return }
    const participants = competitionForm.participantsText.split(/[,،]/).map(s => s.trim()).filter(Boolean)
    const winners = competitionForm.winnersText.split('\n').map(line => {
      const parts = line.split(/[,،]/).map(s => s.trim())
      return parts.length >= 2 ? { name: parts[0], rank: parts[1] } : null
    }).filter(Boolean) as { name: string; rank: string }[]
    const res = await apiCall('/api/competitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: competitionForm.title, type: competitionForm.type, date: competitionForm.date, participants, winners }) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم إنشاء المسابقة')
    setCompetitionForm(EMPTY_COMPETITION_FORM)
    loadAllData()
  }, [competitionForm, apiCall, loadAllData])

  const updateCompetition = useCallback(async () => {
    if (!editingCompetition) return
    const participants = competitionForm.participantsText.split(/[,،]/).map(s => s.trim()).filter(Boolean)
    const winners = competitionForm.winnersText.split('\n').map(line => {
      const parts = line.split(/[,،]/).map(s => s.trim())
      return parts.length >= 2 ? { name: parts[0], rank: parts[1] } : null
    }).filter(Boolean) as { name: string; rank: string }[]
    const res = await apiCall('/api/competitions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingCompetition.id, title: competitionForm.title, type: competitionForm.type, date: competitionForm.date, participants, winners }) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم التحديث')
    setEditingCompetition(null)
    setCompetitionDialogOpen(false)
    setCompetitionForm(EMPTY_COMPETITION_FORM)
    loadAllData()
  }, [editingCompetition, competitionForm, apiCall, loadAllData])

  const deleteCompetition = useCallback(async (id: string) => {
    if (!confirm('حذف المسابقة؟')) return
    const res = await apiCall(`/api/competitions?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم الحذف')
    loadAllData()
  }, [apiCall, loadAllData])

  const openEditCompetition = useCallback((c: Competition) => {
    setEditingCompetition(c)
    setCompetitionForm({
      title: c.title,
      type: c.type,
      date: c.date,
      participantsText: c.participants.join('، '),
      winnersText: c.winners.map(w => `${w.name}، ${w.rank}`).join('\n'),
    })
    setCompetitionDialogOpen(true)
  }, [])

  // ── CRUD: Graduates ──────────────────────────────────────
  const createGraduate = useCallback(async () => {
    if (!graduateForm.title || !graduateForm.date) { toast.error('عنوان الدفعة والتاريخ مطلوبان'); return }
    const namesList = graduateForm.graduatesText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean)
    const res = await apiCall('/api/graduates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batchNumber: parseInt(graduateForm.batchNumber) || 1, title: graduateForm.title, date: graduateForm.date, graduates: namesList, notes: graduateForm.notes }) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم إنشاء الدفعة')
    setGraduateForm(EMPTY_GRADUATE_FORM)
    loadAllData()
  }, [graduateForm, apiCall, loadAllData])

  const updateGraduate = useCallback(async () => {
    if (!editingGraduate) return
    const namesList = graduateForm.graduatesText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean)
    const res = await apiCall('/api/graduates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingGraduate.id, batchNumber: parseInt(graduateForm.batchNumber) || 1, title: graduateForm.title, date: graduateForm.date, graduates: namesList, notes: graduateForm.notes }) })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم التحديث')
    setEditingGraduate(null)
    setGraduateDialogOpen(false)
    setGraduateForm(EMPTY_GRADUATE_FORM)
    loadAllData()
  }, [editingGraduate, graduateForm, apiCall, loadAllData])

  const deleteGraduate = useCallback(async (id: string) => {
    if (!confirm('حذف الدفعة؟')) return
    const res = await apiCall(`/api/graduates?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('خطأ'); return }
    toast.success('تم الحذف')
    loadAllData()
  }, [apiCall, loadAllData])

  const openEditGraduate = useCallback((g: GraduateBatch) => {
    setEditingGraduate(g)
    setGraduateForm({
      batchNumber: g.batchNumber.toString(),
      title: g.title,
      date: g.date,
      graduatesText: g.graduates.join('\n'),
      notes: g.notes,
    })
    setGraduateDialogOpen(true)
  }, [])

  // ── Sidebar navigation config ─────────────────────────────
  const navItems = [
    { value: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { value: 'halakat', label: 'الحلقات', icon: BookOpen },
    { value: 'students', label: 'الطلاب', icon: GraduationCap },
    { value: 'attendance', label: 'الحضور', icon: ClipboardCheck },
    { value: 'media', label: 'الوسائط', icon: Camera },
    { value: 'activities', label: 'الأنشطة', icon: Calendar },
    { value: 'competitions', label: 'المسابقات', icon: Trophy },
    { value: 'graduates', label: 'الخريجين', icon: Award },
    { value: 'branches', label: 'الفروع', icon: Building2 },
    { value: 'centerinfo', label: 'عن المركز', icon: Info },
    { value: 'monthlyrate', label: 'معدل الحفظ', icon: TrendingUp },
    { value: 'telegram', label: 'تيلجرام', icon: Send },
  ]

  // ── Derived: active tab label ──────────────────────────────
  const activeLabel = navItems.find((n) => n.value === activeTab)?.label || ''

  // ── Handler: navigate tab (close sidebar on mobile) ──────
  const handleNav = useCallback((tab: string) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }, [])

  // ══════════════════════════════════════════════════════════
  //  RENDER: Loading Screen
  // ══════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d3d2e' }}>
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center animate-pulse-glow">
            <img src="/center-logo.png" alt="مركز الشفاء" className="w-20 h-20 object-contain" />
          </div>
          <Skeleton className="h-6 w-48 mx-auto bg-white/10" />
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  //  RENDER: Login Screen (single form — role determined by credentials)
  // ══════════════════════════════════════════════════════════
  if (view === 'splash') {
    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-start pt-8 sm:pt-12 md:pt-16 relative overflow-y-auto overflow-x-hidden"
        style={{ background: 'linear-gradient(160deg, #1a5f4a 0%, #0d3d2e 40%, #071f19 100%)' }}
      >
        {/* Islamic pattern overlay */}
        <div className="fixed inset-0 islamic-pattern pointer-events-none" />

        {/* Gold accent lines */}
        <div className="fixed top-0 inset-x-0 h-1 z-20" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
        <div className="fixed bottom-0 inset-x-0 h-1 z-20" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />

        {/* Decorative circles */}
        <div className="fixed top-20 right-10 w-40 h-40 rounded-full opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
        <div className="fixed bottom-32 left-10 w-56 h-56 rounded-full opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full pb-8">
          {/* Logo */}
          <div
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center mb-4 sm:mb-5 animate-pulse-glow animate-float flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
              border: '3px solid rgba(212,175,55,0.4)',
            }}
          >
            <img
              src="/center-logo.png"
              alt="مركز الشفاء لتحفيظ القرآن الكريم"
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain"
            />
          </div>

          {/* Center Name */}
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-1 animate-fade-in-up"
            style={{ fontFamily: 'var(--font-cairo)', textShadow: '0 2px 8px rgba(0,0,0,0.4)', animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            مركز الشفاء لتحفيظ القرآن الكريم
          </h1>

          {/* Quran Verse */}
          <p
            className="text-sm sm:text-base text-white/80 text-center mb-1 animate-fade-in-up"
            style={{ fontFamily: 'var(--font-amiri)', animationDelay: '0.4s', animationFillMode: 'both' }}
          >
            ﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾
          </p>
          <p
            className="text-xs text-white/50 mb-4 sm:mb-5 animate-fade-in-up"
            style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
          >
            سورة الحجر — الآية ٩
          </p>

          {/* Gold separator */}
          <div
            className="w-32 h-0.5 mb-4 sm:mb-6 animate-fade-in-up"
            style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)', animationDelay: '0.6s', animationFillMode: 'both' }}
          />

          {/* Login Form */}
          <div
            className="w-full rounded-2xl p-5 sm:p-6 md:p-8 animate-fade-in-up"
            style={{
              backgroundColor: 'rgba(255,255,255,0.07)',
              WebkitBackdropFilter: 'blur(12px)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              animationDelay: '0.7s',
              animationFillMode: 'both',
            }}
          >
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2" style={{ color: '#d4af37' }}>
                  <User className="w-4 h-4" />
                  اسم المستخدم
                </Label>
                <Input
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLoginError('') }}
                  className="h-11 text-right bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                  enterKeyHint="next"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2" style={{ color: '#d4af37' }}>
                  <Lock className="w-4 h-4" />
                  كلمة المرور
                </Label>
                <Input
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
                  className="h-11 text-right bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                  enterKeyHint="go"
                />
              </div>
              {/* Error message display */}
              {loginError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-sm text-white"
                  style={{ backgroundColor: 'rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.4)' }}
                >
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl"
                style={{
                  background: loginLoading
                    ? 'linear-gradient(135deg, #999, #bbb, #999)'
                    : 'linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)',
                  backgroundSize: '200% 200%',
                  color: '#0d3d2e',
                  borderRadius: '0.8rem',
                }}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    تسجيل الدخول
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Bottom branding */}
          <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'both' }}>
            <p className="text-white/30 text-xs">© 2025 جميع الحقوق محفوظة</p>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  //  RENDER: Viewer Mode
  // ══════════════════════════════════════════════════════════
  if (view === 'viewer') {
    return <PublicDisplayView onLogout={handleLogout} />
  }

  // ══════════════════════════════════════════════════════════
  //  RENDER: Admin Panel — Professional Sidebar Layout
  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f2f5' }}>

      {/* ── Mobile Overlay ─────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        className={[
          'fixed lg:sticky top-0 right-0 z-50 h-screen flex flex-col transition-transform duration-300 ease-in-out',
          'w-72 shadow-2xl lg:shadow-lg',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{
          background: 'linear-gradient(180deg, #0d3d2e 0%, #1a5f4a 50%, #0d3d2e 100%)',
          minWidth: '18rem',
        }}
      >
        {/* Sidebar Header — Logo & Name */}
        <div className="relative flex-shrink-0 pt-6 pb-4 px-5">
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 left-4 lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                border: '2px solid rgba(212,175,55,0.4)',
              }}
            >
              <img src="/center-logo.png" alt="مركز الشفاء" className="w-9 h-9 object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-base leading-tight truncate">مركز الشفاء</h2>
              <p className="text-white/50 text-xs mt-0.5">لوحة التحكم الإدارية</p>
            </div>
          </div>
        </div>

        {/* Gold Separator */}
        <div className="mx-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }} />

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.value
              return (
                <button
                  key={item.value}
                  data-nav-tab={item.value}
                  onClick={() => handleNav(item.value)}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/5',
                  ].join(' ')}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))',
                    borderRight: '3px solid #d4af37',
                    boxShadow: '0 4px 15px rgba(212,175,55,0.15)',
                  } : {
                    borderRight: '3px solid transparent',
                  }}
                >
                  <div className={[
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                  ].join(' ')} style={{
                    backgroundColor: isActive ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                  }}>
                    <Icon className="w-[18px] h-[18px]" style={{ color: isActive ? '#d4af37' : 'currentColor' }} />
                  </div>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <ChevronLeft className="w-4 h-4 mr-auto" style={{ color: '#d4af37' }} />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Sidebar Footer — User + Logout */}
        <div className="flex-shrink-0">
          {/* Gold Separator */}
          <div className="mx-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }} />

          <div className="p-4 space-y-3">
            {/* User Info */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}>
                <User className="w-4 h-4" style={{ color: '#d4af37' }} />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">المدير</p>
                <p className="text-white/40 text-xs">مدير النظام</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(220,38,38,0.1)',
                color: '#fca5a5',
                border: '1px solid rgba(220,38,38,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.2)'
                e.currentTarget.style.color = '#fecaca'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'
                e.currentTarget.style.color = '#fca5a5'
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* ── Top Header Bar ────────────────────────────────── */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-16 shadow-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            WebkitBackdropFilter: 'blur(8px)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Back button — goes to dashboard from any tab */}
            {activeTab !== 'dashboard' && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                title="الرجوع للرئيسية"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {/* Hamburger for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title */}
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#1a5f4a' }}>
                {activeLabel}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                مركز الشفاء لتحفيظ القرآن الكريم
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadAllData()}
              className="hidden sm:flex items-center gap-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
              <span className="text-xs">تحديث</span>
            </Button>

            {/* Logout Button in Header */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>

            {/* Mobile User Badge */}
            <div className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#f0fdf4', color: '#1a5f4a' }}>
              <User className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">المدير</span>
            </div>
          </div>
        </header>

        {/* ── Page Content ──────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <DashboardTab stats={dashboardStats} loading={dataLoading} onNavigate={handleNav} formatDate={formatDate} />
            )}
            {activeTab === 'halakat' && (
              <HalakatTab
                halakat={halakat}
                form={halakaForm}
                setForm={setHalakaForm}
                editing={editingHalaka}
                dialogOpen={halakaDialogOpen}
                setDialogOpen={setHalakaDialogOpen}
                onCreate={createHalaka}
                onUpdate={updateHalaka}
                onDelete={deleteHalaka}
                onEdit={openEditHalaka}
              />
            )}
            {activeTab === 'students' && (
              <StudentsTab
                students={students}
                halakat={halakat}
                form={studentForm}
                setForm={setStudentForm}
                editing={editingStudent}
                dialogOpen={studentDialogOpen}
                setDialogOpen={setStudentDialogOpen}
                onCreate={createStudent}
                onUpdate={updateStudent}
                onDelete={deleteStudent}
                onEdit={openEditStudent}
              />
            )}
            {activeTab === 'attendance' && (
              <AttendanceTab
                halakat={halakat}
                students={students}
                date={attendanceDate}
                setDate={setAttendanceDate}
                halakaId={attendanceHalakaId}
                setHalakaId={setAttendanceHalakaId}
                records={attendanceRecords}
                updateRecord={updateAttendanceRecord}
                onSave={saveAttendance}
              />
            )}
            {activeTab === 'media' && (
              <MediaTab
                album={mediaAlbum}
                setAlbum={setMediaAlbum}
                filter={mediaFilter}
                setFilter={setMediaFilter}
                file={mediaFile}
                setFile={setMediaFile}
                uploading={uploading}
                images={mediaImages}
                onUpload={uploadMedia}
                onDelete={deleteMedia}
              />
            )}
            {activeTab === 'activities' && (
              <ActivitiesTab
                activities={activities}
                form={activityForm}
                setForm={setActivityForm}
                editing={editingActivity}
                dialogOpen={activityDialogOpen}
                setDialogOpen={setActivityDialogOpen}
                onCreate={createActivity}
                onUpdate={updateActivity}
                onDelete={deleteActivity}
                onEdit={openEditActivity}
                formatDate={formatDate}
              />
            )}
            {activeTab === 'competitions' && (
              <CompetitionsTab
                competitions={competitions}
                form={competitionForm}
                setForm={setCompetitionForm}
                editing={editingCompetition}
                dialogOpen={competitionDialogOpen}
                setDialogOpen={setCompetitionDialogOpen}
                onCreate={createCompetition}
                onUpdate={updateCompetition}
                onDelete={deleteCompetition}
                onEdit={openEditCompetition}
              />
            )}
            {activeTab === 'graduates' && (
              <GraduatesTab
                graduates={graduates}
                form={graduateForm}
                setForm={setGraduateForm}
                editing={editingGraduate}
                dialogOpen={graduateDialogOpen}
                setDialogOpen={setGraduateDialogOpen}
                onCreate={createGraduate}
                onUpdate={updateGraduate}
                onDelete={deleteGraduate}
                onEdit={openEditGraduate}
              />
            )}
            {activeTab === 'branches' && (
              <DashboardTab stats={dashboardStats} loading={dataLoading} onNavigate={handleNav} formatDate={formatDate} />
            )}
            {activeTab === 'centerinfo' && (
              <CenterInfoTab
                items={centerInfoItems}
                form={centerInfoForm}
                setForm={setCenterInfoForm}
                editing={editingCenterInfo}
                dialogOpen={centerInfoDialogOpen}
                setDialogOpen={setCenterInfoDialogOpen}
                file={centerInfoFile}
                setFile={setCenterInfoFile}
                preview={centerInfoPreview}
                setPreview={setCenterInfoPreview}
                onCreate={createCenterInfo}
                onUpdate={updateCenterInfo}
                onDelete={deleteCenterInfo}
                onEdit={openEditCenterInfo}
              />
            )}
            {activeTab === 'monthlyrate' && (
              <MonthlyRateTab data={monthlyRate} month={monthlyMonth} setMonth={setMonthlyMonth} loading={dataLoading} students={students} />
            )}
            {activeTab === 'telegram' && (
              <TelegramTab />
            )}
            </ErrorBoundary>
          </div>
        </main>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer
          className="text-center py-3 text-xs flex-shrink-0"
          style={{
            backgroundColor: '#ffffff',
            color: '#9ca3af',
            borderTop: '1px solid #f3f4f6',
          }}
        >
          © {new Date().getFullYear()} مركز الشفاء لتحفيظ القرآن الكريم — جميع الحقوق محفوظة
        </footer>
      </div>
    </div>
  )
}
