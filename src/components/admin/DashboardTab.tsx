'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Users, ClipboardCheck, Camera, Calendar, Plus, Star, TrendingUp, Award, RefreshCw } from 'lucide-react'

interface DashboardStats {
  totalHalakat: number
  totalStudents: number
  todayAttendance: number
  totalPresent: number
  totalImages: number
  totalActivities: number
  recentStudents: { name: string; createdAt: string }[]
  recentHalakat: { name: string; createdAt: string }[]
  recentActivities: { title: string; createdAt: string }[]
}

export function DashboardTab({ stats, loading, onNavigate, formatDate }: {
  stats: DashboardStats | null
  loading: boolean
  onNavigate: (tab: string) => void
  formatDate: (s: string) => string
}) {
  const safe = stats
    ? stats
    : { totalHalakat: 0, totalStudents: 0, todayAttendance: 0, totalPresent: 0, totalImages: 0, totalActivities: 0, recentStudents: [], recentHalakat: [], recentActivities: [] }

  const cards = [
    { label: 'الحلقات', value: safe.totalHalakat, icon: BookOpen, color: '#1a5f4a', bg: 'bg-emerald-50', tab: 'halakat' },
    { label: 'الطلاب', value: safe.totalStudents, icon: Users, color: '#2563eb', bg: 'bg-blue-50', tab: 'students' },
    { label: 'نسبة الحضور', value: `${safe.todayAttendance}%`, icon: ClipboardCheck, color: '#d97706', bg: 'bg-amber-50', tab: 'attendance' },
    { label: 'الصور المرفوعة', value: safe.totalImages, icon: Camera, color: '#dc2626', bg: 'bg-red-50', tab: 'media' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-0 shadow-md" style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)', borderRadius: '1rem' }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ border: '2px solid #d4af37' }}>
              <img src="/center-logo.png" alt="مركز الشفاء" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">مرحباً بك في مركز الشفاء</h2>
              <p className="text-white/70 text-sm mt-1">نظام إدارة مراكز تحفيظ القرآن الكريم المتكامل</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <Card key={c.label} className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] ${c.bg}`} style={{ borderRadius: '0.8rem' }} onClick={() => onNavigate(c.tab)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#6b7280' }}>{c.label}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
                    </div>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + '15' }}>
                      <Icon className="w-5 h-5" style={{ color: c.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
            <Star className="w-5 h-5" style={{ color: '#d4af37' }} />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'إضافة حلقة', tab: 'halakat', icon: Plus },
              { label: 'إضافة طالب', tab: 'students', icon: Users },
              { label: 'تسجيل حضور', tab: 'attendance', icon: ClipboardCheck },
              { label: 'رفع صور', tab: 'media', icon: Camera },
              { label: 'إضافة نشاط', tab: 'activities', icon: Calendar },
              { label: 'معدل الحفظ', tab: 'monthlyrate', icon: TrendingUp },
            ].map((a) => {
              const Icon = a.icon
              return (
                <Button key={a.label} variant="outline" onClick={() => onNavigate(a.tab)} className="h-auto py-3 flex-col gap-2 border-dashed hover:border-solid transition-all" style={{ borderColor: '#1a5f4a40', borderRadius: '0.6rem' }}>
                  <Icon className="w-5 h-5" style={{ color: '#1a5f4a' }} />
                  <span className="text-xs font-medium" style={{ color: '#1a5f4a' }}>{a.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
            <RefreshCw className="w-5 h-5" style={{ color: '#d4af37' }} />
            آخر التحديثات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-3">
              {(safe.recentStudents || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>آخر الطلاب المسجلين</p>
                  <div className="flex flex-wrap gap-2">
                    {(safe.recentStudents || []).map((s: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs py-1 px-3" style={{ borderColor: '#1a5f4a30', color: '#1a5f4a' }}>
                        <Users className="w-3 h-3 ml-1" />{s.name} — {formatDate(s.createdAt)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(safe.recentHalakat || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>آخر الحلقات المضافة</p>
                  <div className="flex flex-wrap gap-2">
                    {(safe.recentHalakat || []).map((h: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs py-1 px-3" style={{ borderColor: '#d4af3760', color: '#b8860b' }}>
                        <BookOpen className="w-3 h-3 ml-1" />{h.name} — {formatDate(h.createdAt)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(safe.recentActivities || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>آخر الأنشطة</p>
                  <div className="flex flex-wrap gap-2">
                    {(safe.recentActivities || []).map((a: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs py-1 px-3" style={{ borderColor: '#dc262630', color: '#dc2626' }}>
                        <Calendar className="w-3 h-3 ml-1" />{a.title} — {formatDate(a.createdAt)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(safe.recentStudents || []).length === 0 && (safe.recentHalakat || []).length === 0 && (safe.recentActivities || []).length === 0 && (
                <div className="text-center py-8" style={{ color: '#9ca3af' }}>
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد تحديثات بعد</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
