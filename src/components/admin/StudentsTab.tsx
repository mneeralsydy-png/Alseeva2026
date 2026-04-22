'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Phone, Plus, Pencil, Trash2, Save } from 'lucide-react'
import type { Student, Halaka } from '@/lib/types'
import { CATEGORIES, LEVELS, CATEGORY_COLORS } from '@/lib/types'

interface Props {
  students: Student[]
  halakat: Halaka[]
  form: { name: string; age: string; surah: string; category: string; parentName: string; parentPhone: string; level: string; halakaId: string }
  setForm: (f: any) => void
  editing: Student | null
  dialogOpen: boolean
  setDialogOpen: (o: boolean) => void
  onCreate: () => void
  onUpdate: () => void
  onDelete: (id: string) => void
  onEdit: (s: Student) => void
}

const levelBadgeColors: Record<string, string> = { 'مبتدئ': 'bg-emerald-100 text-emerald-700', 'متوسط': 'bg-blue-100 text-blue-700', 'متقدم': 'bg-amber-100 text-amber-700' }

export function StudentsTab({ students, halakat, form, setForm, editing, dialogOpen, setDialogOpen, onCreate, onUpdate, onDelete, onEdit }: Props) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
            <Plus className="w-5 h-5" style={{ color: '#d4af37' }} />إضافة طالب جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>اسم الطالب *</Label><Input placeholder="الاسم الثلاثي" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>العمر</Label><Input placeholder="العمر بالسنوات" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>السورة</Label><Input placeholder="مثال: النبأ، الملك" value={form.surah} onChange={(e) => setForm({ ...form, surah: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>الفئة</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>المستوى</Label><Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>اسم ولي الأمر</Label><Input placeholder="اسم ولي الأمر" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}><span className="flex items-center gap-1"><Phone className="w-3 h-3" />رقم هاتف ولي الأمر</span></Label><Input placeholder="05XXXXXXXX" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>الحلقة</Label><Select value={form.halakaId} onValueChange={(v) => setForm({ ...form, halakaId: v })}><SelectTrigger className="text-right"><SelectValue placeholder="اختر الحلقة" /></SelectTrigger><SelectContent>{halakat.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <Button onClick={onCreate} className="mt-4 font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}><Plus className="w-4 h-4 ml-1" />إضافة الطالب</Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3"><CardTitle className="text-base font-bold" style={{ color: '#1a5f4a' }}>قائمة الطلاب ({students.length})</CardTitle></CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-10" style={{ color: '#9ca3af' }}><Users className="w-12 h-12 mx-auto mb-2 opacity-30" /><p className="text-sm">لا يوجد طلاب مسجلين بعد</p></div>
          ) : (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
                    <TableHead className="text-white font-semibold text-sm">الطالب</TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden sm:table-cell">العمر</TableHead>
                    <TableHead className="text-white font-semibold text-sm">الفئة</TableHead>
                    <TableHead className="text-white font-semibold text-sm">المستوى</TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden md:table-cell">السورة</TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden lg:table-cell">ولي الأمر</TableHead>
                    <TableHead className="text-white font-semibold text-sm hidden xl:table-cell">الحلقة</TableHead>
                    <TableHead className="text-white font-semibold text-sm text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-sm">{s.name}</TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">{s.age || '-'}</TableCell>
                      <TableCell><Badge className={`text-xs ${CATEGORY_COLORS[s.category] || ''}`}>{s.category || '-'}</Badge></TableCell>
                      <TableCell><Badge className={`text-xs ${levelBadgeColors[s.level] || ''}`}>{s.level}</Badge></TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{s.surah || '-'}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell"><div><p>{s.parentName || '-'}</p><p className="text-xs" style={{ color: '#9ca3af' }}>{s.parentPhone || ''}</p></div></TableCell>
                      <TableCell className="text-sm hidden xl:table-cell"><Badge variant="outline" className="text-xs" style={{ color: '#1a5f4a', borderColor: '#1a5f4a40' }}>{s.halaka?.name || '-'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(s)} className="h-8 w-8 p-0" style={{ color: '#d4af37' }}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) onDelete(s.id) }} className="h-8 w-8 p-0 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2" style={{ color: '#1a5f4a' }}><Pencil className="w-5 h-5" style={{ color: '#d4af37' }} />تعديل بيانات الطالب</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>اسم الطالب *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-right" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>العمر</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="text-right" /></div>
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>السورة</Label><Input value={form.surah} onChange={(e) => setForm({ ...form, surah: e.target.value })} className="text-right" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>الفئة</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>المستوى</Label><Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>اسم ولي الأمر</Label><Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>رقم هاتف ولي الأمر</Label><Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>الحلقة</Label><Select value={form.halakaId} onValueChange={(v) => setForm({ ...form, halakaId: v })}><SelectTrigger className="text-right"><SelectValue placeholder="اختر الحلقة" /></SelectTrigger><SelectContent><SelectItem value="none">بدون حلقة</SelectItem>{halakat.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></div>
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
