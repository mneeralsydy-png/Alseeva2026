'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Bot, Send, RefreshCw, Settings, Link2, Upload, Download,
  CheckCircle, XCircle, Wifi, WifiOff, ArrowLeftRight, MessageCircle, Hash
} from 'lucide-react'

interface BotStatus {
  status: 'online' | 'offline'
  bot?: { id: number; first_name: string; username: string; is_bot: boolean }
  channel?: string
  authorizedChats?: number[]
  pendingMedia?: number
  storage?: string
  configured?: boolean
  message?: string
  serviceOnline?: boolean
  serviceInfo?: { bot: string; channel: string; authorizedChats: number; pendingMedia: number }
}

interface TelegramImport {
  id: string
  album: string
  filename: string
  url: string
  displayUrl?: string
  source: string
  createdAt: string
}

// Pre-configured credentials (set via environment variables)
const CONFIGURED_CHANNEL_ID = process.env.NEXT_PUBLIC_CHANNEL_ID || ''
const CONFIGURED_ACCOUNT_ID = process.env.NEXT_PUBLIC_ADMIN_ID || ''

export function TelegramTab() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatId, setChatId] = useState(CONFIGURED_ACCOUNT_ID)
  const [syncing, setSyncing] = useState(false)
  const [imports, setImports] = useState<TelegramImport[]>([])
  const [activeSection, setActiveSection] = useState<'status' | 'import' | 'config'>('status')

  const loadBotStatus = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/telegram'))
      const data = await res.json()
      setBotStatus(data)
    } catch {
      setBotStatus({ status: 'offline', message: 'فشل في الاتصال بخدمة البوت', configured: false })
    }
    setLoading(false)
  }, [])

  const loadImports = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/telegram/imports'))
      const data = await res.json()
      setImports(data.images || [])
    } catch {
      setImports([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(apiUrl('/api/telegram'))
        if (cancelled) return
        const data = await res.json()
        setBotStatus(data)
      } catch {
        if (cancelled) return
        setBotStatus({ status: 'offline', message: 'فشل في الاتصال بخدمة البوت', configured: false })
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (activeSection !== 'import') return
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(apiUrl('/api/telegram/imports'))
        if (cancelled) return
        const data = await res.json()
        setImports(data.images || [])
      } catch {
        if (cancelled) return
        setImports([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeSection])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch(apiUrl('/api/telegram/imports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', chatId: parseInt(chatId) }),
      })
      const data = await res.json()
      if (data.synced) {
        toast.success(`تمت مزامنة ${data.synced} عنصر`)
      } else {
        toast.info(data.message || 'لا توجد عناصر للمزامنة')
      }
      loadImports()
    } catch {
      toast.error('فشل في المزامنة')
    }
    setSyncing(false)
  }, [chatId, loadImports])

  const handleRegisterChat = useCallback(async () => {
    if (!chatId) {
      toast.error('أدخل معرف المحادثة أولاً')
      return
    }
    try {
      const res = await fetch(apiUrl('/api/telegram'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-chat',
          chatId: parseInt(chatId),
          adminId: 'default-admin',
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم ربط المحادثة بنجاح')
        loadBotStatus()
      } else {
        toast.error(data.error || 'فشل في الربط')
      }
    } catch {
      toast.error('فشل في الاتصال بخدمة البوت')
    }
  }, [chatId, loadBotStatus])

  return (
    <div className="space-y-6">
      {/* ── Section Tabs ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'status' as const, label: 'حالة البوت', icon: Bot },
          { key: 'import' as const, label: 'الاستيراد من تيلجرام', icon: Download },
          { key: 'config' as const, label: 'الإعدادات', icon: Settings },
        ].map((sec) => {
          const Icon = sec.icon
          const isActive = activeSection === sec.key
          return (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: isActive ? '#1a5f4a' : 'white',
                color: isActive ? 'white' : '#374151',
                boxShadow: isActive ? '0 2px 8px rgba(26,95,74,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <Icon className="w-4 h-4" />
              {sec.label}
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── STATUS SECTION ──────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeSection === 'status' && (
        <>
          {/* Bot Status Card */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                  <Bot className="w-5 h-5" style={{ color: '#d4af37' }} />
                  حالة بوت تيلجرام
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { loadBotStatus() }}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                  <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#1a5f4a' }} />
                  <span className="text-sm" style={{ color: '#6b7280' }}>جاري التحقق...</span>
                </div>
              ) : botStatus?.status === 'online' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <Wifi className="w-6 h-6" style={{ color: '#16a34a' }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#16a34a' }}>البوت متصل ✓</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        {botStatus.serviceOnline
                          ? 'يعمل بشكل طبيعي — التخزين عبر تيلجرام'
                          : 'التوكن صالح — خدمة الاستقبال غير متصلة'}
                      </p>
                    </div>
                  </div>

                  {!botStatus.serviceOnline && (
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                      <WifiOff className="w-5 h-5" style={{ color: '#d97706' }} />
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#d97706' }}>خدمة الاستقباب غير متصلة</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>خدمة البوت (port 3030) لا تعمل حالياً. يمكنك رفع الصور من الموقع مباشرة.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>اسم البوت</p>
                      <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                        @{botStatus.bot?.username || '—'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>القناة</p>
                      <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#0088cc' }}>
                        <Hash className="w-4 h-4" />
                        {botStatus.channel || CONFIGURED_CHANNEL_ID}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>المحادثات المرتبطة</p>
                      <p className="text-sm font-bold" style={{ color: '#1a5f4a' }}>
                        {botStatus.authorizedChats?.length || 1} محادثة
                      </p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>نوع التخزين</p>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {botStatus.storage === 'telegram' ? 'تيلجرام فقط ✓' : 'مختلط'}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>الحالة</p>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">نشط ✓</Badge>
                    </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>الحساب المدير</p>
                      <p className="text-sm font-bold" style={{ color: '#1a5f4a' }}>
                        {CONFIGURED_ACCOUNT_ID}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                    <WifiOff className="w-6 h-6" style={{ color: '#dc2626' }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#dc2626' }}>البوت غير متصل</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{botStatus?.message || 'تحقق من إعدادات البوت'}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                    <p className="text-sm font-bold" style={{ color: '#92400e' }}>📋 خطوات الإعداد:</p>
                    <ol className="text-sm space-y-1.5 list-decimal list-inside" style={{ color: '#78350f' }}>
                      <li>تأكد من تشغيل خدمة البوت</li>
                      <li>أرسل <strong>/start</strong> للبوت في تيلجرام</li>
                      <li>أرسل <strong>/code كلمة_المرور</strong> للربط</li>
                      <li>ابدأ بإرسال الصور واختيار الألبوم</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                <MessageCircle className="w-5 h-5" style={{ color: '#d4af37' }} />
                كيفية الاستخدام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-sm font-bold" style={{ color: '#166534' }}>📤 رفع الصور من تيلجرام:</p>
                <p className="text-xs" style={{ color: '#374151' }}>
                  1. افتح محادثة خاصة مع البوت<br/>
                  2. أرسل /start ثم /code كلمة_المرور<br/>
                  3. أرسل أي صورة واختر الألبوم<br/>
                  4. سيتم حفظها في القناة ومزامنتها تلقائياً
                </p>
              </div>

              <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <p className="text-sm font-bold" style={{ color: '#1e40af' }}>📥 استيراد الصور من تيلجرام:</p>
                <p className="text-xs" style={{ color: '#374151' }}>
                  1. أعد توجيه الصور من أي قناة/مجموعة إلى البوت<br/>
                  2. اختر الألبوم المناسب لكل صورة<br/>
                  3. الصور ستظهر مباشرة في معرض الوسائط
                </p>
              </div>

              <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <p className="text-sm font-bold" style={{ color: '#6b21a8' }}>🔄 التخزين عبر تيلجرام:</p>
                <p className="text-xs" style={{ color: '#374151' }}>
                  جميع الصور تُحفظ مباشرة في قناة تيلجرام بدون حفظ في قاعدة البيانات<br/>
                  التطبيق يعتمد على تيلجرام كخزن رئيسي للوسائط
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── IMPORT SECTION ──────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeSection === 'import' && (
        <>
          {/* Sync Controls */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                <ArrowLeftRight className="w-5 h-5" style={{ color: '#d4af37' }} />
                مزامنة مع تيلجرام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm" style={{ color: '#1a5f4a' }}>معرف المحادثة (Chat ID)</Label>
                  <Input
                    placeholder="مثال: 123456789"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="text-right"
                    dir="ltr"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleSync}
                    disabled={syncing || !chatId}
                    className="font-semibold shadow-md flex-1"
                    style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}
                  >
                    <RefreshCw className={`w-4 h-4 ml-1 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
                  </Button>
                  <Button
                    onClick={loadImports}
                    variant="outline"
                    className="font-semibold"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    تحديث القائمة
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>المزامنة ترسل آخر التحديثات من لوحة التحكم إلى تيلجرام</span>
              </div>
            </CardContent>
          </Card>

          {/* Imported Images Grid */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                  <Upload className="w-5 h-5" style={{ color: '#d4af37' }} />
                  الصور في القناة ({imports.length})
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  تيلجرام
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {imports.length === 0 ? (
                <div className="text-center py-10" style={{ color: '#9ca3af' }}>
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد صور في القناة بعد</p>
                  <p className="text-xs mt-1">أرسل صورة إلى البوت لبدء الحفظ في القناة</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imports.map((img) => (
                    <div key={img.id} className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div className="aspect-square bg-gray-50 relative">
                        <img src={img.displayUrl || img.url} alt={img.album} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5">
                            <Send className="w-2.5 h-2.5 ml-0.5" />
                            القناة
                          </Badge>
                        </div>
                      </div>
                      <div className="p-2">
                        <span className="text-xs truncate block" style={{ color: '#6b7280' }}>{img.album}</span>
                        <span className="text-[10px]" style={{ color: '#9ca3af' }}>
                          {new Date(img.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── CONFIG SECTION ──────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeSection === 'config' && (
        <>
          {/* Config Status */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                <Settings className="w-5 h-5" style={{ color: '#d4af37' }} />
                إعدادات البوت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5" style={{ color: '#16a34a' }} />
                  <p className="text-sm font-bold" style={{ color: '#166534' }}>البوت مُعد مسبقاً</p>
                </div>
                <div className="space-y-2 text-xs" style={{ color: '#374151' }}>
                  <div className="flex justify-between">
                    <span>القناة:</span>
                    <span className="font-mono font-bold" dir="ltr">{CONFIGURED_CHANNEL_ID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حساب المدير:</span>
                    <span className="font-mono font-bold" dir="ltr">{CONFIGURED_ACCOUNT_ID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>نوع التخزين:</span>
                    <span className="font-bold" style={{ color: '#16a34a' }}>تيلجرام فقط</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm" style={{ color: '#1a5f4a' }}>ربط محادثة إضافية (اختياري)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل Chat ID"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="text-right"
                    dir="ltr"
                  />
                  <Button
                    onClick={handleRegisterChat}
                    disabled={!chatId}
                    variant="outline"
                    className="font-semibold flex-shrink-0"
                  >
                    <Link2 className="w-4 h-4 ml-1" />
                    ربط
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Guide */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
                📖 دليل الاستخدام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>1</div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1a5f4a' }}>فتح البوت</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      ابحث عن البوت في تيلجرام وأرسل <strong>/start</strong>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>2</div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1a5f4a' }}>ربط الحساب</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      أرسل <strong>/code كلمة_المرور</strong> لربط حساب المدير
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>3</div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1a5f4a' }}>رفع الصور</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      أرسل صورة للبوت → اختر الألبوم → يتم حفظها في القناة تلقائياً
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>4</div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1a5f4a' }}>العرض والمزامنة</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      الصور تظهر في معرض الوسائط مباشرة ويمكنك رفعها من الموقع أيضاً
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
