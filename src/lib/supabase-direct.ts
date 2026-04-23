// Direct Supabase REST client for client-side usage
// This reads directly from Supabase WITHOUT going through the Next.js server
// Used by the viewer/public app to be resilient against server downtime

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ntshduvxdehefxmchusw.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_nnhQkb5fX6SPZ7Nx8L7rcg_r-BDxd-M'

// Detect Capacitor native environment
function isNativeApp(): boolean {
  try {
    if (typeof window === 'undefined') return false
    const proto = window.location?.protocol?.toLowerCase()
    if (proto === 'capacitor:' || proto === 'ionic:') return true
    const cap = (window as any).Capacitor
    if (cap && (cap.isNativePlatform?.() || cap.platform === 'android' || cap.platform === 'ios')) return true
  } catch { /* ignore */ }
  return false
}

function headers(extra?: Record<string, string>) {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...extra,
  }
}

// Direct GET from Supabase - works from client-side without server
// Enhanced with timeout and retry logic for Capacitor/Android WebView
export async function sbDirectGet<T = any>(table: string, query?: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

  try {
    console.log(`[Supabase] GET ${table}${query ? ' ?' + query : ''} (native: ${isNativeApp()})`)
    const res = await fetch(url, {
      headers: headers(),
      signal: controller.signal,
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error(`[Supabase] Error ${res.status} for ${table}: ${errorText}`)
      throw new Error(`Supabase direct GET ${table} error ${res.status}: ${errorText}`)
    }

    const data = await res.json()
    console.log(`[Supabase] OK ${table}: ${Array.isArray(data) ? data.length + ' rows' : typeof data}`)
    return data
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[Supabase] Timeout fetching ${table} (15s)`)
      throw new Error(`Timeout fetching ${table}`)
    }
    // Log network errors for debugging in APK
    console.error(`[Supabase] Network error for ${table}:`, error?.message || error)
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

// Direct COUNT from Supabase
export async function sbDirectCount(table: string, query?: string): Promise<number> {
  const q = query ? query + '&' : ''
  const url = `${SUPABASE_URL}/rest/v1/${table}?${q}select=count`
  const res = await fetch(url, {
    headers: headers({ Prefer: 'count=exact', Range: '0-0' }),
  })
  const range = res.headers.get('content-range')
  if (range) {
    const total = range.split('/')[1]
    if (total === '*') {
      const data = await sbDirectGet(table, query)
      return data.length
    }
    return parseInt(total) || 0
  }
  const data = await sbDirectGet(table, query)
  return data.length
}

// Telegram Bot API - direct client-side access for media files
// The Telegram Bot API is publicly accessible, so the app can fetch media directly
const BOT_TOKEN = process.env.NEXT_PUBLIC_BOT_TOKEN || ''

// Get Telegram file direct URL (2-step process: getFile → build URL)
export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  if (!BOT_TOKEN) {
    console.warn('[Telegram] BOT_TOKEN not configured')
    return null
  }
  try {
    // Step 1: Get file path from Telegram
    const infoRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`
    )
    if (!infoRes.ok) return null
    const info = await infoRes.json()
    if (!info.ok || !info.result?.file_path) return null

    // Step 2: Build direct URL (Telegram CDN)
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${info.result.file_path}`
  } catch {
    return null
  }
}

// Resolve media URL - handles both tg: prefixed and regular URLs
// Returns a function that lazily resolves Telegram file IDs
export function resolveMediaUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('tg:')) {
    // For Telegram files, we'll resolve lazily when needed
    // Return the raw URL - the image component will handle it
    return url
  }
  return url
}

// Check if a URL is a Telegram file reference that needs resolution
export function isTelegramRef(url: string): boolean {
  return url?.startsWith('tg:') || false
}

// Supabase Realtime - subscribe to table changes
// Returns an unsubscribe function
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: string
): () => void {
  try {
    // Import dynamically to avoid SSR issues
    const wsUrl = `${SUPABASE_URL.replace('https://', 'wss://')}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      // Join the realtime channel
      const joinMsg = JSON.stringify({
        topic: `realtime:${table}`,
        event: 'phx_join',
        payload: {},
        ref: '1',
      })
      ws.send(joinMsg)

      // Subscribe to changes
      const subMsg = JSON.stringify({
        topic: `realtime:${table}`,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
            postgres_changes: [
              {
                event: '*',
                schema: 'public',
                table: table,
                filter: filter || '',
              },
            ],
          },
        },
        ref: '2',
      })
      ws.send(subMsg)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'postgres_changes' && data.payload) {
          callback(data.payload)
        }
      } catch { /* ignore parse errors */ }
    }

    ws.onerror = () => {
      // Connection error - silent fail, polling will handle updates
    }

    ws.onclose = () => {
      // Connection closed - silent fail
    }

    // Return unsubscribe function
    return () => {
      try { ws.close() } catch { /* ignore */ }
    }
  } catch {
    // If WebSocket is not available, return no-op
    return () => {}
  }
}
