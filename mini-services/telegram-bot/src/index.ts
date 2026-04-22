// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 Alseeva2026 — Telegram Bot v5.0
// Professional Admin Dashboard for Center Management
// ═══════════════════════════════════════════════════════════════════════════════
//
// Environment Variables (from GitHub Secrets):
//   BOT_TOKEN              — Telegram bot token
//   ADMIN_ACCOUNT_ID       — Allowed admin Telegram chat ID
//   NEXT_PUBLIC_SUPABASE_URL          — Supabase project URL
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — Supabase anon key
// ═══════════════════════════════════════════════════════════════════════════════

import { Bot, InlineKeyboard } from 'grammy'

// ─── Services ─────────────────────────────────────────────────────────────────
import { sbGet, sbPost, sbPatch, sbDelete } from './services/supabase.js'
import {
  isAuthenticated, isPendingPassword, setAuthenticated,
  setPendingPassword, verifyPassword, changePassword,
} from './services/auth.js'
import { getState, clearState, startConversation } from './services/conversation.js'

// ─── Middleware ────────────────────────────────────────────────────────────────
import { authMiddleware } from './middlewares/auth.js'

// ─── Keyboards ────────────────────────────────────────────────────────────────
import {
  mainKeyboard, homeKeyboard, cancelKeyboard, backKeyboard,
  branchKeyboard,
} from './keyboards/index.js'

// ─── Views ────────────────────────────────────────────────────────────────────
import { viewHalList, viewHalStudents, viewHalEdit, confirmDeleteHal, doDeleteHal } from './views/halakat.js'
import { viewAllStudents, viewStudentEdit, quickAttendance, viewMoveStudent, confirmDeleteStudent, doDeleteStudent } from './views/students.js'
import { viewAttPicker, viewAttHalaka, markAttendance } from './views/attendance.js'
import { viewStats } from './views/stats.js'
import {
  viewGraduates, startAddGraduate,
  viewCompetitions, startAddCompetition,
  viewMediaAlbums, viewMediaList,
  viewActivities,
  viewSettings, viewCenterInfo, startChangePassword,
} from './views/sections.js'

// ─── Utils ────────────────────────────────────────────────────────────────────
import { ed } from './utils/messenger.js'
import { bold, esc, LINE, chatId, PAGE_SIZE, BRANCHES } from './utils/helpers.js'

// ═══════════════════════════════════════════════════════════════════════════════
// BOT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

const BOT_TOKEN = process.env.BOT_TOKEN!
if (!BOT_TOKEN) throw new Error('BOT_TOKEN env var is required')

const bot = new Bot(BOT_TOKEN)
bot.use(authMiddleware)

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

bot.command('start', async (ctx) => {
  const c = ctx.chat!.id
  clearState(c)

  if (isAuthenticated(c)) {
    await ctx.reply(
      `👋 مرحباً بعودتك\n\n${bold('لوحة التحكم — Alseeva2026')}\n${LINE}\n\nاختر القسم ⬇️`,
      { parse_mode: 'MarkdownV2', reply_markup: mainKeyboard() }
    )
    return
  }

  setPendingPassword(c)
  await ctx.reply(
    `🤖 ${bold('مرحباً بك في Alseeva2026')}\n${LINE}\n\n🔒 أرسل ${bold('كلمة المرور')} للمتابعة:`,
    { parse_mode: 'MarkdownV2' }
  )
})

bot.command('login', async (ctx) => {
  const c = ctx.chat!.id
  clearState(c)
  setPendingPassword(c)
  await ctx.reply('🔒 أرسل كلمة المرور:', { parse_mode: 'MarkdownV2' })
})

