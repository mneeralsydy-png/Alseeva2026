'use client'

import { useMediaUrl } from '@/components/MediaResolver'
import { isNativeApp, fetchMediaBlob, saveFileToGallery, shareFile, openWith } from '@/lib/capacitor-bridge'
import {
  X, MoreVertical, ExternalLink, Share2, Save, CheckCircle,
  ImageIcon, Play,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

interface MediaViewerModalProps {
  image: {
    id: string
    album: string
    filename: string
    url: string
  }
  onClose: () => void
  showMsg: (msg: string, duration?: number) => void
}

// Check if a URL is a video
function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.avi') ||
    lower.includes('.webm') || lower.includes('.mkv') || lower.includes('.3gp') ||
    lower.includes('video')
}

// Get file extension
function getFileExtension(url: string): string {
  if (!url) return 'jpg'
  const lower = url.toLowerCase()
  if (lower.includes('.mp4')) return 'mp4'
  if (lower.includes('.mov')) return 'mov'
  if (lower.includes('.webm')) return 'webm'
  if (lower.includes('.avi')) return 'avi'
  if (lower.includes('.png')) return 'png'
  if (lower.includes('.gif')) return 'gif'
  if (lower.includes('.webp')) return 'webp'
  return 'jpg'
}

function getMimeType(url: string): string {
  if (!url) return 'image/jpeg'
  const ext = getFileExtension(url)
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp',
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
    avi: 'video/x-msvideo',
  }
  return mimeMap[ext] || 'image/jpeg'
}

