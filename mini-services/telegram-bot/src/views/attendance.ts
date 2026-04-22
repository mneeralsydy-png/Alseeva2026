// ═══════════════════════════════════════════════════════════════════════════════
// Views — Attendance Management
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { sbGet, sbPost, sbPatch } from '../services/supabase.js'
import { clearState } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, attEmoji, today } from '../utils/helpers.js'
import { homeKeyboard, backKeyboard } from '../keyboards/index.js'

// ─── Attendance: Pick Halaka ──────────────────────────────────────────────────
export async function viewAttPicker(ctx: any, c: number) {
  clearState(c)
  const halakat = await sbGet('Halaka', 'order=createdAt.asc')

  if (!halakat.length) {
    await ed(ctx, '❌ لا توجد حلقات', homeKeyboard())
    return
  }

  const kb = new InlineKeyboard()
  for (const h of halakat) {
    kb.text(`📚 ${esc(h.name)}`, `ath_${h.id}`).row()
  }
  kb.row().text('🏠', 'home')
  await ed(ctx, `✅ ${bold('تسجيل الحضور')}\n${LINE}\n\nاختر الحلقة ⬇️`, kb)
}

// ─── Attendance: Show Halaka Students ────────────────────────────────────────
export async function viewAttHalaka(ctx: any, c: number, hid: string) {
  clearState(c)
  const [hResult, students] = await Promise.all([
    sbGet('Halaka', `id=eq.${hid}`),
    sbGet('Student', `halakaId=eq.${hid}&order=createdAt.asc`),
  ])
  const halaka = hResult[0]

  if (!students.length) {
    await ed(ctx, '❌ لا يوجد طلاب', backKeyboard('m_att'))
    return
  }

  const todayStr = today()
  const attendance = await sbGet('Attendance', `date=eq.${todayStr}&halakaId=eq.${hid}`)
  const attMap = new Map(attendance.map((a: any) => [a.studentId, a.status]))

  let msg = `✅ ${bold('حضور اليوم')} — ${esc(halaka?.name || '')}\n📅 ${esc(todayStr)}\n${LINE}\n\n`
  const kb = new InlineKeyboard()

  for (const s of students) {
    const st = attMap.get(s.id) || ''
    msg += `${attEmoji(st)} ${esc(s.name)} — ${esc(st || 'لم يسجل')}\n`
    kb.text(`${st === 'حاضر' ? '✅' : '☐'} حاضر`, `atm_${s.id}|${hid}|حاضر`)
      .text(`${st === 'غائب' ? '❌' : '☐'} غائب`, `atm_${s.id}|${hid}|غائب`)
      .text(`${st === 'متأخر' ? '⚠️' : '☐'} متأخر`, `atm_${s.id}|${hid}|متأخر`).row()
  }

  kb.row().text('🔙', 'm_att').text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ─── Mark Attendance ─────────────────────────────────────────────────────────
export async function markAttendance(
  ctx: any, c: number, sid: string, hid: string, status: string
) {
  const todayStr = today()
  const existing = await sbGet('Attendance', `studentId=eq.${sid}&date=eq.${todayStr}&halakaId=eq.${hid}`)

  if (existing.length) {
    await sbPatch('Attendance', `id=eq.${existing[0].id}`, { status })
  } else {
    await sbPost('Attendance', { studentId: sid, date: todayStr, halakaId: hid, status })
  }

  const emoji = attEmoji(status)
  try { await ctx.answerCallbackQuery({ text: `${emoji} تم: ${status}` }) } catch { /* ignore */ }

  // Refresh the attendance view
  await viewAttHalaka(ctx, c, hid)
}
