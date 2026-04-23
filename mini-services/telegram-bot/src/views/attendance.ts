// ═══════════════════════════════════════════════════════════════════════════════
// Attendance View — Daily attendance per halaka
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { sbGet, sbPost, sbPatch } from '../services/supabase.js'
import { clearState } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, attEmoji, today } from '../utils/helpers.js'
import { backKeyboard } from '../keyboards/index.js'

// ─── Pick Halaka ─────────────────────────────────────────────────────────────
export async function viewAttPicker(ctx: any, c: number) {
  clearState(c)
  const halakat = await sbGet('Halaka', 'order=createdAt.asc')

  if (!halakat.length) {
    await ed(ctx, '❌ لا توجد حلقات\n\nأنشئ حلقة أولاً من قسم الحلقات', backKeyboard('home'))
    return
  }

  // Show today's summary
  const todayStr = today()
  const allAtt = await sbGet('Attendance', `date=eq.${todayStr}`)
  const todayPresent = allAtt.filter((a: any) => a.status === 'حاضر').length
  const todayTotal = allAtt.length

  let msg = `✅ ${bold('تسجيل الحضور')}\n📅 ${esc(todayStr)}\n${LINE}\n\n`
  if (todayTotal > 0) {
    msg += `📊 سجل اليوم: ${bold(`${todayPresent}/${todayTotal}`)} حاضر\n\n`
  }
  msg += `اختر الحلقة ⬇️`

  const kb = new InlineKeyboard()
  for (const h of halakat) {
    kb.text(`📚 ${esc(h.name)}`, `ath_${h.id}`).row()
  }
  kb.row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ─── Show Halaka Students for Attendance ─────────────────────────────────────
export async function viewAttHalaka(ctx: any, c: number, hid: string) {
  clearState(c)
  const [hResult, students] = await Promise.all([
    sbGet('Halaka', `id=eq.${hid}`),
    sbGet('Student', `halakaId=eq.${hid}&order=createdAt.asc`),
  ])
  const halaka = hResult[0]

  if (!students.length) {
    await ed(ctx, '❌ لا يوجد طلاب في هذه الحلقة', backKeyboard('m_att'))
    return
  }

  const todayStr = today()
  const attendance = await sbGet('Attendance', `date=eq.${todayStr}&halakaId=eq.${hid}`)
  const attMap = new Map(attendance.map((a: any) => [a.studentId, a.status]))

  const presentCount = attendance.filter((a: any) => a.status === 'حاضر').length
  const absentCount = attendance.filter((a: any) => a.status === 'غائب').length
  const lateCount = attendance.filter((a: any) => a.status === 'متأخر').length

  let msg = `✅ ${bold('حضور اليوم')} — ${esc(halaka?.name || '')}\n`
  msg += `📅 ${esc(todayStr)}  👥 ${students.length} طالب\n${LINE}\n\n`
  msg += `📊 ملخص: ✅ ${presentCount}  ❌ ${absentCount}  ⚠️ ${lateCount}\n\n`

  const kb = new InlineKeyboard()

  for (const s of students) {
    const st = attMap.get(s.id) || ''
    const statusIcon = attEmoji(st)
    msg += `${statusIcon} ${esc(s.name)} — ${st ? esc(st) : 'لم يسجل'}\n`
    kb.text(`${st === 'حاضر' ? '✅' : '☐'} حاضر`, `atm_${s.id}|${hid}|حاضر`)
      .text(`${st === 'غائب' ? '❌' : '☐'} غائب`, `atm_${s.id}|${hid}|غائب`)
      .text(`${st === 'متأخر' ? '⚠️' : '☐'} متأخر`, `atm_${s.id}|${hid}|متأخر`).row()
  }

  kb.row().text('🔙 الحلقات', 'm_att').text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ─── Mark Attendance ─────────────────────────────────────────────────────────
export async function markAttendance(ctx: any, c: number, sid: string, hid: string, status: string) {
  const todayStr = today()
  const existing = await sbGet('Attendance', `studentId=eq.${sid}&date=eq.${todayStr}&halakaId=eq.${hid}`)

  if (existing.length) {
    await sbPatch('Attendance', `id=eq.${existing[0].id}`, { status })
  } else {
    await sbPost('Attendance', { studentId: sid, date: todayStr, halakaId: hid, status })
  }

  const emoji = attEmoji(status)
  try { await ctx.answerCallbackQuery({ text: `${emoji} تم: ${status}` }) } catch {}

  // Refresh the attendance view
  await viewAttHalaka(ctx, c, hid)
}
