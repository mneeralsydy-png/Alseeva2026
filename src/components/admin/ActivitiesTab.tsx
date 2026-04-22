'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Plus, Pencil, Trash2, Save } from 'lucide-react'
import type { Activity } from '@/lib/types'
import { ACTIVITY_TYPES } from '@/lib/types'

interface Props {
  activities: Activity[]
  form: { title: string; description: string; date: string; type: string }
  setForm: (f: any) => void
  editing: Activity | null
  dialogOpen: boolean
  setDialogOpen: (o: boolean) => void
  onCreate: () => void
  onUpdate: () => void
  onDelete: (id: string) => void
  onEdit: (a: Activity) => void
  formatDate: (s: string) => string
}

export function ActivitiesTab({ activities, form, setForm, editing, dialogOpen, setDialogOpen, onCreate, onUpdate, onDelete, onEdit, formatDate }: Props) {
  const typeColors: Record<string, string> = {
    'عامة': 'bg-gray-100 text-gray-700', 'قرآنية': 'bg-emerald-100 text-emerald-700',
    'ثقافية': 'bg-blue-100 text-blue-700', 'رياضية': 'bg-amber-100 text-amber-700', 'اجتماعية': 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
            <Plus className="w-5 h-5" style={{ color: '#d4af37' }} />إضافة نشاط جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>عنوان النشاط *</Label><Input placeholder="عنوان النشاط" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>التاريخ *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>النوع</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>الوصف</Label><Textarea placeholder="وصف النشاط" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-right" rows={2} /></div>
          </div>
          <Button onClick={onCreate} className="mt-4 font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>
            <Plus className="w-4 h-4 ml-1" />إضافة النشاط
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3"><CardTitle className="text-base font-bold" style={{ color: '#1a5f4a' }}>قائمة الأنشطة ({activities.length})</CardTitle></CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-10" style={{ color: '#9ca3af' }}><Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد أنشطة مسجلة</p></div>
          ) : (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
                    <TableHead className="text-white font-semibold text-sm">النشاط</TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden sm:table-cell">النوع</TableHead>
                    <TableHead className="text-white font-semibold text-sm">التاريخ</TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden md:table-cell">الوصف</TableHead>
                    <TableHead className="text-white font-semibold text-sm text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-sm">{a.title}</TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge className={`text-xs ${typeColors[a.type] || ''}`}>{a.type}</Badge></TableCell>
                      <TableCell className="text-sm">{formatDate(a.date)}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell max-w-xs truncate">{a.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(a)} className="h-8 w-8 p-0" style={{ color: '#d4af37' }}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm('حذف النشاط؟')) onDelete(a.id) }} className="h-8 w-8 p-0 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" style={{ borderRadius: '0.8rem' }}>
          <DialogHeader><DialogTitle className="flex items-center gap-2" style={{ color: '#1a5f4a' }}><Pencil className="w-5 h-5" style={{ color: '#d4af37' }} />تعديل النشاط</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>عنوان النشاط *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>النوع</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-right" rows={2} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={onUpdate} className="flex-1 font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}><Save className="w-4 h-4 ml-1" />حفظ التعديلات</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
