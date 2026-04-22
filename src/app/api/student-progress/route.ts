import { sbGet, sbPost, sbPatch } from '@/lib/supabase'
import { NextResponse } from 'next/server'


// ── Helper: Get or create a progress record for a month ────
// Key pattern: "student_progress_YYYY-MM"
// Value: JSON string of { [studentId_monthKey]: { fromSurah: string, toSurah: string } }

async function getProgressData(month: string): Promise<Record<string, { fromSurah: string; toSurah: string }>> {
  try {
    const records = await sbGet<any>('CenterInfo', `key=eq.student_progress_${encodeURIComponent(month)}`)
    if (records.length > 0 && records[0].value) {
      return JSON.parse(records[0].value)
    }
  } catch (e) {
    console.error('Load progress error:', e)
  }
  return {}
}

async function saveProgressData(month: string, data: Record<string, { fromSurah: string; toSurah: string }>): Promise<void> {
  const key = `student_progress_${month}`
  const value = JSON.stringify(data)
  
  try {
    const existing = await sbGet<any>('CenterInfo', `key=eq.${encodeURIComponent(key)}`)
    if (existing.length > 0) {
      await sbPatch('CenterInfo', `id=eq.${existing[0].id}`, { value })
    } else {
      await sbPost('CenterInfo', { key, value, section: 'تقدم الحفظ', type: 'text' })
    }
  } catch (e) {
    console.error('Save progress error:', e)
    throw e
  }
}

// ── GET /api/student-progress?month=YYYY-MM ────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    if (!month) {
      return NextResponse.json({ error: 'معرف الشهر مطلوب' }, { status: 400 })
    }
    const data = await getProgressData(month)
    return NextResponse.json({ month, progress: data })
  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json({ progress: {} })
  }
}

// ── POST /api/student-progress ─────────────────────────────
// Body: { month: string, progress: Record<string, { fromSurah: string, toSurah: string }> }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { month, progress } = body
    if (!month || !progress) {
      return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 })
    }
    await saveProgressData(month, progress)
    return NextResponse.json({ success: true, month })
  } catch (error) {
    console.error('Save progress error:', error)
    return NextResponse.json({ error: 'فشل في حفظ البيانات' }, { status: 500 })
  }
}
