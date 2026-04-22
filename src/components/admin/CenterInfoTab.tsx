'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Save, Image, Link as LinkIcon } from 'lucide-react'
import type { CenterInfoItem } from '@/lib/types'

const INFO_TYPES = [{ value: 'text', label: 'نص' }, { value: 'image', label: 'صورة' }, { value: 'link', label: 'رابط' }]
const INFO_SECTIONS = ['عام', 'عن المركز', 'أوقات الدوام', 'تواصل']
const SECTION_TITLES: Record<string, string> = { 'عام': 'معلومات عامة', 'عن المركز': 'عن المركز', 'أوقات الدوام': 'أوقات الدوام', 'تواصل': 'تواصل معنا' }

interface Props {
  items: CenterInfoItem[]
  form: { key: string; value: string; type: string; section: string }
  setForm: (f: any) => void
  editing: CenterInfoItem | null
  dialogOpen: boolean
  setDialogOpen: (o: boolean) => void
  file: File | null
  setFile: (f: File | null) => void
  preview: string | null
  setPreview: (p: string | null) => void
  onCreate: () => void
  onUpdate: () => void
  onDelete: (id: string) => void
  onEdit: (item: CenterInfoItem) => void
}

export function CenterInfoTab({ items, form, setForm, editing, dialogOpen, setDialogOpen, file, setFile, preview, setPreview, onCreate, onUpdate, onDelete, onEdit }: Props) {
  const grouped = items.reduce<Record<string, CenterInfoItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  const typeIcon = (type: string) => {
    if (type === 'image') return <Image className="w-3.5 h-3.5" />
    if (type === 'link') return <LinkIcon className="w-3.5 h-3.5" />
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
            <Plus className="w-5 h-5" style={{ color: '#d4af37' }} />إضافة عنصر جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>المفتاح *</Label><Input placeholder="مثال: العنوان" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>القسم</Label><Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{INFO_SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>النوع</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{INFO_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            {form.type === 'image' ? (
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>صورة</Label><Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); if (f) setPreview(URL.createObjectURL(f)) }} className="text-right" />{preview && <img src={preview} alt="preview" className="w-20 h-20 rounded-lg object-cover mt-2" />}</div>
            ) : (
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>القيمة *</Label><Input placeholder={form.type === 'link' ? 'https://...' : 'القيمة'} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="text-right" dir={form.type === 'link' ? 'ltr' : 'rtl'} /></div>
            )}
          </div>
          <Button onClick={onCreate} className="mt-4 font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}><Plus className="w-4 h-4 ml-1" />إضافة</Button>
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([section, sectionItems]) => (
        <Card key={section} className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
          <CardHeader className="pb-3"><CardTitle className="text-base font-bold" style={{ color: '#1a5f4a' }}>{SECTION_TITLES[section] || section}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
                    <TableHead className="text-white font-semibold text-sm">المفتاح</TableHead>
                    <TableHead className="text-white font-semibold text-sm">القيمة</TableHead>
                    <TableHead className="text-white font-semibold text-sm">النوع</TableHead>
                    <TableHead className="text-white font-semibold text-sm text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-sm">{item.key}</TableCell>
                      <TableCell className="text-sm">
                        {item.type === 'image' ? (
                          <img src={item.value} alt={item.key} className="w-16 h-16 rounded-lg object-cover" />
                        ) : item.type === 'link' ? (
                          <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline text-xs truncate block max-w-[200px]">{item.value}</a>
                        ) : (
                          item.value
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">{typeIcon(item.type)}{item.type}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 w-8 p-0" style={{ color: '#d4af37' }}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm('حذف؟')) onDelete(item.id) }} className="h-8 w-8 p-0 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <div className="text-center py-10" style={{ color: '#9ca3af' }}><p className="text-sm">لا توجد معلومات مسجلة</p></div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" style={{ borderRadius: '0.8rem' }}>
          <DialogHeader><DialogTitle className="flex items-center gap-2" style={{ color: '#1a5f4a' }}><Pencil className="w-5 h-5" style={{ color: '#d4af37' }} />تعديل</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>المفتاح</Label><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>القسم</Label><Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}><SelectTrigger className="text-right"><SelectValue /></SelectTrigger><SelectContent>{INFO_SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            {form.type === 'image' ? (
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>صورة</Label><Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); if (f) setPreview(URL.createObjectURL(f)) }} className="text-right" />{preview && <img src={preview} alt="preview" className="w-20 h-20 rounded-lg object-cover mt-2" />}</div>
            ) : (
              <div className="space-y-2"><Label className="text-sm" style={{ color: '#1a5f4a' }}>القيمة</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="text-right" dir={form.type === 'link' ? 'ltr' : 'rtl'} /></div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={onUpdate} className="flex-1 font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}><Save className="w-4 h-4 ml-1" />حفظ</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
