import { sbGet, sbPost, sbPatch, sbDelete } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic"

// GET all graduate batches
export async function GET() {
  try {
    const rows = await sbGet<any>('CenterInfo', 'type=eq.graduate_batch&order=createdAt.desc')
    const batches = rows.map((row: any) => {
      let parsed: any = {}
      try {
        parsed = JSON.parse(row.value)
      } catch {
        parsed = {}
      }
      return {
        id: row.id,
        batchNumber: parsed.batchNumber || 1,
        title: parsed.title || row.key,
        date: parsed.date || '',
        graduateCount: parsed.graduateCount || 0,
        graduates: Array.isArray(parsed.graduates) ? parsed.graduates : [],
        notes: parsed.notes || '',
        createdAt: row.createdAt,
      }
    })
    return NextResponse.json(batches)
  } catch (error) {
    console.error('Fetch graduates error:', error)
    return NextResponse.json({ error: 'فشل في تحميل الخريجين' }, { status: 500 })
  }
}

// POST create graduate batch
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { batchNumber, title, date, graduates, notes } = body

    if (!title || !date) {
      return NextResponse.json(
        { error: 'عنوان الدفعة والتاريخ مطلوبان' },
        { status: 400 }
      )
    }

    const value = JSON.stringify({
      batchNumber: batchNumber || 1,
      title,
      date,
      graduateCount: Array.isArray(graduates) ? graduates.length : 0,
      graduates: graduates || [],
      notes: notes || '',
    })

    const entry = await sbPost('CenterInfo', {
      key: `دفعة_${batchNumber || 1}_${title}`,
      value,
      type: 'graduate_batch',
      section: 'خريجين',
    })

    return NextResponse.json({
      id: entry.id,
      batchNumber: batchNumber || 1,
      title,
      date,
      graduateCount: Array.isArray(graduates) ? graduates.length : 0,
      graduates: graduates || [],
      notes: notes || '',
      createdAt: entry.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Create graduate batch error:', error)
    return NextResponse.json({ error: 'فشل في إنشاء الدفعة' }, { status: 500 })
  }
}

// PUT update graduate batch
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, batchNumber, title, date, graduates, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف الدفعة مطلوب' }, { status: 400 })
    }

    const value = JSON.stringify({
      batchNumber: batchNumber || 1,
      title,
      date,
      graduateCount: Array.isArray(graduates) ? graduates.length : 0,
      graduates: graduates || [],
      notes: notes || '',
    })

    const entry = await sbPatch('CenterInfo', `id=eq.${id}`, {
      key: `دفعة_${batchNumber || 1}_${title}`,
      value,
      type: 'graduate_batch',
      section: 'خريجين',
    })

    return NextResponse.json({
      id: entry.id,
      batchNumber: batchNumber || 1,
      title,
      date,
      graduateCount: Array.isArray(graduates) ? graduates.length : 0,
      graduates: graduates || [],
      notes: notes || '',
      createdAt: entry.createdAt,
    })
  } catch (error) {
    console.error('Update graduate batch error:', error)
    return NextResponse.json({ error: 'فشل في تحديث الدفعة' }, { status: 500 })
  }
}

// DELETE graduate batch
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف الدفعة مطلوب' }, { status: 400 })
    }

    await sbDelete('CenterInfo', `id=eq.${id}`)
    return NextResponse.json({ message: 'تم حذف الدفعة بنجاح' })
  } catch (error) {
    console.error('Delete graduate batch error:', error)
    return NextResponse.json({ error: 'فشل في حذف الدفعة' }, { status: 500 })
  }
}
