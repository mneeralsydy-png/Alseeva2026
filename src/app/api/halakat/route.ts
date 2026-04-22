import { sbGet, sbPost, sbPatch, sbDelete, sbCount } from '@/lib/supabase'
import { NextResponse } from 'next/server'


// GET all halakat with student counts (no embedded relations)
export async function GET() {
  try {
    const halakat = await sbGet<any>('Halaka', 'order=createdAt.desc')

    // Count students per halaka using separate query
    const allStudents = await sbGet<any>('Student', 'select=halakaId')
    const studentCountMap = new Map<string, number>()
    for (const s of allStudents) {
      if (s.halakaId) {
        studentCountMap.set(s.halakaId, (studentCountMap.get(s.halakaId) || 0) + 1)
      }
    }

    // Enrich with student counts
    const enriched = halakat.map((h: any) => ({
      ...h,
      _count: { students: studentCountMap.get(h.id) || 0 }
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Fetch halakat error:', error)
    return NextResponse.json({ error: 'فشل في تحميل الحلقات' }, { status: 500 })
  }
}

// POST create halaka
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, teacher, time, location, branch, description } = body

    if (!name || !teacher) {
      return NextResponse.json(
        { error: 'اسم الحلقة والمعلم مطلوبان' },
        { status: 400 }
      )
    }

    const halaka = await sbPost('Halaka', {
      name,
      teacher,
      time: time || '',
      location: location || '',
      branch: branch || 'السرور',
      description
    })

    return NextResponse.json(halaka, { status: 201 })
  } catch (error) {
    console.error('Create halaka error:', error)
    return NextResponse.json({ error: 'فشل في إنشاء الحلقة' }, { status: 500 })
  }
}

// PUT update halaka
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, teacher, time, location, branch, description } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف الحلقة مطلوب' }, { status: 400 })
    }

    const halaka = await sbPatch('Halaka', `id=eq.${id}`, { name, teacher, time, location, branch, description })

    return NextResponse.json(halaka)
  } catch (error) {
    console.error('Update halaka error:', error)
    return NextResponse.json({ error: 'فشل في تحديث الحلقة' }, { status: 500 })
  }
}

// DELETE halaka
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف الحلقة مطلوب' }, { status: 400 })
    }

    await sbDelete('Halaka', `id=eq.${id}`)
    return NextResponse.json({ message: 'تم حذف الحلقة بنجاح' })
  } catch (error) {
    console.error('Delete halaka error:', error)
    return NextResponse.json({ error: 'فشل في حذف الحلقة' }, { status: 500 })
  }
}
