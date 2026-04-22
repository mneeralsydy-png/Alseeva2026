// ═══════════════════════════════════════════════════════════════════════════════
// Keyboards — All inline keyboards for the bot
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'

/** Main dashboard keyboard */
export function mainKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📚 الحلقات', 'm_hal').text('👥 الطلاب', 'm_stu').row()
    .text('✅ الحضور', 'm_att').text('📊 الإحصائيات', 'm_stat').row()
    .text('🎓 الخريجين', 'm_grad').text('🏆 المسابقات', 'm_comp').row()
    .text('🖼️ الوسائط', 'm_media').text('📋 الأنشطة', 'm_act').row()
    .text('⚙️ الإعدادات', 'm_set')
}

/** Home button */
export function homeKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('🏠 القائمة الرئيسية', 'home')
}

/** Cancel button */
export function cancelKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('❌ إلغاء', 'cancel')
}

/** Back + Home buttons */
export function backKeyboard(backData: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔙 رجوع', backData).row()
    .text('🏠 القائمة الرئيسية', 'home')
}

/** Pagination row */
export function paginationKeyboard(
  page: number,
  totalPages: number,
  prefix: string,
  extraData?: string
): InlineKeyboard {
  const kb = new InlineKeyboard()
  if (totalPages > 1) {
    if (page > 0) {
      kb.text('⬅️', `${prefix}_${page - 1}${extraData ? '_' + extraData : ''}`)
    }
    if (page < totalPages - 1) {
      kb.text('➡️', `${prefix}_${page + 1}${extraData ? '_' + extraData : ''}`)
    }
    kb.row()
  }
  return kb
}

/** Confirm delete keyboard */
export function confirmDeleteKeyboard(
  confirmData: string,
  backData: string
): InlineKeyboard {
  return new InlineKeyboard()
    .text('⚠️ نعم احذف', confirmData).text('🔙 لا', backData).row()
    .text('🏠', 'home')
}

/** Branch selection keyboard */
export function branchKeyboard(backData: string): InlineKeyboard {
  const kb = new InlineKeyboard()
  const branches = ['السرور', 'المركز العام', 'الوادي', 'وبرة', 'ضية', 'المنعم']
  for (const br of branches) {
    kb.text(`🌳 ${br}`, `branch_${br}`).row()
  }
  kb.row().text('❌ إلغاء', 'cancel')
  return kb
}

/** Level selection keyboard */
export function levelKeyboard(backData: string): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const lvl of ['مبتدئ', 'متوسط', 'متقدم']) {
    kb.text(lvl, `level_${lvl}_${backData}`).row()
  }
  kb.row().text('🔙 رجوع', backData).text('🏠', 'home')
  return kb
}

/** Category selection keyboard */
export function categoryKeyboard(backData: string): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const cat of ['1-10', '10-20', '20-30', '30-20', 'محو الامية']) {
    kb.text(cat, `cat_${cat}_${backData}`).row()
  }
  kb.row().text('🔙 رجوع', backData).text('🏠', 'home')
  return kb
}
