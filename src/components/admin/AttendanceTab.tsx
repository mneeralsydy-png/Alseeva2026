'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ClipboardCheck, Save } from 'lucide-react'
import type { Halaka, Student } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  'حاضر': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'غائب': 'bg-red-100 text-red-800 border-red-300',
  'متأخر': 'bg-amber-100 text-amber-800 border-amber-300',
}

interface Props {
  halakat: Halaka[]
  students: Student[]
  date: string
  setDate: (d: string) => void
  halakaId: string
  setHalakaId: (id: string) => void
  records: { studentId: string; status: string; notes: string }[]
  updateRecord: (studentId: string, field: 'status' | 'notes', value: string) => void
  onSave: () => void
}

export function AttendanceTab({ halakat, students, date, setDate, halakaId, setHalakaId, records, updateRecord, onSave }: Props) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm" style={{ borderRadius: '0.8rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: '#1a5f4a' }}>
            <ClipboardCheck className="w-5 h-5" style={{ color: '#d4af37' }} />تسجيل الحضور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: '#1a5f4a' }}>التاريخ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-right" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: '#1a5f4a' }}>الحلقة</Label>
              <Select value={halakaId} onValueChange={setHalakaId}>
                <SelectTrigger className="text-right"><SelectValue placeholder="اختر الحلقة" /></SelectTrigger>
                <SelectContent>{halakat.map((h) => <SelectItem key={h.id} value={h.id}>{h.name} - {h.teacher}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {records.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)' }}>
                      <TableHead className="text-white font-semibold text-sm">الطالب</TableHead>
                      <TableHead className="text-white font-semibold text-sm text-center">الحالة</TableHead>
                      <TableHead className="text-white font-semibold text-sm">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => {
                      const student = students.find((s) => s.id === r.studentId)
                      return (
                        <TableRow key={r.studentId} className="hover:bg-gray-50">
                          <TableCell className="font-semibold text-sm">{student?.name || 'غير معروف'}</TableCell>
                          <TableCell className="text-center">
                            <Select value={r.status} onValueChange={(v) => updateRecord(r.studentId, 'status', v)}>
                              <SelectTrigger className={`w-28 mx-auto text-center ${STATUS_COLORS[r.status] || ''}`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="حاضر">حاضر</SelectItem>
                                <SelectItem value="غائب">غائب</SelectItem>
                                <SelectItem value="متأخر">متأخر</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell><Input placeholder="ملاحظات" value={r.notes} onChange={(e) => updateRecord(r.studentId, 'notes', e.target.value)} className="text-right h-9" /></TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={onSave} className="font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #d4af37, #f4d03f)', color: '#0d3d2e' }}>
                <Save className="w-4 h-4 ml-1" />حفظ الحضور ({records.length} طالب)
              </Button>
            </>
          )}

          {halakaId && records.length === 0 && (
            <div className="text-center py-8" style={{ color: '#9ca3af' }}>
              <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا يوجد طلاب في هذه الحلقة</p>
            </div>
          )}

          {!halakaId && (
            <div className="text-center py-8" style={{ color: '#9ca3af' }}>
              <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">اختر الحلقة لتسجيل الحضور</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
