import { Bot, InlineKeyboard } from 'grammy'

// ═══════════════════════════════════════════════════════════════════════════════
// 🕌 AlShifa Quran Center — Telegram Bot v5.0 (Professional Admin Dashboard)
// ═══════════════════════════════════════════════════════════════════════════════

const BOT_TOKEN = process.env.BOT_TOKEN || '8432772266:AAEYLFX34FiAxIqhTBS59-d06PUJORbWP6w'
const ADMIN_PWD = 'A777A777'
const SUPABASE_URL = 'https://ntshduvxdehefxmchusw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nnhQkb5fX6SPZ7Nx8L7rcg_r-BDxd-M'

// ─── Supabase ────────────────────────────────────────────────────────────────
const sbH = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' })
async function sbGet(t: string, q = '') { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}${q?'?'+q:''}`, { headers: sbH() }); if (!r.ok) throw new Error(`${t}:${r.status}`); return r.json() }
async function sbPost(t: string, d: Record<string, unknown>) { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}`, { method:'POST', headers:sbH(), body:JSON.stringify({...d, id:crypto.randomUUID(), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()}) }); if (!r.ok) throw new Error(`POST ${t}:${r.status}`); return (await r.json())[0] }
async function sbPatch(t: string, f: string, d: Record<string, unknown>) { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { method:'PATCH', headers:sbH(), body:JSON.stringify({...d, updatedAt:new Date().toISOString()}) }); if (!r.ok) throw new Error(`PATCH ${t}:${r.status}`); return (await r.json())[0] }
async function sbDel(t: string, f: string) { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { method:'DELETE', headers:sbH() }); if (!r.ok) throw new Error(`DEL ${t}:${r.status}`) }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const E = (t: string) => String(t||'').replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$&')
const B = (t: string) => `*${E(t)}*`
const I = (t: string) => `_${E(t)}_`
const LINE = '━━━━━━━━━━━━━━━━━━'

const authed = new Set<number>()
const pendPwd = new Set<number>()
const conv = new Map<number, { act: string; step: number; data: Record<string, any> }>()
const gs = (id: number) => { if (!conv.has(id)) conv.set(id, { act:'', step:0, data:{} }); return conv.get(id)! }
const cc = (id: number) => conv.delete(id)
const cid = (ctx: any) => ctx.callbackQuery?.message?.chat?.id || ctx.chat?.id || 0

const BRANCHES = ['السرور','المركز العام','الوادي','وبرة','ضية','المنعم']
const LEVELS = ['مبتدئ','متوسط','متقدم']
const CATS = ['1-10','10-20','20-30','30-20','محو الامية']
const PS = 8

// ─── Safe Edit (update message, not send new) ────────────────────────────────
async function ed(ctx: any, text: string, kb?: any) {
  const o: any = { parse_mode:'MarkdownV2', reply_markup:kb, link_preview_options:{is_disabled:true} }
  try {
    if (ctx.callbackQuery?.message) await ctx.editMessageText(text, o)
    else if (ctx.chat) await ctx.reply(text, o)
  } catch {
    try { await ctx.reply(text, o) } catch {}
  }
}

// ─── Keyboards ───────────────────────────────────────────────────────────────
function mainKB(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📚 الحلقات','m_hal').text('👥 الطلاب','m_stu').row()
    .text('✅ الحضور','m_att').text('📊 الإحصائيات','m_stat').row()
    .text('🎓 الخريجين','m_grad').text('🏆 المسابقات','m_comp').row()
    .text('🖼️ الوسائط','m_media').text('📋 الأنشطة','m_act').row()
    .text('⚙️ الإعدادات','m_set')
}
function homeKB() { return new InlineKeyboard().text('🏠 القائمة الرئيسية','home') }
function cancelKB() { return new InlineKeyboard().text('❌ إلغاء','cancel') }
function backKB(data: string) { return new InlineKeyboard().text('🔙 رجوع',data).row().text('🏠 القائمة الرئيسية','home') }

// ═══════════════════════════════════════════════════════════════════════════════
// BOT
// ═══════════════════════════════════════════════════════════════════════════════
const bot = new Bot(BOT_TOKEN)

// ─── Auth Middleware ──────────────────────────────────────────────────────────
bot.use(async (ctx, next) => {
  const c = ctx.chat?.id
  if (!c || ctx.chat?.type !== 'private') return next()
  const txt = ctx.message?.text || ''
  if (txt.startsWith('/') && (txt === '/start' || txt === '/login' || txt === '/help')) return next()
  if (pendPwd.has(c)) return next()
  if (ctx.updateType === 'callback_query') {
    const d = (ctx.callbackQuery as any).data || ''
    if (d === 'cancel' || d === 'home') return next()
    if (!authed.has(c)) { try { await ctx.answerCallbackQuery({ text:'🔒 سجل دخولك أولاً' }) } catch {} return }
    return next()
  }
  if (gs(c).act) return next()
  if (!authed.has(c)) { await ctx.reply('🔒 لم يتم تسجيل الدخول\n\nأرسل /start') ; return }
  return next()
})

// ─── Commands ────────────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const c = ctx.chat!.id; cc(c)
  if (authed.has(c)) {
    await ctx.reply(`👋 مرحباً بعودتك\n\n${B('لوحة التحكم — مركز الشفاء')}\n${LINE}`, { parse_mode:'MarkdownV2', reply_markup: mainKB() })
    return
  }
  pendPwd.add(c)
  await ctx.reply(`🕌 ${B('مرحباً بك في مساعد مركز الشفاء')}\n${LINE}\n\n🔒 أرسل ${B('كلمة المرور')} للمتابعة:`, { parse_mode:'MarkdownV2' })
})

bot.command('login', async (ctx) => {
  const c = ctx.chat!.id; authed.delete(c); pendPwd.add(c); cc(c)
  await ctx.reply('🔒 أرسل كلمة المرور:', { parse_mode:'MarkdownV2' })
})

bot.command('help', async (ctx) => {
  await ctx.reply(
    `${B('📋 المساعدة')}\n${LINE}\n\n` +
    `🏠 /start — القائمة الرئيسية\n` +
    `🔐 /login — تسجيل الدخول\n\n` +
    `استخدم الأزرار للتنقل\nكل قائمة فرعية بها زر رجوع 🔙`,
    { parse_mode:'MarkdownV2' }
  )
})

