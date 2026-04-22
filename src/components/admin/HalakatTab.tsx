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
import { BookOpen, Clock, MapPin, Plus, Pencil, Trash2, Save } from 'lucide-react'
import type { Halaka } from '@/lib/types'
import { BRANCHES, BRANCH_COLORS } from '@/lib/types'

interface Props {
  halakat: Halaka[]
  form: { name: string; teacher: string; time: string; location: string; branch: string; description: string }
  setForm: (f: any) => void
  editing: Halaka | null
  dialogOpen: boolean
  setDialogOpen: (o: boolean) => void
  onCreate: () => void
  onUpdate: () => void
  onDelete: (id: string) => void
  onEdit: (h: Halaka) => void
}

const emptyForm = { name: '', teacher: '', time: '', location: '', branch: 'السرور', description: '' }

export function HalakatTab({ halakat, form, setForm, editing, dialogOpen, setDialogOpen, onCreate, onUpdate, onDelete, onEdit }: Props) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
            <Plus className="w-5 h-5" style={{ color: '#d4af37' }} />إضافة حلقة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: '#1a5f4a' }}>اسم الحلقة *</Label>
              <Input placeholder="مثال: حلقة حفظ الجزء الثلاثين" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-right" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: '#1a5f4a' }}>اسم المعلم *</Label>
              <Input placeholder="اسم المعلم" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} className="text-right" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: '#1a5f4a' }}>الفرع</Label>
              <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                <SelectTrigger className="text-right"><SelectValue /></SelectTrigger>
                <SelectContent>{BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: '#1a5f4a' }}>الوقت</Label>
              <Input placeholder="مثال: 4:00 - 6:00 مساءً" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="text-right" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: '#1a5f4a' }}>المكان</Label>
              <Input placeholder="مثال: المصلى الرئيسي" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="text-right" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: '#1a5f4a' }}>وصف (اختياري)</Label>
              <Input placeholder="وصف مختصر للحلقة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-right" />
            </div>
          </div>
          <Button onClick={onCreate} className="mt-4 font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>
            <Plus className="w-4 h-4 ml-1" />إضافة الحلقة
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold" style={{ color: '#1a5f4a' }}>قائمة الحلقات ({halakat.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {halakat.length === 0 ? (
            <div className="text-center py-10" style={{ color: '#9ca3af' }}><BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد حلقات مسجلة بعد</p></div>
          ) : (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
                    <TableHead className="text-white font-semibold text-sm">الحلقة</TableHead>
                    <TableHead className="text-white font-semibold text-sm">المعلم</TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden md:table-cell"><span className="flex items-center gap-1"><Clock className="w-3 h-3" />الوقت</span></TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden lg:table-cell"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />المكان</span></TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden sm:table-cell">الفرع</TableHead>
                    <TableHead className="text-white font-semibold text-sm">الطلاب</TableHead>
                    <TableHead className="text-white font-semibold text-sm text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {halakat.map((h) => (
                    <TableRow key={h.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-sm">{h.name}</TableCell>
                      <TableCell className="text-sm">{h.teacher}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{h.time || '-'}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{h.location || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge variant="outline" className={`text-xs ${BRANCH_COLORS[h.branch] || ''}`}>{h.branch || '-'}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs" style={{ color: '#1a5f4a', borderColor: '#1a5f4a40' }}>{h._count?.students || 0}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(h)} className="h-8 w-8 p-0" style={{ color: '#d4af37' }}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm('هل أنت متأكد من حذف هذه الحلقة؟')) onDelete(h.id) }} className="h-8 w-8 p-0 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2" style={{ color: '#1a5f4a' }}><Pencil className="w-5 h-5" style={{ color: '#d4af37' }} />تعديل الحلقة</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>اسم الحلقة *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>اسم المعلم *</Label><Input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} className="text-right" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>الفرع</Label><Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>الوقت</Label><Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="text-right" /></div>
            </div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>المكان</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>وصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-right" rows={2} /></div>
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
