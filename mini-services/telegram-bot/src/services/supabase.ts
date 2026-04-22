// ═══════════════════════════════════════════════════════════════════════════════
// Supabase REST API Client
// Env vars: SUPABASE_URL, SUPABASE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

if (!SUPABASE_URL) throw new Error('SUPABASE_URL env var is required')
if (!SUPABASE_KEY) throw new Error('SUPABASE_KEY env var is required')

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export function uid(): string {
  return crypto.randomUUID()
}

export function now(): string {
  return new Date().toISOString()
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function sbGet(table: string, query?: string): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`
  try {
    const res = await fetch(url, { headers: headers() })
    if (!res.ok) {
      const text = await res.text()
      console.error(`[sbGet] ${table}: ${res.status} — ${text.slice(0, 200)}`)
      return []
    }
    const data = await res.json()
    console.log(`[sbGet] ${table}: ${data.length} rows`)
    return data
  } catch (e: any) {
    console.error(`[sbGet] ${table} FETCH ERROR:`, e?.message || e)
    return []
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function sbPost(table: string, data: Record<string, any>): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ ...data, id: uid(), createdAt: now(), updatedAt: now() }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`[sbPost] ${table}: ${res.status} — ${text.slice(0, 200)}`)
    throw new Error(`POST ${table}: ${res.status}`)
  }
  const result = await res.json()
  return Array.isArray(result) ? result[0] : result
}

// ─── PATCH ───────────────────────────────────────────────────────────────────
export async function sbPatch(table: string, filter: string, data: Record<string, any>): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ ...data, updatedAt: now() }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`[sbPatch] ${table}: ${res.status} — ${text.slice(0, 200)}`)
    throw new Error(`PATCH ${table}: ${res.status}`)
  }
  const result = await res.json()
  return Array.isArray(result) ? result[0] : result
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function sbDelete(table: string, filter: string): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`
  const res = await fetch(url, { method: 'DELETE', headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    console.error(`[sbDelete] ${table}: ${res.status} — ${text.slice(0, 200)}`)
    throw new Error(`DELETE ${table}: ${res.status}`)
  }
}

// ─── Upsert (POST with Prefer: resolution=merge-duplicates) ──────────────────
export async function sbUpsert(table: string, data: Record<string, any>): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify({ ...data, updatedAt: now() }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`[sbUpsert] ${table}: ${res.status} — ${text.slice(0, 200)}`)
    throw new Error(`UPSERT ${table}: ${res.status}`)
  }
  const result = await res.json()
  return Array.isArray(result) ? result[0] : result
}