// ─── Text Handler ────────────────────────────────────────────────────────────
bot.on('message:text', async (ctx) => {
  const c = ctx.chat!.id; const txt = ctx.message!.text.trim()
  // Password
  if (pendPwd.has(c)) {
    if (txt === ADMIN_PWD) {
      pendPwd.delete(c); authed.add(c)
      await ctx.reply(`✅ ${B('تم تسجيل الدخول!')} 🎉\n${LINE}\n\nاختر القسم ⬇️`, { parse_mode:'MarkdownV2', reply_markup: mainKB() })
    } else {
      await ctx.reply('❌ كلمة المرور غير صحيحة', { parse_mode:'MarkdownV2' })
    }
    return
  }
  const s = gs(c)
  if (!s.act) { await ctx.reply('👆 اختر من القائمة', { reply_markup: mainKB() }); return }
  await handleText(ctx, c, txt, s)
})

async function handleText(ctx: any, c: number, txt: string, s: any) {
  // Add Halaka
  if (s.act === 'add_hal') {
    if (s.step === 1) { if (!txt) { await ctx.reply('❌ مطلوب',{reply_markup:cancelKB()}); return }; s.data.name=txt; s.step=2; await ed(ctx,`📝 ${B('الخطوة 2/4')} — 👨‍🏫 المعلم:`,cancelKB()) }
    else if (s.step === 2) { s.data.teacher=txt; s.step=3; const kb=new InlineKeyboard(); BRANCHES.forEach(br=>kb.text(`🌳 ${br}`,`nhb_${br}`).row()); kb.row().text('❌ إلغاء','cancel'); await ed(ctx,`📝 ${B('الخطوة 3/4')} — 🌳 الفرع:`,kb) }
    else if (s.step === 4) { s.data.desc=txt; await sbPost('Halaka',{name:s.data.name,teacher:s.data.teacher,branch:s.data.branch,description:txt}); cc(c); await ed(ctx,`✅ ${B('تم إضافة الحلقة!')} 🎉\n\n🏫 ${E(s.data.name)}\n👨‍🏫 ${E(s.data.teacher)}\n🌳 ${E(s.data.branch)}`,mainKB()) }
    return
  }
  // Add Student
  if (s.act === 'add_stu') {
    if (s.step === 1) { if (!txt) { await ctx.reply('❌ مطلوب',{reply_markup:cancelKB()}); return }; s.data.name=txt; s.step=2; await ed(ctx,`📝 ${B('الخطوة 2/6')} — 🎂 العمر:`,cancelKB()) }
    else if (s.step === 2) { const a=parseInt(txt); if(isNaN(a)||a<3||a>100){await ctx.reply('❌ عمركان غير صحيح',{reply_markup:cancelKB()});return}; s.data.age=a; s.step=3; await ed(ctx,`📝 ${B('الخطوة 3/6')} — 📖 السورة:`,cancelKB()) }
    else if (s.step === 7) { s.data.phone=txt||''; await sbPost('Student',{name:s.data.name,age:s.data.age,surah:s.data.surah,category:s.data.cat,level:s.data.lvl,halakaId:s.data.hid,parentPhone:txt||''}); cc(c); await ed(ctx,`✅ ${B('تم إضافة الطالب!')} 🎉\n\n👤 ${E(s.data.name)}`,mainKB()) }
    return
  }
  // Edit field
  if (s.act === 'edit_field' && s.step === 1) {
    if (!txt) { await ctx.reply('❌ مطلوب',{reply_markup:cancelKB()}); return }
    await sbPatch(s.data.table, `id=eq.${s.data.id}`, { [s.data.field]: txt })
    const bk = backKB(s.data.backCb)
    cc(c); await ed(ctx, `✅ تم التعديل: ${B(txt)}`, bk)
    return
  }
  // Search
  if (s.act === 'search') {
    const sts = await sbGet('Student', `name=ilike.%${txt}%&limit=10`)
    const hL = await sbGet('Halaka'); const hM = new Map(hL.map((h:any)=>[h.id,h.name]))
    cc(c)
    if (!sts.length) { await ed(ctx,`🔍 لا نتائج لـ: ${E(txt)}`,mainKB()); return }
    let msg = `🔍 ${B('نتائج البحث')} (${sts.length})\n${LINE}\n\n`
    const kb = new InlineKeyboard()
    for (const st of sts) { msg += `👤 ${B(st.name)}  📚 ${E(hM.get(st.halakaId)||'—')}\n\n`; kb.text('✏️',`se_${st.id}`).text('✅ حضور',`sa_${st.id}`).row() }
    kb.row().text('🏠','home')
    await ed(ctx, msg, kb)
    return
  }
  // Change password
  if (s.act === 'chg_pwd' && s.step === 1) {
    if (txt.length < 4) { await ctx.reply('❌ كلمة المرور قصيرة (4 أحرف على الأقل)',{reply_markup:cancelKB()}); return }
    const admins = await sbGet('Admin')
    if (admins.length) await sbPatch('Admin', `id=eq.${admins[0].id}`, { password: txt })
    cc(c); await ed(ctx, `✅ ${B('تم تغيير كلمة المرور!')}`, backKB('m_set'))
    return
  }
  await ctx.reply('👆 اختر من القائمة',{reply_markup:mainKB()})
}

