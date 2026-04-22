import { sbGet } from '@/lib/supabase'
import { NextResponse } from 'next/server'


export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    const admins = await sbGet('Admin', `username=eq.${encodeURIComponent(username)}`)
    const admin = admins[0]

    if (!admin) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    if (password !== admin.password) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // Determine role: Hi user gets viewer role, everyone else gets admin role
    const role = username === 'Hi' ? 'viewer' : 'admin'

    return NextResponse.json({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    )
  }
}
