// ═══════════════════════════════════════════════════════════════════════════════
// Views — Statistics
// ═══════════════════════════════════════════════════════════════════════════════

import { sbGet } from '../services/supabase.js'
import { clearState } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, monthStart } from '../utils/helpers.js'
import { homeKeyboard } from '../keyboards/index.js'

export async function viewStats(ctx: any, c: number) {
  clearState(c)

  const [students, halakat, attendance] = await Promise.all([
    sbGet('Student'),
    sbGet('Halaka'),
    sbGet('Attendance'),
  ])

  // Branch distribution
  const branchCount = new Map<string, number>()
  for (const h of halakat) {
    const br = h.branch || '?'
    branchCount.set(br, (branchCount.get(br) || 0) + 1)
  }

  // Level distribution
  const levelCount = new Map<string, number>()
  for (const s of students) {
    const lv = s.level || '?'
    levelCount.set(lv, (levelCount.get(lv) || 0) + 1)
  }

  // Category distribution
  const catCount = new Map<string, number>()
  for (const s of students) {
    const ct = s.category || '?'
    catCount.set(ct, (catCount.get(ct) || 0) + 1)
  }

  // Monthly attendance rate
  const mStart = monthStart()
  const monthlyAtt = attendance.filter((a: any) => a.date >= mStart)
  const presentCount = monthlyAtt.filter((a: any) => a.status === 'حاضر').length
  const rate = monthlyAtt.length ? Math.round((presentCount / monthlyAtt.length) * 100) : 0

  // Today's attendance
  const todayStr = new Date().toISOString().split('T')[0]
  const todayAtt = attendance.filter((a: any) => a.date === todayStr)
  const todayPresent = todayAtt.filter((a: any) => a.status === 'حاضر').length

  let msg =
    `📊 ${bold('إحصائيات Alseeva2026')}\n${LINE}\n\n` +
    `👥 إجمالي الطلاب: ${bold(String(students.length))}\n` +
    `📚 الحلقات: ${bold(String(halakat.length))}\n\n` +
    `✅ حضور اليوم: ${bold(`${todayPresent}/${todayAtt.length}`)}\n` +
    `📈 نسبة الحضور الشهري: ${bold(rate + '%')}\n\n`

  if (branchCount.size) {
    msg += `🌳 ${bold('حسب الفرع:')}\n`
    for (const [br, n] of branchCount) msg += `   • ${esc(br)}: ${bold(String(n))} حلقة\n`
    msg += '\n'
  }

  if (levelCount.size) {
    msg += `📊 ${bold('حسب المستوى:')}\n`
    for (const [lv, n] of levelCount) msg += `   • ${esc(lv)}: ${bold(String(n))} طالب\n`
    msg += '\n'
  }

  if (catCount.size) {
    msg += `📂 ${bold('حسب الفئة:')}\n`
    for (const [ct, n] of catCount) msg += `   • ${esc(ct)}: ${bold(String(n))} طالب\n`
  }

  await ed(ctx, msg, homeKeyboard())
}