// ─── Callback Handler (Single, Complete) ──────────────────────────────────────
bot.on('callback_query:data', async (ctx) => {
  const d = ctx.callbackQuery.data
  const c = cid(ctx)
  if (!c) { try{await ctx.answerCallbackQuery()}catch{}; return }
  try { await ctx.answerCallbackQuery() } catch {}

  try {
    // Global
    if (d === 'cancel') { cc(c); await ed(ctx,'❌ تم الإلغاء',mainKB()); return }
    if (d === 'home') { cc(c); await ed(ctx,`${B('🏠 القائمة الرئيسية')}\n${LINE}\n\nاختر القسم ⬇️`,mainKB()); return }

    // ── Main sections ──
    if (d === 'm_hal') return vHalList(ctx,c,0)
    if (d === 'm_stu') return vStuAll(ctx,c,0)
    if (d === 'm_att') return vAttPicker(ctx,c)
    if (d === 'm_stat') return vStats(ctx,c)
    if (d === 'm_grad') return vGradList(ctx,c,0)
    if (d === 'm_comp') return vCompList(ctx,c,0)
    if (d === 'm_media') return vMediaAlbums(ctx,c)
    if (d === 'm_act') return vActList(ctx,c,0)
    if (d === 'm_set') return vSettings(ctx,c)
    if (d === 'm_addh') return startAddHal(ctx,c)
    if (d === 'm_adds') return startAddStu(ctx,c)
    if (d === 'm_search') { const s=gs(c); s.act='search'; s.step=1; s.data={}; await ed(ctx,`🔍 ${B('بحث عن طالب')}\n${LINE}\n\n👤 أدخل الاسم:`,cancelKB()); return }

    // ── Halaka: pagination ──
    if (d.startsWith('hp_')) return vHalList(ctx,c,parseInt(d.slice(3)))
    // ── Halaka: actions ──
    if (d.startsWith('hs_')) return vHalStu(ctx,c,d.slice(3),0)
    if (d.startsWith('he_')) return vHalEdit(ctx,c,d.slice(3))
    if (d.startsWith('hd_')) return confirmDel(ctx,c,'Halaka',d.slice(3),'hdc_','he_')
    if (d.startsWith('hdc_')) return doDel(ctx,c,'Halaka',d.slice(4))
    // ── Halaka Edit fields ──
    if (d.startsWith('ehn_')) { startEditField(c,d.slice(4),'Halaka','name','✏️ الاسم الجديد:','he_'); return }
    if (d.startsWith('eht_')) { startEditField(c,d.slice(4),'Halaka','teacher','👨‍🏫 المعلم الجديد:','he_'); return }
    if (d.startsWith('ehb_')) {
      const hid=d.slice(4); const kb=new InlineKeyboard(); BRANCHES.forEach(br=>kb.text(`🌳 ${br}`,`shb_${hid}_${br}`).row()); kb.row().text('🔙',`he_${hid}`).text('🏠','home')
      await ed(ctx,`✏️ ${B('اختر الفرع:')}`,kb); return
    }
    if (d.startsWith('shb_')) {
      const p=d.slice(4); const i=p.indexOf('_'); const hid=p.slice(0,i); const br=p.slice(i+1)
      await sbPatch('Halaka',`id=eq.${hid}`,{branch:br})
      await ed(ctx,`✅ الفرع: ${B(br)}`,new InlineKeyboard().text('🔙',`he_${hid}`).row().text('🏠','home')); return
    }
    if (d.startsWith('ehd_')) { startEditField(c,d.slice(4),'Halaka','description','📝 الوصف الجديد:','he_'); return }
    if (d.startsWith('ehti_')) { startEditField(c,d.slice(4),'Halaka','time','🕐 الموعد الجديد:','he_'); return }
    if (d.startsWith('ehlo_')) { startEditField(c,d.slice(4),'Halaka','location','📍 المكان الجديد:','he_'); return }

    // ── Students: pagination ──
    if (d.startsWith('sp_')) { const p=d.slice(3).split('_'); return vStuAll(ctx,c,parseInt(p[0])) }
    // ── Student actions ──
    if (d.startsWith('se_')) return vStuEdit(ctx,c,d.slice(3))
    if (d.startsWith('sa_')) return quickAtt(ctx,c,d.slice(3))
    if (d.startsWith('sd_')) return confirmDel(ctx,c,'Student',d.slice(3),'sdc_','m_stu')
    if (d.startsWith('sdc_')) return doDelStu(ctx,c,d.slice(4))
    if (d.startsWith('smv_')) { const sid=d.slice(4); const sts=await sbGet('Student',`id=eq.${sid}`); const s=sts[0]; if(!s)return; const hL=await sbGet('Halaka'); const kb=new InlineKeyboard(); hL.forEach((h:any)=>kb.text(`${E(h.name)}`,`smv_do_${sid}_${h.id}`).row()); kb.row().text('🔙',`se_${sid}`).text('🏠','home'); await ed(ctx,`📚 ${B('نقل الطالب: '+s.name)}\n\nاختر الحلقة الجديدة:`,kb); return }
    if (d.startsWith('smv_do_')) { const p=d.slice(7); const i=p.indexOf('_'); const sid=p.slice(0,i); const hid=p.slice(i+1); await sbPatch('Student',`id=eq.${sid}`,{halakaId:hid}); await ed(ctx,`✅ ${B('تم نقل الطالب!')}`,backKB(`se_${sid}`)); return }
    // ── Student Edit ──
    if (d.startsWith('esn_')) { const s=(await sbGet('Student',`id=eq.${d.slice(4)}`))[0]; startEditField(c,d.slice(4),'Student','name','👤 الاسم الجديد:',`hs_${s?.halakaId||''}`); return }
    if (d.startsWith('esu_')) { const s=(await sbGet('Student',`id=eq.${d.slice(4)}`))[0]; startEditField(c,d.slice(4),'Student','surah','📖 السورة الجديدة:',`hs_${s?.halakaId||''}`); return }
    if (d.startsWith('esa_')) { const s=(await sbGet('Student',`id=eq.${d.slice(4)}`))[0]; startEditField(c,d.slice(4),'Student','age','🎂 العمر الجديد (رقم):',`hs_${s?.halakaId||''}`); return }
    if (d.startsWith('esl_')) {
      const sid=d.slice(4); const s=(await sbGet('Student',`id=eq.${sid}`))[0]
      const kb=new InlineKeyboard(); LEVELS.forEach(l=>kb.text(l,`stl_${sid}_${l}`).row()); kb.row().text('🔙',`se_${sid}`).text('🏠','home')
      await ed(ctx,`✏️ ${B('اختر المستوى:')}`,kb); return
    }
    if (d.startsWith('stl_')) { const p=d.slice(4); const i=p.indexOf('_'); const sid=p.slice(0,i); const l=p.slice(i+1); await sbPatch('Student',`id=eq.${sid}`,{level:l}); const s=(await sbGet('Student',`id=eq.${sid}`))[0]; await ed(ctx,`✅ المستوى: ${B(l)}`,backKB(`se_${sid}`)); return }
    if (d.startsWith('esc_')) {
      const sid=d.slice(4); const kb=new InlineKeyboard(); CATS.forEach(c2=>kb.text(c2,`stc_${sid}_${c2}`).row()); kb.row().text('🔙',`se_${sid}`).text('🏠','home')
      await ed(ctx,`✏️ ${B('اختر الفئة:')}`,kb); return
    }
    if (d.startsWith('stc_')) { const p=d.slice(4); const i=p.indexOf('_'); const sid=p.slice(0,i); const cat=p.slice(i+1); await sbPatch('Student',`id=eq.${sid}`,{category:cat}); const s=(await sbGet('Student',`id=eq.${sid}`))[0]; await ed(ctx,`✅ الفئة: ${B(cat)}`,backKB(`se_${sid}`)); return }

    // ── Attendance ──
    if (d.startsWith('ath_')) return vAttHal(ctx,c,d.slice(4))
    if (d.startsWith('atm_')) { const p=d.slice(4).split('|'); return markAtt(ctx,c,p[0],p[1],p[2]) }

    // ── Graduates pagination ──
    if (d.startsWith('gp_')) return vGradList(ctx,c,parseInt(d.slice(3)))
    if (d.startsWith('gd_')) return confirmDelCenter(ctx,c,d.slice(3),'gdc_','m_grad')
    if (d.startsWith('gdc_')) { await sbDel('CenterInfo',`id=eq.${d.slice(4)}`); await ed(ctx,`✅ ${B('تم الحذف')}`,backKB('m_grad')); return }
    if (d === 'grad_add') { const s=gs(c); s.act='add_grad'; s.step=1; s.data={}; await ed(ctx,`🎓 ${B('إضافة دفعة خريجين')}\n${LINE}\n\n📝 ${B('الخطوة 1/3')} — عنوان الدفعة:`,cancelKB()); return }

    // ── Competitions pagination ──
    if (d.startsWith('cp_')) return vCompList(ctx,c,parseInt(d.slice(3)))
    if (d.startsWith('cd_')) return confirmDelCenter(ctx,c,d.slice(3),'cdc_','m_comp')
    if (d.startsWith('cdc_')) { await sbDel('CenterInfo',`id=eq.${d.slice(4)}`); await ed(ctx,`✅ ${B('تم الحذف')}`,backKB('m_comp')); return }
    if (d === 'comp_add') { const s=gs(c); s.act='add_comp'; s.step=1; s.data={}; const kb=new InlineKeyboard(); kb.text('📍 داخلية','comp_type_داخلية').text('🌍 خارجية','comp_type_خارجية').row(); kb.row().text('❌ إلغاء','cancel'); await ed(ctx,`🏆 ${B('إضافة مسابقة')}\n${LINE}\n\nاختر النوع:`,kb); return }

    // ── Media ──
    if (d.startsWith('malb_')) return vMediaList(ctx,c,d.slice(5),0)
    if (d === 'media_upload') { await ed(ctx,`📤 ${B('رفع صورة')}\n${LINE}\n\nأرسل الصورة مباشرة كرسالة وسائط`,cancelKB()); const s=gs(c); s.act='wait_photo'; s.step=1; s.data={}; return }

    // ── Settings ──
    if (d === 'set_pwd') { const s=gs(c); s.act='chg_pwd'; s.step=1; s.data={}; await ed(ctx,`🔐 ${B('تغيير كلمة المرور')}\n${LINE}\n\nأرسل كلمة المرور الجديدة:`,cancelKB()); return }
    if (d === 'set_info') return vCenterInfo(ctx,c)
    if (d.startsWith('sinf_')) {
      const id=d.slice(4); const row=(await sbGet('CenterInfo',`id=eq.${id}`))[0]
      if(!row)return; const s=gs(c); s.act='edit_field'; s.step=1; s.data={table:'CenterInfo',id,field:'value',backCb:'m_set'}
      await ed(ctx,`✏️ ${B('تعديل: '+row.key)}\n\nالقيمة الحالية: ${I(String(row.value).slice(0,100))}\n\nأرسل القيمة الجديدة:`,cancelKB()); return
    }

    await ed(ctx,'❌ أمر غير معروف',mainKB())
  } catch (e) {
    console.error('CB Error:', e)
    try { await ctx.reply('❌ حدث خطأ',{parse_mode:'MarkdownV2'}) } catch {}
  }
})

