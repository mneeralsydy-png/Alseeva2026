import { sbGet, sbCount } from '@/lib/supabase'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Current month and previous month for monthly rate
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const currentMonth = `${year}-${String(month).padStart(2, '0')}`
    const prevMonthNum = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const prevMonth = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`

    // Fetch all data in parallel (no embedded relations)
    const [
      totalHalakat,
      totalStudents,
      totalActivities,
      halakat,
      allStudents,
      activities,
      allMedia,
      centerInfo,
      todayAttendance,
      currentMonthAttendance,
      prevMonthAttendance,
    ] = await Promise.all([
      sbCount('Halaka'),
      sbCount('Student'),
      sbCount('Activity'),
      sbGet<any>('Halaka', 'order=branch.asc'),
      sbGet<any>('Student', 'select=id,name,age,surah,category,halakaId'),
      sbGet('Activity', 'order=date.desc'),
      sbGet<any>('MediaImage', 'order=createdAt.desc'),
      sbGet('CenterInfo', 'order=section.asc'),
      sbGet<any>('Attendance', `date=eq.${today}`),
      // Current month attendance
      (() => {
        const start = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
        return sbGet<any>('Attendance', `date=gte.${start}&date=lte.${end}`)
      })(),
      // Previous month attendance
      (() => {
        const start = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`
        const lastDay = new Date(prevYear, prevMonthNum, 0).getDate()
        const end = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
        return sbGet<any>('Attendance', `date=gte.${start}&date=lte.${end}`).catch(() => [])
      })(),
    ])

    // Build student count per halaka manually
    const studentCountMap = new Map<string, number>()
    const studentsByHalaka = new Map<string, any[]>()
    for (const s of allStudents) {
      if (s.halakaId) {
        studentCountMap.set(s.halakaId, (studentCountMap.get(s.halakaId) || 0) + 1)
        if (!studentsByHalaka.has(s.halakaId)) studentsByHalaka.set(s.halakaId, [])
        studentsByHalaka.get(s.halakaId)!.push(s)
      }
    }

    const halakatWithCounts = halakat.map((h: any) => ({
      ...h,
      students: studentsByHalaka.get(h.id) || [],
      _count: { students: studentCountMap.get(h.id) || 0 }
    }))

    // Compute branch data
    const branchMap: Record<string, { halakatCount: number; studentsCount: number }> = {}
    for (const h of halakat) {
      const branch = h.branch || 'غير محدد'
      if (!branchMap[branch]) branchMap[branch] = { halakatCount: 0, studentsCount: 0 }
      branchMap[branch].halakatCount++
      branchMap[branch].studentsCount += studentCountMap.get(h.id) || 0
    }
    const branches = Object.entries(branchMap).map(([name, data]) => ({ name, ...data }))

    // Compute categories
    const categoryMap: Record<string, number> = {}
    for (const s of allStudents) {
      const cat = s.category || 'غير محدد'
      categoryMap[cat] = (categoryMap[cat] || 0) + 1
    }
    const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }))

    // Media albums
    const DEFAULT_ALBUMS = [
      'حلقات تحفيظية', 'سرد قرآني', 'دورات سنوية', 'مسابقات سنوية',
      'تكريم', 'احتفالات خريجين', 'متميزين', 'خريجون', 'أخرى',
    ]
    // Convert Telegram file URLs to proxy URLs
    const resolveMediaUrl = (url: string) => {
      if (!url) return ''
      if (url.startsWith('tg:')) {
        const fileId = url.replace('tg:', '')
        return `/api/telegram/image-proxy?file_id=${encodeURIComponent(fileId)}`
      }
      return url
    }

    const albumMap: Record<string, any[]> = {}
    for (const img of allMedia) {
      const resolvedImg = { ...img, url: resolveMediaUrl(img.url) }
      if (!albumMap[img.album]) albumMap[img.album] = []
      albumMap[img.album].push(resolvedImg)
    }
    const albums = DEFAULT_ALBUMS.map((name) => ({
      name,
      count: albumMap[name]?.length || 0,
      images: albumMap[name] || [],
    }))

    // Build student and halaka lookup maps for attendance enrichment
    const studentMap = new Map(allStudents.map((s: any) => [s.id, s]))
    const halakaMap = new Map(halakat.map((h: any) => [h.id, h]))

    // Enrich attendance and compute stats
    const attendanceStats = { present: 0, absent: 0, late: 0, total: 0 }
    const attendanceByHalakaMap: Record<string, {
      halakaName: string; branch: string; teacher: string
      present: number; absent: number; late: number; total: number
      records: { studentName: string; status: string; notes?: string }[]
    }> = {}

    for (const a of todayAttendance) {
      const status = a.status || 'حاضر'
      attendanceStats.total++
      if (status === 'حاضر') attendanceStats.present++
      else if (status === 'غائب') attendanceStats.absent++
      else if (status === 'متأخر') attendanceStats.late++

      const halakaKey = a.halakaId || 'unknown'
      if (!attendanceByHalakaMap[halakaKey]) {
        const hk = a.halakaId ? halakaMap.get(a.halakaId) : null
        attendanceByHalakaMap[halakaKey] = {
          halakaName: hk?.name || 'غير محدد',
          branch: hk?.branch || '',
          teacher: hk?.teacher || '',
          present: 0, absent: 0, late: 0, total: 0, records: [],
        }
      }
      const group = attendanceByHalakaMap[halakaKey]
      group.total++
      if (status === 'حاضر') group.present++
      else if (status === 'غائب') group.absent++
      else if (status === 'متأخر') group.late++
      const student = a.studentId ? studentMap.get(a.studentId) : null
      group.records.push({
        studentName: student?.name || 'غير معروف',
        status,
        notes: a.notes || undefined,
      })
    }

    // ── Compute monthly rate per halaka (current vs previous month) ──
    const computeHalakaRate = (records: any[]) => {
      const halakaStats: Record<string, { present: number; total: number }> = {}
      for (const r of records) {
        const hk = r.halakaId || 'unknown'
        if (!halakaStats[hk]) halakaStats[hk] = { present: 0, total: 0 }
        halakaStats[hk].total++
        if (r.status === 'حاضر') halakaStats[hk].present++
      }
      const rates: Record<string, number> = {}
      for (const [hkId, stats] of Object.entries(halakaStats)) {
        rates[hkId] = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
      }
      return rates
    }

    const currentRates = computeHalakaRate(currentMonthAttendance || [])
    const prevRates = computeHalakaRate(prevMonthAttendance || [])

    const halakaMonthlyRates: Record<string, { halakaId: string; halakaName: string; currentRate: number; prevRate: number; change: number }> = {}
    for (const h of halakat) {
      const cRate = currentRates[h.id] || 0
      const pRate = prevRates[h.id] || 0
      const change = pRate > 0 ? cRate - pRate : 0
      halakaMonthlyRates[h.id] = {
        halakaId: h.id,
        halakaName: h.name || h.teacher,
        currentRate: cRate,
        prevRate: pRate,
        change,
      }
    }

    return NextResponse.json({
      centerName: 'مركز الشفاء لتحفيظ القرآن الكريم',
      totalHalakat,
      totalStudents,
      totalActivities,
      totalImages: allMedia.length,
      halakat: halakatWithCounts,
      branches,
      categories,
      activities,
      media: allMedia.map((img: any) => ({ ...img, url: resolveMediaUrl(img.url) })),
      albums,
      centerInfo,
      attendanceStats,
      attendanceByHalaka: Object.values(attendanceByHalakaMap),
      todayDate: today,
      monthlyRate: halakaMonthlyRates,
    })
  } catch (error) {
    console.error('Public API error:', error)
    return NextResponse.json({ error: 'فشل في تحميل البيانات' }, { status: 500 })
  }
}
