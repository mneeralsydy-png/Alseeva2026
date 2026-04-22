'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, ChevronDown, ChevronUp, Save, Sparkles, RefreshCw, BookOpen, FileText, Plus, Trash2, BarChart3, ArrowUp, ArrowDown } from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { toast } from 'sonner'

const BRANCH_STYLES: Record<string, { color: string; bg: string }> = {
  'السرور': { color: '#059669', bg: '#ecfdf5' },
  'المركز العام': { color: '#d97706', bg: '#fffbeb' },
  'الوادي': { color: '#0891b2', bg: '#ecfeff' },
  وبرة: { color: '#0d9488', bg: '#f0fdfa' },
  ضية: { color: '#e11d48', bg: '#fff1f2' },
  'المنعم': { color: '#7c3aed', bg: '#f5f3ff' },
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function getMonthLabel(monthStr: string): string {
  const monthNum = parseInt(monthStr.split('-')[1]) - 1
  return ARABIC_MONTHS[monthNum] || monthStr
}

function rateColor(rate: number) {
  if (rate >= 80) return { color: '#059669', bg: '#ecfdf5', label: 'ممتاز' }
  if (rate >= 60) return { color: '#d97706', bg: '#fffbeb', label: 'جيد' }
  if (rate >= 40) return { color: '#dc2626', bg: '#fef2f2', label: 'مقبول' }
  return { color: '#6b7280', bg: '#f9fafb', label: 'ضعيف' }
}

// ── Simple text input cell ─────────────────────────────────
function ProgressCell({
  value,
  onChange,
  studentId,
  monthKey,
}: {
  value: string
  onChange: (studentId: string, monthKey: string, val: string) => void
  studentId: string
  monthKey: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(studentId, monthKey, e.target.value)}
      placeholder="من سورة ... إلى سورة ..."
      className="w-full text-[11px] px-2 py-1.5 border rounded-lg bg-white text-right outline-none focus:ring-1 focus:ring-emerald-300 focus:border-emerald-400 transition-colors"
      style={{ minHeight: '32px', borderColor: '#e5e7eb' }}
    />
  )
}