// ─── Conversation Helpers ────────────────────────────────────────────────────
function startEditField(c: number, id: string, table: string, field: string, prompt: string, backCb: string) {
  const s = gs(c); s.act = 'edit_field'; s.step = 1; s.data = { id, table, field, backCb }
  // We need the context to send - will be handled by a wrapper
}

// ─── Photo Handler ───────────────────────────────────────────────────────────
bot.on('message:photo', async (ctx) => {
  const c = ctx.chat!.id; const s = gs(c)
  if (s.act !== 'wait_photo') return
  const photo = ctx.message.photo[ctx.message.photo.length - 1]
  const fid = photo.file_id
  // Determine album from state or default
  const album = s.data.album || 'عامة'
  const fn = `tg-${Date.now()}-${fid.slice(0,10)}.jpg`
  await sbPost('MediaImage', { album, filename: fn, url: `tg:${fid}` })
  cc(c)
  await ctx.reply(`✅ ${B('تم حفظ الصورة!')}\n\n📁 الألبوم: ${E(album)}`, { parse_mode:'MarkdownV2', reply_markup: mainKB() })
})

// ─── Add Halaka/Branch Selection ──────────────────────────────────────────────
bot.on('callback_query:data', async (ctx) => {
  const d = ctx.callbackQuery.data; const c = cid(ctx)
  if (!c) return
  try { await ctx.answerCallbackQuery() } catch {}

  // Add Halaka: branch
  if (d.startsWith('nhb_')) {
    const br=d.slice(4); const s=gs(c)
    if(s.act==='add_hal'&&s.step===3){s.data.branch=br;s.step=4;await ed(ctx,`📝 ${B('الخطوة 4/4')} — 📝 وصف الحلقة:`,cancelKB())}
    return
  }
  // Add Student: category
  if (d.startsWith('nsc_')) {
    const cat=d.slice(4); const s=gs(c)
    if(s.act==='add_stu'&&s.step===4){s.data.cat=cat;s.step=5;const kb=new InlineKeyboard();LEVELS.forEach(l=>kb.text(l,`nsl_${l}`).row());kb.row().text('❌ إلغاء','cancel');await ed(ctx,`📝 ${B('الخطوة 5/6')} — 📊 المستوى:`,kb)}
    return
  }
  // Add Student: level
  if (d.startsWith('nsl_')) {
    const lvl=d.slice(4); const s=gs(c)
    if(s.act==='add_stu'&&s.step===5){s.data.lvl=lvl;s.step=6;const hL=await sbGet('Halaka','order=createdAt.asc');if(!hL.length){await ed(ctx,'❌ لا توجد حلقات',cancelKB());return};const kb=new InlineKeyboard();hL.slice(0,15).forEach((h:any)=>kb.text(`📚 ${E(h.name)}`,`nsh_${h.id}`).row());kb.row().text('❌ إلغاء','cancel');await ed(ctx,`📝 ${B('الخطوة 6/6')} — 🏫 الحلقة:`,kb)}
    return
  }
  // Add Student: halaka
  if (d.startsWith('nsh_')) {
    const hid=d.slice(4); const s=gs(c)
    if(s.act==='add_stu'&&s.step===6){s.data.hid=hid;s.step=7;await ed(ctx,`📝 ${B('الخطوة الأخيرة')} — 📱 هاتف ولي الأمر (اختياري):`,cancelKB());s.step=7}
    return
  }
  // Competition type
  if (d.startsWith('comp_type_')) {
    const type=d.slice(10); const s=gs(c)
    if(s.act==='add_comp'&&s.step===1){s.data.type=type;s.step=2;await ed(ctx,`🏆 ${B('الخطوة 2/4')} — عنوان المسابقة:`,cancelKB())}
    return
  }
  // Graduate add conversation steps
  if (d.startsWith('grad_add_c_')) {
    // Continue grad add from callback - not needed since we use text
    return
  }
})

