// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard View — Stats + Quick Actions + Recent Items
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { sbGet } from '../services/supabase.js'
import { clearState } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, attEmoji, today, monthStart } from '../utils/helpers.js'
import { mainKeyboard } from '../keyboards/index.js'

export async function viewDashboard(ctx: any, c: number) {
  clearState(c)

  const [students, halakat, activities, media] = await Promise.all([
    sbGet('Student'),
    sbGet('Halaka'),
    sbGet('Activity', 'order=createdAt.desc&limit=3'),
    sbGet('MediaImage'),
  ])

  // Today's attendance
  const todayStr = today()
  const todayAtt = await sbGet('Attendance', `date=eq.${todayStr}`)
  const todayPresent = todayAtt.filter((a: any) => a.status === 'حاضر').length
  const todayLate = todayAtt.filter((a: any) => a.status === 'متأخر').length
  const todayAbsent = todayAtt.filter((a: any) => a.status === 'غائب').length

  // Monthly attendance rate
  const mStart = monthStart()
  const monthlyAtt = await sbGet('Attendance', `date=gte.${mStart}`)
  const monthlyPresent = monthlyAtt.filter((a: any) => a.status === 'حاضر').length
  const monthlyRate = monthlyAtt.length ? Math.round((monthlyPresent / monthlyAtt.length) * 100) : 0

  let msg =
    `🏠 ${bold('لوحة التحكم — Alseeva2026')}\n${LINE}\n\n` +
    `📊 ${bold('الإحصائيات العامة')}\n\n` +
    `📚 الحلقات: ${bold(String(halakat.length))}\n` +
    `👥 الطلاب: ${bold(String(students.length))}\n` +
    `🖼️ الصور: ${bold(String(media.length))}\n\n`

  msg += `✅ ${bold('حضور اليوم')} (${esc(todayStr)})\n`
  msg += `   حاضر: ${bold(String(todayPresent))}  |  متأخر: ${bold(String(todayLate))}  |  غائب: ${bold(String(todayAbsent))}\n\n`

  msg += `📈 نسبة الحضور الشهري: ${bold(monthlyRate + '%')}\n\n`

  // Recent activities
  if (activities.length) {
    msg += `📋 ${bold('آخر الأنشطة')}\n`
    for (const a of activities) {
      msg += `   • ${esc(a.title || '—')} — ${esc(a.date || '—')}\n`
    }
    msg += '\n'
  }

  // Quick actions
  const kb = new InlineKeyboard()
    .text('➕ إضافة حلقة', 'action_add_hal').text('➕ إضافة طالب', 'action_add_stu').row()
    .text('✅ تسجيل حضور', 'm_att').text('🔍 بحث طالب', 'action_search').row()
    .text('📊 الإحصائيات الكاملة', 'm_stat').row()
    .text('🏠 القائمة', 'home')

  await ed(ctx, msg, kb)
}
