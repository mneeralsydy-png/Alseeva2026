// Capacitor native bridge - provides native device functionality
// Only works in Capacitor (Android/iOS), gracefully falls back in browser
// All Capacitor imports are DYNAMIC to prevent crashes on web browsers

// ── Platform detection (safe, no imports needed) ───────────
export function isNativeApp(): boolean {
  try {
    return typeof window !== 'undefined' && 
      !!(window as any).Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

/** Get the server base URL for API calls from Capacitor */
function getServerUrl(): string {
  try {
    if (isNativeApp()) {
      const envBase = process.env.NEXT_PUBLIC_API_BASE || ''
      if (envBase) return envBase
      return 'https://abualzahracom.online'
    }
    return typeof window !== 'undefined' ? window.location.origin : ''
  } catch {
    return ''
  }
}

/**
 * Fetch an image/video blob with CORS handling.
 */
export async function fetchMediaBlob(imageUrl: string): Promise<Blob> {
  if (isNativeApp()) {
    const serverBase = getServerUrl()
    const proxyUrl = `${serverBase}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    const response = await fetch(proxyUrl)
    if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status}`)
    return response.blob()
  }

  try {
    const response = await fetch(imageUrl)
    if (response.ok) return response.blob()
  } catch {
    // Direct fetch failed, try proxy
  }

  const serverBase = getServerUrl()
  if (serverBase) {
    const proxyUrl = `${serverBase}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    const response = await fetch(proxyUrl)
    if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status}`)
    return response.blob()
  }

  throw new Error('Failed to fetch media blob')
}

/**
 * Save a file to the device's Downloads/Pictures directory
 */
export async function saveFileToGallery(
  blob: Blob,
  filename: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  if (!isNativeApp()) {
    return saveFileBrowser(blob, filename)
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const base64 = await blobToBase64(blob)

    const result = await Filesystem.writeFile({
      path: `Download/alshifa/${filename}`,
      data: base64,
      directory: Directory.ExternalStorage,
      recursive: true,
    })

    return { success: true, path: result.uri }
  } catch (error: any) {
    console.error('Capacitor save error:', error)

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const base64 = await blobToBase64(blob)
      const result = await Filesystem.writeFile({
        path: `alshifa/${filename}`,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      })
      return { success: true, path: result.uri }
    } catch {
      return saveFileBrowser(blob, filename)
    }
  }
}

/**
 * Share a file using the native share sheet
 */
export async function shareFile(
  blob: Blob,
  filename: string,
  title?: string,
  _text?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isNativeApp()) {
    return shareFileBrowser(blob, filename, title, _text)
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const base64 = await blobToBase64(blob)
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

    const result = await Filesystem.writeFile({
      path: `share/${safeFilename}`,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    })

    await Share.share({
      title: title || 'مركز الشفاء',
      url: result.uri,
    })

    try {
      await Filesystem.deleteFile({
        path: `share/${safeFilename}`,
        directory: Directory.Cache,
      })
    } catch { /* ignore cleanup error */ }

    return { success: true }
  } catch (error: any) {
    if (!error?.message) return { success: false, error: 'cancelled' }
    return shareFileBrowser(blob, filename, title, _text)
  }
}

/**
 * Open a file with an external app
 */
export async function openWith(
  blob: Blob,
  filename: string,
  title?: string,
  _text?: string
): Promise<{ success: boolean; error?: string }> {
  return shareFile(blob, filename, title, _text)
}

/**
 * Share text content
 */
export async function shareText(
  title: string,
  text: string,
  url?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isNativeApp()) {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title, text, url: url || '' })
      return { success: true }
    }

    if (navigator.share) {
      await navigator.share({ title, text, url: url || '' })
      return { success: true }
    }

    await navigator.clipboard.writeText(url || text)
    return { success: true }
  } catch (error: any) {
    if (!error?.message) return { success: false, error: 'cancelled' }
    return { success: false, error: String(error) }
  }
}

// ─── Browser fallbacks ───────────────────────────────────

function saveFileBrowser(
  blob: Blob,
  filename: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  return new Promise((resolve) => {
    try {
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
        if (link.parentNode) document.body.removeChild(link)
        resolve({ success: true })
      }, 3000)
    } catch (error) {
      resolve({ success: false, error: String(error) })
    }
  })
}

async function shareFileBrowser(
  blob: Blob,
  filename: string,
  title?: string,
  text?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const file = new File([blob], filename, { type: blob.type })
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text, files: [file] })
      return { success: true }
    }
    if (navigator.share) {
      await navigator.share({ title, text })
      return { success: true }
    }
    return { success: false, error: 'Share not supported' }
  } catch (error: any) {
    if (!error?.message) return { success: false, error: 'cancelled' }
    return { success: false, error: String(error) }
  }
}

// ─── Utility functions ───────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ─── Android Back Button Handler ──────────────────────────

type BackButtonAction = () => boolean

let backActionStack: BackButtonAction[] = []

export function registerBackAction(action: BackButtonAction): () => void {
  backActionStack.push(action)
  return () => {
    backActionStack = backActionStack.filter(a => a !== action)
  }
}

function handleBackPress(): boolean {
  for (let i = backActionStack.length - 1; i >= 0; i--) {
    if (backActionStack[i]()) return true
  }
  return false
}

export function initBackButton(): void {
  if (typeof window === 'undefined') return

  // Dynamic import - won't crash on web
  import('@capacitor/app').then(({ App }) => {
    App.addListener('backButton', ({ canGoBack }) => {
      if (handleBackPress()) return
      if (canGoBack) {
        window.history.back()
        return
      }
      App.exitApp()
    })
  }).catch(() => {
    // App plugin not available (browser) — expected, silently ignore
  })
}
