import { sbGet, sbPost, sbDelete } from '@/lib/supabase'
import { NextResponse } from 'next/server'


const BOT_TOKEN = '8432772266:AAEYLFX34FiAxIqhTBS59-d06PUJORbWP6w'
const CHANNEL_ID = '-1003778275232'

// Helper: get image display URL from telegram file_id
function getImageUrl(media: any): string {
  const url = media.url || ''
  if (url.startsWith('tg:')) {
    const fileId = url.replace('tg:', '')
    return `/api/telegram/image-proxy?file_id=${encodeURIComponent(fileId)}`
  }
  return url
}

// GET all images
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const album = searchParams.get('album')

    let query = 'order=createdAt.desc'
    if (album) {
      query = `album=eq.${encodeURIComponent(album)}&${query}`
    }

    const images = await sbGet<any>('MediaImage', query)

    const imagesWithUrls = images.map(img => ({
      ...img,
      displayUrl: getImageUrl(img),
    }))

    if (!album) {
      const albumCounts: Record<string, number> = {}
      for (const img of images) {
        const a = img.album || 'بدون ألبوم'
        albumCounts[a] = (albumCounts[a] || 0) + 1
      }
      const albums = Object.entries(albumCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, count]) => ({ album: name, _count: { id: count } }))

      return NextResponse.json({ images: imagesWithUrls, albums })
    }

    return NextResponse.json({ images: imagesWithUrls, albums: [] })
  } catch (error) {
    console.error('Fetch media error:', error)
    return NextResponse.json({ error: 'فشل في تحميل الصور' }, { status: 500 })
  }
}

// POST upload image — sends to Telegram channel directly, stores metadata only
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const album = formData.get('album') as string
    const file = formData.get('file') as File

    if (!album || !file) {
      return NextResponse.json({ error: 'الألبوم والملف مطلوبان' }, { status: 400 })
    }

    // Send photo to Telegram channel directly via Bot API
    const bytes = await file.arrayBuffer()
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)
    const body = []
    body.push(`--${boundary}`)
    body.push(`Content-Disposition: form-data; name="chat_id"`)
    body.push('')
    body.push(CHANNEL_ID)
    body.push(`--${boundary}`)
    body.push(`Content-Disposition: form-data; name="caption"`)
    body.push('')
    body.push(`📁 ${album}\n📅 ${new Date().toLocaleDateString('ar-SA')}`)
    body.push(`--${boundary}`)
    body.push(`Content-Disposition: form-data; name="photo"; filename="${file.name}"`)
    body.push(`Content-Type: ${file.type || 'image/jpeg'}`)
    body.push('')
    // Binary data placeholder
    const beforeBinary = body.join('\r\n') + '\r\n'
    const afterBinary = `\r\n--${boundary}--\r\n`

    const binaryBuffer = Buffer.from(beforeBinary + afterBinary)
    const binaryArray = new Uint8Array(binaryBuffer)
    const fileBuffer = new Uint8Array(bytes)
    
    // Construct the multipart body properly
    const encoder = new TextEncoder()
    const beforeBytes = encoder.encode(beforeBinary)
    const afterBytes = encoder.encode(afterBinary)
    
    const fullBody = new Uint8Array(beforeBytes.length + fileBuffer.length + afterBytes.length)
    fullBody.set(beforeBytes, 0)
    fullBody.set(fileBuffer, beforeBytes.length)
    fullBody.set(afterBytes, beforeBytes.length + fileBuffer.length)

    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: fullBody,
      }
    )

    if (!tgRes.ok) {
      const errText = await tgRes.text()
      console.error('Telegram API error:', errText)
      return NextResponse.json({ error: 'فشل في إرسال الصورة للقناة' }, { status: 500 })
    }

    const tgData = await tgRes.json()
    if (!tgData.ok) {
      console.error('Telegram API response error:', tgData)
      return NextResponse.json({ error: tgData.description || 'فشل في إرسال الصورة' }, { status: 500 })
    }

    // Get file_id from the response
    const photo = tgData.result?.photo
    const highestRes = photo ? photo[photo.length - 1] : null
    const telegramFileId = highestRes?.file_id

    if (!telegramFileId) {
      return NextResponse.json({ error: 'لم يتم الحصول على معرف الملف' }, { status: 500 })
    }

    // Store metadata only in DB
    const filename = `tg-${Date.now()}-${telegramFileId.slice(0, 8)}.jpg`

    try {
      await sbPost('MediaImage', {
        album,
        filename,
        url: `tg:${telegramFileId}`,
        source: 'web-upload',
        telegramMessageId: tgData.result?.message_id,
      })
    } catch (saveErr: any) {
      console.error('Save metadata error:', saveErr)
      try {
        await sbPost('MediaImage', { album, filename, url: `tg:${telegramFileId}` })
      } catch (saveErr2) {
        console.error('Save metadata retry error:', saveErr2)
      }
    }

    return NextResponse.json({
      id: filename,
      album,
      filename,
      url: `tg:${telegramFileId}`,
      displayUrl: `/api/telegram/image-proxy?file_id=${encodeURIComponent(telegramFileId)}`,
      source: 'web-upload',
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Upload media error:', error)
    return NextResponse.json({ error: 'فشل في رفع الصورة' }, { status: 500 })
  }
}

// DELETE image
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف الصورة مطلوب' }, { status: 400 })
    }

    await sbDelete('MediaImage', `id=eq.${id}`)
    return NextResponse.json({ message: 'تم حذف الصورة بنجاح' })
  } catch (error) {
    console.error('Delete media error:', error)
    return NextResponse.json({ error: 'فشل في حذف الصورة' }, { status: 500 })
  }
}
