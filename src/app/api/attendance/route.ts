import { sbGet, sbPost, sbPatch } from '@/lib/supabase'
import { NextResponse } from 'next/server'


// GET attendance records (no embedded relations)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const halakaId = searchParams.get('halakaId')

    // Build query filters
    const filters: string[] = []
    if (date) filters.push(`date=eq.${date}`)
    if (halakaId) filters.push(`halakaId=eq.${halakaId}`)
    const query = filters.length > 0 ? filters.join('&') + '&order=createdAt.desc' : 'order=createdAt.desc'

    const attendance = await sbGet<any>('Attendance', query)

    // Fetch students and halakat for enrichment
    const [students, halakat] = await Promise.all([
      sbGet<any>('Student', 'select=id,name'),
      sbGet<any>('Halaka', 'select=id,name,branch'),
    ])
    const studentMap = new Map(students.map((s: any) => [s.id, s]))
    const halakaMap = new Map(halakat.map((h: any) => [h.id, h]))

    // Enrich attendance records
    const enriched = attendance.map((a: any) => ({
      ...a,
      student: a.studentId ? studentMap.get(a.studentId) || null : null,
      halaka: a.halakaId ? halakaMap.get(a.halakaId) || null : null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Fetch attendance error:', error)
    return NextResponse.json({ error: 'فشل في تحميل سجل الحضور' }, { status: 500 })
  }
}

// POST save attendance (batch with upsert logic)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, halakaId, records } = body

    if (!date || !records || records.length === 0) {
      return NextResponse.json(
        { error: 'التاريخ وسجل الحضور مطلوبان' },
        { status: 400 }
      )
    }

    let count = 0

    for (const record of records) {
      const { studentId, status, notes } = record

      // Check if record already exists for this student on this date
      const existing = await sbGet('Attendance', `studentId=eq.${studentId}&date=eq.${date}`)

      if (existing.length > 0) {
        // Update existing record
        await sbPatch('Attendance', `studentId=eq.${studentId}&date=eq.${date}`, {
          status: status || 'حاضر',
          notes: notes || '',
          halakaId: halakaId || null
        })
      } else {
        // Create new record
        await sbPost('Attendance', {
          date,
          studentId,
          halakaId: halakaId || null,
          status: status || 'حاضر',
          notes: notes || ''
        })
      }

      count++
    }

    return NextResponse.json({ message: 'تم حفظ الحضور بنجاح', count })
  } catch (error) {
    console.error('Save attendance error:', error)
    return NextResponse.json({ error: 'فشل في حفظ الحضور' }, { status: 500 })
  }
}