bot.command('help', async (ctx) => {
  await ctx.reply(
    `${bold('المساعدة')}\n${LINE}\n\n` +
    `🏠 /start — القائمة الرئيسية\n` +
    `🔐 /login — تسجيل الدخول\n\n` +
    `استخدم الأزرار للتنقل\nكل قائمة فرعية بها زر رجوع 🔙`,
    { parse_mode: 'MarkdownV2' }
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT MESSAGE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

bot.on('message:text', async (ctx) => {
  const c = ctx.chat!.id
  const txt = ctx.message!.text.trim()

  // ── Password check ──
  if (isPendingPassword(c)) {
    const valid = await verifyPassword(txt)
    if (valid) {
      setAuthenticated(c)
      await ctx.reply(
        `✅ ${bold('تم تسجيل الدخول!')} 🎉\n${LINE}\n\nاختر القسم ⬇️`,
        { parse_mode: 'MarkdownV2', reply_markup: mainKeyboard() }
      )
    } else {
      await ctx.reply('❌ كلمة المرور غير صحيحة', { parse_mode: 'MarkdownV2' })
    }
    return
  }

  const state = getState(c)

  // ── No active conversation ──
  if (!state.action) {
    await ctx.reply('👆 اختر من القائمة', { reply_markup: mainKeyboard() })
    return
  }

  // ── Add Halaka conversation ──
  if (state.action === 'add_hal') {
    await handleAddHalaka(ctx, c, txt, state)
    return
  }

  // ── Add Student conversation ──
  if (state.action === 'add_stu') {
    await handleAddStudent(ctx, c, txt, state)
    return
  }

  // ── Edit field ──
  if (state.action === 'edit_field') {
    await handleEditField(ctx, c, txt, state)
    return
  }

  // ── Search ──
  if (state.action === 'search') {
    await handleSearch(ctx, c, txt, state)
    return
  }

  // ── Change Password ──
  if (state.action === 'chg_pwd') {
    if (txt.length < 4) {
      await ctx.reply('❌ كلمة المرور قصيرة (4 أحرف على الأقل)', { reply_markup: cancelKeyboard() })
      return
    }
    const ok = await changePassword(txt)
    clearState(c)
    if (ok) {
      await ed(ctx, `✅ ${bold('تم تغيير كلمة المرور!')}`, backKeyboard('m_set'))
    } else {
      await ed(ctx, '❌ حدث خطأ', backKeyboard('m_set'))
    }
    return
  }

  // ── Add Graduate ──
  if (state.action === 'add_grad') {
    await handleAddGraduate(ctx, c, txt, state)
    return
  }

  // ── Add Competition ──
  if (state.action === 'add_comp') {
    await handleAddCompetition(ctx, c, txt, state)
    return
  }

  await ctx.reply('👆 اختر من القائمة', { reply_markup: mainKeyboard() })
})

// ── Conversation: Add Halaka ──────────────────────────────────────────────────
async function handleAddHalaka(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 1) {
    if (!txt) { await ctx.reply('❌ الاسم مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.name = txt
    state.step = 2
    await ed(ctx, `📝 ${bold('الخطوة 2/4')} — 👨‍🏫 المعلم:`, cancelKeyboard())
  } else if (state.step === 2) {
    state.data.teacher = txt
    state.step = 3
    await ed(ctx, `📝 ${bold('الخطوة 3/4')} — 🌳 الفرع:`, branchKeyboard('cancel'))
  } else if (state.step === 4) {
    await sbPost('Halaka', {
      name: state.data.name,
      teacher: state.data.teacher,
      branch: state.data.branch,
      description: txt,
    })
    clearState(c)
    await ed(ctx,
      `✅ ${bold('تم إضافة الحلقة!')} 🎉\n\n` +
      `🏫 ${esc(state.data.name)}\n👨‍🏫 ${esc(state.data.teacher)}\n🌳 ${esc(state.data.branch)}`,
      mainKeyboard()
    )
  }
}

// ── Conversation: Add Student ─────────────────────────────────────────────────
async function handleAddStudent(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 1) {
    if (!txt) { await ctx.reply('❌ الاسم مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.name = txt
    state.step = 2
    await ed(ctx, `📝 ${bold('الخطوة 2/6')} — 🎂 العمر:`, cancelKeyboard())
  } else if (state.step === 2) {
    const age = parseInt(txt)
    if (isNaN(age) || age < 3 || age > 100) {
      await ctx.reply('❌ عمر غير صحيح (3-100)', { reply_markup: cancelKeyboard() })
      return
    }
    state.data.age = age
    state.step = 3
    await ed(ctx, `📝 ${bold('الخطوة 3/6')} — 📖 السورة:`, cancelKeyboard())
  } else if (state.step === 3) {
    state.data.surah = txt
    state.step = 4
    // Show category keyboard
    const kb = new InlineKeyboard()
    for (const cat of ['1-10', '10-20', '20-30', '30-20', 'محو الامية']) {
      kb.text(cat, `nsc_${cat}`).row()
    }
    kb.row().text('❌ إلغاء', 'cancel')
    await ed(ctx, `📝 ${bold('الخطوة 4/6')} — 📂 الفئة:`, kb)
  } else if (state.step === 7) {
    state.data.phone = txt || ''
    await sbPost('Student', {
      name: state.data.name,
      age: state.data.age,
      surah: state.data.surah,
      category: state.data.cat,
      level: state.data.lvl,
      halakaId: state.data.hid,
      parentPhone: txt || '',
    })
    clearState(c)
    await ed(ctx, `✅ ${bold('تم إضافة الطالب!')} 🎉\n\n👤 ${esc(state.data.name)}`, mainKeyboard())
  }
}

// ── Conversation: Edit Field ──────────────────────────────────────────────────
async function handleEditField(ctx: any, c: number, txt: string, state: any) {
  if (!txt) { await ctx.reply('❌ مطلوب', { reply_markup: cancelKeyboard() }); return }
  await sbPatch(state.data.table, `id=eq.${state.data.id}`, { [state.data.field]: txt })
  const kb = backKeyboard(state.data.backCb)
  clearState(c)
  await ed(ctx, `✅ تم التعديل: ${bold(txt)}`, kb)
}

// ── Conversation: Search ─────────────────────────────────────────────────────
async function handleSearch(ctx: any, c: number, txt: string, state: any) {
  const students = await sbGet('Student', `name=ilike.%${txt}%&limit=10`)
  const halakat = await sbGet('Halaka')
  const hMap = new Map(halakat.map((h: any) => [h.id, h.name]))

  clearState(c)

  if (!students.length) {
    await ed(ctx, `🔍 لا نتائج لـ: ${esc(txt)}`, mainKeyboard())
    return
  }

  let msg = `🔍 ${bold('نتائج البحث')} (${students.length})\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const s of students) {
    msg += `👤 ${bold(s.name)}  📚 ${esc(hMap.get(s.halakaId) || '—')}\n\n`
    kb.text('✏️', `se_${s.id}`).text('✅ حضور', `sa_${s.id}`).row()
  }
  kb.row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ── Conversation: Add Graduate ────────────────────────────────────────────────
async function handleAddGraduate(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 1) {
    if (!txt) { await ctx.reply('❌ مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.title = txt
    state.step = 2
    await ed(ctx, `📝 ${bold('الخطوة 2/3')} — 📅 التاريخ (YYYY-MM-DD):`, cancelKeyboard())
  } else if (state.step === 2) {
    state.data.date = txt
    state.step = 3
    await ed(ctx, `📝 ${bold('الخطوة 3/3')} — 📝 ملاحظات (اختياري):`, cancelKeyboard())
  } else if (state.step === 3) {
    const grads = await sbGet('CenterInfo', 'type=eq.graduate_batch')
    const bn = grads.length + 1
    await sbPost('CenterInfo', {
      key: `دفعة_${bn}_${state.data.title}`,
      value: JSON.stringify({ batchNumber: bn, title: state.data.title, date: state.data.date, graduateCount: 0, graduates: [], notes: txt || '' }),
      type: 'graduate_batch',
      section: 'خريجين',
    })
    clearState(c)
    await ed(ctx, `✅ ${bold('تم إضافة الدفعة!')} 🎉\n\n🎓 ${esc(state.data.title)}\n📅 ${esc(state.data.date)}`, backKeyboard('m_grad'))
  }
}

// ── Conversation: Add Competition ─────────────────────────────────────────────
async function handleAddCompetition(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 2) {
    if (!txt) { await ctx.reply('❌ مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.title = txt
    state.step = 3
    await ed(ctx, `📝 ${bold('الخطوة 3/4')} — 📅 التاريخ:`, cancelKeyboard())
  } else if (state.step === 3) {
    state.data.date = txt
    state.step = 4
    await ed(ctx, `📝 ${bold('الخطوة 4/4')} — 👥 المشاركون (مفصولة بفواصل، أو - للتخطي):`, cancelKeyboard())
  } else if (state.step === 4) {
    const participants = txt === '-' ? [] : txt.split(',').map((n: string) => n.trim()).filter(Boolean)
    const section = state.data.type === 'داخلية' ? 'مسابقات_داخلية' : 'مسابقات_خارجية'
    await sbPost('CenterInfo', {
      key: state.data.title,
      value: JSON.stringify({ title: state.data.title, date: state.data.date, participants, winners: [] }),
      type: 'competition',
      section,
    })
    clearState(c)
    await ed(ctx, `✅ ${bold('تم إضافة المسابقة!')} 🎉\n\n🏆 ${esc(state.data.title)}\n📍 ${esc(state.data.type)}\n📅 ${esc(state.data.date)}`, backKeyboard('m_comp'))
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHOTO HANDLER (Media Upload)
// ═══════════════════════════════════════════════════════════════════════════════

bot.on('message:photo', async (ctx) => {
  const c = ctx.chat!.id
  const state = getState(c)

  if (state.action !== 'wait_photo') return

  const photo = ctx.message.photo[ctx.message.photo.length - 1]
  const fileId = photo.file_id
  const album = state.data.album || 'عامة'
  const filename = `tg-${Date.now()}-${fileId.slice(0, 10)}.jpg`

  await sbPost('MediaImage', { album, filename, url: `tg:${fileId}` })
  clearState(c)

  await ctx.reply(
    `✅ ${bold('تم حفظ الصورة!')}\n\n📁 الألبوم: ${esc(album)}`,
    { parse_mode: 'MarkdownV2', reply_markup: mainKeyboard() }
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// CALLBACK QUERY ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

bot.on('callback_query:data', async (ctx) => {
  const d = ctx.callbackQuery.data
  const c = chatId(ctx)
  if (!c) { try { await ctx.answerCallbackQuery() } catch {} return }
  try { await ctx.answerCallbackQuery() } catch {}

  try {
    // ── Global ──
    if (d === 'cancel') { clearState(c); await ed(ctx, '❌ تم الإلغاء', mainKeyboard()); return }
    if (d === 'home') { clearState(c); await ed(ctx, `${bold('القائمة الرئيسية')}\n${LINE}\n\nاختر القسم ⬇️`, mainKeyboard()); return }
    if (d === 'login') { setPendingPassword(c); await ed(ctx, '🔒 أرسل كلمة المرور:', cancelKeyboard()); return }

    // ── Main sections ──
    if (d === 'm_hal') return viewHalList(ctx, c, 0)
    if (d === 'm_stu') return viewAllStudents(ctx, c, 0)
    if (d === 'm_att') return viewAttPicker(ctx, c)
    if (d === 'm_stat') return viewStats(ctx, c)
    if (d === 'm_grad') return viewGraduates(ctx, c, 0)
    if (d === 'm_comp') return viewCompetitions(ctx, c, 0)
    if (d === 'm_media') return viewMediaAlbums(ctx, c)
    if (d === 'm_act') return viewActivities(ctx, c, 0)
    if (d === 'm_set') return viewSettings(ctx, c)

    // ── Actions ──
    if (d === 'action_add_hal') return startAddHalaka(ctx, c)
    if (d === 'action_add_stu') return startAddStudent(ctx, c)
    if (d === 'action_search') {
      startConversation(c, 'search')
      await ed(ctx, `🔍 ${bold('بحث عن طالب')}\n${LINE}\n\n👤 أدخل الاسم:`, cancelKeyboard())
      return
    }

    // ── Settings ──
    if (d === 'set_pwd') return startChangePassword(ctx, c)
    if (d === 'set_info') return viewCenterInfo(ctx, c)

    // ── Halaka callbacks ──
    if (d.startsWith('hp_')) return viewHalList(ctx, c, parseInt(d.slice(3)))
    if (d.startsWith('hs_')) return viewHalStudents(ctx, c, d.slice(3), 0)
    if (d.startsWith('he_')) return viewHalEdit(ctx, c, d.slice(3))
    if (d.startsWith('hd_')) return confirmDeleteHal(ctx, c, d.slice(3))
    if (d.startsWith('hdc_')) return doDeleteHal(ctx, c, d.slice(4))
    if (d.startsWith('ehn_')) return startEditFieldInline(ctx, c, d.slice(4), 'Halaka', 'name', '🏫 الاسم الجديد:', `he_${d.slice(4)}`)
    if (d.startsWith('eht_')) return startEditFieldInline(ctx, c, d.slice(4), 'Halaka', 'teacher', '👨‍🏫 المعلم الجديد:', `he_${d.slice(4)}`)
    if (d.startsWith('ehb_')) {
      const hid = d.slice(4)
      const kb = new InlineKeyboard()
      for (const br of BRANCHES) kb.text(`🌳 ${br}`, `shb_${hid}_${br}`).row()
      kb.row().text('🔙', `he_${hid}`).text('🏠', 'home')
      await ed(ctx, `✏️ ${bold('اختر الفرع:')}`, kb)
      return
    }
    if (d.startsWith('shb_')) {
      const p = d.slice(4); const idx = p.indexOf('_')
      const hid = p.slice(0, idx); const br = p.slice(idx + 1)
      await sbPatch('Halaka', `id=eq.${hid}`, { branch: br })
      await ed(ctx, `✅ الفرع: ${bold(br)}`, new InlineKeyboard().text('🔙', `he_${hid}`).row().text('🏠', 'home'))
      return
    }
    if (d.startsWith('ehd_')) return startEditFieldInline(ctx, c, d.slice(4), 'Halaka', 'description', '📝 الوصف الجديد:', `he_${d.slice(4)}`)
    if (d.startsWith('ehti_')) return startEditFieldInline(ctx, c, d.slice(4), 'Halaka', 'time', '🕐 الموعد الجديد:', `he_${d.slice(4)}`)
    if (d.startsWith('ehlo_')) return startEditFieldInline(ctx, c, d.slice(4), 'Halaka', 'location', '📍 المكان الجديد:', `he_${d.slice(4)}`)

    // ── Student callbacks ──
    if (d.startsWith('sp_')) { const p = d.slice(3).split('_'); return viewAllStudents(ctx, c, parseInt(p[0])) }
    if (d.startsWith('se_')) return viewStudentEdit(ctx, c, d.slice(3))
    if (d.startsWith('sa_')) return quickAttendance(ctx, c, d.slice(3))
    if (d.startsWith('sd_')) return confirmDeleteStudent(ctx, c, d.slice(3))
    if (d.startsWith('sdc_')) return doDeleteStudent(ctx, c, d.slice(4))
    if (d.startsWith('smv_')) return viewMoveStudent(ctx, c, d.slice(4))
    if (d.startsWith('smv_do_')) {
      const p = d.slice(7); const idx = p.indexOf('_')
      const sid = p.slice(0, idx); const hid = p.slice(idx + 1)
      await sbPatch('Student', `id=eq.${sid}`, { halakaId: hid })
      await ed(ctx, `✅ ${bold('تم نقل الطالب!')}`, backKeyboard(`se_${sid}`))
      return
    }
    if (d.startsWith('esn_')) {
      const sid = d.slice(4); const s = (await sbGet('Student', `id=eq.${sid}`))[0]
      return startEditFieldInline(ctx, c, sid, 'Student', 'name', '👤 الاسم الجديد:', `hs_${s?.halakaId || ''}`)
    }
    if (d.startsWith('esu_')) {
      const sid = d.slice(4); const s = (await sbGet('Student', `id=eq.${sid}`))[0]
      return startEditFieldInline(ctx, c, sid, 'Student', 'surah', '📖 السورة الجديدة:', `hs_${s?.halakaId || ''}`)
    }
    if (d.startsWith('esa_')) {
      const sid = d.slice(4); const s = (await sbGet('Student', `id=eq.${sid}`))[0]
      return startEditFieldInline(ctx, c, sid, 'Student', 'age', '🎂 العمر الجديد (رقم):', `hs_${s?.halakaId || ''}`)
    }
    if (d.startsWith('esl_')) {
      const sid = d.slice(4)
      const kb = new InlineKeyboard()
      for (const l of ['مبتدئ', 'متوسط', 'متقدم']) kb.text(l, `stl_${sid}_${l}`).row()
      kb.row().text('🔙', `se_${sid}`).text('🏠', 'home')
      await ed(ctx, `✏️ ${bold('اختر المستوى:')}`, kb)
      return
    }
    if (d.startsWith('stl_')) {
      const p = d.slice(4); const idx = p.indexOf('_')
      const sid = p.slice(0, idx); const lvl = p.slice(idx + 1)
      await sbPatch('Student', `id=eq.${sid}`, { level: lvl })
      await ed(ctx, `✅ المستوى: ${bold(lvl)}`, backKeyboard(`se_${sid}`))
      return
    }
    if (d.startsWith('esc_')) {
      const sid = d.slice(4)
      const kb = new InlineKeyboard()
      for (const cat of ['1-10', '10-20', '20-30', '30-20', 'محو الامية']) kb.text(cat, `stc_${sid}_${cat}`).row()
      kb.row().text('🔙', `se_${sid}`).text('🏠', 'home')
      await ed(ctx, `✏️ ${bold('اختر الفئة:')}`, kb)
      return
    }
    if (d.startsWith('stc_')) {
      const p = d.slice(4); const idx = p.indexOf('_')
      const sid = p.slice(0, idx); const cat = p.slice(idx + 1)
      await sbPatch('Student', `id=eq.${sid}`, { category: cat })
      await ed(ctx, `✅ الفئة: ${bold(cat)}`, backKeyboard(`se_${sid}`))
      return
    }

    // ── Attendance callbacks ──
    if (d.startsWith('ath_')) return viewAttHalaka(ctx, c, d.slice(4))
    if (d.startsWith('atm_')) {
      const parts = d.slice(4).split('|')
      return markAttendance(ctx, c, parts[0], parts[1], parts[2])
    }

    // ── Graduates callbacks ──
    if (d.startsWith('gp_')) return viewGraduates(ctx, c, parseInt(d.slice(3)))
    if (d.startsWith('gdc_')) { await sbDelete('CenterInfo', `id=eq.${d.slice(4)}`); await ed(ctx, `✅ ${bold('تم الحذف')}`, backKeyboard('m_grad')); return }
    if (d === 'grad_add') return startAddGraduate(ctx, c)

    // ── Competition callbacks ──
    if (d.startsWith('cp_')) return viewCompetitions(ctx, c, parseInt(d.slice(3)))
    if (d.startsWith('cdc_')) { await sbDelete('CenterInfo', `id=eq.${d.slice(4)}`); await ed(ctx, `✅ ${bold('تم الحذف')}`, backKeyboard('m_comp')); return }
    if (d === 'comp_add') return startAddCompetition(ctx, c)
    if (d.startsWith('comp_type_')) {
      const type = d.slice(10)
      const state = getState(c)
      if (state.action === 'add_comp' && state.step === 1) {
        state.data.type = type
        state.step = 2
        await ed(ctx, `🏆 ${bold('الخطوة 2/4')} — عنوان المسابقة:`, cancelKeyboard())
      }
      return
    }

    // ── Media callbacks ──
    if (d.startsWith('malb_')) return viewMediaList(ctx, c, d.slice(5), 0)
    if (d.startsWith('mp_')) {
      const p = d.slice(3).split('_')
      return viewMediaList(ctx, c, p[1], parseInt(p[0]))
    }
    if (d.startsWith('mdel_')) {
      await sbDelete('MediaImage', `id=eq.${d.slice(5)}`)
      await ed(ctx, `✅ ${bold('تم الحذف')}`, backKeyboard('m_media'))
      return
    }
    if (d === 'media_upload') {
      const state = getState(c)
      state.action = 'wait_photo'
      state.step = 1
      state.data = {}
      await ed(ctx, `📤 ${bold('رفع صورة')}\n${LINE}\n\nأرسل الصورة مباشرة كرسالة وسائط`, cancelKeyboard())
      return
    }

    // ── Activity pagination ──
    if (d.startsWith('ap_')) return viewActivities(ctx, c, parseInt(d.slice(3)))

    // ── Center info edit ──
    if (d.startsWith('sinf_')) {
      const id = d.slice(4)
      const row = (await sbGet('CenterInfo', `id=eq.${id}`))[0]
      if (!row) return
      const state = startConversation(c, 'edit_field')
      state.data = { id, table: 'CenterInfo', field: 'value', backCb: 'm_set' }
      await ed(ctx, `✏️ ${bold('تعديل: ' + row.key)}\n\nالقيمة الحالية: ${esc(String(row.value).slice(0, 100))}\n\nأرسل القيمة الجديدة:`, cancelKeyboard())
      return
    }

    // ── Student add sub-steps ──
    if (d.startsWith('nsc_')) {
      const cat = d.slice(4); const state = getState(c)
      if (state.action === 'add_stu' && state.step === 4) {
        state.data.cat = cat
        state.step = 5
        const kb = new InlineKeyboard()
        for (const l of ['مبتدئ', 'متوسط', 'متقدم']) kb.text(l, `nsl_${l}`).row()
        kb.row().text('❌ إلغاء', 'cancel')
        await ed(ctx, `📝 ${bold('الخطوة 5/6')} — 📊 المستوى:`, kb)
      }
      return
    }
    if (d.startsWith('nsl_')) {
      const lvl = d.slice(4); const state = getState(c)
      if (state.action === 'add_stu' && state.step === 5) {
        state.data.lvl = lvl
        state.step = 6
        const halakat = await sbGet('Halaka', 'order=createdAt.asc')
        if (!halakat.length) { await ed(ctx, '❌ لا توجد حلقات', cancelKeyboard()); return }
        const kb = new InlineKeyboard()
        for (const h of halakat.slice(0, 15)) kb.text(`📚 ${esc(h.name)}`, `nsh_${h.id}`).row()
        kb.row().text('❌ إلغاء', 'cancel')
        await ed(ctx, `📝 ${bold('الخطوة 6/6')} — 🏫 الحلقة:`, kb)
      }
      return
    }
    if (d.startsWith('nsh_')) {
      const hid = d.slice(4); const state = getState(c)
      if (state.action === 'add_stu' && state.step === 6) {
        state.data.hid = hid
        state.step = 7
        await ed(ctx, `📝 ${bold('الخطوة الأخيرة')} — 📱 هاتف ولي الأمر (اختياري):`, cancelKeyboard())
      }
      return
    }

    await ed(ctx, '❌ أمر غير معروف', mainKeyboard())
  } catch (e) {
    console.error('[CB Error]', e)
    try { await ctx.reply('❌ حدث خطأ', { parse_mode: 'MarkdownV2' }) } catch {}
  }
})

// ── Inline helpers for edit fields ─────────────────────────────────────────────
async function startAddHalaka(ctx: any, c: number) {
  startConversation(c, 'add_hal')
  await ed(ctx, `📚 ${bold('إضافة حلقة جديدة')}\n${LINE}\n\n📝 ${bold('الخطوة 1/4')} — 🏫 اسم الحلقة:`, cancelKeyboard())
}

async function startAddStudent(ctx: any, c: number) {
  startConversation(c, 'add_stu')
  await ed(ctx, `👥 ${bold('إضافة طالب جديد')}\n${LINE}\n\n📝 ${bold('الخطوة 1/6')} — 👤 اسم الطالب:`, cancelKeyboard())
}

async function startEditFieldInline(ctx: any, c: number, id: string, table: string, field: string, prompt: string, backCb: string) {
  const state = startConversation(c, 'edit_field')
  state.data = { id, table, field, backCb }
  await ed(ctx, `✏️ ${bold('تعديل')}\n${LINE}\n\n${prompt}`, cancelKeyboard())
}

// ═══════════════════════════════════════════════════════════════════════════════
// START BOT
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true })
    console.log('✅ Webhook cleared')
  } catch { /* ignore */ }

  try {
    await bot.api.setMyCommands([
      { command: 'start', description: '🏠 القائمة الرئيسية' },
      { command: 'login', description: '🔐 تسجيل الدخول' },
      { command: 'help', description: '📋 المساعدة' },
    ])
    console.log('✅ Bot commands set')
  } catch { /* ignore */ }

  console.log('🚀 Alseeva2026 Bot v5.0 starting...')
  bot.start({
    onStart: (info) => console.log(`✅ @${info.username} running (id: ${info.id})`),
  })
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