// ══════════════════════════════════════════════════════════════
// ── Main Component ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export function MonthlyRateTab({
  data,
  month,
  setMonth,
  loading,
  students,
}: {
  data: any
  month: string
  setMonth: (m: string) => void
  loading: boolean
  students?: any[]
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [progressTexts, setProgressTexts] = useState<Record<string, string>>({})
  const [activeMonths, setActiveMonths] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [progressLoaded, setProgressLoaded] = useState(false)

  // ── Load progress data ────────────────────────────────────
  const loadProgressForMonth = useCallback(async (m: string) => {
    try {
      const res = await fetch(apiUrl(`/api/student-progress?month=${m}`))
      if (res.ok) {
        const result = await res.json()
        if (result.progress) {
          setProgressTexts((prev) => {
            const next = { ...prev }
            for (const [key, val] of Object.entries(result.progress)) {
              const entry = val as any
              if (entry.fromSurah || entry.toSurah) {
                const from = entry.fromSurah || ''
                const to = entry.toSurah || ''
                next[key] = from && to ? `من ${from} إلى ${to}` : from || to || ''
              } else if (typeof entry === 'string') {
                next[key] = entry
              }
            }
            return next
          })
        }
      }
    } catch {
      // silent
    }
  }, [])

  // ── Initialize on mount ──────────────────────────────────
  const initLoad = useCallback(async () => {
    if (month) {
      await loadProgressForMonth(month)
      setActiveMonths([month])
    }
    setProgressLoaded(true)
  }, [month, loadProgressForMonth])

  useEffect(() => {
    initLoad()
  }, [initLoad])

  // ── Add month ────────────────────────────────────────────
  const addMonth = useCallback(() => {
    if (!month) return
    setActiveMonths((prev) => {
      if (prev.includes(month)) return prev
      return [...prev, month].sort()
    })
    loadProgressForMonth(month)
  }, [month, loadProgressForMonth])

  // ── Remove month ─────────────────────────────────────────
  const removeMonth = useCallback((m: string) => {
    setActiveMonths((prev) => prev.filter((am) => am !== m))
    setProgressTexts((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((key) => {
        if (key.endsWith(`_${m}`)) {
          delete next[key]
        }
      })
      return next
    })
  }, [])

  // ── Update cell ──────────────────────────────────────────
  const updateCell = useCallback((studentId: string, m: string, val: string) => {
    setProgressTexts((prev) => ({ ...prev, [`${studentId}_${m}`]: val }))
  }, [])

  // ── Save ─────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // Convert text back to structured format
      const progress: Record<string, { fromSurah: string; toSurah: string }> = {}
      for (const [key, text] of Object.entries(progressTexts)) {
        let fromSurah = ''
        let toSurah = ''
        const t = text.trim()
        if (t) {
          // Parse "من X إلى Y" pattern
          const fromMatch = t.match(/من\s+(.+?)(?:\s+إلى|$)/)
          const toMatch = t.match(/إلى\s+(.+?)$/)
          if (fromMatch) fromSurah = fromMatch[1].trim()
          else if (t.includes('إلى')) fromSurah = t.split('إلى')[0].replace(/من/g, '').trim()
          if (toMatch) toSurah = toMatch[1].trim()
          else if (!fromSurah) fromSurah = t // fallback: whole text is the value
        }
        progress[key] = { fromSurah, toSurah }
      }

      const res = await fetch(apiUrl('/api/student-progress'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, progress }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('تم حفظ تقدم الحفظ بنجاح')
    } catch {
      toast.error('فشل في حفظ البيانات')
    }
    setSaving(false)
  }, [month, progressTexts])

  // ── Halqa Analysis State ──────────────────────────────
  const [analysisHalqa, setAnalysisHalqa] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<{ currentRate: number; prevRate: number; change: number; currentMonth: string; prevMonth: string; studentsCount: number } | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Build halqa list from data
  const halqaList = (data?.branches || []).flatMap((b: any) =>
    (b.students || []).map((s: any) => ({
      name: s.halakaName || s.name,
      branch: b.name,
      rate: s.rate,
    }))
  ).filter((h: any) => h.name && h.name !== '—')

  // ── Halqa Analysis ──────────────────────────────────
  const handleHalqaAnalysis = useCallback(async (halqaName: string) => {
    if (!month) {
      toast.error('اختر شهراً أولاً')
      return
    }
    setAnalysisHalqa(halqaName)
    setAnalysisLoading(true)
    setAnalysisResult(null)
    try {
      // Fetch current month data
      const [currentRes, prevDate] = await Promise.all([
        fetch(apiUrl(`/api/monthly-rate?month=${month}`)),
        (() => {
          const [y, m] = month.split('-').map(Number)
          const pm = m === 1 ? 12 : m - 1
          const py = m === 1 ? y - 1 : y
          return `${py}-${String(pm).padStart(2, '0')}`
        })(),
      ])

      const [currentData, prevRes] = await Promise.all([
        currentRes.json(),
        fetch(apiUrl(`/api/monthly-rate?month=${prevDate}`)).then(r => r.json()).catch(() => null),
      ])

      // Find halqa students in current month
      const currentHalqaStudents = (currentData?.branches || []).flatMap((b: any) =>
        (b.students || []).filter((s: any) => s.halakaName === halqaName)
      )

      // Find halqa students in previous month
      const prevHalqaStudents = (prevData?.branches || []).flatMap((b: any) =>
        (b.students || []).filter((s: any) => s.halakaName === halqaName)
      )

      const currentRate = currentHalqaStudents.length > 0
        ? Math.round(currentHalqaStudents.reduce((sum: number, s: any) => sum + s.rate, 0) / currentHalqaStudents.length)
        : 0
      const prevRate = prevHalqaStudents.length > 0
        ? Math.round(prevHalqaStudents.reduce((sum: number, s: any) => sum + s.rate, 0) / prevHalqaStudents.length)
        : 0
      const change = prevRate > 0 ? currentRate - prevRate : 0

      setAnalysisResult({
        currentRate,
        prevRate,
        change,
        currentMonth: month,
        prevMonth: prevDate,
        studentsCount: currentHalqaStudents.length,
      })
    } catch {
      toast.error('حدث خطأ أثناء التحليل')
    }
    setAnalysisLoading(false)
  }, [month])

  // ── Build student list (paginated for performance) ──────
  const PAGE_SIZE = 50
  const [page, setPage] = useState(0)

  const studentList = (students || []).map((s: any) => {
    const halaka = (data?.branches || [])
      .flatMap((b: any) => b.students || [])
      .find((st: any) => st.name === s.name)

    const filledMonths = activeMonths.filter((m) => {
      const text = progressTexts[`${s.id}_${m}`]
      return text && text.trim()
    }).length

    return {
      id: s.id,
      name: s.name,
      branch: halaka?.branch || (s.halakaId ? 'غير محدد' : '—'),
      halakaName: halaka?.halakaName || '—',
      filledMonths,
    }
  }).sort((a: any, b: any) => b.filledMonths - a.filledMonths)

  const totalPages = Math.ceil(studentList.length / PAGE_SIZE)
  const pagedStudents = studentList.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // ── Loading state ────────────────────────────────────────
  if (loading || !progressLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // ── Render ───────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  return (
    <div className="space-y-5" dir="rtl">
      {/* ── Controls Bar ────────────────────────────── */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: '#1a5f4a' }}>
                <TrendingUp className="w-4 h-4 inline ml-1" style={{ color: '#d4af37' }} />
                اختر الشهر
              </Label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-48 text-right"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={addMonth}
                variant="outline"
                className="flex items-center gap-2"
                style={{ borderColor: '#1a5f4a40', color: '#1a5f4a', borderRadius: '0.6rem' }}
              >
                <Plus className="w-4 h-4" />
                إضافة شهر
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
                style={{ background: '#1a5f4a', borderRadius: '0.6rem' }}
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ…' : 'حفظ'}
              </Button>
              <div className="relative">
                <Button
                  onClick={() => setAnalysisHalqa(analysisHalqa === '__open' ? null : '__open')}
                  variant="outline"
                  className="flex items-center gap-2"
                  style={{ borderColor: '#d4af3760', color: '#b8860b', borderRadius: '0.6rem' }}
                >
                  {analysisLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  {analysisLoading ? 'جاري التحليل…' : 'تحليل'}
                </Button>
                {/* Halqa selection dropdown */}
                {analysisHalqa === '__open' && (
                  <div className="absolute top-full right-0 mt-1 w-64 rounded-xl shadow-xl py-1 z-50 max-h-60 overflow-y-auto" style={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}>
                    {halqaList.length === 0 ? (
                      <p className="px-4 py-3 text-xs" style={{ color: '#9ca3af' }}>لا توجد حلقات متاحة</p>
                    ) : (
                      halqaList.map((h: any, i: number) => (
                        <button
                          key={`${h.name}-${h.branch}-${i}`}
                          onClick={() => handleHalqaAnalysis(h.name)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors"
                          style={{ color: '#374151' }}
                        >
                          <span className="font-medium">{h.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: (BRANCH_STYLES[h.branch] || { bg: '#f3f4f6' }).bg, color: (BRANCH_STYLES[h.branch] || { color: '#6b7280' }).color }}>
                            {h.branch}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active months pills */}
          {activeMonths.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
              <BookOpen className="w-3.5 h-3.5" />
              <span>الأشهر:</span>
              {activeMonths.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                >
                  {getMonthLabel(m)}
                  {activeMonths.length > 1 && (
                    <button
                      type="button"
                      className="hover:text-red-500 transition-colors mr-0.5"
                      onClick={() => removeMonth(m)}
                      aria-label={`حذف ${getMonthLabel(m)}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Hint ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>اكتب نطاق الحفظ لكل طالب مثل: من سورة يس إلى سورة الكهف</span>
        </div>
      </div>

      {/* ── Halqa Analysis Card ─────────────────────── */}
      {analysisResult && (
        <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem', borderRight: '4px solid #d4af37' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#b8860b' }}>
                <BarChart3 className="w-5 h-5" />
                تحليل: {analysisHalqa}
              </CardTitle>
              <button
                onClick={() => { setAnalysisHalqa(null); setAnalysisResult(null) }}
                className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100"
                style={{ color: '#9ca3af' }}
              >
                إغلاق
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: '#9ca3af' }}>{getMonthLabel(analysisResult.currentMonth)}</p>
                <p className="text-2xl font-extrabold" style={{ color: rateColor(analysisResult.currentRate).color }}>
                  {analysisResult.currentRate}%
                </p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: '#9ca3af' }}>{getMonthLabel(analysisResult.prevMonth)}</p>
                <p className="text-2xl font-extrabold" style={{ color: rateColor(analysisResult.prevRate).color }}>
                  {analysisResult.prevRate}%
                </p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{
                backgroundColor: analysisResult.change >= 0 ? '#ecfdf5' : '#fef2f2',
              }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: '#9ca3af' }}>التغيير</p>
                <div className="flex items-center justify-center gap-1">
                  {analysisResult.change >= 0 ? (
                    <ArrowUp className="w-4 h-4" style={{ color: '#059669' }} />
                  ) : (
                    <ArrowDown className="w-4 h-4" style={{ color: '#dc2626' }} />
                  )}
                  <p className="text-2xl font-extrabold" style={{ color: analysisResult.change >= 0 ? '#059669' : '#dc2626' }}>
                    {analysisResult.change > 0 ? '+' : ''}{analysisResult.change}%
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
              <Users className="w-3.5 h-3.5" />
              <span>عدد الطلاب: {analysisResult.studentsCount}</span>
              <span>•</span>
              <span>
                {analysisResult.change > 0
                  ? `تحسّن بنسبة ${Math.abs(analysisResult.change)}% مقارنة بالشهر الماضي`
                  : analysisResult.change < 0
                    ? `تراجع بنسبة ${Math.abs(analysisResult.change)}% مقارنة بالشهر الماضي`
                    : 'لم يتغير المعدل مقارنة بالشهر الماضي'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main Content ──────────────────────────── */}
      {!data ? (
        <div className="text-center py-10" style={{ color: '#9ca3af' }}>
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">اختر شهراً واضغط &quot;إضافة شهر&quot; لبدء تتبع التقدم</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-medium" style={{ color: '#6b7280' }}>المعدل الإجمالي</p>
                <p className="text-2xl font-extrabold" style={{ color: rateColor(data.overallRate).color }}>
                  {data.overallRate}%
                </p>
                <Badge className="text-[10px]" style={{ backgroundColor: rateColor(data.overallRate).bg, color: rateColor(data.overallRate).color, border: 'none' }}>
                  {rateColor(data.overallRate).label}
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-medium" style={{ color: '#6b7280' }}>الطلاب</p>
                <p className="text-2xl font-extrabold" style={{ color: '#1a5f4a' }}>{data.totalStudents}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-medium" style={{ color: '#6b7280' }}>الأشهر</p>
                <p className="text-2xl font-extrabold" style={{ color: '#d4af37' }}>{activeMonths.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* ── Progress Table ─────────────────────── */}
          {students && students.length > 0 && activeMonths.length > 0 && (
            <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                      <BookOpen className="w-5 h-5" style={{ color: '#d4af37' }} />
                      تقدم الحفظ الشهري
                    </CardTitle>
                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                      {studentList.length} طالب — صفحة {page + 1} من {totalPages}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e5e7eb' }}>
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th className="text-right p-2.5 font-semibold text-[11px]" style={{ color: '#374151', minWidth: '40px' }}>#</th>
                        <th className="text-right p-2.5 font-semibold text-[11px]" style={{ color: '#374151', minWidth: '120px' }}>الطالب</th>
                        <th className="text-center p-2.5 font-semibold text-[11px]" style={{ color: '#374151', minWidth: '60px' }}>الفرع</th>
                        {activeMonths.map((m) => (
                          <th key={m} className="text-center p-2.5 font-semibold text-[11px]" style={{ color: '#1a5f4a', minWidth: '200px' }}>
                            {getMonthLabel(m)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedStudents.map((s: any, i: number) => {
                        const branchStyle = BRANCH_STYLES[s.branch] || { color: '#6b7280', bg: '#f9fafb' }
                        return (
                          <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6' }} className="hover:bg-gray-50/80">
                            <td className="p-2 text-[10px] text-gray-400">{page * PAGE_SIZE + i + 1}</td>
                            <td className="p-2 font-medium text-xs" style={{ color: '#1a5f4a' }}>{s.name}</td>
                            <td className="p-2 text-center">
                              <Badge className="text-[9px]" style={{ backgroundColor: branchStyle.bg, color: branchStyle.color, border: 'none' }}>
                                {s.branch}
                              </Badge>
                            </td>
                            {activeMonths.map((m) => {
                              const cellKey = `${s.id}_${m}`
                              return (
                                <td key={cellKey} className="p-1">
                                  <ProgressCell
                                    value={progressTexts[cellKey] || ''}
                                    onChange={updateCell}
                                    studentId={s.id}
                                    monthKey={m}
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                      className="text-xs"
                      style={{ borderRadius: '0.4rem' }}
                    >
                      السابق
                    </Button>
                    <span className="text-xs font-medium px-3" style={{ color: '#6b7280' }}>
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="text-xs"
                      style={{ borderRadius: '0.4rem' }}
                    >
                      التالي
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No months hint */}
          {students && students.length > 0 && activeMonths.length === 0 && (
            <div className="text-center py-8" style={{ color: '#9ca3af' }}>
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">اختر شهراً واضغط &quot;إضافة شهر&quot; لبدء تتبع التقدم</p>
            </div>
          )}

          {/* ── Summary of filled data ──────────────── */}
          {students && students.length > 0 && studentList.some((s: any) => s.filledMonths > 0) && (
            <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                  <FileText className="w-5 h-5" style={{ color: '#d4af37' }} />
                  ملخص تقدم الحفظ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {studentList
                  .filter((s: any) => s.filledMonths > 0)
                  .map((s: any, i: number) => {
                    const branchStyle = BRANCH_STYLES[s.branch] || { color: '#6b7280', bg: '#f9fafb' }
                    const entries = activeMonths
                      .map((m) => {
                        const text = progressTexts[`${s.id}_${m}`]
                        if (text && text.trim()) {
                          return `${getMonthLabel(m)}: ${text.trim()}`
                        }
                        return null
                      })
                      .filter(Boolean) as string[]

                    return (
                      <div
                        key={s.id}
                        className="flex items-start justify-between p-3 rounded-xl gap-3"
                        style={{ backgroundColor: '#f9fafb', border: `1px solid ${branchStyle.color}15` }}
                      >
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold w-6 text-center" style={{ color: '#9ca3af' }}>{i + 1}</span>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#1a5f4a' }}>{s.name}</p>
                            <p className="text-[10px]" style={{ color: '#9ca3af' }}>{s.branch}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          {entries.map((entry, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                              {entry}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </CardContent>
            </Card>
          )}

          {/* ── Branch Attendance Rates ─────────────── */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold" style={{ color: '#1a5f4a' }}>
                معدل الحضور حسب الفروع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!data.branches || data.branches.length === 0 ? (
                <div className="text-center py-8" style={{ color: '#9ca3af' }}><p className="text-sm">لا توجد بيانات</p></div>
              ) : (
                data.branches.map((branch: any) => {
                  const style = BRANCH_STYLES[branch.name] || { color: '#6b7280', bg: '#f9fafb' }
                  const isExpanded = expanded === branch.name
                  const rc = rateColor(branch.rate)
                  return (
                    <div key={branch.name} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${style.color}20` }}>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : branch.name)}
                        className="w-full flex items-center justify-between p-4 transition-all hover:opacity-90"
                        style={{ backgroundColor: style.bg }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: style.color + '15' }}>
                            <Users className="w-5 h-5" style={{ color: style.color }} />
                          </div>
                          <div className="text-right">
                            <h4 className="font-bold text-sm" style={{ color: style.color }}>فرع {branch.name}</h4>
                            <p className="text-xs" style={{ color: '#9ca3af' }}>{branch.students?.length || 0} طالب</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="text-lg font-bold px-3 py-1" style={{ backgroundColor: rc.bg, color: rc.color, border: 'none' }}>
                            {branch.rate}%
                          </Badge>
                          {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: '#9ca3af' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9ca3af' }} />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-4 space-y-2 max-h-96 overflow-y-auto" style={{ borderTop: `1px solid ${style.color}15` }}>
                          {branch.students?.map((s: any, idx: number) => {
                            const src = rateColor(s.rate)
                            return (
                              <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                                <span className="text-sm font-medium" style={{ color: '#374151' }}>{s.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs" style={{ color: '#9ca3af' }}>{s.presentDays}/{s.totalDays}</span>
                                  <Badge className="text-xs font-bold" style={{ backgroundColor: src.bg, color: src.color, border: 'none' }}>
                                    {s.rate}%
                                  </Badge>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
