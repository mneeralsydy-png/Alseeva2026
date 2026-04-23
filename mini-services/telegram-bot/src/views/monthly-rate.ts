// ═══════════════════════════════════════════════════════════════════════════════
// Monthly Rate View — Attendance rate per branch + student progress
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { sbGet } from '../services/supabase.js'
import { clearState } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, monthStart } from '../utils/helpers.js'
import { backKeyboard } from '../keyboards/index.js'

export async function viewMonthlyRate(ctx: any, c: number) {
  clearState(c)

  const [students, halakat, attendance] = await Promise.all([
    sbGet('Student'),
    sbGet('Halaka'),
    sbGet('Attendance'),
  ])

  const mStart = monthStart()

  // Branch-based analysis
  const hMap = new Map(halakat.map((h: any) => [h.id, h]))
  const branchStudents = new Map<string, any[]>()
  for (const s of students) {
    const h = hMap.get(s.halakaId)
    const br = h?.branch || 'غير محدد'
    if (!branchStudents.has(br)) branchStudents.set(br, [])
    branchStudents.get(br)!.push(s)
  }

  // Monthly attendance by branch
  const branchStats = new Map<string, { total: number; present: number }>()
  for (const a of attendance) {
    if (a.date < mStart) continue
    const s = students.find((st: any) => st.id === a.studentId)
    if (!s) continue
    const h = hMap.get(s.halakaId)
    const br = h?.branch || 'غير محدد'
    if (!branchStats.has(br)) branchStats.set(br, { total: 0, present: 0 })
    const st = branchStats.get(br)!
    st.total++
    if (a.status === 'حاضر') st.present++
  }

  // Level-based analysis
  const levelStats = new Map<string, { total: number; present: number }>()
  for (const a of attendance) {
    if (a.date < mStart) continue
    const s = students.find((st: any) => st.id === a.studentId)
    if (!s) continue
    const lv = s.level || 'غير محدد'
    if (!levelStats.has(lv)) levelStats.set(lv, { total: 0, present: 0 })
    const st = levelStats.get(lv)!
    st.total++
    if (a.status === 'حاضر') st.present++
  }

  const now = new Date()
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  const monthName = monthNames[now.getMonth()]
  const year = now.getFullYear()

  let msg = `📈 ${bold('معدل الحفظ والحضور الشهري')}\n`
  msg += `📅 ${esc(monthName)} ${year}\n${LINE}\n\n`

  // Overall monthly rate
  const monthlyAtt = attendance.filter((a: any) => a.date >= mStart)
  const monthlyPresent = monthlyAtt.filter((a: any) => a.status === 'حاضر').length
  const monthlyLate = monthlyAtt.filter((a: any) => a.status === 'متأخر').length
  const monthlyAbsent = monthlyAtt.filter((a: any) => a.status === 'غائب').length
  const overallRate = monthlyAtt.length ? Math.round((monthlyPresent / monthlyAtt.length) * 100) : 0

  msg += `📊 ${bold('ملخص الشهر')}\n`
  msg += `   إجمالي السجلات: ${bold(String(monthlyAtt.length))}\n`
  msg += `   ✅ حاضر: ${bold(String(monthlyPresent))}  ⚠️ متأخر: ${bold(String(monthlyLate))}  ❌ غائب: ${bold(String(monthlyAbsent))}\n`
  msg += `   📊 نسبة الحضور: ${bold(overallRate + '%')}\n\n`

  // Per-branch
  if (branchStats.size) {
    msg += `🌳 ${bold('حسب الفرع')}\n`
    for (const [br, st] of branchStats) {
      const rate = st.total ? Math.round((st.present / st.total) * 100) : 0
      const bar = rate >= 80 ? '🟢' : rate >= 50 ? '🟡' : '🔴'
      msg += `   ${bar} ${esc(br)}: ${bold(rate + '%')} (${st.present}/${st.total})\n`
    }
    msg += '\n'
  }

  // Per-level
  if (levelStats.size) {
    msg += `📊 ${bold('حسب المستوى')}\n`
    for (const [lv, st] of levelStats) {
      const rate = st.total ? Math.round((st.present / st.total) * 100) : 0
      const bar = rate >= 80 ? '🟢' : rate >= 50 ? '🟡' : '🔴'
      msg += `   ${bar} ${esc(lv)}: ${bold(rate + '%')} (${st.present}/${st.total})\n`
    }
  }

  await ed(ctx, msg, backKeyboard('home'))
}
