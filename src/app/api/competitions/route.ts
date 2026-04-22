import { sbGet, sbPost, sbPatch, sbDelete } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic"

// GET all competitions
export async function GET() {
  try {
    const rows = await sbGet<any>('CenterInfo', 'type=eq.competition&order=createdAt.desc')
    const competitions = rows.map((row: any) => {
      let parsed: any = {}
      try {
        parsed = JSON.parse(row.value)
      } catch {
        parsed = {}
      }
      return {
        id: row.id,
        title: parsed.title || row.key,
        date: parsed.date || '',
        type: row.section === 'مسابقات_داخلية' ? 'داخلية' as const : 'خارجية' as const,
        participants: Array.isArray(parsed.participants) ? parsed.participants : [],
        winners: Array.isArray(parsed.winners) ? parsed.winners : [],
        createdAt: row.createdAt,
      }
    })
    return NextResponse.json(competitions)
  } catch (error) {
    console.error('Fetch competitions error:', error)
    return NextResponse.json({ error: 'فشل في تحميل المسابقات' }, { status: 500 })
  }
}

// POST create competition
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, type, date, participants, winners } = body

    if (!title || !date) {
      return NextResponse.json(
        { error: 'عنوان المسابقة والتاريخ مطلوبان' },
        { status: 400 }
      )
    }

    const section = type === 'داخلية' ? 'مسابقات_داخلية' : 'مسابقات_خارجية'
    const value = JSON.stringify({ title, date, participants: participants || [], winners: winners || [] })

    const entry = await sbPost('CenterInfo', {
      key: title,
      value,
      type: 'competition',
      section,
    })

    return NextResponse.json({
      id: entry.id,
      title,
      date,
      type,
      participants: participants || [],
      winners: winners || [],
      createdAt: entry.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Create competition error:', error)
    return NextResponse.json({ error: 'فشل في إنشاء المسابقة' }, { status: 500 })
  }
}

// PUT update competition
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, title, type, date, participants, winners } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف المسابقة مطلوب' }, { status: 400 })
    }

    const section = type === 'داخلية' ? 'مسابقات_داخلية' : 'مسابقات_خارجية'
    const value = JSON.stringify({ title, date, participants: participants || [], winners: winners || [] })

    const entry = await sbPatch('CenterInfo', `id=eq.${id}`, {
      key: title,
      value,
      type: 'competition',
      section,
    })

    return NextResponse.json({
      id: entry.id,
      title,
      date,
      type,
      participants: participants || [],
      winners: winners || [],
      createdAt: entry.createdAt,
    })
  } catch (error) {
    console.error('Update competition error:', error)
    return NextResponse.json({ error: 'فشل في تحديث المسابقة' }, { status: 500 })
  }
}

// DELETE competition
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف المسابقة مطلوب' }, { status: 400 })
    }

    await sbDelete('CenterInfo', `id=eq.${id}`)
    return NextResponse.json({ message: 'تم حذف المسابقة بنجاح' })
  } catch (error) {
    console.error('Delete competition error:', error)
    return NextResponse.json({ error: 'فشل في حذف المسابقة' }, { status: 500 })
  }
}
