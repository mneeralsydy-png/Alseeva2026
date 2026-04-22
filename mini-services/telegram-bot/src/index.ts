// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 Alseeva2026 — Telegram Bot v6.0
// Professional Admin Dashboard — Full Mirror of Admin Web App
// ═══════════════════════════════════════════════════════════════════════════════
//
// Environment Variables (.env):
//   BOT_TOKEN        — Telegram bot token
//   SUPABASE_URL     — Supabase project URL
//   SUPABASE_KEY     — Supabase anon/public key
//   CHANNEL_ID       — Telegram channel ID for media
//   ADMIN_ACCOUNT_ID — Allowed admin Telegram chat ID
// ═══════════════════════════════════════════════════════════════════════════════

import { Bot, InlineKeyboard } from 'grammy'

// ─── Services ─────────────────────────────────────────────────────────────────
import { sbGet, sbPost, sbPatch, sbDelete } from './services/supabase.js'
import {
  isAuthenticated, isPendingPassword, setAuthenticated,
  setPendingPassword, verifyPassword, changePassword, logout,
} from './services/auth.js'
import { getState, clearState, startConversation } from './services/conversation.js'

// ─── Middleware ────────────────────────────────────────────────────────────────
import { authMiddleware } from './middlewares/auth.js'

// ─── Keyboards ────────────────────────────────────────────────────────────────
import {
  mainKeyboard, cancelKeyboard, backKeyboard, branchKeyboard,
  levelKeyboard, categoryKeyboard, activityTypeKeyboard,
} from './keyboards/index.js'

// ─── Views ────────────────────────────────────────────────────────────────────
import { viewDashboard } from './views/dashboard.js'
import { viewHalList, viewHalStudents, viewHalEdit, confirmDeleteHal, doDeleteHal } from './views/halakat.js'
import { viewAllStudents, viewStudentEdit, quickAttendance, viewMoveStudent, confirmDeleteStudent, doDeleteStudent } from './views/students.js'
import { viewAttPicker, viewAttHalaka, markAttendance } from './views/attendance.js'
import { viewMonthlyRate } from './views/monthly-rate.js'
import { viewStats } from './views/stats.js'
import {
  viewGraduates, startAddGraduate,
  viewCompetitions, startAddCompetition,
  viewMediaAlbums, viewMediaList, startMediaUpload, handlePhotoUpload,
  viewActivities, startAddActivity,
  viewSettings, viewCenterInfo, startChangePassword,
} from './views/sections.js'

// ─── Utils ────────────────────────────────────────────────────────────────────
import { ed } from './utils/messenger.js'
import { bold, esc, LINE, chatId, PAGE_SIZE, BRANCHES, LEVELS, CATEGORIES } from './utils/helpers.js'

// ═══════════════════════════════════════════════════════════════════════════════
// BOT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

const BOT_TOKEN = process.env.BOT_TOKEN!
if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN env var is required')
  process.exit(1)
}

const bot = new Bot(BOT_TOKEN)
bot.use(authMiddleware)

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

