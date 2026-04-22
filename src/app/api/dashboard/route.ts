import { sbGet, sbCount } from '@/lib/supabase'
import { NextResponse } from 'next/server'


// GET dashboard stats
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [totalHalakat, totalStudents, todayAttendanceCount, totalImages, totalActivities, totalPresent] = await Promise.all([
      sbCount('Halaka'),
      sbCount('Student'),
      sbCount('Attendance', `date=eq.${today}`),
      sbCount('MediaImage'),
      sbCount('Activity'),
      sbCount('Attendance', `date=eq.${today}&status=eq.حاضر`),
    ])

    const attendancePercent = totalStudents > 0
      ? Math.round((totalPresent / totalStudents) * 100)
      : 0

    const [recentStudents, recentHalakat, recentActivities] = await Promise.all([
      sbGet('Student', 'select=name,createdAt&order=createdAt.desc&limit=3'),
      sbGet('Halaka', 'select=name,createdAt&order=createdAt.desc&limit=3'),
      sbGet('Activity', 'select=title,createdAt&order=createdAt.desc&limit=3'),
    ])

    return NextResponse.json({
      totalHalakat,
      totalStudents,
      todayAttendance: attendancePercent,
      totalPresent,
      totalImages,
      totalActivities,
      recentStudents,
      recentHalakat,
      recentActivities
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'فشل في تحميل الإحصائيات' }, { status: 500 })
  }
}
