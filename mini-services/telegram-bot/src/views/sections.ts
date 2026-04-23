// ═══════════════════════════════════════════════════════════════════════════════
// Sections View — Graduates, Competitions, Media, Activities, Settings
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { Bot } from 'grammy'
import { sbGet, sbPost, sbDelete, sbPatch } from '../services/supabase.js'
import { clearState, startConversation } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, italic, PAGE_SIZE, ACTIVITY_TYPES } from '../utils/helpers.js'
import { backKeyboard, confirmDeleteKeyboard, activityTypeKeyboard } from '../keyboards/index.js'

// ═══════════════════════════════════════════════════════════════════════════════
// GRADUATES
// ═══════════════════════════════════════════════════════════════════════════════
export async function viewGraduates(ctx: any, c: number, page: number) {
  clearState(c)
  const rows = await sbGet('CenterInfo', 'type=eq.graduate_batch&order=createdAt.desc')
  const batches = rows.map((r: any) => {
    try {
      const p = JSON.parse(r.value)
      return { ...p, id: r.id, key: r.key }
    } catch { return { id: r.id, title: r.key, date: '', graduateCount: 0, notes: '' } }
  })

  if (!batches.length) {
    const kb = new InlineKeyboard()
      .text('➕ إضافة دفعة', 'grad_add')
      .row().text('🏠', 'home')
    await ed(ctx, `🎓 ${bold('الخريجين')}\n${LINE}\n\nلا توجد دفعات خريجين بعد`, kb)
    return
  }

  const totalPages = Math.ceil(batches.length / PAGE_SIZE)
  const slice = batches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `🎓 ${bold('دفعات الخريجين')} (${batches.length})  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const b of slice) {
    msg += `🎓 ${bold(b.title || '—')}\n`
    msg += `   📅 ${esc(b.date || '—')}  👥 ${esc(String(b.graduateCount || 0))} خريج\n`
    if (b.notes) msg += `   📝 ${esc(String(b.notes).slice(0, 60))}\n`
    msg += '\n'
    kb.text('🗑️ حذف', `gdc_${b.id}`).row()
  }
  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `gp_${page - 1}`)
    if (page < totalPages - 1) kb.text('➡️', `gp_${page + 1}`)
    kb.row()
  }
  kb.text('➕ إضافة دفعة جديدة', 'grad_add').row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export function startAddGraduate(ctx: any, c: number) {
  startConversation(c, 'add_grad')
  ed(ctx,
    `🎓 ${bold('إضافة دفعة خريجين')}\n${LINE}\n\n📝 الخطوة 1/3 — عنوان الدفعة:`,
    new InlineKeyboard().text('❌ إلغاء', 'cancel')
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
      return {
        id: r.id, title: p.title || r.key, date: p.date || '',
        type: r.section === 'مسابقات_داخلية' ? '📍 داخلية' : '🌍 خارجية',
        participants: p.participants || [], winners: p.winners || []
      }
    } catch { return { id: r.id, title: r.key, date: '', type: '—', participants: [], winners: [] } }
  })

  if (!comps.length) {
    const kb = new InlineKeyboard()
      .text('➕ إضافة مسابقة', 'comp_add')
      .row().text('🏠', 'home')
    await ed(ctx, `🏆 ${bold('المسابقات')}\n${LINE}\n\nلا توجد مسابقات بعد`, kb)
    return
  }

  const totalPages = Math.ceil(comps.length / PAGE_SIZE)
  const slice = comps.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `🏆 ${bold('المسابقات')} (${comps.length})  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const cp of slice) {
    msg += `${cp.type} ${bold(cp.title || '—')}\n`
    msg += `   📅 ${esc(cp.date || '—')}  👥 ${esc(String(cp.participants?.length || 0))} مشارك\n`
    if (cp.winners?.length) {
      msg += `   🥇 الفائزون: ${esc(cp.winners.join(', ').slice(0, 60))}\n`
    }
    msg += '\n'
    kb.text('🗑️ حذف', `cdc_${cp.id}`).row()
  }
  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `cp_${page - 1}`)
    if (page < totalPages - 1) kb.text('➡️', `cp_${page + 1}`)
    kb.row()
  }
  kb.text('➕ إضافة مسابقة', 'comp_add').row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export function startAddCompetition(ctx: any, c: number) {
  startConversation(c, 'add_comp')
  const kb = new InlineKeyboard()
    .text('📍 داخلية', 'comp_type_داخلية').text('🌍 خارجية', 'comp_type_خارجية').row()
    .row().text('❌ إلغاء', 'cancel')
  ed(ctx, `🏆 ${bold('إضافة مسابقة')}\n${LINE}\n\nاختر النوع:`, kb)
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
    await ed(ctx, `🖼️ ${bold('الوسائط')}\n${LINE}\n\nلا توجد صور بعد\n\nاضغط رفع صورة لإضافة صور جديدة`, kb)
    return
  }

  let msg = `🖼️ ${bold('ألبومات الوسائط')} (${imgs.length} صورة)\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const [alb, cnt] of albums) {
    msg += `📁 ${bold(alb)} (${cnt} صورة)\n\n`
    kb.text(`📁 ${esc(alb)}`, `malb_${alb}`).row()
  }
  kb.row().text('📤 رفع صورة جديدة', 'media_upload').text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export async function viewMediaList(ctx: any, c: number, album: string, page: number) {
  clearState(c)
  const imgs = await sbGet('MediaImage', `album=eq.${encodeURIComponent(album)}&order=createdAt.desc`)

  if (!imgs.length) {
    await ed(ctx, `📁 ${bold(album)} — فارغ`, backKeyboard('m_media'))
    return
  }

  const totalPages = Math.ceil(imgs.length / PAGE_SIZE)
  const slice = imgs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `📁 ${bold(album)}  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const i of slice) {
    msg += `🖼️ ${esc(i.filename)}\n`
    msg += `   📅 ${esc((i.createdAt || '').split('T')[0])}\n\n`
    kb.text('🗑️ حذف', `mdel_${i.id}`).row()
  }
  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `mp_${page - 1}_${album}`)
    if (page < totalPages - 1) kb.text('➡️', `mp_${page + 1}_${album}`)
    kb.row()
  }
  kb.row().text('🔙 الألبومات', 'm_media').text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export function startMediaUpload(ctx: any, c: number) {
  const state = startConversation(c, 'wait_photo')
  state.data = { album: 'عامة' }
  ed(ctx,
    `📤 ${bold('رفع صورة')}\n${LINE}\n\n` +
    `الخطوة 1/2 — اختر اسم الألبوم:\n` +
    `أرسل اسم الألبوم أو أرسل "عامة" للألبوم الافتراضي`,
    new InlineKeyboard().text('📁 عامة', 'photoalb_عامة').row().text('❌ إلغاء', 'cancel')
  )
}

