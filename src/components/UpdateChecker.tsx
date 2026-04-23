'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '@/lib/api'

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
const STORAGE_KEY = 'alshifa_app_version'

export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/version'))
      if (!res.ok) return
      const data = await res.json()
      const serverVersion = data.buildHash || data.version

      if (!serverVersion) return

      const storedVersion = localStorage.getItem(STORAGE_KEY)

      if (storedVersion && storedVersion !== serverVersion) {
        console.log('[UpdateChecker] New version available:', storedVersion, '→', serverVersion)
        setUpdateAvailable(true)
        setUpdateMessage(`يتوفر تحديث جديد (${serverVersion.slice(0, 8)})`)
      }

      // Always update stored version
      localStorage.setItem(STORAGE_KEY, serverVersion)
    } catch {
      // Silently fail — user might be offline
    }
  }, [])

  // Register Service Worker
  useEffect(() => {
    if (typeof window === 'undefined') return

    const registerSW = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })

          console.log('[SW] Registered successfully, scope:', registration.scope)

          // Listen for updates from the Service Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('[SW] New service worker activated')
                setUpdateAvailable(true)
                setUpdateMessage('يتوفر تحديث جديد')
              }
            })
          })

          // Listen for messages from Service Worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SW_UPDATED') {
              console.log('[SW] Received SW_UPDATED message')
              setUpdateAvailable(true)
              setUpdateMessage('يتوفر تحديث جديد')
            }
            if (event.data?.type === 'CONTENT_UPDATED') {
              console.log('[SW] Content updated, hash:', event.data.newHash)
              setUpdateAvailable(true)
              setUpdateMessage('يتوفر تحديث جديد للمحتوى')
            }
          })
        }
      } catch (err) {
        console.warn('[SW] Registration failed:', err)
      }
    }

    registerSW()
  }, [])

  // Check for updates periodically
  useEffect(() => {
    // Initial check after 3 seconds
    const initialTimer = setTimeout(checkForUpdate, 3000)

    // Periodic check
    const interval = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [checkForUpdate])

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true)

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration?.waiting) {
          // Tell the waiting SW to activate
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }

      // Small delay to let SW activate
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Clear version cache to force re-check
      localStorage.removeItem(STORAGE_KEY)

      // Reload the page to get new content
      window.location.reload()
    } catch {
      // Fallback: just reload
      window.location.reload()
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    // Re-check after 10 minutes if dismissed
    setTimeout(() => {
      setDismissed(false)
      checkForUpdate()
    }, 10 * 60 * 1000)
  }, [checkForUpdate])

  // Don't show if no update or dismissed
  if (!updateAvailable || dismissed) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down"
      style={{
        background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {/* Update icon */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">تحديث جديد متاح</p>
            <p className="text-white/60 text-xs">{updateMessage}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white/80 transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            لاحقاً
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
              color: '#0d3d2e',
            }}
          >
            {isUpdating ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                جاري التحديث...
              </span>
            ) : (
              'تحديث الآن'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
