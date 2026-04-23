// ═══════════════════════════════════════════════════════════════════════════════
// Keyboards — All inline keyboards for the bot
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'

/** Main dashboard keyboard — mirrors admin app tabs */
export function mainKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🏠 الرئيسية', 'm_dash').row()
    .text('📚 الحلقات', 'm_hal').text('👥 الطلاب', 'm_stu').row()
    .text('✅ الحضور', 'm_att').text('📈 معدل الحفظ', 'm_rate').row()
    .text('🎨 الوسائط', 'm_media').text('📋 الأنشطة', 'm_act').row()
    .text('🎓 الخريجين', 'm_grad').text('🏆 المسابقات', 'm_comp').row()
    .text('📊 الإحصائيات', 'm_stat').text('⚙️ الإعدادات', 'm_set')
}

/** Cancel button */
export function cancelKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('❌ إلغاء', 'cancel')
}

/** Back + Home buttons */
export function backKeyboard(backData: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔙 رجوع', backData).row()
    .text('🏠 الرئيسية', 'home')
}

/** Home only */
export function homeKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('🏠 الرئيسية', 'home')
}

/** Confirm delete keyboard */
export function confirmDeleteKeyboard(confirmData: string, backData: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('⚠️ نعم احذف', confirmData).text('🔙 لا', backData).row()
    .text('🏠', 'home')
}

/** Branch selection */
export function branchKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
  const branches = ['السرور', 'المركز العام', 'الوادي', 'وبرة', 'ضية', 'المنعم']
  for (const br of branches) {
    kb.text(`🌳 ${br}`, `branch_${br}`).row()
  }
  kb.row().text('❌ إلغاء', 'cancel')
  return kb
}

/** Level selection */
export function levelKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const lvl of ['مبتدئ', 'متوسط', 'متقدم']) {
    kb.text(lvl, `newlvl_${lvl}`).row()
  }
  kb.row().text('❌ إلغاء', 'cancel')
  return kb
}

/** Category selection */
export function categoryKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const cat of ['1-10', '10-20', '20-30', '30-20', 'محو الامية']) {
    kb.text(cat, `newcat_${cat}`).row()
  }
  kb.row().text('❌ إلغاء', 'cancel')
  return kb
}

/** Activity type selection */
export function activityTypeKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const t of ['عامة', 'قرآنية', 'ثقافية', 'رياضية', 'اجتماعية']) {
    kb.text(t, `newacttype_${t}`).row()
  }
  kb.row().text('❌ إلغاء', 'cancel')
  return kb
}
