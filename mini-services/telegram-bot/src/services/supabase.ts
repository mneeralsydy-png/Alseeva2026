// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Client — REST API Wrapper
// All env vars from GitHub Secrets (no hardcoded values)
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!

if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL env var is required')
if (!SUPABASE_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY env var is required')

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
export async function sbGet<T = any>(table: string, query?: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GET ${table}: ${res.status} — ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ─── POST (create) ────────────────────────────────────────────────────────────
export async function sbPost<T = any>(table: string, data: Record<string, unknown>): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ ...data, id: uid(), createdAt: now(), updatedAt: now() }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`POST ${table}: ${res.status} — ${text.slice(0, 200)}`)
  }
  const result = await res.json()
  return Array.isArray(result) ? result[0] : result
}

// ─── PATCH (update) ──────────────────────────────────────────────────────────
export async function sbPatch<T = any>(table: string, filter: string, data: Record<string, unknown>): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ ...data, updatedAt: now() }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PATCH ${table}: ${res.status} — ${text.slice(0, 200)}`)
  }
  const result = await res.json()
  return Array.isArray(result) ? result[0] : result
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function sbDelete(table: string, filter: string): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`
  const res = await fetch(url, { method: 'DELETE', headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DELETE ${table}: ${res.status} — ${text.slice(0, 200)}`)
  }
}
