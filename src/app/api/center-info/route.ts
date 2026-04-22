import { sbGet, sbPost, sbPatch, sbDelete } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'


// GET all center info
export async function GET() {
  try {
    const info = await sbGet('CenterInfo', 'order=section.asc')
    return NextResponse.json(info)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في تحميل البيانات' }, { status: 500 })
  }
}

// POST create new info item (supports JSON and FormData for image upload)
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const key = formData.get('key') as string
      const section = formData.get('section') as string || 'عام'
      const file = formData.get('file') as File

      if (!key || !file) {
        return NextResponse.json({ error: 'المفتاح والصورة مطلوبان' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const mimeType = file.type || 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${base64}`

      const filename = `center-${Date.now()}-${file.name}`

      // Also save locally
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadDir, { recursive: true })
        await writeFile(path.join(uploadDir, filename), buffer)
      } catch {
        // ignore
      }

      const info = await sbPost('CenterInfo', { key, value: dataUrl, type: 'image', section })
      return NextResponse.json(info, { status: 201 })
    }

    // Handle JSON body
    const body = await request.json()
    const { key, value, type, section } = body
    if (!key || !value) {
      return NextResponse.json({ error: 'المفتاح والقيمة مطلوبان' }, { status: 400 })
    }
    const info = await sbPost('CenterInfo', { key, value, type: type || 'text', section: section || 'عام' })
    return NextResponse.json(info, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'فشل في إنشاء العنصر' }, { status: 500 })
  }
}

// PUT update info item (supports JSON and FormData)
export async function PUT(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const id = formData.get('id') as string
      const key = formData.get('key') as string
      const section = formData.get('section') as string || 'عام'
      const file = formData.get('file') as File

      if (!id) {
        return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
      }

      if (file) {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const mimeType = file.type || 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64}`

        const info = await sbPatch('CenterInfo', `id=eq.${id}`, { key, value: dataUrl, type: 'image', section })
        return NextResponse.json(info)
      }

      // No file, just update text fields
      const value = formData.get('value') as string || ''
      const type = formData.get('type') as string || 'text'
      const info = await sbPatch('CenterInfo', `id=eq.${id}`, { key, value, type, section })
      return NextResponse.json(info)
    }

    // Handle JSON body
    const body = await request.json()
    const { id, key, value, type, section } = body
    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    }
    const info = await sbPatch('CenterInfo', `id=eq.${id}`, { key, value, type, section })
    return NextResponse.json(info)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في تحديث العنصر' }, { status: 500 })
  }
}

// DELETE info item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    }
    await sbDelete('CenterInfo', `id=eq.${id}`)
    return NextResponse.json({ message: 'تم الحذف بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'فشل في حذف العنصر' }, { status: 500 })
  }
}
