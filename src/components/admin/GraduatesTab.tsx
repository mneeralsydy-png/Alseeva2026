'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GraduationCap, Plus, Pencil, Trash2, Save, Users, Calendar, Award, FileText } from 'lucide-react'

export interface GraduateBatch {
  id: string
  batchNumber: number
  title: string
  date: string
  graduateCount: number
  graduates: string[]
  notes: string
  createdAt: string
}

export interface GraduateForm {
  batchNumber: string
  title: string
  date: string
  graduatesText: string
  notes: string
}

interface Props {
  graduates: GraduateBatch[]
  form: GraduateForm
  setForm: (f: GraduateForm) => void
  editing: GraduateBatch | null
  dialogOpen: boolean
  setDialogOpen: (o: boolean) => void
  onCreate: () => void
  onUpdate: () => void
  onDelete: (id: string) => void
  onEdit: (g: GraduateBatch) => void
}

const emptyForm: GraduateForm = {
  batchNumber: '',
  title: '',
  date: '',
  graduatesText: '',
  notes: '',
}

export { emptyForm }

function GraduateFormFields({
  form,
  setForm,
  isEdit = false,
}: {
  form: GraduateForm
  setForm: (f: GraduateForm) => void
  isEdit?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-1" style={{ color: '#1a5f4a' }}>
          <Award className="w-3.5 h-3.5" />
          رقم الدفعة *
        </Label>
        <Input
          type="number"
          placeholder="مثال: 1"
          value={form.batchNumber}
          onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
          className="text-right"
          min="1"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-1" style={{ color: '#1a5f4a' }}>
          <GraduationCap className="w-3.5 h-3.5" />
          عنوان الدفعة *
        </Label>
        <Input
          placeholder="مثال: الدفعة الأولى لخريجي مركز الشفاء"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="text-right"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-1" style={{ color: '#1a5f4a' }}>
          <Calendar className="w-3.5 h-3.5" />
          تاريخ التخرج *
        </Label>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="text-right"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-1" style={{ color: '#1a5f4a' }}>
          <Users className="w-3.5 h-3.5" />
          عدد الخريجين
        </Label>
        <Input
          value={form.graduatesText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean).length || 0}
          disabled
          className="text-right bg-gray-50"
        />
        <p className="text-[10px]" style={{ color: '#9ca3af' }}>يُحسب تلقائياً من أسماء الخريجين</p>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label className="text-sm flex items-center gap-1" style={{ color: '#1a5f4a' }}>
          <Users className="w-3.5 h-3.5" />
          أسماء الخريجين (أسماء مفصولة بفواصل أو سطور جديدة)
        </Label>
        <Textarea
          placeholder={"أحمد بن محمد\nخالد بن عمر\nسالم بن علي"}
          value={form.graduatesText}
          onChange={(e) => setForm({ ...form, graduatesText: e.target.value })}
          className="text-right"
          rows={5}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label className="text-sm flex items-center gap-1" style={{ color: '#1a5f4a' }}>
          <FileText className="w-3.5 h-3.5" />
          ملاحظات (اختياري)
        </Label>
        <Textarea
          placeholder="ملاحظات إضافية عن الدفعة"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="text-right"
          rows={2}
        />
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function GraduatesTab({
  graduates,
  form,
  setForm,
  editing,
  dialogOpen,
  setDialogOpen,
  onCreate,
  onUpdate,
  onDelete,
  onEdit,
}: Props) {
  const totalGraduates = graduates.reduce((sum, b) => sum + b.graduateCount, 0)

  const renderBatchCard = (batch: GraduateBatch, index: number) => {
    const batchColors = [
      { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', gradient: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' },
      { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', gradient: 'linear-gradient(135deg, #92400e, #78350f)' },
      { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', gradient: 'linear-gradient(135deg, #0d9488, #0f766e)' },
      { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', gradient: 'linear-gradient(135deg, #e11d48, #be123c)' },
      { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
    ]
    const color = batchColors[index % batchColors.length]

    return (
      <Card
        key={batch.id}
        className={`border ${color.border} ${color.bg} shadow-sm`}
        style={{ borderRadius: '0.8rem' }}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color.gradient }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: '#1a1a1a' }}>
                  {batch.title}
                </h3>
                <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                  الدفعة رقم {batch.batchNumber}
                </p>
              </div>
            </div>
            <Badge className={`text-xs font-bold ${color.badge}`}>
              {batch.graduateCount} خريج
            </Badge>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(batch.date)}</span>
          </div>

          {/* Graduates list */}
          {batch.graduates.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#1a5f4a' }}>
                <Users className="w-3.5 h-3.5" />
                أسماء الخريجين
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {batch.graduates.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: i === 0
                        ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                        : i % 2 === 0
                          ? '#f9fafb'
                          : 'white',
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
                        color: '#0d3d2e',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium flex-1" style={{ color: '#1a1a1a' }}>
                      {g}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {batch.notes && (
            <div className="mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-[10px] font-semibold mb-0.5 flex items-center gap-1" style={{ color: '#1a5f4a' }}>
                <FileText className="w-3 h-3" />
                ملاحظات
              </p>
              <p className="text-xs" style={{ color: '#374151' }}>{batch.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-1 pt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(batch)}
              className="h-8 w-8 p-0"
              style={{ color: '#d4af37' }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('هل تريد حذف هذه الدفعة؟')) onDelete(batch.id)
              }}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem', background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-8 h-8 mx-auto mb-2 text-white/80" />
            <p className="text-2xl font-extrabold text-white">{graduates.length}</p>
            <p className="text-xs text-white/60">دفعة تخرج</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem', background: 'linear-gradient(135deg, #d4af37, #f4d03f)' }}>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#0d3d2e' }} />
            <p className="text-2xl font-extrabold" style={{ color: '#0d3d2e' }}>{totalGraduates}</p>
            <p className="text-xs" style={{ color: '#0d3d2e99' }}>إجمالي الخريجين</p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Batch Card */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base font-bold flex items-center gap-2"
            style={{ color: '#1a5f4a' }}
          >
            <Plus className="w-5 h-5" style={{ color: '#d4af37' }} />
            إضافة دفعة خريجين جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GraduateFormFields form={form} setForm={setForm} />
          <Button
            onClick={onCreate}
            className="mt-4 font-semibold shadow-md"
            style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة الدفعة
          </Button>
        </CardContent>
      </Card>

      {/* All Batches */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-bold flex items-center gap-2 text-white px-4 py-2 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}
          >
            <GraduationCap className="w-4 h-4" />
            دفوعات الخريجين ({graduates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {graduates.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#9ca3af' }}>
              <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs">لا توجد دفوعات خريجين مسجلة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {graduates.map((g, i) => renderBatchCard(g, i))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" style={{ borderRadius: '0.8rem' }}>
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2"
              style={{ color: '#1a5f4a' }}
            >
              <Pencil className="w-5 h-5" style={{ color: '#d4af37' }} />
              تعديل دفعة الخريجين
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <GraduateFormFields form={form} setForm={setForm} isEdit />
            <div className="flex gap-2 pt-2">
              <Button
                onClick={onUpdate}
                className="flex-1 font-semibold shadow-md"
                style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}
              >
                <Save className="w-4 h-4 ml-1" />
                حفظ التعديلات
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
