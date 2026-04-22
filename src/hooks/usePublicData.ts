'use client'

// Custom hook that fetches ALL public data DIRECTLY from Supabase
// No server needed! This is the key to making the app work without the Next.js server.
// Falls back to cached data when offline.

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  sbDirectGet,
  getTelegramFileUrl,
  isTelegramRef,
} from '@/lib/supabase-direct'

const CACHE_KEY = 'alshifa_public_data'
const CACHE_TIME_KEY = 'alshifa_cache_time'

// Offline cache utilities
function loadCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
  } catch { /* ignore */ }
  return null
}

function saveToCache(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString())
  } catch { /* ignore */ }
}

// Resolve Telegram file references in media data
// Converts tg:file_id to actual Telegram CDN URLs
// Resolves in batch with a concurrency limit to avoid overwhelming the API
async function resolveMediaUrls(media: any[]): Promise<any[]> {
  const CONCURRENCY = 5
  const results = new Array(media.length)
  let index = 0

  async function processNext(): Promise<void> {
    while (index < media.length) {
      const i = index++
      const img = media[i]
      if (isTelegramRef(img.url)) {
        try {
          const fileId = img.url.replace('tg:', '')
          // Check sessionStorage cache first for faster resolution
          let directUrl: string | null = null
          try {
            directUrl = sessionStorage.getItem(`tg_url_${fileId}`) || null
          } catch { /* ignore */ }
          if (!directUrl) {
            directUrl = await getTelegramFileUrl(fileId)
          }
          if (directUrl) {
            // Cache in sessionStorage
            try { sessionStorage.setItem(`tg_url_${fileId}`, directUrl) } catch { /* ignore */ }
          }
          results[i] = { ...img, url: directUrl || img.url, resolved: !!directUrl }
        } catch {
          results[i] = { ...img, url: img.url, resolved: false }
        }
      } else {
        results[i] = { ...img, resolved: true }
      }
    }
  }

  // Process in parallel with concurrency limit
  const workers = Array.from({ length: Math.min(CONCURRENCY, media.length) }, () => processNext())
  await Promise.all(workers)
  return results
}

const DEFAULT_ALBUMS = [
  'حلقات تحفيظية', 'سرد قرآني', 'دورات سنوية', 'مسابقات سنوية',
  'تكريم', 'احتفالات خريجين', 'متميزين', 'خريجون', 'أخرى',
]

function buildAlbums(media: any[]) {
  const albumMap: Record<string, any[]> = {}
  for (const img of media) {
    if (!albumMap[img.album]) albumMap[img.album] = []
    albumMap[img.album].push(img)
  }
  return DEFAULT_ALBUMS.map((name) => ({
    name,
    count: albumMap[name]?.length || 0,
    images: albumMap[name] || [],
  }))
}

export interface PublicData {
  centerName: string
  totalHalakat: number
  totalStudents: number
  totalActivities: number
  totalImages: number
  halakat: any[]
  branches: { name: string; halakatCount: number; studentsCount: number }[]
  categories: { name: string; count: number }[]
  activities: any[]
  media: any[]
  albums: any[]
  centerInfo: any[]
  attendanceStats: { present: number; absent: number; late: number; total: number }
  attendanceByHalaka: any[]
  todayDate: string
  monthlyRate: Record<string, any>
  competitions: { id: string; title: string; date: string; type: string; participants: string[]; winners: { name: string; rank: string }[] }[]
  graduates: { id: string; batchNumber: number; title: string; date: string; graduateCount: number; graduates: string[]; notes: string }[]
}

