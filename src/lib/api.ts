// API URL helper for both server and Capacitor (APK) builds
// When building for APK (static export), NEXT_PUBLIC_API_BASE is set to the server URL
// When running on the server, it's empty and relative URLs work fine
// In Capacitor (APK), if NEXT_PUBLIC_API_BASE is not set, we auto-detect and use the live server URL

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const LIVE_SERVER = 'https://abualzahracom.online';

let _isNative: boolean | null = null;

function isCapacitorNative(): boolean {
  // Cache the result to avoid repeated checks
  if (_isNative !== null) return _isNative;
  try {
    if (typeof window === 'undefined') { _isNative = false; return false; }
    // Method 1: Check URL protocol (most reliable — Capacitor uses capacitor://)
    const proto = window.location?.protocol?.toLowerCase();
    if (proto === 'capacitor:' || proto === 'ionic:') {
      console.log('[api] Detected native via protocol:', proto);
      _isNative = true;
      return true;
    }
    // Method 2: Check Capacitor global object
    const cap = (window as any).Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
      console.log('[api] Detected native via Capacitor.isNativePlatform()');
      _isNative = true;
      return true;
    }
    // Method 3: Check if Capacitor object exists at all (even if method not ready yet)
    if (cap && cap.platform && (cap.platform === 'android' || cap.platform === 'ios')) {
      console.log('[api] Detected native via Capacitor.platform:', cap.platform);
      _isNative = true;
      return true;
    }
    console.log('[api] Not native, protocol:', proto, 'Capacitor:', cap ? 'exists' : 'missing');
    _isNative = false;
    return false;
  } catch {
    _isNative = false;
    return false;
  }
}

function getApiBase(): string {
  if (API_BASE) {
    console.log('[api] Using NEXT_PUBLIC_API_BASE:', API_BASE);
    return API_BASE;
  }
  // In Capacitor (APK), use the live server URL since there's no local API server
  if (isCapacitorNative()) {
    console.log('[api] Using LIVE_SERVER:', LIVE_SERVER);
    return LIVE_SERVER;
  }
  return '';
}

export function apiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const url = getApiBase() + path;
  return url;
}
