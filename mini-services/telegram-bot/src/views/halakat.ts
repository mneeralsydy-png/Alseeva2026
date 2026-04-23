// ═══════════════════════════════════════════════════════════════════════════════
// Halakat View — Full CRUD for Study Circles
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { sbGet, sbDelete } from '../services/supabase.js'
import { clearState } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, italic, PAGE_SIZE } from '../utils/helpers.js'
import { backKeyboard, confirmDeleteKeyboard } from '../keyboards/index.js'

// ─── Halakat List ─────────────────────────────────────────────────────────────
export async function viewHalList(ctx: any, c: number, page: number) {
  clearState(c)
  const halakat = await sbGet('Halaka', 'order=createdAt.asc')

  if (!halakat.length) {
    const kb = new InlineKeyboard()
      .text('➕ إضافة حلقة', 'action_add_hal')
      .row().text('🏠', 'home')
    await ed(ctx, `📚 ${bold('الحلقات')}\n${LINE}\n\nلا توجد حلقات بعد\n\nاضغط إضافة حلقة لإنشاء أول حلقة`, kb)
    return
  }

  const totalPages = Math.ceil(halakat.length / PAGE_SIZE)
  const slice = halakat.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `📚 ${bold('قائمة الحلقات')}  (${halakat.length})  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  const kb = new InlineKeyboard()

  for (const h of slice) {
    msg += `🏫 ${bold(h.name)}\n`
    msg += `   👨‍🏫 ${esc(h.teacher || '—')}  🌳 ${esc(h.branch || '—')}\n`
    msg += `   🕐 ${esc(h.time || '—')}  📍 ${esc(h.location || '—')}\n\n`
    kb.text('👥 الطلاب', `hs_${h.id}`)
      .text('✏️ تعديل', `he_${h.id}`)
      .text('🗑️ حذف', `hd_${h.id}`).row()
  }

  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️ السابق', `hp_${page - 1}`)
    if (page < totalPages - 1) kb.text('➡️ التالي', `hp_${page + 1}`)
    kb.row()
  }
  kb.text('➕ إضافة حلقة جديدة', 'action_add_hal').row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ─── Halaka Students ──────────────────────────────────────────────────────────
export async function viewHalStudents(ctx: any, c: number, hid: string, page: number) {
  clearState(c)
  const [hResult, students] = await Promise.all([
    sbGet('Halaka', `id=eq.${hid}`),
    sbGet('Student', `halakaId=eq.${hid}&order=createdAt.asc`),
  ])
  const halaka = hResult[0]

  if (!halaka) { await ed(ctx, '❌ الحلقة غير موجودة', backKeyboard('m_hal')); return }

  if (!students.length) {
    const kb = new InlineKeyboard()
      .text('➕ إضافة طالب', 'action_add_stu')
      .row().text('🔙', 'm_hal').text('🏠', 'home')
    await ed(ctx, `📚 ${bold(halaka.name)}\n${LINE}\n\nلا يوجد طلاب في هذه الحلقة`, kb)
    return
  }

  const totalPages = Math.ceil(students.length / PAGE_SIZE)
  const slice = students.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `📚 ${bold(halaka.name)} — 👥 الطلاب (${students.length})\n`
  msg += `👨‍🏫 ${esc(halaka.teacher)}  🌳 ${esc(halaka.branch || '—')}\n${LINE}\n\n`
  const kb = new InlineKeyboard()

  for (const s of slice) {
    msg += `👤 ${bold(s.name)}  📖 ${esc(s.surah || '—')}  📊 ${esc(s.level || '—')}  📂 ${esc(s.category || '—')}\n`
    msg += `   🎂 ${esc(String(s.age || '—'))}  📱 ${esc(s.parentPhone || '—')}\n\n`
    kb.text('✅ حضور', `sa_${s.id}`).text('✏️ تعديل', `se_${s.id}`).text('🗑️', `sd_${s.id}`).row()
  }

  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `hsp_${page - 1}_${hid}`)
    if (page < totalPages - 1) kb.text('➡️', `hsp_${page + 1}_${hid}`)
    kb.row()
  }
  kb.text('➕ إضافة طالب', 'action_add_stu').row()
    .text('🔙 الحلقات', 'm_hal').text('✏️ تعديل الحلقة', `he_${hid}`).row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ─── Halaka Edit ─────────────────────────────────────────────────────────────
export async function viewHalEdit(ctx: any, c: number, hid: string) {
  clearState(c)
  const h = (await sbGet('Halaka', `id=eq.${hid}`))[0]
  if (!h) { await ed(ctx, '❌ الحلقة غير موجودة', backKeyboard('m_hal')); return }

  await ed(ctx,
    `✏️ ${bold('تعديل الحلقة')}\n${LINE}\n\n` +
    `🏫 الاسم: ${bold(h.name)}\n` +
    `👨‍🏫 المعلم: ${esc(h.teacher || '—')}\n` +
    `🌳 الفرع: ${esc(h.branch || '—')}\n` +
    `🕐 الموعد: ${esc(h.time || '—')}\n` +
    `📍 المكان: ${esc(h.location || '—')}\n` +
    `📝 الوصف: ${esc(h.description || '—')}`,
    new InlineKeyboard()
      .text('🏫 الاسم', `ehn_${hid}`).text('👨‍🏫 المعلم', `eht_${hid}`).row()
      .text('🌳 الفرع', `ehb_${hid}`).text('🕐 الموعد', `ehti_${hid}`).row()
      .text('📍 المكان', `ehlo_${hid}`).text('📝 الوصف', `ehd_${hid}`).row()
      .text('🔙', 'm_hal').text('🏠', 'home')
  )
}

// ─── Delete Halaka ────────────────────────────────────────────────────────────
export async function confirmDeleteHal(ctx: any, c: number, hid: string) {
  const h = (await sbGet('Halaka', `id=eq.${hid}`))[0]
  const name = h?.name || hid
  await ed(ctx,
    `⚠️ ${bold('تأكيد حذف الحلقة')}\n\n${esc(name)}؟\n\n${italic('سيتم حذف جميع بيانات الحضور المرتبطة')}`,
    confirmDeleteKeyboard(`hdc_${hid}`, 'm_hal')
  )
}

export async function doDeleteHal(ctx: any, c: number, hid: string) {
  try {
    // Delete related attendance first
    const students = await sbGet('Student', `halakaId=eq.${hid}`)
    for (const s of students) {
      try { await sbDelete('Attendance', `studentId=eq.${s.id}`) } catch {}
    }
    // Delete students in this halaka
    for (const s of students) {
      try { await sbDelete('Student', `id=eq.${s.id}`) } catch {}
    }
    await sbDelete('Halaka', `id=eq.${hid}`)
    await ed(ctx, `✅ ${bold('تم حذف الحلقة بنجاح')}`, backKeyboard('m_hal'))
  } catch (e) {
    console.error('[DELETE HAL]', e)
    await ed(ctx, '❌ حدث خطأ أثناء الحذف', backKeyboard('m_hal'))
  }
}
