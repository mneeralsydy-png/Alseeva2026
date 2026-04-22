const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

function headers(extra?: Record<string, string>) {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function uid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

// GET with optional query
export async function sbGet<T = any>(table: string, query?: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase GET ${table} error ${res.status}: ${text}`)
  }
  return res.json()
}

// POST create
export async function sbPost<T = any>(table: string, data: Record<string, unknown>): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ ...data, id: uid(), createdAt: now(), updatedAt: now() }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase POST ${table} error ${res.status}: ${text}`)
  }
  const result = await res.json()
  return result[0]
}

// PATCH update
export async function sbPatch<T = any>(table: string, filter: string, data: Record<string, unknown>): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ ...data, updatedAt: now() }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase PATCH ${table} error ${res.status}: ${text}`)
  }
  const result = await res.json()
  return result[0]
}

// DELETE
export async function sbDelete(table: string, filter: string): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`
  const res = await fetch(url, { method: 'DELETE', headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase DELETE ${table} error ${res.status}: ${text}`)
  }
}

// DELETE all rows in table (truncate)
export async function sbDeleteAll(table: string): Promise<void> {
  // Supabase doesn't support TRUNCATE via REST, delete all rows
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`
  const res = await fetch(url, { method: 'DELETE', headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase DELETE ALL ${table} error ${res.status}: ${text}`)
  }
}

// COUNT
export async function sbCount(table: string, query?: string): Promise<number> {
  const q = query ? query + '&' : ''
  const url = `${SUPABASE_URL}/rest/v1/${table}?${q}select=count`
  const res = await fetch(url, {
    headers: headers({ Prefer: 'count=exact', Range: '0-0' }),
  })
  const range = res.headers.get('content-range')
  if (range) {
    const total = range.split('/')[1]
    if (total === '*') {
      // Get all and count
      const data = await sbGet(table, query)
      return data.length
    }
    return parseInt(total)
  }
  // Fallback
  const data = await sbGet(table, query)
  return data.length
}

// POST multiple rows (upsert)
export async function sbPostMany(table: string, rows: Record<string, unknown>[]): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const data = rows.map(r => ({ ...r, id: uid(), createdAt: now(), updatedAt: now() }))
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase POST MANY ${table} error ${res.status}: ${text}`)
  }
}

export { uid, now }