// Override text handler for add_stu step 7 (which is actually step 7 now)
const origHandleText = handleText
async function handleTextFull(ctx: any, c: number, txt: string, s: any) {
  // Add student step 7 (phone)
  if (s.act === 'add_stu' && s.step === 7) {
    s.data.phone = txt || ''
    await sbPost('Student', { name:s.data.name, age:s.data.age, surah:s.data.surah, category:s.data.cat, level:s.data.lvl, halakaId:s.data.hid, parentPhone:txt||'' })
    cc(c); await ed(ctx, `✅ ${B('تم إضافة الطالب!')} 🎉\n\n👤 ${E(s.data.name)}`, mainKB())
    return
  }
  // Add graduate conversation
  if (s.act === 'add_grad') {
    if (s.step === 1) { if (!txt) { await ctx.reply('❌ مطلوب',{reply_markup:cancelKB()}); return }; s.data.title=txt; s.step=2; await ed(ctx,`📝 ${B('الخطوة 2/3')} — 📅 التاريخ (YYYY-MM-DD):`,cancelKB()) }
    else if (s.step === 2) { s.data.date=txt; s.step=3; await ed(ctx,`📝 ${B('الخطوة 3/3')} — 📝 ملاحظات (اختياري):`,cancelKB()) }
    else if (s.step === 3) {
      const grads = await sbGet('CenterInfo','type=eq.graduate_batch')
      const bn = grads.length + 1
      const val = JSON.stringify({ batchNumber:bn, title:s.data.title, date:s.data.date, graduateCount:0, graduates:[], notes:txt||'' })
      await sbPost('CenterInfo', { key:`دفعة_${bn}_${s.data.title}`, value:val, type:'graduate_batch', section:'خريجين' })
      cc(c); await ed(ctx, `✅ ${B('تم إضافة الدفعة!')} 🎉\n\n🎓 ${E(s.data.title)}\n📅 ${E(s.data.date)}`, backKB('m_grad'))
    }
    return
  }
  // Add competition conversation
  if (s.act === 'add_comp') {
    if (s.step === 2) { if (!txt) { await ctx.reply('❌ مطلوب',{reply_markup:cancelKB()}); return }; s.data.title=txt; s.step=3; await ed(ctx,`📝 ${B('الخطوة 3/4')} — 📅 التاريخ (YYYY-MM-DD):`,cancelKB()) }
    else if (s.step === 3) { s.data.date=txt; s.step=4; await ed(ctx,`📝 ${B('الخطوة 4/4')} — 👥 المشاركون (أسماء مفصولة بفواصل، أو "-" للتخطي):`,cancelKB()) }
    else if (s.step === 4) {
      const participants = txt === '-' ? [] : txt.split(',').map((n:string)=>n.trim()).filter(Boolean)
      const section = s.data.type === 'داخلية' ? 'مسابقات_داخلية' : 'مسابقات_خارجية'
      const val = JSON.stringify({ title:s.data.title, date:s.data.date, participants, winners:[] })
      await sbPost('CenterInfo', { key:s.data.title, value:val, type:'competition', section })
      cc(c); await ed(ctx, `✅ ${B('تم إضافة المسابقة!')} 🎉\n\n🏆 ${E(s.data.title)}\n📍 ${E(s.data.type)}\n📅 ${E(s.data.date)}`, backKB('m_comp'))
    }
    return
  }
  return origHandleText(ctx, c, txt, s)
}

// Replace the text handler
bot.on('message:text', async (ctx) => {
  const c = ctx.chat!.id; const txt = ctx.message!.text.trim()
  if (pendPwd.has(c)) {
    if (txt === ADMIN_PWD) { pendPwd.delete(c); authed.add(c); await ctx.reply(`✅ ${B('تم تسجيل الدخول!')} 🎉\n${LINE}\n\nاختر القسم ⬇️`,{parse_mode:'MarkdownV2',reply_markup:mainKB()}) }
    else { await ctx.reply('❌ كلمة المرور غير صحيحة',{parse_mode:'MarkdownV2'}) }
    return
  }
  const s = gs(c)
  if (!s.act) { await ctx.reply('👆 اختر من القائمة',{reply_markup:mainKB()}); return }
  await handleTextFull(ctx, c, txt, s)
})

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Halakat List ─────────────────────────────────────────────────────────────
async function vHalList(ctx:any,c:number,page:number) {
  cc(c); const hL=await sbGet('Halaka','order=createdAt.asc')
  if(!hL.length){await ed(ctx,`📚 ${B('الحلقات')}\n${LINE}\n\nلا توجد حلقات`,homeKB());return}
  const tp=Math.ceil(hL.length/PS); const sl=hL.slice(page*PS,(page+1)*PS)
  let msg=`📚 ${B('قائمة الحلقات')}  📄 ${page+1}/${tp}\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  for(const h of sl){
    msg+=`🏫 ${B(h.name)}  👨‍🏫 ${E(h.teacher||'—')}  🌳 ${E(h.branch||'—')}\n\n`
    kb.text('👥 الطلاب',`hs_${h.id}`).text('✏️ تعديل',`he_${h.id}`).text('🗑️',`hd_${h.id}`).row()
  }
  if(tp>1){if(page>0)kb.text('⬅️',`hp_${page-1}`);if(page<tp-1)kb.text('➡️',`hp_${page+1}`);kb.row()}
  kb.text('➕ إضافة حلقة','m_addh').row().text('🏠','home')
  await ed(ctx,msg,kb)
}

// ─── Halaka Students ──────────────────────────────────────────────────────────
async function vHalStu(ctx:any,c:number,hid:string,page:number) {
  cc(c); const[hR,sts]=await Promise.all([sbGet('Halaka',`id=eq.${hid}`),sbGet('Student',`halakaId=eq.${hid}&order=createdAt.asc`)])
  const h=hR[0]; if(!h){await ed(ctx,'❌',homeKB());return}
  if(!sts.length){await ed(ctx,`📚 ${B(h.name)} — لا طلاب`,backKB('m_hal'));return}
  const tp=Math.ceil(sts.length/PS); const sl=sts.slice(page*PS,(page+1)*PS)
  let msg=`📚 ${B(h.name)} — 👥 الطلاب (${sts.length})\n👨‍🏫 ${E(h.teacher)}\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  for(const s of sl){msg+=`👤 ${B(s.name)}  📖 ${E(s.surah||'—')}  📊 ${E(s.level||'—')}\n\n`;kb.text('✅ حضور',`sa_${s.id}`).text('✏️',`se_${s.id}`).text('🗑️',`sd_${s.id}`).row()}
  if(tp>1){if(page>0)kb.text('⬅️',`sp_${page-1}_${hid}`);if(page<tp-1)kb.text('➡️',`sp_${page+1}_${hid}`);kb.row()}
  kb.text('➕ إضافة طالب','m_adds').row().text('🔙',`he_${hid}`).text('📚 الحلقات','m_hal').row().text('🏠','home')
  await ed(ctx,msg,kb)
}

