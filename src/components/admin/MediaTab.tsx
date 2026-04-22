'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Camera, Upload, Trash2, FolderOpen, Send, RefreshCw, ArrowUpDown, Download } from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { toast } from 'sonner'

const ALBUMS = ['حلقات تحفيظية', 'سرد قرآني', 'دورات سنوية', 'مسابقات سنوية', 'تكريم', 'احتفالات خريجين', 'متميزين', 'خريجون', 'أخرى']

interface Props {
  album: string
  setAlbum: (a: string) => void
  filter: string
  setFilter: (f: string) => void
  file: File | null
  setFile: (f: File | null) => void
  uploading: boolean
  images: any[]
  onUpload: () => void
  onDelete: (id: string) => void
}

export function MediaTab({ album, setAlbum, filter, setFilter, file, setFile, uploading, images, onUpload, onDelete }: Props) {
  const filtered = filter ? images.filter((i) => i.album === filter) : images

  // Detect Telegram vs local images
  const telegramImages = images.filter((i) => i.url?.startsWith('tg:') || i.source === 'telegram' || i.source === 'web-upload')
  const localImages = images.filter((i) => !i.url?.startsWith('tg:') && i.source !== 'telegram' && i.source !== 'web-upload')

  const [syncing, setSyncing] = useState(false)
  const [botOnline, setBotOnline] = useState(false)
  const [showTelegramBanner, setShowTelegramBanner] = useState(true)
  const [activeUploadTab, setActiveUploadTab] = useState<'local' | 'telegram'>('local')

  // Check bot status on mount
  useEffect(() => {
    const checkBot = async () => {
      try {
        const res = await fetch(apiUrl('/api/telegram'))
        const data = await res.json()
        setBotOnline(data.status === 'online')
      } catch {
        setBotOnline(false)
      }
    }
    checkBot()
  }, [])

  const handleSyncFromTelegram = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch(apiUrl('/api/telegram/imports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      })
      const data = await res.json()
      if (data.synced) {
        toast.success(`تمت مزامنة ${data.synced} عنصر`)
      } else {
        toast.info(data.message || 'لا توجد عناصر للمزامنة')
      }
      onUpload() // Refresh gallery
    } catch {
      toast.error('فشل في الاتصال بخدمة البوت')
    }
    setSyncing(false)
  }, [onUpload])

  // Get display URL for an image
  const getDisplayUrl = (img: any): string => {
    if (img.displayUrl) return img.displayUrl
    if (img.url?.startsWith('tg:')) {
      return `/api/telegram/image-proxy?file_id=${encodeURIComponent(img.url.replace('tg:', ''))}`
    }
    return img.url || ''
  }

  return (
    <div className="space-y-6">
      {/* ── Telegram Storage Banner ─────────────────────────── */}
      {showTelegramBanner && (
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)',
          }}
        >
          <button
            onClick={() => setShowTelegramBanner(false)}
            className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-lg"
          >
            ×
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
              <Send className="w-6 h-6" style={{ color: '#d4af37' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm mb-1">تخزين الوسائط عبر تيلجرام 🤖</h3>
              <p className="text-white/70 text-xs mb-3">
                جميع الصور تُحفظ مباشرة في قناة تيلجرام بدون حفظ في قاعدة البيانات
              </p>
              <div className="flex flex-wrap gap-2">
                {botOnline ? (
                  <Badge className="bg-green-500/20 text-green-300 text-xs border border-green-500/30 hover:bg-green-500/20">
                    <Send className="w-3 h-3 ml-1" />
                    البوت متصل — القناة نشطة
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-300 text-xs border border-red-500/30 hover:bg-red-500/20">
                    البوت غير متصل
                  </Badge>
                )}
                <Badge className="bg-yellow-500/20 text-yellow-300 text-[10px] border border-yellow-500/30 hover:bg-yellow-500/20">
                  {telegramImages.length} صورة في القناة
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Section ───────────────────────────────── */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
              <Upload className="w-5 h-5" style={{ color: '#d4af37' }} />
              رفع صورة جديدة
            </CardTitle>
            {/* Upload method tabs */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
              <button
                onClick={() => setActiveUploadTab('local')}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: activeUploadTab === 'local' ? '#1a5f4a' : 'transparent',
                  color: activeUploadTab === 'local' ? 'white' : '#6b7280',
                }}
              >
                <Upload className="w-3 h-3 inline ml-1" />
                رفع للقناة
              </button>
              <button
                onClick={() => setActiveUploadTab('telegram')}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1"
                style={{
                  backgroundColor: activeUploadTab === 'telegram' ? '#1a5f4a' : 'transparent',
                  color: activeUploadTab === 'telegram' ? 'white' : '#6b7280',
                }}
              >
                <Send className="w-3 h-3" />
                من تيلجرام
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeUploadTab === 'local' ? (
            <>
              <div className="p-3 rounded-xl flex items-center gap-2 text-xs" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                <Send className="w-4 h-4 flex-shrink-0" />
                <span>سيتم رفع الصورة إلى قناة تيلجرام مباشرة (بدون حفظ في قاعدة البيانات)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm" style={{ color: '#1a5f4a' }}>الألبوم *</Label>
                  <Select value={album} onValueChange={setAlbum}>
                    <SelectTrigger className="text-right"><SelectValue placeholder="اختر الألبوم" /></SelectTrigger>
                    <SelectContent>{ALBUMS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm" style={{ color: '#1a5f4a' }}>اختر صورة *</Label>
                  <Input id="media-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-right" />
                </div>
              </div>
              <Button onClick={onUpload} disabled={uploading} className="font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>
                <Send className="w-4 h-4 ml-1" />
                {uploading ? 'جاري الرفع إلى القناة...' : 'رفع الصورة إلى القناة'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              {botOnline ? (
                <>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#dcfce7' }}>
                        <Send className="w-5 h-5" style={{ color: '#16a34a' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold mb-1" style={{ color: '#166534' }}>البوت متصل ✓</p>
                        <p className="text-xs" style={{ color: '#374151' }}>
                          أرسل الصور مباشرة إلى البوت في تيلجرام واختر الألبوم. سيتم حفظها في القناة ومزامنتها هنا تلقائياً.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSyncFromTelegram}
                      disabled={syncing}
                      className="font-semibold shadow-md"
                      style={{ background: 'linear-gradient(135deg, #0088cc, #00aaff)', color: 'white' }}
                    >
                      <Download className="w-4 h-4 ml-1" />
                      {syncing ? 'جاري المزامنة...' : 'مزامنة من تيلجرام'}
                    </Button>
                    <Button
                      onClick={onUpload}
                      variant="outline"
                      className="font-semibold"
                    >
                      <RefreshCw className="w-4 h-4 ml-1" />
                      تحديث المعرض
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fee2e2' }}>
                      <Send className="w-5 h-5" style={{ color: '#dc2626' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: '#991b1b' }}>البوت غير متصل</p>
                      <p className="text-xs mb-2" style={{ color: '#374151' }}>
                        انتقل إلى تبويب "تيلجرام" في القائمة الجانبية للتحقق من حالة البوت
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Gallery ──────────────────────────────────────── */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-bold" style={{ color: '#1a5f4a' }}>
              معرض الصور ({filtered.length})
            </CardTitle>
            {telegramImages.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700 text-[10px] border border-blue-200 hover:bg-blue-100">
                <Send className="w-2.5 h-2.5 ml-0.5" />
                {telegramImages.length} في القناة
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter('')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all`} style={{ backgroundColor: !filter ? '#1a5f4a' : 'white', color: !filter ? 'white' : '#374151', boxShadow: !filter ? '0 2px 8px rgba(26,95,74,0.3)' : '0 1px 3px rgba(0,0,0,0.06)' }}>
              <Camera className="w-3.5 h-3.5" />الكل
            </button>
            {ALBUMS.map((a) => (
              <button key={a} onClick={() => setFilter(filter === a ? '' : a)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all`} style={{ backgroundColor: filter === a ? '#1a5f4a' : 'white', color: filter === a ? 'white' : '#374151', boxShadow: filter === a ? '0 2px 8px rgba(26,95,74,0.3)' : '0 1px 3px rgba(0,0,0,0.06)' }}>
                <FolderOpen className="w-3.5 h-3.5" />{a}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10" style={{ color: '#9ca3af' }}>
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد صور مرفوعة</p>
              <p className="text-xs mt-1">ارفع صورة من هنا أو أرسلها للبوت في تيلجرام</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((img) => {
                const isTelegram = img.url?.startsWith('tg:') || img.source === 'telegram' || img.source === 'web-upload'
                const displayUrl = getDisplayUrl(img)
                return (
                  <div key={img.id} className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div className="aspect-square bg-gray-50 relative">
                      {displayUrl ? (
                        <img src={displayUrl} alt={img.album} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Camera className="w-8 h-8" />
                        </div>
                      )}
                      {isTelegram && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-500/90 text-white text-[9px] px-1.5 py-0.5 backdrop-blur-sm">
                            <Send className="w-2 h-2 ml-0.5" />
                            القناة
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs truncate" style={{ color: '#6b7280' }}>{img.album}</span>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm('حذف الصورة؟')) onDelete(img.id) }} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
