import { sbGet, sbPost, sbCount } from '@/lib/supabase'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const count = await sbCount('Admin')

    if (count === 0) {
      await sbPost('Admin', {
        username: 'Am2026',
        password: 'A777A777',
        name: 'المدير'
      })
    }

    // Seed public viewer
    const publicAdmins = await sbGet('Admin', 'username=eq.Hi')
    if (publicAdmins.length === 0) {
      await sbPost('Admin', { username: 'Hi', password: 'Hi123', name: 'العرض العام' })
    }

    return NextResponse.json({ message: 'Seed completed' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