bot.command('start', async (ctx) => {
  const c = ctx.chat!.id
  clearState(c)

  if (isAuthenticated(c)) {
    await viewDashboard(ctx, c)
    return
  }

  setPendingPassword(c)
  await ctx.reply(
    `🤖 ${bold('مرحباً بك في مركز الشفاء — Alseeva2026')}\n${LINE}\n\n` +
    `🔒 أرسل ${bold('كلمة المرور')} للمتابعة:`,
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
    `${bold('المساعدة — Alseeva2026 Bot')}\n${LINE}\n\n` +
    `🏠 /start — القائمة الرئيسية\n` +
    `🔐 /login — تسجيل الدخول\n` +
    `❓ /help — المساعدة\n\n` +
    `📌 استخدم الأزرار للتنقل بين الأقسام\n` +
    `🔙 كل قائمة فرعية بها زر رجوع\n` +
    `🏠 زر الرئيسية في كل صفحة`,
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
      await ed(ctx,
        `✅ ${bold('تم تسجيل الدخول بنجاح!')} 🎉\n${LINE}\n\nمرحباً بك في لوحة التحكم`,
        mainKeyboard()
      )
    } else {
      await ctx.reply('❌ كلمة المرور غير صحيحة\n\nحاول مرة أخرى:', { parse_mode: 'MarkdownV2' })
    }
    return
  }

  const state = getState(c)

  // ── No active conversation ──
  if (!state.action) {
    await ed(ctx, '👆 اختر من القائمة الرئيسية', mainKeyboard())
    return
  }

  // ── Add Halaka ──
  if (state.action === 'add_hal') {
    await handleAddHalaka(ctx, c, txt, state)
    return
  }

  // ── Add Student ──
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
      await ed(ctx, `✅ ${bold('تم تغيير كلمة المرور بنجاح!')}`, backKeyboard('m_set'))
    } else {
      await ed(ctx, '❌ حدث خطأ أثناء تغيير كلمة المرور', backKeyboard('m_set'))
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

  // ── Add Activity ──
  if (state.action === 'add_act') {
    await handleAddActivity(ctx, c, txt, state)
    return
  }

  // ── Media: album name input ──
  if (state.action === 'wait_album') {
    state.data.album = txt || 'عامة'
    state.action = 'wait_photo'
    state.step = 2
    await ed(ctx,
      `📤 ${bold('رفع صورة')}\n${LINE}\n\n📁 الألبوم: ${bold(state.data.album)}\n\nأرسل الصورة الآن:`,
      cancelKeyboard()
    )
    return
  }

  await ed(ctx, '👆 اختر من القائمة', mainKeyboard())
})

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Add Halaka (4 steps) ─────────────────────────────────────────────────────
async function handleAddHalaka(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 1) {
    if (!txt) { await ctx.reply('❌ الاسم مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.name = txt
    state.step = 2
    await ed(ctx, `📝 ${bold('الخطوة 2/5')} — 👨‍🏫 اسم المعلم:`, cancelKeyboard())
  } else if (state.step === 2) {
    state.data.teacher = txt
    state.step = 3
    await ed(ctx, `📝 ${bold('الخطوة 3/5')} — 🌳 الفرع:`, branchKeyboard())
  } else if (state.step === 4) {
    // Time step (after branch callback)
    state.data.time = txt
    state.step = 5
    await ed(ctx, `📝 ${bold('الخطوة 5/6')} — 📍 المكان:`, cancelKeyboard())
  } else if (state.step === 5) {
    // Location step
    state.data.location = txt
    await ed(ctx, `📝 ${bold('الخطوة 6/6')} — 📝 وصف الحلقة (اختياري):`, cancelKeyboard())
    state.step = 6
  } else if (state.step === 6) {
    // Description step - final
    await sbPost('Halaka', {
      name: state.data.name,
      teacher: state.data.teacher,
      branch: state.data.branch,
      time: state.data.time || '',
      location: state.data.location || '',
      description: txt,
    })
    clearState(c)
    await ed(ctx,
      `✅ ${bold('تم إضافة الحلقة بنجاح!')} 🎉\n\n` +
      `🏫 ${esc(state.data.name)}\n` +
      `👨‍🏫 ${esc(state.data.teacher)}\n` +
      `🌳 ${esc(state.data.branch)}\n` +
      `🕐 ${esc(state.data.time || '—')}\n` +
      `📍 ${esc(state.data.location || '—')}`,
      mainKeyboard()
    )
  }
}

// ── Add Student (multi-step with callbacks for branch/level/category) ─────────
async function handleAddStudent(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 1) {
    if (!txt) { await ctx.reply('❌ الاسم مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.name = txt
    state.step = 2
    await ed(ctx, `📝 ${bold('الخطوة 2/8')} — 🎂 العمر (رقم):`, cancelKeyboard())
  } else if (state.step === 2) {
    const age = parseInt(txt)
    if (isNaN(age) || age < 3 || age > 100) {
      await ctx.reply('❌ عمر غير صحيح (3-100)', { reply_markup: cancelKeyboard() })
      return
    }
    state.data.age = age
    state.step = 3
    await ed(ctx, `📝 ${bold('الخطوة 3/8')} — 📖 السورة الحالية:`, cancelKeyboard())
  } else if (state.step === 3) {
    state.data.surah = txt
    state.step = 4
    // Show category keyboard via callback
    const kb = new InlineKeyboard()
    for (const cat of CATEGORIES) kb.text(cat, `newcat_${cat}`).row()
    kb.row().text('❌ إلغاء', 'cancel')
    await ed(ctx, `📝 ${bold('الخطوة 4/8')} — 📂 الفئة:`, kb)
  } else if (state.step === 6) {
    // Parent name
    state.data.parentName = txt || ''
    state.step = 7
    // Show halaka selection keyboard
    const halakat = await sbGet('Halaka', 'order=createdAt.asc')
    if (!halakat.length) {
      await ed(ctx, '❌ لا توجد حلقات! أنشئ حلقة أولاً.', cancelKeyboard())
      clearState(c)
      return
    }
    const kb = new InlineKeyboard()
    for (const h of halakat.slice(0, 15)) kb.text(`📚 ${esc(h.name)}`, `newhal_${h.id}`).row()
    kb.row().text('❌ إلغاء', 'cancel')
    await ed(ctx, `📝 ${bold('الخطوة 7/8')} — 🏫 اختر الحلقة:`, kb)
  } else if (state.step === 8) {
    // Final step: parent phone
    state.data.phone = txt || ''
    await sbPost('Student', {
      name: state.data.name,
      age: state.data.age,
      surah: state.data.surah,
      category: state.data.cat,
      level: state.data.lvl,
      halakaId: state.data.hid,
      parentName: state.data.parentName || '',
      parentPhone: txt || '',
    })
    clearState(c)
    await ed(ctx,
      `✅ ${bold('تم إضافة الطالب بنجاح!')} 🎉\n\n` +
      `👤 ${esc(state.data.name)}\n` +
      `🎂 ${esc(String(state.data.age))}  📖 ${esc(state.data.surah)}\n` +
      `📊 ${esc(state.data.lvl)}  📂 ${esc(state.data.cat)}`,
      mainKeyboard()
    )
  }
}

// ── Edit Field ───────────────────────────────────────────────────────────────
async function handleEditField(ctx: any, c: number, txt: string, state: any) {
  if (!txt) { await ctx.reply('❌ مطلوب', { reply_markup: cancelKeyboard() }); return }

  // Handle age as number
  let value: any = txt
  if (state.data.field === 'age') {
    const n = parseInt(txt)
    if (isNaN(n)) { await ctx.reply('❌ أرسل رقماً', { reply_markup: cancelKeyboard() }); return }
    value = n
  }

  await sbPatch(state.data.table, `id=eq.${state.data.id}`, { [state.data.field]: value })
  const backCb = state.data.backCb || 'home'
  clearState(c)
  await ed(ctx, `✅ ${bold('تم التعديل بنجاح!')}\n\nالقيمة الجديدة: ${esc(txt)}`, backKeyboard(backCb))
}

// ── Search ───────────────────────────────────────────────────────────────────
async function handleSearch(ctx: any, c: number, txt: string, state: any) {
  const students = await sbGet('Student', `name=ilike.%${txt}%&limit=10`)
  const halakat = await sbGet('Halaka')
  const hMap = new Map(halakat.map((h: any) => [h.id, h.name]))

  clearState(c)

  if (!students.length) {
    await ed(ctx, `🔍 ${bold('لا نتائج')}\n\nلم يتم العثور على طالب باسم: ${esc(txt)}`, mainKeyboard())
    return
  }

  let msg = `🔍 ${bold('نتائج البحث')} (${students.length})\n${LINE}\n\n`
  const kb = new InlineKeyboard()
  for (const s of students) {
    const halName = hMap.get(s.halakaId) || '—'
    msg += `👤 ${bold(s.name)}  📚 ${esc(halName)}  📖 ${esc(s.surah || '—')}\n\n`
    kb.text('✏️ تعديل', `se_${s.id}`).text('✅ حضور', `sa_${s.id}`).row()
  }
  kb.row().text('🏠', 'home')
  await ed(ctx, msg, kb)
}

// ── Add Graduate (3 steps) ───────────────────────────────────────────────────
async function handleAddGraduate(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 1) {
    if (!txt) { await ctx.reply('❌ العنوان مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.title = txt
    state.step = 2
    await ed(ctx, `📝 ${bold('الخطوة 2/3')} — 📅 التاريخ (YYYY-MM-DD):`, cancelKeyboard())
  } else if (state.step === 2) {
    state.data.date = txt
    state.step = 3
    await ed(ctx, `📝 ${bold('الخطوة 3/3')} — 👥 عدد الخريجين:`, cancelKeyboard())
  } else if (state.step === 3) {
    const count = parseInt(txt) || 0
    const grads = await sbGet('CenterInfo', 'type=eq.graduate_batch')
    const bn = grads.length + 1
    await sbPost('CenterInfo', {
      key: `دفعة_${bn}_${state.data.title}`,
      value: JSON.stringify({
        batchNumber: bn,
        title: state.data.title,
        date: state.data.date,
        graduateCount: count,
        graduates: [],
        notes: '',
      }),
      type: 'graduate_batch',
      section: 'خريجين',
    })
    clearState(c)
    await ed(ctx,
      `✅ ${bold('تم إضافة الدفعة بنجاح!')} 🎉\n\n` +
      `🎓 ${esc(state.data.title)}\n` +
      `📅 ${esc(state.data.date)}\n` +
      `👥 ${bold(String(count))} خريج`,
      backKeyboard('m_grad')
    )
  }
}

// ── Add Competition (4 steps) ────────────────────────────────────────────────
async function handleAddCompetition(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 2) {
    if (!txt) { await ctx.reply('❌ العنوان مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.title = txt
    state.step = 3
    await ed(ctx, `📝 ${bold('الخطوة 3/4')} — 📅 التاريخ (YYYY-MM-DD):`, cancelKeyboard())
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
    await ed(ctx,
      `✅ ${bold('تم إضافة المسابقة بنجاح!')} 🎉\n\n` +
      `🏆 ${esc(state.data.title)}\n` +
      `📍 ${esc(state.data.type)}\n` +
      `📅 ${esc(state.data.date)}\n` +
      `👥 ${bold(String(participants.length))} مشارك`,
      backKeyboard('m_comp')
    )
  }
}

// ── Add Activity (4 steps) ──────────────────────────────────────────────────
async function handleAddActivity(ctx: any, c: number, txt: string, state: any) {
  if (state.step === 1) {
    if (!txt) { await ctx.reply('❌ العنوان مطلوب', { reply_markup: cancelKeyboard() }); return }
    state.data.title = txt
    state.step = 2
    await ed(ctx, `📝 ${bold('الخطوة 2/4')} — 📅 التاريخ (YYYY-MM-DD):`, cancelKeyboard())
  } else if (state.step === 2) {
    state.data.date = txt
    state.step = 3
    // Show type keyboard
    const kb = new InlineKeyboard()
    for (const t of ['عامة', 'قرآنية', 'ثقافية', 'رياضية', 'اجتماعية']) kb.text(t, `newacttype_${t}`).row()
    kb.row().text('❌ إلغاء', 'cancel')
    await ed(ctx, `📝 ${bold('الخطوة 3/4')} — 🏷️ نوع النشاط:`, kb)
  } else if (state.step === 4) {
    await sbPost('Activity', {
      title: state.data.title,
      date: state.data.date,
      type: state.data.actType || 'عامة',
      description: txt,
    })
    clearState(c)
    await ed(ctx,
      `✅ ${bold('تم إضافة النشاط بنجاح!')} 🎉\n\n` +
      `📌 ${esc(state.data.title)}\n` +
      `📅 ${esc(state.data.date)}\n` +
      `🏷️ ${esc(state.data.actType || 'عامة')}`,
      backKeyboard('m_act')
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHOTO HANDLER (Media Upload)
// ═══════════════════════════════════════════════════════════════════════════════

bot.on('message:photo', async (ctx) => {
  const c = ctx.chat!.id
  const state = getState(c)

  if (state.action === 'wait_photo') {
    await handlePhotoUpload(ctx, c, bot)
    return
  }

  // Ignore photos in other states
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
    // ═══ GLOBAL ═══
    if (d === 'cancel') { clearState(c); await ed(ctx, '❌ تم الإلغاء', mainKeyboard()); return }
    if (d === 'home') { clearState(c); await viewDashboard(ctx, c); return }
    if (d === 'login') { setPendingPassword(c); clearState(c); await ed(ctx, '🔒 أرسل كلمة المرور:', cancelKeyboard()); return }

    // ═══ MAIN SECTIONS ═══
    if (d === 'm_dash') return viewDashboard(ctx, c)
    if (d === 'm_hal') return viewHalList(ctx, c, 0)
    if (d === 'm_stu') return viewAllStudents(ctx, c, 0)
    if (d === 'm_att') return viewAttPicker(ctx, c)
    if (d === 'm_rate') return viewMonthlyRate(ctx, c)
    if (d === 'm_stat') return viewStats(ctx, c)
    if (d === 'm_grad') return viewGraduates(ctx, c, 0)
    if (d === 'm_comp') return viewCompetitions(ctx, c, 0)
    if (d === 'm_media') return viewMediaAlbums(ctx, c)
    if (d === 'm_act') return viewActivities(ctx, c, 0)
    if (d === 'm_set') return viewSettings(ctx, c)

    // ═══ QUICK ACTIONS ═══
    if (d === 'action_add_hal') {
      startConversation(c, 'add_hal')
      await ed(ctx, `📚 ${bold('إضافة حلقة جديدة')}\n${LINE}\n\n📝 الخطوة 1/6 — 🏫 اسم الحلقة:`, cancelKeyboard())
      return
    }
    if (d === 'action_add_stu') {
      startConversation(c, 'add_stu')
      await ed(ctx, `👥 ${bold('إضافة طالب جديد')}\n${LINE}\n\n📝 الخطوة 1/8 — 👤 اسم الطالب:`, cancelKeyboard())
      return
    }
    if (d === 'action_search') {
      startConversation(c, 'search')
      await ed(ctx, `🔍 ${bold('بحث عن طالب')}\n${LINE}\n\n👤 أدخل اسم الطالب:`, cancelKeyboard())
      return
    }

    // ═══ SETTINGS ═══
    if (d === 'set_pwd') return startChangePassword(ctx, c)
    if (d === 'set_info') return viewCenterInfo(ctx, c)
    if (d === 'set_logout') { logout(c); clearState(c); await ed(ctx, `👋 ${bold('تم تسجيل الخروج')}\n\nأرسل /start لتسجيل الدخول`, new InlineKeyboard().text('🔐 تسجيل الدخول', 'login')); return }

    // ═══ HALAKA CALLBACKS ═══
    if (d.startsWith('hp_')) return viewHalList(ctx, c, parseInt(d.slice(3)))
    if (d.startsWith('hs_')) return viewHalStudents(ctx, c, d.slice(3), 0)
    if (d.startsWith('hsp_')) {
      const parts = d.slice(4).split('_')
      return viewHalStudents(ctx, c, parts[1], parseInt(parts[0]))
    }
    if (d.startsWith('he_')) return viewHalEdit(ctx, c, d.slice(3))
    if (d.startsWith('hd_')) return confirmDeleteHal(ctx, c, d.slice(3))
    if (d.startsWith('hdc_')) return doDeleteHal(ctx, c, d.slice(4))

    // Halaka edit fields
    if (d.startsWith('ehn_')) return startEditInline(ctx, c, d.slice(4), 'Halaka', 'name', '🏫 الاسم الجديد:', `he_${d.slice(4)}`)
    if (d.startsWith('eht_')) return startEditInline(ctx, c, d.slice(4), 'Halaka', 'teacher', '👨‍🏫 المعلم الجديد:', `he_${d.slice(4)}`)
    if (d.startsWith('ehti_')) return startEditInline(ctx, c, d.slice(4), 'Halaka', 'time', '🕐 الموعد الجديد:', `he_${d.slice(4)}`)
    if (d.startsWith('ehlo_')) return startEditInline(ctx, c, d.slice(4), 'Halaka', 'location', '📍 المكان الجديد:', `he_${d.slice(4)}`)
    if (d.startsWith('ehd_')) return startEditInline(ctx, c, d.slice(4), 'Halaka', 'description', '📝 الوصف الجديد:', `he_${d.slice(4)}`)

    // Halaka branch select
    if (d.startsWith('ehb_')) {
      const hid = d.slice(4)
      const kb = new InlineKeyboard()
      for (const br of BRANCHES) kb.text(`🌳 ${br}`, `shb_${hid}_${br}`).row()
      kb.row().text('🔙', `he_${hid}`).text('🏠', 'home')
      await ed(ctx, `✏️ ${bold('اختر الفرع الجديد:')}`, kb)
      return
    }
    if (d.startsWith('shb_')) {
      const p = d.slice(4); const idx = p.indexOf('_')
      const hid = p.slice(0, idx); const br = p.slice(idx + 1)
      await sbPatch('Halaka', `id=eq.${hid}`, { branch: br })
      await ed(ctx, `✅ ${bold('تم تغيير الفرع بنجاح!')}\n\nالفرع الجديد: ${bold(br)}`, backKeyboard(`he_${hid}`))
      return
    }

    // Halaka add - branch step (step 3)
    if (d.startsWith('branch_') && getState(c).action === 'add_hal' && getState(c).step === 3) {
      const br = d.slice(7)
      const state = getState(c)
      state.data.branch = br
      state.step = 4
      await ed(ctx, `📝 ${bold('الخطوة 4/6')} — 🕐 الموعد (مثال: 4:00 عصراً):`, cancelKeyboard())
      return
    }

    // Halaka add - time (step 4) and location (step 5) handled via text in handleAddHalaka

    // ═══ STUDENT CALLBACKS ═══
    if (d.startsWith('sp_')) return viewAllStudents(ctx, c, parseInt(d.slice(3)))
    if (d.startsWith('se_')) return viewStudentEdit(ctx, c, d.slice(3))
    if (d.startsWith('sa_')) return quickAttendance(ctx, c, d.slice(3))
    if (d.startsWith('sd_')) return confirmDeleteStudent(ctx, c, d.slice(3))
    if (d.startsWith('sdc_')) return doDeleteStudent(ctx, c, d.slice(4))
    if (d.startsWith('smv_')) return viewMoveStudent(ctx, c, d.slice(4))
    if (d.startsWith('smv_do_')) {
      const p = d.slice(7); const idx = p.indexOf('_')
      const sid = p.slice(0, idx); const hid = p.slice(idx + 1)
      await sbPatch('Student', `id=eq.${sid}`, { halakaId: hid })
      const s = (await sbGet('Student', `id=eq.${sid}`))[0]
      const h = (await sbGet('Halaka', `id=eq.${hid}`))[0]
      await ed(ctx, `✅ ${bold('تم نقل الطالب بنجاح!')}\n\n👤 ${esc(s?.name || '')} → 📚 ${esc(h?.name || '')}`, backKeyboard(`se_${sid}`))
      return
    }

    // Student edit fields
    if (d.startsWith('esn_')) return startEditInline(ctx, c, d.slice(4), 'Student', 'name', '👤 الاسم الجديد:', `se_${d.slice(4)}`)
    if (d.startsWith('esu_')) return startEditInline(ctx, c, d.slice(4), 'Student', 'surah', '📖 السورة الجديدة:', `se_${d.slice(4)}`)
    if (d.startsWith('esa_')) return startEditInline(ctx, c, d.slice(4), 'Student', 'age', '🎂 العمر الجديد (رقم):', `se_${d.slice(4)}`)
    if (d.startsWith('espn_')) return startEditInline(ctx, c, d.slice(4), 'Student', 'parentName', '🧑‍👦 اسم ولي الأمر الجديد:', `se_${d.slice(4)}`)
    if (d.startsWith('espp_')) return startEditInline(ctx, c, d.slice(4), 'Student', 'parentPhone', '📱 هاتف ولي الأمر الجديد:', `se_${d.slice(4)}`)

    // Student add - halaka selection (step 7)
    if (d.startsWith('newhal_') && getState(c).action === 'add_stu' && getState(c).step === 7) {
      const hid = d.slice(7)
      const state = getState(c)
      state.data.hid = hid
      state.step = 8
      await ed(ctx, `📝 ${bold('الخطوة 8/8')} — 📱 هاتف ولي الأمر (اختياري):`, cancelKeyboard())
      return
    }

    // Student level select
    if (d.startsWith('esl_')) {
      const sid = d.slice(4)
      const kb = new InlineKeyboard()
      for (const l of LEVELS) kb.text(l, `stl_${sid}_${l}`).row()
      kb.row().text('🔙', `se_${sid}`).text('🏠', 'home')
      await ed(ctx, `✏️ ${bold('اختر المستوى الجديد:')}`, kb)
      return
    }
    if (d.startsWith('stl_')) {
      const p = d.slice(4); const idx = p.indexOf('_')
      const sid = p.slice(0, idx); const lvl = p.slice(idx + 1)
      await sbPatch('Student', `id=eq.${sid}`, { level: lvl })
      await ed(ctx, `✅ ${bold('تم تغيير المستوى!')}\n\nالمستوى الجديد: ${bold(lvl)}`, backKeyboard(`se_${sid}`))
      return
    }

    // Student category select
    if (d.startsWith('esc_')) {
      const sid = d.slice(4)
      const kb = new InlineKeyboard()
      for (const cat of CATEGORIES) kb.text(cat, `stc_${sid}_${cat}`).row()
      kb.row().text('🔙', `se_${sid}`).text('🏠', 'home')
      await ed(ctx, `✏️ ${bold('اختر الفئة الجديدة:')}`, kb)
      return
    }
    if (d.startsWith('stc_')) {
      const p = d.slice(4); const idx = p.indexOf('_')
      const sid = p.slice(0, idx); const cat = p.slice(idx + 1)
      await sbPatch('Student', `id=eq.${sid}`, { category: cat })
      await ed(ctx, `✅ ${bold('تم تغيير الفئة!')}\n\nالفئة الجديدة: ${bold(cat)}`, backKeyboard(`se_${sid}`))
      return
    }

    // ═══ STUDENT ADD SUB-STEPS ═══
    // Category selection (step 4)
    if (d.startsWith('newcat_') && getState(c).action === 'add_stu' && getState(c).step === 4) {
      const cat = d.slice(7)
      const state = getState(c)
      state.data.cat = cat
      state.step = 5
      const kb = new InlineKeyboard()
      for (const l of LEVELS) kb.text(l, `newlvl_${l}`).row()
      kb.row().text('❌ إلغاء', 'cancel')
      await ed(ctx, `📝 ${bold('الخطوة 5/8')} — 📊 المستوى:`, kb)
      return
    }
    // Level selection (step 5)
    if (d.startsWith('newlvl_') && getState(c).action === 'add_stu' && getState(c).step === 5) {
      const lvl = d.slice(7)
      const state = getState(c)
      state.data.lvl = lvl
      state.step = 6
      await ed(ctx, `📝 ${bold('الخطوة 6/8')} — 🧑‍👦 اسم ولي الأمر (اختياري):`, cancelKeyboard())
      return
    }

    // ═══ ATTENDANCE CALLBACKS ═══
    if (d.startsWith('ath_')) return viewAttHalaka(ctx, c, d.slice(4))
    if (d.startsWith('atm_')) {
      const parts = d.slice(4).split('|')
      return markAttendance(ctx, c, parts[0], parts[1], parts[2])
    }

    // ═══ GRADUATES CALLBACKS ═══
    if (d.startsWith('gp_')) return viewGraduates(ctx, c, parseInt(d.slice(3)))
    if (d.startsWith('gdc_')) {
      await sbDelete('CenterInfo', `id=eq.${d.slice(4)}`)
      await ed(ctx, `✅ ${bold('تم حذف الدفعة')}`, backKeyboard('m_grad'))
      return
    }
    if (d === 'grad_add') return startAddGraduate(ctx, c)

    // ═══ COMPETITION CALLBACKS ═══
    if (d.startsWith('cp_')) return viewCompetitions(ctx, c, parseInt(d.slice(3)))
    if (d.startsWith('cdc_')) {
      await sbDelete('CenterInfo', `id=eq.${d.slice(4)}`)
      await ed(ctx, `✅ ${bold('تم حذف المسابقة')}`, backKeyboard('m_comp'))
      return
    }
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

    // ═══ MEDIA CALLBACKS ═══
    if (d.startsWith('malb_')) return viewMediaList(ctx, c, d.slice(5), 0)
    if (d.startsWith('mp_')) {
      const p = d.slice(3).split('_')
      return viewMediaList(ctx, c, p[1], parseInt(p[0]))
    }
    if (d.startsWith('mdel_')) {
      await sbDelete('MediaImage', `id=eq.${d.slice(5)}`)
      await ed(ctx, `✅ ${bold('تم حذف الصورة')}`, backKeyboard('m_media'))
      return
    }
    if (d === 'media_upload') return startMediaUpload(ctx, c)
    if (d.startsWith('photoalb_')) {
      const album = d.slice(8)
      const state = getState(c)
      if (state.action === 'wait_photo') {
        state.data.album = album
        state.step = 2
        await ed(ctx,
          `📤 ${bold('رفع صورة')}\n${LINE}\n\n📁 الألبوم: ${bold(album)}\n\nأرسل الصورة الآن:`,
          cancelKeyboard()
        )
      }
      return
    }

    // ═══ ACTIVITY CALLBACKS ═══
    if (d.startsWith('ap_')) return viewActivities(ctx, c, parseInt(d.slice(3)))
    if (d.startsWith('adel_')) {
      await sbDelete('Activity', `id=eq.${d.slice(5)}`)
      await ed(ctx, `✅ ${bold('تم حذف النشاط')}`, backKeyboard('m_act'))
      return
    }
    if (d === 'act_add') return startAddActivity(ctx, c)
    if (d.startsWith('newacttype_') && getState(c).action === 'add_act' && getState(c).step === 3) {
      const actType = d.slice(11)
      const state = getState(c)
      state.data.actType = actType
      state.step = 4
      await ed(ctx, `📝 ${bold('الخطوة 4/4')} — 📝 وصف النشاط (اختياري):`, cancelKeyboard())
      return
    }

    // ═══ CENTER INFO ═══
    if (d.startsWith('sinf_')) {
      const id = d.slice(4)
      const row = (await sbGet('CenterInfo', `id=eq.${id}`))[0]
      if (!row) return
      startConversation(c, 'edit_field')
      const state = getState(c)
      state.data = { id, table: 'CenterInfo', field: 'value', backCb: 'm_set' }
      await ed(ctx,
        `✏️ ${bold('تعديل: ' + row.key)}\n\nالقيمة الحالية:\n${esc(String(row.value).slice(0, 150))}\n\nأرسل القيمة الجديدة:`,
        cancelKeyboard()
      )
      return
    }

    await ed(ctx, '❌ أمر غير معروف', mainKeyboard())
  } catch (e) {
    console.error('[CB Error]', e)
    try { await ctx.reply('❌ حدث خطأ، حاول مرة أخرى') } catch {}
  }
})

// ── Helper: Start inline edit field ──────────────────────────────────────────
async function startEditInline(ctx: any, c: number, id: string, table: string, field: string, prompt: string, backCb: string) {
  const state = startConversation(c, 'edit_field')
  state.data = { id, table, field, backCb }
  await ed(ctx, `✏️ ${bold('تعديل')}\n${LINE}\n\n${prompt}`, cancelKeyboard())
}

// ═══════════════════════════════════════════════════════════════════════════════
// START BOT
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🚀 Alseeva2026 Bot v6.0 starting...')

  // Clear webhook
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true })
    console.log('✅ Webhook cleared')
  } catch {}

  // Set commands
  try {
    await bot.api.setMyCommands([
      { command: 'start', description: '🏠 القائمة الرئيسية' },
      { command: 'login', description: '🔐 تسجيل الدخول' },
      { command: 'help', description: '❓ المساعدة' },
    ])
    console.log('✅ Bot commands set')
  } catch {}

  console.log('✅ Bot starting with long polling...')
  bot.start({
    onStart: (info) => {
      console.log(`✅ @${info.username} is running (id: ${info.id})`)
      console.log(`   SUPABASE: ${process.env.SUPABASE_URL?.slice(0, 40)}...`)
      console.log(`   CHANNEL: ${process.env.CHANNEL_ID || 'not set'}`)
      console.log(`   ADMIN_ID: ${process.env.ADMIN_ACCOUNT_ID || 'not set'}`)
    },
  })
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
