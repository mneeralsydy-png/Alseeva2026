import { NextResponse } from 'next/server'


const BOT_TOKEN = process.env.BOT_TOKEN!
const CHANNEL_ID = process.env.CHANNEL_ID || ''
const BOT_SERVICE_URL = 'http://localhost:3030'

// GET /api/telegram — Get bot status (checks both token validity AND mini-service)
export async function GET() {
  try {
    // 1. Check bot token validity
    const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!meRes.ok) {
      return NextResponse.json({
        status: 'offline',
        message: 'توكن البوت غير صالح',
        configured: false,
      })
    }
    const botInfo = await meRes.json()
    if (!botInfo.ok) {
      return NextResponse.json({
        status: 'offline',
        message: botInfo.description || 'خدمة البوت غير متصلة',
        configured: false,
      })
    }

    // 2. Check mini-service health
    let serviceOnline = false
    let serviceInfo: any = null
    try {
      const healthRes = await fetch(`${BOT_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(3000),
      })
      if (healthRes.ok) {
        serviceOnline = true
        serviceInfo = await healthRes.json()
      }
    } catch {
      // Mini-service not running, but bot token is valid
    }

    return NextResponse.json({
      status: 'online',
      bot: botInfo.result,
      channel: CHANNEL_ID,
      storage: 'telegram',
      configured: true,
      serviceOnline,
      serviceInfo,
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'offline',
      message: err?.name === 'TimeoutError' ? 'انتهت مهلة الاتصال' : 'خدمة البوت غير متصلة',
      configured: false,
    })
  }
}

// POST /api/telegram — Manage bot
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Register a chat
    if (body.action === 'register-chat') {
      try {
        const res = await fetch(`${BOT_SERVICE_URL}/register-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        })
        return NextResponse.json(await res.json())
      } catch {
        return NextResponse.json({ error: 'خدمة البوت غير متصلة' }, { status: 503 })
      }
    }

    return NextResponse.json({ success: true, action: body.action })
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في خدمة البوت' }, { status: 500 })
  }
}
