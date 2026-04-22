import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase'


const BOT_TOKEN = '8432772266:AAEYLFX34FiAxIqhTBS59-d06PUJORbWP6w'

// GET /api/telegram/imports — Get images from DB
export async function GET() {
  try {
    const images = await sbGet('MediaImage', 'order=createdAt.desc&limit=100')
    const tgImages = images.filter((i: any) => i.url?.startsWith('tg:')).map((i: any) => ({
      ...i,
      displayUrl: `/api/telegram/image-proxy?file_id=${encodeURIComponent(i.url.replace('tg:', ''))}`,
    }))
    return NextResponse.json({ images: tgImages })
  } catch {
    return NextResponse.json({ images: [] })
  }
}

// POST /api/telegram/imports — Sync
export async function POST() {
  try {
    const images = await sbGet('MediaImage', 'order=createdAt.desc&limit=100')
    const tgImages = images.filter((i: any) => i.url?.startsWith('tg:'))
    return NextResponse.json({ synced: tgImages.length, message: `تمت مزامنة ${tgImages.length} صورة` })
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في خدمة الاستيراد' }, { status: 500 })
  }
}
