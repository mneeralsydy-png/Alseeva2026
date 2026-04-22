import { sbGet, sbPost, sbPatch, sbDelete } from '@/lib/supabase'
import { NextResponse } from 'next/server'


// GET all students (no embedded relations - fetch halaka info separately)
export async function GET() {
  try {
    const students = await sbGet<any>('Student', 'order=createdAt.desc')

    // Fetch all halakat for lookup
    const halakat = await sbGet<any>('Halaka', 'select=id,name,teacher,branch')
    const halakaMap = new Map(halakat.map((h: any) => [h.id, h]))

    // Enrich students with halaka info manually
    const enriched = students.map((s: any) => ({
      ...s,
      halaka: s.halakaId ? halakaMap.get(s.halakaId) || null : null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Fetch students error:', error)
    return NextResponse.json({ error: 'فشل في تحميل الطلاب' }, { status: 500 })
  }
}

// POST create student
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, age, surah, category, parentName, parentPhone, level, halakaId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'اسم الطالب مطلوب' },
        { status: 400 }
      )
    }

    const student = await sbPost('Student', {
      name,
      age: age ? parseInt(age) : null,
      surah: surah || '',
      category: category || '1-10',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      level: level || 'مبتدئ',
      halakaId: halakaId || null
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json({ error: 'فشل في إضافة الطالب' }, { status: 500 })
  }
}

// PUT update student
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, age, surah, category, parentName, parentPhone, level, halakaId } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 })
    }

    const student = await sbPatch('Student', `id=eq.${id}`, {
      name,
      age: age ? parseInt(age) : null,
      surah: surah || '',
      category: category || '1-10',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      level,
      halakaId: halakaId || null
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'فشل في تحديث بيانات الطالب' }, { status: 500 })
  }
}

// DELETE student
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 })
    }

    await sbDelete('Student', `id=eq.${id}`)
    return NextResponse.json({ message: 'تم حذف الطالب بنجاح' })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'فشل في حذف الطالب' }, { status: 500 })
  }
}
