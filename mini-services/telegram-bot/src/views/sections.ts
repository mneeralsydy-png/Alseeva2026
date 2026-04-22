// ═══════════════════════════════════════════════════════════════════════════════
// Views — Graduates, Competitions, Media, Activities, Settings
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { sbGet, sbPost, sbDelete, sbPatch } from '../services/supabase.js'
import { clearState, getState, startConversation } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, italic, PAGE_SIZE } from '../utils/helpers.js'
import {
  mainKeyboard, homeKeyboard, backKeyboard, cancelKeyboard,
  confirmDeleteKeyboard,
} from '../keyboards/index.js'
import { changePassword } from '../services/auth.js'

// ═══════════════════════════════════════════════════════════════════════════════
// GRADUATES
// ═══════════════════════════════════════════════════════════════════════════════
export async function viewGraduates(ctx: any, c: number, page: number) {
  clearState(c)
  const rows = await sbGet('CenterInfo', 'type=eq.graduate_batch&order=createdAt.desc')
  const batches = rows.map((r: any) => {
    try { return { ...JSON.parse(r.value), id: r.id } }
    catch { return { id: r.id, title: r.key } }
  })

  if (!batches.length) {
    const kb = new InlineKeyboard()
      .text('➕ إضافة دفعة', 'grad_add')
      .row().text('🏠', 'home')
    await ed(ctx, `🎓 ${bold('الخريجين')}\n${LINE}\n\nلا توجد دفعات`, kb)
    return
  }

  const totalPages = Math.ceil(batches.length / PAGE_SIZE)
  const slice = batches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `🎓 ${bold('دفعات الخريجين')}  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const b of slice) {
    msg += `🎓 ${bold(b.title || '—')}\n📅 ${esc(b.date || '—')}  👥 ${esc(String(b.graduateCount || 0))}\n\n`
    kb.text('🗑️', `gdc_${b.id}`).row()
  }
  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `gp_${page - 1}`)
    if (page < totalPages - 1) kb.text('➡️', `gp_${page + 1}`)
    kb.row()
  }
  kb.text('➕ إضافة دفعة', 'grad_add').row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export async function startAddGraduate(ctx: any, c: number) {
  startConversation(c, 'add_grad')
  await ed(ctx,
    `🎓 ${bold('إضافة دفعة خريجين')}\n${LINE}\n\n📝 ${bold('الخطوة 1/3')} — عنوان الدفعة:`,
    cancelKeyboard()
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPETITIONS
// ═══════════════════════════════════════════════════════════════════════════════
export async function viewCompetitions(ctx: any, c: number, page: number) {
  clearState(c)
  const rows = await sbGet('CenterInfo', 'type=eq.competition&order=createdAt.desc')
  const comps = rows.map((r: any) => {
    try {
      const p = JSON.parse(r.value)
      return { id: r.id, title: p.title || r.key, date: p.date || '', type: r.section === 'مسابقات_داخلية' ? 'داخلية' : 'خارجية', participants: p.participants || [] }
    } catch { return { id: r.id, title: r.key } }
  })

  if (!comps.length) {
    const kb = new InlineKeyboard()
      .text('➕ إضافة مسابقة', 'comp_add')
      .row().text('🏠', 'home')
    await ed(ctx, `🏆 ${bold('المسابقات')}\n${LINE}\n\nلا توجد مسابقات`, kb)
    return
  }

  const totalPages = Math.ceil(comps.length / PAGE_SIZE)
  const slice = comps.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `🏆 ${bold('المسابقات')}  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const cp of slice) {
    const icon = cp.type === 'داخلية' ? '📍' : '🌍'
    msg += `${icon} ${bold(cp.title || '—')}\n📅 ${esc(cp.date || '—')}  👥 ${esc(String(cp.participants?.length || 0))}\n\n`
    kb.text('🗑️', `cdc_${cp.id}`).row()
  }
  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `cp_${page - 1}`)
    if (page < totalPages - 1) kb.text('➡️', `cp_${page + 1}`)
    kb.row()
  }
  kb.text('➕ إضافة مسابقة', 'comp_add').row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export async function startAddCompetition(ctx: any, c: number) {
  startConversation(c, 'add_comp')
  const kb = new InlineKeyboard()
    .text('📍 داخلية', 'comp_type_داخلية').text('🌍 خارجية', 'comp_type_خارجية').row()
    .row().text('❌ إلغاء', 'cancel')
  await ed(ctx, `🏆 ${bold('إضافة مسابقة')}\n${LINE}\n\nاختر النوع:`, kb)
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA
// ═══════════════════════════════════════════════════════════════════════════════
export async function viewMediaAlbums(ctx: any, c: number) {
  clearState(c)
  const imgs = await sbGet('MediaImage')
  const albums = new Map<string, number>()
  for (const i of imgs) {
    const alb = i.album || 'عامة'
    albums.set(alb, (albums.get(alb) || 0) + 1)
  }

  if (!albums.size) {
    const kb = new InlineKeyboard()
      .text('📤 رفع صورة', 'media_upload')
      .row().text('🏠', 'home')
    await ed(ctx, `🖼️ ${bold('الوسائط')}\n${LINE}\n\nلا توجد صور`, kb)
    return
  }

  let msg = `🖼️ ${bold('ألبومات الوسائط')}\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const [alb, cnt] of albums) {
    msg += `📁 ${bold(alb)}  (${cnt})\n\n`
    kb.text(`📁 ${esc(alb)}`, `malb_${alb}`).row()
  }
  kb.row().text('📤 رفع صورة', 'media_upload').text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export async function viewMediaList(ctx: any, c: number, album: string, page: number) {
  clearState(c)
  const imgs = await sbGet('MediaImage', `album=eq.${album}&order=createdAt.desc`)

  if (!imgs.length) {
    await ed(ctx, `📁 ${bold(album)} — فارغ`, backKeyboard('m_media'))
    return
  }

  const totalPages = Math.ceil(imgs.length / PAGE_SIZE)
  const slice = imgs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `📁 ${bold(album)}  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const i of slice) {
    msg += `🖼️ ${esc(i.filename)}\n\n`
    kb.text('🗑️', `mdel_${i.id}`).row()
  }
  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `mp_${page - 1}_${album}`)
    if (page < totalPages - 1) kb.text('➡️', `mp_${page + 1}_${album}`)
    kb.row()
  }
  kb.row().text('🔙', 'm_media').text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITIES
