'use client'

// Resolve Telegram file URLs at the component level
// When a media URL starts with "tg:", it needs to be resolved via the server proxy
// This component handles the resolution and displays the media

import { useState, useEffect } from 'react'
import { isTelegramRef } from '@/lib/supabase-direct'
import { apiUrl } from '@/lib/api'

/**
 * Get the displayable URL for a media item
 * If it's a tg: reference, uses server proxy (/api/telegram/image-proxy)
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

    // Telegram reference: use server proxy (works in APK without BOT_TOKEN)
    const fileId = rawUrl.replace('tg:', '')
    const proxyUrl = apiUrl(`/api/telegram/image-proxy?file_id=${encodeURIComponent(fileId)}`)
    setUrl(proxyUrl)
    setLoading(false)
    setError(false)

    return () => {}
  }, [rawUrl, retryCount])

  return {
    url,
    loading,
    error,
    retry: () => setRetryCount((c) => c + 1),
  }
}
