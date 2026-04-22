'use client'

// Resolve Telegram file URLs at the component level
// When a media URL starts with "tg:", it needs to be resolved via Telegram Bot API
// This component handles the resolution and displays the media

import { useState, useEffect } from 'react'
import { getTelegramFileUrl, isTelegramRef } from '@/lib/supabase-direct'

/**
 * Get the displayable URL for a media item
 * If it's a tg: reference, resolves it via Telegram Bot API
 * Otherwise returns the URL as-is
 */
export function useMediaUrl(rawUrl: string | undefined): {
  url: string
  loading: boolean
  error: boolean
  retry: () => void
} {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!rawUrl) {
      setUrl('')
      return
    }

    // Non-telegram URLs: use directly
    if (!isTelegramRef(rawUrl)) {
      setUrl(rawUrl)
      return
    }

    // Telegram reference: resolve via Bot API
    const fileId = rawUrl.replace('tg:', '')
    let cancelled = false

    const resolve = async () => {
      setLoading(true)
      setError(false)
      try {
        const resolved = await getTelegramFileUrl(fileId)
        if (cancelled) return
        if (resolved) {
          setUrl(resolved)
          // Cache the resolved URL in sessionStorage for faster subsequent loads
          try {
            sessionStorage.setItem(`tg_url_${fileId}`, resolved)
          } catch { /* ignore */ }
        } else {
          setError(true)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(`tg_url_${fileId}`)
      if (cached) {
        setUrl(cached)
        setLoading(false)
        return
      }
    } catch { /* ignore */ }

    resolve()

    return () => { cancelled = true }
  }, [rawUrl, retryCount])

  return {
    url,
    loading,
    error,
    retry: () => setRetryCount((c) => c + 1),
  }
}
