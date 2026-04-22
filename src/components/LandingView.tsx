'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ShieldCheck, Eye } from 'lucide-react'

export default function LandingView({ onAdminLogin, onPublicView }: { onAdminLogin: () => void; onPublicView: () => void }) {
  return (
    <div className="w-full max-w-lg">
      <Card className="border-0 shadow-2xl overflow-hidden" style={{ borderRadius: '1.5rem' }}>
        {/* Header with gradient */}
        <div className="relative p-8 pb-4 text-center" style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-24 h-24 rounded-full" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
            <div className="absolute bottom-4 left-4 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
          </div>
          <div className="relative z-10">
            <div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)' }}
            >
              <BookOpen className="w-12 h-12" style={{ color: '#0d3d2e' }} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-cairo)' }}>
              مركز الشفاء
            </h1>
            <p className="text-lg font-semibold" style={{ color: '#d4af37' }}>
              لتحفيظ القرآن الكريم
            </p>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              نظام إدارة وإشراف متكامل
            </p>
          </div>
        </div>

        {/* Options */}
        <CardContent className="p-6 space-y-4">
          {/* Admin Panel */}
          <button
            onClick={onAdminLogin}
            className="w-full group flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{
              borderColor: '#1a5f4a',
              backgroundColor: 'rgba(26, 95, 74, 0.03)',
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ backgroundColor: 'rgba(26, 95, 74, 0.1)' }}
            >
              <ShieldCheck className="w-7 h-7" style={{ color: '#1a5f4a' }} />
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-lg font-bold" style={{ color: '#1a5f4a' }}>
                لوحة التحكم الإدارية
              </h3>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                دخول المدير — إدارة الحلقات والطلاب والأنشطة
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 rotate-180" style={{ color: '#1a5f4a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Public Display */}
          <button
            onClick={onPublicView}
            className="w-full group flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{
              borderColor: '#d4af37',
              backgroundColor: 'rgba(212, 175, 55, 0.03)',
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
            >
              <Eye className="w-7 h-7" style={{ color: '#d4af37' }} />
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-lg font-bold" style={{ color: '#b8941e' }}>
                العرض العام
              </h3>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                استعراض الحلقات والطلاب والإحصائيات
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 rotate-180" style={{ color: '#d4af37' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Verse */}
          <div className="text-center mt-6 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
            <p className="text-sm italic" style={{ color: '#1a5f4a', fontFamily: 'var(--font-amiri)' }}>
              ﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾
            </p>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              سورة الحجر - آية ٩
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