/** Upload photo to Supabase + forward to Telegram channel */
export async function handlePhotoUpload(ctx: any, c: number, bot: Bot) {
  const state = startConversation(c, 'wait_photo')
  state.data = { album: 'عامة' }

  const photo = ctx.message.photo[ctx.message.photo.length - 1]
  const fileId = photo.file_id
  const album = state.data.album || 'عامة'
  const filename = `tg-${Date.now()}-${fileId.slice(0, 10)}.jpg`

  // Save to Supabase
  await sbPost('MediaImage', { album, filename, url: `tg:${fileId}`, source: 'telegram' })
  clearState(c)

  // Try to forward to channel
  const channelId = process.env.CHANNEL_ID
  if (channelId) {
    try {
      await bot.api.sendPhoto(channelId, fileId, {
        caption: `📷 ${album}`,
      })
    } catch (e) {
      console.error('[Channel send]', e)
    }
  }

  await ctx.reply(
    `✅ ${bold('تم حفظ الصورة بنجاح!')}\n\n📁 الألبوم: ${esc(album)}\n📎 الملف: ${esc(filename)}`,
    { parse_mode: 'MarkdownV2', reply_markup: backKeyboard('m_media') }
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITIES — Full CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function viewActivities(ctx: any, c: number, page: number) {
  clearState(c)
  const acts = await sbGet('Activity', 'order=createdAt.desc')

  if (!acts.length) {
    const kb = new InlineKeyboard()
      .text('➕ إضافة نشاط', 'act_add')
      .row().text('🏠', 'home')
    await ed(ctx, `📋 ${bold('الأنشطة')}\n${LINE}\n\nلا توجد أنشطة بعد`, kb)
    return
  }

  const totalPages = Math.ceil(acts.length / PAGE_SIZE)
  const slice = acts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  let msg = `📋 ${bold('الأنشطة')} (${acts.length})  📄 ${page + 1}/${totalPages}\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const a of slice) {
    msg += `📌 ${bold(a.title || '—')}\n`
    msg += `   📅 ${esc(a.date || '—')}  🏷️ ${esc(a.type || '—')}\n`
    if (a.description) msg += `   📝 ${esc(String(a.description).slice(0, 60))}\n`
    msg += '\n'
    kb.text('🗑️ حذف', `adel_${a.id}`).row()
  }
  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `ap_${page - 1}`)
    if (page < totalPages - 1) kb.text('➡️', `ap_${page + 1}`)
    kb.row()
  }
  kb.text('➕ إضافة نشاط جديد', 'act_add').row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export function startAddActivity(ctx: any, c: number) {
  startConversation(c, 'add_act')
  ed(ctx,
    `📋 ${bold('إضافة نشاط جديد')}\n${LINE}\n\n📝 الخطوة 1/4 — عنوان النشاط:`,
    new InlineKeyboard().text('❌ إلغاء', 'cancel')
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
export function viewSettings(ctx: any, c: number) {
  ed(ctx,
    `⚙️ ${bold('الإعدادات')}\n${LINE}\n\nاختر الإجراء ⬇️`,
    new InlineKeyboard()
      .text('🔐 تغيير كلمة المرور', 'set_pwd')
      .text('📝 معلومات المركز', 'set_info').row()
      .text('🚪 تسجيل الخروج', 'set_logout').row()
      .text('🏠', 'home')
  )
}

export async function viewCenterInfo(ctx: any, c: number) {
  const rows = await sbGet('CenterInfo', 'type=eq.text&order=createdAt.asc')
  let msg = `📝 ${bold('معلومات المركز')}\n${LINE}\n\n`
  const kb = new InlineKeyboard()

  if (!rows.length) {
    msg += 'لا توجد معلومات مسجلة'
  } else {
    for (const r of rows) {
      msg += `🔑 ${bold(r.key)}\n   ${esc(String(r.value).slice(0, 100))}\n\n`
      kb.text('✏️ تعديل', `sinf_${r.id}`).row()
    }
  }

  kb.row().text('🔙', 'm_set').text('🏠', 'home')
  await ed(ctx, msg, kb)
}

export function startChangePassword(ctx: any, c: number) {
  startConversation(c, 'chg_pwd')
  ed(ctx,
    `🔐 ${bold('تغيير كلمة المرور')}\n${LINE}\n\nأرسل كلمة المرور الجديدة (4 أحرف على الأقل):`,
    new InlineKeyboard().text('❌ إلغاء', 'cancel')
  )
}