// ─── Halaka Edit ─────────────────────────────────────────────────────────────
async function vHalEdit(ctx:any,c:number,hid:string) {
  cc(c); const h=(await sbGet('Halaka',`id=eq.${hid}`))[0]; if(!h){await ed(ctx,'❌',homeKB());return}
  await ed(ctx,
    `✏️ ${B('تعديل الحلقة')}\n${LINE}\n\n🏫 ${B(h.name)}\n👨‍🏫 ${E(h.teacher||'—')}\n🌳 ${E(h.branch||'—')}\n🕐 ${E(h.time||'—')}\n📍 ${E(h.location||'—')}\n📝 ${E(h.description||'—')}`,
    new InlineKeyboard().text('🏫 الاسم',`ehn_${hid}`).text('👨‍🏫 المعلم',`eht_${hid}`).row().text('🌳 الفرع',`ehb_${hid}`).text('🕐 الموعد',`ehti_${hid}`).row().text('📍 المكان',`ehlo_${hid}`).text('📝 الوصف',`ehd_${hid}`).row().text('🔙','m_hal').text('🏠','home')
  )
}

// ─── All Students ────────────────────────────────────────────────────────────
async function vStuAll(ctx:any,c:number,page:number) {
  cc(c); const[sts,hL]=await Promise.all([sbGet('Student','order=createdAt.asc'),sbGet('Halaka')])
  const hM=new Map(hL.map((h:any)=>[h.id,h.name]))
  if(!sts.length){await ed(ctx,`👥 ${B('الطلاب')}\n${LINE}\n\nلا يوجد طلاب`,homeKB());return}
  const tp=Math.ceil(sts.length/PS); const sl=sts.slice(page*PS,(page+1)*PS)
  let msg=`👥 ${B('قائمة الطلاب')}  📄 ${page+1}/${tp}  (${sts.length})\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  for(const s of sl){msg+=`👤 ${B(s.name)}  📚 ${E(hM.get(s.halakaId)||'—')}\n\n`;kb.text('✏️',`se_${s.id}`).text('✅ حضور',`sa_${s.id}`).row()}
  if(tp>1){if(page>0)kb.text('⬅️',`sp_${page-1}`);if(page<tp-1)kb.text('➡️',`sp_${page+1}`);kb.row()}
  kb.text('➕ إضافة طالب','m_adds').text('🔍 بحث','m_search').row().text('🏠','home')
  await ed(ctx,msg,kb)
}

// ─── Student Edit ─────────────────────────────────────────────────────────────
async function vStuEdit(ctx:any,c:number,sid:string) {
  cc(c); const s=(await sbGet('Student',`id=eq.${sid}`))[0]; if(!s){await ed(ctx,'❌',homeKB());return}
  await ed(ctx,
    `✏️ ${B('تعديل الطالب')}\n${LINE}\n\n👤 ${B(s.name)}\n📖 ${E(s.surah||'—')}  📊 ${E(s.level||'—')}  📂 ${E(s.category||'—')}\n🎂 ${E(String(s.age||'—'))}`,
    new InlineKeyboard().text('👤 الاسم',`esn_${sid}`).text('📖 السورة',`esu_${sid}`).row().text('📊 المستوى',`esl_${sid}`).text('📂 الفئة',`esc_${sid}`).row().text('🎂 العمر',`esa_${sid}`).text('📚 نقل حلقة',`smv_${sid}`).row().text('🔙','m_stu').text('🏠','home')
  )
}

// ─── Quick Attendance Toggle ──────────────────────────────────────────────────
async function quickAtt(ctx:any,c:number,sid:string) {
  const s=(await sbGet('Student',`id=eq.${sid}`))[0]; if(!s)return
  const today=new Date().toISOString().split('T')[0]; const hid=s.halakaId
  const ex=await sbGet('Attendance',`studentId=eq.${sid}&date=eq.${today}&halakaId=eq.${hid}`)
  const ns=(ex.length&&ex[0].status==='حاضر')?'غائب':'حاضر'
  if(ex.length)await sbPatch('Attendance',`id=eq.${ex[0].id}`,{status:ns})
  else await sbPost('Attendance',{studentId:sid,date:today,halakaId:hid,status:ns})
  const ic=ns==='حاضر'?'✅':'❌'
  try{await ctx.answerCallbackQuery({text:`${ic} ${ns}`})}catch{}
}

// ─── Attendance Picker ────────────────────────────────────────────────────────
async function vAttPicker(ctx:any,c:number) {
  cc(c); const hL=await sbGet('Halaka','order=createdAt.asc')
  if(!hL.length){await ed(ctx,'❌ لا حلقات',homeKB());return}
  const kb=new InlineKeyboard(); for(const h of hL)kb.text(`📚 ${E(h.name)}`,`ath_${h.id}`).row()
  kb.row().text('🏠','home')
  await ed(ctx,`✅ ${B('تسجيل الحضور')}\n${LINE}\n\nاختر الحلقة ⬇️`,kb)
}

// ─── Attendance Halaka ────────────────────────────────────────────────────────
async function vAttHal(ctx:any,c:number,hid:string) {
  cc(c); const[hR,sts]=await Promise.all([sbGet('Halaka',`id=eq.${hid}`),sbGet('Student',`halakaId=eq.${hid}&order=createdAt.asc`)])
  const h=hR[0]; if(!sts.length){await ed(ctx,'❌ لا طلاب',backKB('m_att'));return}
  const today=new Date().toISOString().split('T')[0]
  const att=await sbGet('Attendance',`date=eq.${today}&halakaId=eq.${hid}`)
  const aM=new Map(att.map((a:any)=>[a.studentId,a.status]))
  let msg=`✅ ${B('حضور اليوم')} — ${E(h?.name||'')}\n📅 ${E(today)}\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  for(const s of sts){
    const st=aM.get(s.id)||''; const ic=st==='حاضر'?'✅':st==='غائب'?'❌':st==='متأخر'?'⚠️':'⬜'
    msg+=`${ic} ${E(s.name)} — ${E(st||'لم يسجل')}\n`
    kb.text(`${st==='حاضر'?'✅':'☐'} حاضر`,`atm_${s.id}|${hid}|حاضر`).text(`${st==='غائب'?'❌':'☐'} غائب`,`atm_${s.id}|${hid}|غائب`).text(`${st==='متأخر'?'⚠️':'☐'} متأخر`,`atm_${s.id}|${hid}|متأخر`).row()
  }
  kb.row().text('🔙','m_att').text('🏠','home')
  await ed(ctx,msg,kb)
}