// ═══════════════════════════════════════════════════════════════════════════════
export async function viewActivities(ctx: any, c: number, page: number) {
  clearState(c)
  const acts = await sbGet('Activity', 'order=createdAt.desc')

  if (!acts.length) {
    await ed(ctx, `📋 ${bold('الأنشطة')}\n${LINE}\n\nلا توجد أنشطة`, homeKeyboard())
    return
  }

  const totalPages = Math.ceil(acts.length / PAGE_SIZE)
  const slice = acts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `📋 ${bold('الأنشطة')}  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  for (const a of slice) {
    msg += `📌 ${bold(a.title || '—')}\n📅 ${esc(a.date || '—')}  🏷️ ${esc(a.type || '—')}\n\n`
  }

  const kb = new InlineKeyboard()
  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `ap_${page - 1}`)
    if (page < totalPages - 1) kb.text('➡️', `ap_${page + 1}`)
    kb.row()
  }
  kb.text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
export async function viewSettings(ctx: any, c: number) {
  await ed(ctx,
    `⚙️ ${bold('الإعدادات')}\n${LINE}\n\nاختر الإجراء ⬇️`,
    new InlineKeyboard()
      .text('🔐 تغيير كلمة المرور', 'set_pwd')
      .text('📝 معلومات المركز', 'set_info').row()
      .text('🏠', 'home')
  )
}

export async function viewCenterInfo(ctx: any, c: number) {
  const rows = await sbGet('CenterInfo', 'type=eq.text&order=createdAt.desc')
  let msg = `📝 ${bold('معلومات المركز')}\n${LINE}\n\n`
  const kb = new InlineKeyboard()

  if (!rows.length) {
    msg += 'لا توجد معلومات'
  } else {
    for (const r of rows) {
      msg += `🔑 ${bold(r.key)}\n   ${italic(String(r.value).slice(0, 80))}\n\n`
      kb.text('✏️', `sinf_${r.id}`).row()
    }
  }

  kb.row().text('🔙', 'm_set').text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export async function startChangePassword(ctx: any, c: number) {
  startConversation(c, 'chg_pwd')
  await ed(ctx,
    `🔐 ${bold('تغيير كلمة المرور')}\n${LINE}\n\nأرسل كلمة المرور الجديدة:`,
    cancelKeyboard()
  )
}
