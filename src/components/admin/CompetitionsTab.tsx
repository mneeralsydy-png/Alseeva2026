'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Plus, Pencil, Trash2, Save, Users, Crown, Calendar, Award } from 'lucide-react'

export interface Competition {
  id: string
  title: string
  date: string
  type: 'داخلية' | 'خارجية'
  participants: string[]
  winners: { name: string; rank: string }[]
  createdAt: string
}

export interface CompetitionForm {
  title: string
  type: 'داخلية' | 'خارجية'
  date: string
  participantsText: string
  winnersText: string
}

interface Props {
  competitions: Competition[]
  form: CompetitionForm
  setForm: (f: CompetitionForm) => void
  editing: Competition | null
  dialogOpen: boolean
  setDialogOpen: (o: boolean) => void
  onCreate: () => void
  onUpdate: () => void
  onDelete: (id: string) => void
  onEdit: (c: Competition) => void
}

const emptyForm: CompetitionForm = {
  title: '',
  type: 'داخلية',
  date: '',
  participantsText: '',
  winnersText: '',
}

export { emptyForm }

function CompetitionFormFields({
  form,
  setForm,
  isEdit = false,
}: {
  form: CompetitionForm
  setForm: (f: CompetitionForm) => void
  isEdit?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm" style={{ color: '#1a5f4a' }}>عنوان المسابقة *</Label>
        <Input
          placeholder="عنوان المسابقة"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="text-right"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" style={{ color: '#1a5f4a' }}>النوع</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v as 'داخلية' | 'خارجية' })}
          >
            <SelectTrigger className="text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="داخلية">داخلية</SelectItem>
              <SelectItem value="خارجية">خارجية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm" style={{ color: '#1a5f4a' }}>التاريخ *</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="text-right"
          />
        </div>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label className="text-sm flex items-center gap-1" style={{ color: '#1a5f4a' }}>
          <Users className="w-3.5 h-3.5" />المشاركون (أسماء مفصولة بفواصل)
        </Label>
        <Textarea
          placeholder="أحمد، محمد، عمر، خالد"
          value={form.participantsText}
          onChange={(e) => setForm({ ...form, participantsText: e.target.value })}
          className="text-right"
          rows={2}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label className="text-sm flex items-center gap-1" style={{ color: '#1a5f4a' }}>
          <Crown className="w-3.5 h-3.5" />الفائزون (كل سطر: الاسم، المركز)
        </Label>
        <Textarea
          placeholder={"أحمد، الأول\nمحمد، الثاني\nعمر، الثالث"}
          value={form.winnersText}
          onChange={(e) => setForm({ ...form, winnersText: e.target.value })}
          className="text-right"
          rows={3}
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

export function CompetitionsTab({
  competitions,
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
  const internalCompetitions = competitions.filter((c) => c.type === 'داخلية')
  const externalCompetitions = competitions.filter((c) => c.type === 'خارجية')

  const renderCompetitionCard = (
    competition: Competition,
    theme: 'internal' | 'external'
  ) => {
    const isInternal = theme === 'internal'
    const accentBg = isInternal ? 'bg-emerald-50' : 'bg-amber-50'
    const accentBorder = isInternal ? 'border-emerald-200' : 'border-amber-200'
    const accentBadge = isInternal
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700'
    const trophyColor = isInternal ? '#1a5f4a' : '#92400e'
    const headerGradient = isInternal
      ? 'linear-gradient(135deg, #1a5f4a, #0d3d2e)'
      : 'linear-gradient(135deg, #92400e, #78350f)'

    return (
      <Card
        key={competition.id}
        className={`border ${accentBorder} ${accentBg} shadow-sm`}
        style={{ borderRadius: '0.8rem' }}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: trophyColor }} />
              <h3 className="font-bold text-sm" style={{ color: trophyColor }}>
                {competition.title}
              </h3>
            </div>
            <Badge className={`text-xs ${accentBadge}`}>
              {competition.type === 'داخلية' ? 'داخلية' : 'خارجية'}
            </Badge>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(competition.date)}</span>
          </div>

          {/* Participants */}
          {competition.participants.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#1a5f4a' }}>
                <Users className="w-3.5 h-3.5" />
                المشاركون ({competition.participants.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {competition.participants.map((p, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-xs font-normal ${accentBorder}`}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Winners */}
          {competition.winners.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#b8860b' }}>
                <Award className="w-3.5 h-3.5" />
                الفائزون
              </p>
              <div className="space-y-1">
                {competition.winners.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: i === 0
                        ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                        : i === 1
                          ? 'linear-gradient(135deg, #f3f4f6, #e5e7eb)'
                          : i === 2
                            ? 'linear-gradient(135deg, #fed7aa, #fdba74)'
                            : '#f9fafb',
                    }}
                  >
                    <Crown
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: i === 0 ? '#d4af37' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#6b7280' }}
                    />
                    <span className="text-xs font-semibold flex-1" style={{ color: '#1a1a1a' }}>
                      {w.name}
                    </span>
                    <Badge
                      className="text-[10px] font-bold px-2 py-0"
                      style={{
                        background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
                        color: '#0d3d2e',
                      }}
                    >
                      {w.rank}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-1 pt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(competition)}
              className="h-8 w-8 p-0"
              style={{ color: '#d4af37' }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('هل تريد حذف هذه المسابقة؟')) onDelete(competition.id)
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

  const renderSection = (
    title: string,
    items: Competition[],
    theme: 'internal' | 'external'
  ) => {
    const isInternal = theme === 'internal'
    const iconColor = isInternal ? '#1a5f4a' : '#92400e'
    const headerGradient = isInternal
      ? 'linear-gradient(135deg, #1a5f4a, #0d3d2e)'
      : 'linear-gradient(135deg, #92400e, #78350f)'

    return (
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-bold flex items-center gap-2 text-white px-4 py-2 rounded-lg"
            style={{ background: headerGradient }}
          >
            <Trophy className="w-4 h-4" />
            {title} ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#9ca3af' }}>
              <Trophy className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs">لا توجد مسابقات مسجلة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {items.map((c) => renderCompetitionCard(c, theme))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add New Competition Card */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base font-bold flex items-center gap-2"
            style={{ color: '#1a5f4a' }}
          >
            <Plus className="w-5 h-5" style={{ color: '#d4af37' }} />
            إضافة مسابقة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitionFormFields form={form} setForm={setForm} />
          <Button
            onClick={onCreate}
            className="mt-4 font-semibold shadow-md"
            style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة المسابقة
          </Button>
        </CardContent>
      </Card>

      {/* Internal Competitions */}
      {renderSection('المسابقات الداخلية', internalCompetitions, 'internal')}

      {/* External Competitions */}
      {renderSection('المسابقات الخارجية', externalCompetitions, 'external')}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" style={{ borderRadius: '0.8rem' }}>
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2"
              style={{ color: '#1a5f4a' }}
            >
              <Pencil className="w-5 h-5" style={{ color: '#d4af37' }} />
              تعديل المسابقة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <CompetitionFormFields form={form} setForm={setForm} isEdit />
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
