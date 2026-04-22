import { NextResponse } from 'next/server'


const BOT_TOKEN = process.env.BOT_TOKEN!

// GET /api/telegram/image-proxy — Proxy image from Telegram Bot API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('file_id')

    if (!fileId) {
      return NextResponse.json({ error: 'file_id required' }, { status: 400 })
    }

    // Get file path from Telegram
    const fileInfoRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`
    )

    if (!fileInfoRes.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileInfo = await fileInfoRes.json()
    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      return NextResponse.json({ error: 'File path not available' }, { status: 404 })
    }

    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`

    // Fetch the actual file
    const imgRes = await fetch(fileUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    const buffer = await imgRes.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json({ error: 'فشل في تحميل الصورة' }, { status: 500 })
  }
}