export default function MediaViewerModal({ image, onClose, showMsg }: MediaViewerModalProps) {
  const { url: mediaUrl, loading: resolving, error: resolveError, retry } = useMediaUrl(image.url)
  const [imageMenuOpen, setImageMenuOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // 'save' | 'share' | 'open' | null
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isVideo = isVideoUrl(image.url)

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setImageMenuOpen(false)
      }
    }
    if (imageMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [imageMenuOpen])

  // Reset states when image changes
  useEffect(() => {
    setImageLoadError(false)
    setSaveSuccess(false)
    setActionMsg(null)
    setImageMenuOpen(false)
    setActionLoading(null)
  }, [image.id])

  const localShowMsg = (msg: string, duration = 3000) => {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(null), duration)
  }

  /** Helper: fetch the media blob using proxy (handles CORS in Capacitor) */
  const getMediaBlob = async (): Promise<Blob> => {
    if (!mediaUrl) throw new Error('No media URL available')
    return fetchMediaBlob(mediaUrl)
  }

  const handleOpenWith = async () => {
    setImageMenuOpen(false)
    if (!mediaUrl) return
    setActionLoading('open')
    try {
      const blob = await getMediaBlob()
      const ext = getFileExtension(image.url)
      const filename = (image.filename || `alshifa-media.${ext}`)

      const result = await openWith(blob, filename, 'مركز الشفاء', image.album)
      if (!result.success && result.error !== 'cancelled') {
        localShowMsg('تعذر فتح الوسائط', 3000)
      }
    } catch (err) {
      console.error('Open with error:', err)
      localShowMsg('حدث خطأ أثناء الفتح', 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSave = async () => {
    setImageMenuOpen(false)
    if (!mediaUrl) return
    setActionLoading('save')
    setSaveSuccess(false)
    try {
      const blob = await getMediaBlob()
      const ext = getFileExtension(image.url)
      const filename = (image.filename || `alshifa-media.${ext}`)

      const result = await saveFileToGallery(blob, filename)
      if (result.success) {
        setSaveSuccess(true)
        localShowMsg(isNativeApp() ? 'تم الحفظ في مجلد التنزيلات/alshifa' : 'تم تحميل الملف', 3000)
      } else {
        localShowMsg('تعذر حفظ الملف', 3000)
      }
    } catch (err) {
      console.error('Save error:', err)
      localShowMsg('حدث خطأ أثناء الحفظ', 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleShare = async () => {
    setImageMenuOpen(false)
    if (!mediaUrl) return
    setActionLoading('share')
    try {
      const blob = await getMediaBlob()
      const ext = getFileExtension(image.url)
      const filename = (image.filename || `alshifa-media.${ext}`)

      const result = await shareFile(blob, filename, 'مركز الشفاء', image.album)
      if (!result.success && result.error !== 'cancelled') {
        localShowMsg('تعذر مشاركة الوسائط', 3000)
      }
    } catch (err) {
      console.error('Share error:', err)
      localShowMsg('حدث خطأ أثناء المشاركة', 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCopyLink = () => {
    setImageMenuOpen(false)
    if (!mediaUrl) return
    navigator.clipboard.writeText(mediaUrl).then(() => {
      localShowMsg('تم نسخ الرابط', 2000)
    }).catch(() => {
      localShowMsg('تعذر نسخ الرابط', 2000)
    })
  }

  const isLoading = actionLoading !== null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
      onClick={() => { onClose(); setImageMenuOpen(false); setSaveSuccess(false) }}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); setImageMenuOpen(false); setSaveSuccess(false) }}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* 3-dot menu */}
      <div className="absolute top-4 right-4 z-10" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setImageMenuOpen(!imageMenuOpen) }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          disabled={isLoading}
        >
          <MoreVertical className="w-5 h-5 text-white" />
        </button>
        {imageMenuOpen && (
          <div
            className="absolute top-12 right-0 w-52 rounded-xl overflow-hidden shadow-2xl py-1"
            style={{ backgroundColor: 'white' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleOpenWith}
              disabled={isLoading}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ color: '#1a5f4a' }}
            >
              {actionLoading === 'open' ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              فتح باستخدام
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ color: saveSuccess ? '#059669' : '#1a5f4a' }}
            >
              {saveSuccess ? (
                <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
              ) : actionLoading === 'save' ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveSuccess ? 'تم الحفظ ✓' : 'حفظ'}
            </button>
            <button
              onClick={handleShare}
              disabled={isLoading}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ color: '#1a5f4a' }}
            >
              {actionLoading === 'share' ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              مشاركة
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
              style={{ color: '#1a5f4a' }}
            >
              <ExternalLink className="w-4 h-4" />
              نسخ الرابط
            </button>
          </div>
        )}
      </div>

      {/* Action message toast */}
      {(saveSuccess || actionMsg) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg"
          style={{ backgroundColor: actionMsg && !saveSuccess ? '#1a5f4a' : '#059669' }}
        >
          <CheckCircle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">
            {saveSuccess ? 'تم حفظ الوسائط بنجاح' : actionMsg}
          </span>
        </div>
      )}

      {/* Loading overlay for actions */}
      {isLoading && (
        <div className="absolute inset-0 z-15 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">
              {actionLoading === 'save' ? 'جاري الحفظ...' : actionLoading === 'share' ? 'جاري المشاركة...' : 'جاري الفتح...'}
            </p>
          </div>
        </div>
      )}

      {/* Media display */}
      <div className="max-w-[95vw] max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
        {/* Resolving URL indicator */}
        {resolving && !mediaUrl && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-3" />
            <p className="text-white/60 text-sm">جاري تحميل الوسائط...</p>
          </div>
        )}

        {/* Resolve error */}
        {resolveError && !mediaUrl && (
          <div className="flex flex-col items-center justify-center text-white/70 py-20">
            <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm mb-3">فشل تحميل الوسائط</p>
            <button onClick={retry} className="px-4 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20">
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Media content */}
        {mediaUrl && !resolveError && (
          <>
            {!imageLoadError && (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {isVideo ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[85vh] rounded-xl"
                style={{ backgroundColor: 'black' }}
                onError={() => setImageLoadError(true)}
                onCanPlay={() => setImageLoadError(false)}
              >
                <track kind="captions" />
              </video>
            ) : (
              <img
                src={mediaUrl}
                alt={image.album}
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
                onError={() => setImageLoadError(true)}
                onLoad={() => setImageLoadError(false)}
              />
            )}
            {imageLoadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
                <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm mb-2">فشل تحميل الوسائط</p>
                <button onClick={retry} className="px-4 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20">
                  إعادة المحاولة
                </button>
              </div>
            )}
            <div className="mt-3 text-center">
              <Badge className="text-xs font-semibold" variant="outline" style={{ borderColor: '#d4af3740', color: '#d4af37', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                {image.album}
              </Badge>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