async function markAtt(ctx:any,c:number,sid:string,hid:string,status:string) {
  const today=new Date().toISOString().split('T')[0]
  const ex=await sbGet('Attendance',`studentId=eq.${sid}&date=eq.${today}&halakaId=eq.${hid}`)
  if(ex.length)await sbPatch('Attendance',`id=eq.${ex[0].id}`,{status})
  else await sbPost('Attendance',{studentId:sid,date:today,halakaId:hid,status})
  const ic=status==='حاضر'?'✅':status==='غائب'?'❌':'⚠️'
  try{await ctx.answerCallbackQuery({text:`${ic} تم: ${status}`})}catch{}
  await vAttHal(ctx,c,hid)
}

// ─── Statistics ───────────────────────────────────────────────────────────────
async function vStats(ctx:any,c:number) {
  cc(c)
  const[sts,hL,att]=await Promise.all([sbGet('Student'),sbGet('Halaka'),sbGet('Attendance')])
  const brC=new Map<string,number>();for(const h of hL)brC.set(h.branch||'?',(brC.get(h.branch||'?')||0)+1)
  const caC=new Map<string,number>();for(const s of sts)caC.set(s.category||'?',(caC.get(s.category||'?')||0)+1)
  const lvC=new Map<string,number>();for(const s of sts)lvC.set(s.level||'?',(lvC.get(s.level||'?')||0)+1)
  // Attendance rate this month
  const now=new Date(); const firstDay=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
  const mAtt=att.filter((a:any)=>a.date>=firstDay); const present=mAtt.filter((a:any)=>a.status==='حاضر').length
  const rate=mAtt.length?Math.round(present/mAtt.length*100):0

  let msg=`📊 ${B('إحصائيات مركز الشفاء')}\n${LINE}\n\n`
  msg+=`👥 الطلاب: ${B(String(sts.length))}  |  📚 الحلقات: ${B(String(hL.length))}\n`
  msg+=`✅ نسبة الحضور الشهري: ${B(rate+'%')}\n\n`
  msg+=`🌳 ${B('حسب الفرع:')}\n`;for(const[b,n]of brC)msg+=`   • ${E(b)}: ${B(String(n))}\n`
  msg+=`\n📊 ${B('حسب المستوى:')}\n`;for(const[l,n]of lvC)msg+=`   • ${E(l)}: ${B(String(n))}\n`
  msg+=`\n📂 ${B('حسب الفئة:')}\n`;for(const[c2,n]of caC)msg+=`   • ${E(c2)}: ${B(String(n))}\n`
  await ed(ctx,msg,homeKB())
}

// ─── Graduates ────────────────────────────────────────────────────────────────
async function vGradList(ctx:any,c:number,page:number) {
  cc(c); const rows=await sbGet('CenterInfo','type=eq.graduate_batch&order=createdAt.desc')
  const batches=rows.map((r:any)=>{try{return{...JSON.parse(r.value),id:r.id}}catch{return{id:r.id,title:r.key}}})
  if(!batches.length){await ed(ctx,`🎓 ${B('الخريجين')}\n${LINE}\n\nلا توجد دفعات`,new InlineKeyboard().text('➕ إضافة دفعة','grad_add').row().text('🏠','home'));return}
  const tp=Math.ceil(batches.length/PS); const sl=batches.slice(page*PS,(page+1)*PS)
  let msg=`🎓 ${B('دفعات الخريجين')}  📄 ${page+1}/${tp}\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  for(const b of sl){const bn=b.batchNumber||'?';msg+=`🎓 ${B(b.title||'—')}\n📅 ${E(b.date||'—')}  👥 ${E(String(b.graduateCount||0))} خريج\n\n`;kb.text('🗑️',`gd_${b.id}`).row()}
  if(tp>1){if(page>0)kb.text('⬅️',`gp_${page-1}`);if(page<tp-1)kb.text('➡️',`gp_${page+1}`);kb.row()}
  kb.text('➕ إضافة دفعة','grad_add').row().text('🏠','home')
  await ed(ctx,msg,kb)
}

// ─── Competitions ─────────────────────────────────────────────────────────────
async function vCompList(ctx:any,c:number,page:number) {
  cc(c); const rows=await sbGet('CenterInfo','type=eq.competition&order=createdAt.desc')
  const comps=rows.map((r:any)=>{try{const p=JSON.parse(r.value);return{id:r.id,title:p.title||r.key,date:p.date||'',type:r.section==='مسابقات_داخلية'?'داخلية':'خارجية',participants:p.participants||[],winners:p.winners||[]}}catch{return{id:r.id,title:r.key}}})
  if(!comps.length){await ed(ctx,`🏆 ${B('المسابقات')}\n${LINE}\n\nلا توجد مسابقات`,new InlineKeyboard().text('➕ إضافة مسابقة','comp_add').row().text('🏠','home'));return}
  const tp=Math.ceil(comps.length/PS); const sl=comps.slice(page*PS,(page+1)*PS)
  let msg=`🏆 ${B('المسابقات')}  📄 ${page+1}/${tp}\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  for(const cp of sl){const ic=cp.type==='داخلية'?'📍':'🌍';msg+=`${ic} ${B(cp.title||'—')}\n📅 ${E(cp.date||'—')}  👥 ${E(String(cp.participants?.length||0))}\n\n`;kb.text('🗑️',`cd_${cp.id}`).row()}
  if(tp>1){if(page>0)kb.text('⬅️',`cp_${page-1}`);if(page<tp-1)kb.text('➡️',`cp_${page+1}`);kb.row()}
  kb.text('➕ إضافة مسابقة','comp_add').row().text('🏠','home')
  await ed(ctx,msg,kb)
}

