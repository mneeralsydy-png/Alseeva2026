'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '@/lib/api'
import type {
  DashboardStats,
  Halaka,
  Student,
  AttendanceRecord,
  MediaImage,
  Activity,
  CenterInfoItem,
} from '@/lib/types'

export function useAdminData() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [halakat, setHalakat] = useState<Halaka[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [mediaImages, setMediaImages] = useState<MediaImage[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [centerInfo, setCenterInfo] = useState<CenterInfoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [monthlyRate, setMonthlyRate] = useState<any>(null)

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/api/dashboard'))
      if (r.ok) setStats(await r.json())
    } catch { /* ignore */ }
  }, [])

  const loadHalakat = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/api/halakat'))
      if (r.ok) setHalakat(await r.json())
    } catch { /* ignore */ }
  }, [])

  const loadStudents = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/api/students'))
      if (r.ok) setStudents(await r.json())
    } catch { /* ignore */ }
  }, [])

  const loadMedia = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/api/media'))
      if (r.ok) {
        const d = await r.json()
        setMediaImages(Array.isArray(d) ? d : (d.images || []))
      }
    } catch { /* ignore */ }
  }, [])

  const loadActivities = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/api/activities'))
      if (r.ok) setActivities(await r.json())
    } catch { /* ignore */ }
  }, [])

  const loadCenterInfo = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/api/center-info'))
      if (r.ok) setCenterInfo(await r.json())
    } catch { /* ignore */ }
  }, [])

  const loadMonthlyRate = useCallback(async (month?: string) => {
    try {
      const params = new URLSearchParams()
      if (month) params.set('month', month)
      const r = await fetch(apiUrl(`/api/monthly-rate?${params.toString()}`))
      if (r.ok) setMonthlyRate(await r.json())
    } catch { /* ignore */ }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadStats(), loadHalakat(), loadStudents(), loadMedia(), loadActivities(), loadCenterInfo()])
    setLoading(false)
  }, [loadStats, loadHalakat, loadStudents, loadMedia, loadActivities, loadCenterInfo])

  return {
    stats, halakat, students, mediaImages, activities, centerInfo, loading, monthlyRate,
    loadAll, loadStats, loadHalakat, loadStudents, loadMedia, loadActivities, loadCenterInfo, loadMonthlyRate,
  }
}