export function usePublicData() {
  // Load cached data immediately on mount (lazy initializer)
  const [data, setData] = useState<PublicData | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY)
        if (cacheTime) {
          // Return cached data with timestamp for display
          return { ...parsed, _cachedAt: cacheTime }
        }
        return parsed
      }
    } catch { /* ignore */ }
    return null
  })
  const [loading, setLoading] = useState(() => data === null)
  const [isOffline, setIsOffline] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(() => {
    try {
      const cacheTime = localStorage.getItem(CACHE_TIME_KEY)
      if (cacheTime) {
        return new Date(cacheTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      }
    } catch { /* ignore */ }
    return null
  })
  const [msg, setMsg] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const showMsg = useCallback((m: string, duration = 3000) => {
    setMsg(m)
    setTimeout(() => { if (mountedRef.current) setMsg(null) }, duration)
  }, [])

  // Main data fetching function - reads DIRECTLY from Supabase
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const prevMonthNum = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year

      // Fetch ALL data directly from Supabase in parallel
      const [
        halakat,
        allStudents,
        activities,
        allMedia,
        centerInfo,
        todayAttendance,
        currentMonthAttendance,
        prevMonthAttendance,
        competitionsRaw,
        graduatesRaw,
      ] = await Promise.all([
        sbDirectGet<any>('Halaka', 'order=branch.asc'),
        sbDirectGet<any>('Student', 'select=id,name,age,surah,category,halakaId'),
        sbDirectGet('Activity', 'order=date.desc'),
        sbDirectGet<any>('MediaImage', 'order=createdAt.desc'),
        sbDirectGet('CenterInfo', 'order=section.asc'),
        sbDirectGet<any>('Attendance', `date=eq.${today}`).catch(() => []),
        sbDirectGet<any>('Attendance', `date=gte.${year}-${String(month).padStart(2, '0')}-01&date=lte.${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`).catch(() => []),
        sbDirectGet<any>('Attendance', `date=gte.${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01&date=lte.${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(new Date(prevYear, prevMonthNum, 0).getDate()).padStart(2, '0')}`).catch(() => []),
        sbDirectGet<any>('CenterInfo', 'type=eq.competition&order=createdAt.desc').catch(() => []),
        sbDirectGet<any>('CenterInfo', 'type=eq.graduate_batch&order=createdAt.desc').catch(() => []),
      ])

      // Parse competitions from CenterInfo JSON values
      const competitions = competitionsRaw.map((row: any) => {
        try {
          const parsed = JSON.parse(row.value)
          return {
            id: row.id,
            title: parsed.title || row.key,
            date: parsed.date || '',
            type: row.section === 'مسابقات_داخلية' ? 'داخلية' : 'خارجية',
            participants: Array.isArray(parsed.participants) ? parsed.participants : [],
            winners: Array.isArray(parsed.winners) ? parsed.winners : [],
          }
        } catch { return null }
      }).filter(Boolean)

      // Parse graduates from CenterInfo JSON values
      const graduates = graduatesRaw.map((row: any) => {
        try {
          const parsed = JSON.parse(row.value)
          return {
            id: row.id,
            batchNumber: parsed.batchNumber || 1,
            title: parsed.title || row.key,
            date: parsed.date || '',
            graduateCount: parsed.graduateCount || 0,
            graduates: Array.isArray(parsed.graduates) ? parsed.graduates : [],
            notes: parsed.notes || '',
          }
        } catch { return null }
      }).filter(Boolean)

      // Build student counts per halaka
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
        _count: { students: studentCountMap.get(h.id) || 0 },
      }))

      // Build branch data
      const branchMap: Record<string, { halakatCount: number; studentsCount: number }> = {}
      for (const h of halakat) {
        const branch = h.branch || 'غير محدد'
        if (!branchMap[branch]) branchMap[branch] = { halakatCount: 0, studentsCount: 0 }
        branchMap[branch].halakatCount++
        branchMap[branch].studentsCount += studentCountMap.get(h.id) || 0
      }
      const branches = Object.entries(branchMap).map(([name, data]) => ({ name, ...data }))

      // Build categories
      const categoryMap: Record<string, number> = {}
      for (const s of allStudents) {
        const cat = s.category || 'غير محدد'
        categoryMap[cat] = (categoryMap[cat] || 0) + 1
      }
      const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }))

      // ── Resolve Telegram media URLs BEFORE setting data (prevents flickering!) ──
      let resolvedMedia = allMedia
      if (allMedia.length > 0) {
        try {
          resolvedMedia = await resolveMediaUrls(allMedia)
        } catch (e) {
          console.error('Media URL resolution failed:', e)
        }
      }

      const albums = buildAlbums(resolvedMedia)

      // Compute attendance stats
      const studentMap = new Map(allStudents.map((s: any) => [s.id, s]))
      const halakaMap = new Map(halakat.map((h: any) => [h.id, h]))

      const attendanceStats = { present: 0, absent: 0, late: 0, total: 0 }
      const attendanceByHalakaMap: Record<string, any> = {}

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

      // Compute monthly rate per halaka
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

      const halakaMonthlyRates: Record<string, any> = {}
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

      // Build the final result with ALL data including resolved media URLs
      const result: PublicData = {
        centerName: 'مركز الشفاء لتحفيظ القرآن الكريم',
        totalHalakat: halakat.length,
        totalStudents: allStudents.length,
        totalActivities: activities.length,
        totalImages: allMedia.length,
        halakat: halakatWithCounts,
        branches,
        categories,
        activities,
        media: resolvedMedia,
        albums,
        centerInfo,
        attendanceStats,
        attendanceByHalaka: Object.values(attendanceByHalakaMap),
        todayDate: today,
        monthlyRate: halakaMonthlyRates,
        competitions,
        graduates,
      }

      // Set data ONCE - no intermediate state with unresolved URLs!
      if (mountedRef.current) {
        setData(result)
        saveToCache(result)
        setLoading(false)
        setIsOffline(false)
        setLastUpdate(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (error) {
      if (mountedRef.current) {
        const cached = loadCachedData()
        if (cached) {
          setData(cached)
          setIsOffline(true)
          showMsg('لا يوجد اتصال — عرض البيانات المحفوظة', 4000)
        } else {
          setIsOffline(true)
          showMsg('لا يوجد اتصال بالإنترنت', 4000)
        }
        setLoading(false)
      }
    }
  }, [showMsg])

  // Initial fetch: data is already loaded from cache via lazy initializer
  // Now fetch fresh data in the background
  useEffect(() => {
    mountedRef.current = true
    // Use microtask to avoid React 19's set-state-in-effect warning
    // fetchData calls setData internally which triggers the warning
    const timer = setTimeout(() => { fetchData() }, 0)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      fetchData(true)
    }
    const handleOffline = () => {
      setIsOffline(true)
      showMsg('لا يوجد اتصال بالإنترنت', 4000)
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData(true)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchData, showMsg])

  return {
    data,
    loading,
    isOffline,
    lastUpdate,
    msg,
    refresh: () => fetchData(),
    showMsg,
  }
}