// ─── Media Albums ─────────────────────────────────────────────────────────────
async function vMediaAlbums(ctx:any,c:number) {
  cc(c); const imgs=await sbGet('MediaImage')
  const albums=new Map<string,number>();for(const i of imgs)albums.set(i.album||'عامة',(albums.get(i.album||'عامة')||0)+1)
  if(!albums.size){await ed(ctx,`🖼️ ${B('الوسائط')}\n${LINE}\n\nلا توجد صور`,new InlineKeyboard().text('📤 رفع صورة','media_upload').row().text('🏠','home'));return}
  let msg=`🖼️ ${B('ألبومات الوسائط')}\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  for(const[alb,cnt]of albums){msg+=`📁 ${B(alb)}  (${cnt})\n\n`;kb.text(`📁 ${E(alb)}`,`malb_${alb}`).row()}
  kb.row().text('📤 رفع صورة','media_upload').text('🏠','home')
  await ed(ctx,msg,kb)
}

async function vMediaList(ctx:any,c:number,album:string,page:number) {
  cc(c); const imgs=await sbGet('MediaImage',`album=eq.${album}&order=createdAt.desc`)
  if(!imgs.length){await ed(ctx,`📁 ${B(album)} — فارغ`,backKB('m_media'));return}
  const tp=Math.ceil(imgs.length/PS); const sl=imgs.slice(page*PS,(page+1)*PS)
  let msg=`📁 ${B(album)}  📄 ${page+1}/${tp}\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  for(const i of sl){msg+=`🖼️ ${E(i.filename)}\n\n`;kb.text('🗑️',`mdel_${i.id}`).row()}
  if(tp>1){if(page>0)kb.text('⬅️',`mp_${page-1}_${album}`);if(page<tp-1)kb.text('➡️',`mp_${page+1}_${album}`);kb.row()}
  kb.row().text('🔙','m_media').text('🏠','home')
  await ed(ctx,msg,kb)
}

// ─── Activities ───────────────────────────────────────────────────────────────
async function vActList(ctx:any,c:number,page:number) {
  cc(c); const acts=await sbGet('Activity','order=createdAt.desc')
  if(!acts.length){await ed(ctx,`📋 ${B('الأنشطة')}\n${LINE}\n\nلا توجد أنشطة`,homeKB());return}
  const tp=Math.ceil(acts.length/PS); const sl=acts.slice(page*PS,(page+1)*PS)
  let msg=`📋 ${B('الأنشطة')}  📄 ${page+1}/${tp}\n${LINE}\n\n`
  for(const a of sl)msg+=`📌 ${B(a.title||'—')}\n📅 ${E(a.date||'—')}  🏷️ ${E(a.type||'—')}\n\n`
  const kb=new InlineKeyboard()
  if(tp>1){if(page>0)kb.text('⬅️',`ap_${page-1}`);if(page<tp-1)kb.text('➡️',`ap_${page+1}`);kb.row()}
  kb.text('🏠','home')
  await ed(ctx,msg,kb)
}

// ─── Settings ─────────────────────────────────────────────────────────────────
async function vSettings(ctx:any,c:number) {
  await ed(ctx,
    `⚙️ ${B('الإعدادات')}\n${LINE}\n\nاختر الإجراء ⬇️`,
    new InlineKeyboard().text('🔐 تغيير كلمة المرور','set_pwd').text('📝 معلومات المركز','set_info').row().text('🏠','home')
  )
}

async function vCenterInfo(ctx:any,c:number) {
  const rows=await sbGet('CenterInfo','type=eq.text&order=createdAt.desc')
  let msg=`📝 ${B('معلومات المركز')}\n${LINE}\n\n`
  const kb=new InlineKeyboard()
  if(!rows.length){msg+='لا توجد معلومات'}
  else{for(const r of rows){msg+=`🔑 ${B(r.key)}\n   ${I(String(r.value).slice(0,80))}\n\n`;kb.text('✏️',`sinf_${r.id}`).row()}}
  kb.row().text('🔙','m_set').text('🏠','home')
  await ed(ctx,msg,kb)
}

// ─── Generic Helpers ──────────────────────────────────────────────────────────
async function confirmDel(ctx:any,c:number,table:string,id:string,confirmCb:string,backCb:string) {
  let name = id
  try{const r=await sbGet(table,`id=eq.${id}`);if(r[0])name=r[0].name||r[0].title||id}catch{}
  await ed(ctx,`⚠️ ${B('تأكيد الحذف')}\n\n${E(name)}؟\n\n${I('هذا الإجراء لا يمكن التراجع عنه')}`,new InlineKeyboard().text('⚠️ نعم احذف',`${confirmCb}${id}`).text('🔙 لا',backCb).row().text('🏠','home'))
}

async function confirmDelCenter(ctx:any,c:number,id:string,confirmCb:string,backCb:string) {
  const r=(await sbGet('CenterInfo',`id=eq.${id}`))[0]
  await ed(ctx,`⚠️ ${B('تأكيد الحذف')}\n\n${E(r?.key||id)}؟`,new InlineKeyboard().text('⚠️ نعم',`${confirmCb}${id}`).text('🔙 لا',backCb).row().text('🏠','home'))
}

async function doDel(ctx:any,c:number,table:string,id:string) {
  try{await sbDel(table,`id=eq.${id}`);await ed(ctx,`✅ ${B('تم الحذف')}`,homeKB())}catch(e){console.error(e);await ed(ctx,'❌ خطأ',homeKB())}
}

async function doDelStu(ctx:any,c:number,sid:string) {
  try{const s=(await sbGet('Student',`id=eq.${sid}`))[0];const hid=s?.halakaId||'';await sbDel('Attendance',`studentId=eq.${sid}`);await sbDel('Student',`id=eq.${sid}`);await ed(ctx,`✅ ${B('تم حذف الطالب')}`,backKB('m_stu'))}catch(e){console.error(e);await ed(ctx,'❌ خطأ',homeKB())}
}

function startEditField(c:number,id:string,table:string,field:string,prompt:string,backCb:string) {
  const s=gs(c);s.act='edit_field';s.step=1;s.data={id,table,field,backCb}
  // Note: this function can't send the message directly - the caller handles it
}

// ─── Additional Callback Handlers ─────────────────────────────────────────────
bot.on('callback_query:data', async (ctx) => {
  const d=ctx.callbackQuery.data; const c=cid(ctx); if(!c)return
  try{await ctx.answerCallbackQuery()}catch{}
  // Media delete
  if(d.startsWith('mdel_')){await sbDel('MediaImage',`id=eq.${d.slice(5)}`);await ed(ctx,`✅ ${B('تم الحذف')}`,backKB('m_media'));return}
  // Media pagination (handled in main router but add safety)
  // Activities pagination
  if(d.startsWith('ap_'))return vActList(ctx,parseInt(d.slice(3)))
})

// ═══════════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  try{await bot.api.deleteWebhook({drop_pending_updates:true});console.log('✅ Webhook cleared')}catch{}
  try{await bot.api.setMyCommands([{command:'start',description:'🏠 القائمة الرئيسية'},{command:'login',description:'🔐 تسجيل الدخول'},{command:'help',description:'📋 المساعدة'}]);console.log('✅ Commands set')}catch{}
  console.log('🚀 AlShifa Bot v5.0 starting...')
  bot.start({onStart:(i)=>console.log(`✅ @${i.username} running`)})
}
main().catch(console.error)
