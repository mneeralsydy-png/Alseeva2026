// ═══════════════════════════════════════════════════════════════════════════════
// Views — Students Management
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { sbGet, sbPost, sbPatch, sbDelete } from '../services/supabase.js'
import { clearState, getState } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, PAGE_SIZE } from '../utils/helpers.js'
import {
  mainKeyboard, homeKeyboard, backKeyboard, confirmDeleteKeyboard,
} from '../keyboards/index.js'

// ─── All Students List ────────────────────────────────────────────────────────
export async function viewAllStudents(ctx: any, c: number, page: number) {
  clearState(c)
  const [students, halakat] = await Promise.all([
    sbGet('Student', 'order=createdAt.asc'),
    sbGet('Halaka'),
  ])
  const hMap = new Map(halakat.map((h: any) => [h.id, h.name]))

  if (!students.length) {
    const kb = new InlineKeyboard()
      .text('➕ إضافة طالب', 'action_add_stu')
      .row().text('🏠', 'home')
    await ed(ctx, `👥 ${bold('الطلاب')}\n${LINE}\n\nلا يوجد طلاب`, kb)
    return
  }

  const totalPages = Math.ceil(students.length / PAGE_SIZE)
  const slice = students.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `👥 ${bold('قائمة الطلاب')}  📄 ${page + 1}/${totalPages}  (${students.length})\n${LINE}\n\n`
  const kb = new InlineKeyboard()

  for (const s of slice) {
    msg += `👤 ${bold(s.name)}  📚 ${esc(hMap.get(s.halakaId) || '—')}\n\n`
    kb.text('✏️', `se_${s.id}`).text('✅ حضور', `sa_${s.id}`).row()
  }

  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `sp_${page - 1}`)
    if (page < totalPages - 1) kb.text('➡️', `sp_${page + 1}`)
    kb.row()
  }
  kb.text('➕ إضافة طالب', 'action_add_stu').text('🔍 بحث', 'action_search').row()
    .text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ─── Student Edit ─────────────────────────────────────────────────────────────
export async function viewStudentEdit(ctx: any, c: number, sid: string) {
  clearState(c)
  const s = (await sbGet('Student', `id=eq.${sid}`))[0]
  if (!s) { await ed(ctx, '❌ الطالب غير موجود', homeKeyboard()); return }

  await ed(ctx,
    `✏️ ${bold('تعديل الطالب')}\n${LINE}\n\n` +
    `👤 ${bold(s.name)}\n` +
    `📖 ${esc(s.surah || '—')}  📊 ${esc(s.level || '—')}  📂 ${esc(s.category || '—')}\n` +
    `🎂 ${esc(String(s.age || '—'))}\n` +
    `📱 ${esc(s.parentPhone || '—')}`,
    new InlineKeyboard()
      .text('👤 الاسم', `esn_${sid}`).text('📖 السورة', `esu_${sid}`).row()
      .text('📊 المستوى', `esl_${sid}`).text('📂 الفئة', `esc_${sid}`).row()
      .text('🎂 العمر', `esa_${sid}`).text('📚 نقل حلقة', `smv_${sid}`).row()
      .text('🔙', 'm_stu').text('🏠', 'home')
  )
}

// ─── Quick Attendance Toggle ──────────────────────────────────────────────────
export async function quickAttendance(ctx: any, c: number, sid: string) {
  const s = (await sbGet('Student', `id=eq.${sid}`))[0]
  if (!s) return

  const todayStr = new Date().toISOString().split('T')[0]
  const hid = s.halakaId

  const existing = await sbGet('Attendance', `studentId=eq.${sid}&date=eq.${todayStr}&halakaId=eq.${hid}`)
  const newStatus = (existing.length && existing[0].status === 'حاضر') ? 'غائب' : 'حاضر'

  if (existing.length) {
    await sbPatch('Attendance', `id=eq.${existing[0].id}`, { status: newStatus })
  } else {
    await sbPost('Attendance', { studentId: sid, date: todayStr, halakaId: hid, status: newStatus })
  }

  const emoji = newStatus === 'حاضر' ? '✅' : '❌'
  try { await ctx.answerCallbackQuery({ text: `${emoji} ${newStatus}` }) } catch { /* ignore */ }
}

// ─── Move Student to another Halaka ───────────────────────────────────────────
export async function viewMoveStudent(ctx: any, c: number, sid: string) {
  const s = (await sbGet('Student', `id=eq.${sid}`))[0]
  if (!s) return

  const halakat = await sbGet('Halaka', 'order=createdAt.asc')
  const kb = new InlineKeyboard()
  for (const h of halakat) {
    kb.text(`📚 ${esc(h.name)}`, `smv_do_${sid}_${h.id}`).row()
  }
  kb.row().text('🔙', `se_${sid}`).text('🏠', 'home')
  await ed(ctx, `📚 ${bold('نقل: ' + s.name)}\n\nاختر الحلقة الجديدة:`, kb)
}

// ─── Delete Student ───────────────────────────────────────────────────────────
export async function confirmDeleteStudent(ctx: any, c: number, sid: string) {
  const s = (await sbGet('Student', `id=eq.${sid}`))[0]
  const name = s?.name || sid
  await ed(ctx,
    `⚠️ ${bold('تأكيد حذف الطالب')}\n\n${esc(name)}؟`,
    confirmDeleteKeyboard(`sdc_${sid}`, 'm_stu')
  )
}

export async function doDeleteStudent(ctx: any, c: number, sid: string) {
  try {
    await sbDelete('Attendance', `studentId=eq.${sid}`)
    await sbDelete('Student', `id=eq.${sid}`)
    await ed(ctx, `✅ ${bold('تم حذف الطالب')}`, backKeyboard('m_stu'))
  } catch (e) {
    console.error('[DELETE STU]', e)
    await ed(ctx, '❌ خطأ', homeKeyboard())
  }
}
