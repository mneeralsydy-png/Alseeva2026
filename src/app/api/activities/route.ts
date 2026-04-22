import { sbGet, sbPost, sbPatch, sbDelete } from '@/lib/supabase'
import { NextResponse } from 'next/server'


// GET all activities
export async function GET() {
  try {
    const activities = await sbGet('Activity', 'order=createdAt.desc')
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Fetch activities error:', error)
    return NextResponse.json({ error: 'فشل في تحميل الأنشطة' }, { status: 500 })
  }
}

// POST create activity
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, date, type } = body

    if (!title || !date) {
      return NextResponse.json(
        { error: 'عنوان النشاط والتاريخ مطلوبان' },
        { status: 400 }
      )
    }

    const activity = await sbPost('Activity', {
      title,
      description,
      date,
      type: type || 'عامة'
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'فشل في إنشاء النشاط' }, { status: 500 })
  }
}

// PUT update activity
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, title, description, date, type } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف النشاط مطلوب' }, { status: 400 })
    }

    const activity = await sbPatch('Activity', `id=eq.${id}`, { title, description, date, type })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Update activity error:', error)
    return NextResponse.json({ error: 'فشل في تحديث النشاط' }, { status: 500 })
  }
}

// DELETE activity
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف النشاط مطلوب' }, { status: 400 })
    }

    await sbDelete('Activity', `id=eq.${id}`)
    return NextResponse.json({ message: 'تم حذف النشاط بنجاح' })
  } catch (error) {
    console.error('Delete activity error:', error)
    return NextResponse.json({ error: 'فشل في حذف النشاط' }, { status: 500 })
  }
}
