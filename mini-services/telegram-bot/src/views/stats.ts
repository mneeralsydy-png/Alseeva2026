// ═══════════════════════════════════════════════════════════════════════════════
// Statistics View — Comprehensive stats
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { sbGet } from '../services/supabase.js'
import { clearState } from '../services/conversation.js'
import { ed } from '../utils/messenger.js'
import { bold, esc, LINE, monthStart, today } from '../utils/helpers.js'
import { backKeyboard } from '../keyboards/index.js'

export async function viewStats(ctx: any, c: number) {
  clearState(c)

  const [students, halakat, attendance, activities, media, graduates] = await Promise.all([
    sbGet('Student'),
    sbGet('Halaka'),
    sbGet('Attendance'),
    sbGet('Activity'),
    sbGet('MediaImage'),
    sbGet('CenterInfo', 'type=eq.graduate_batch'),
  ])

  // Branch distribution
  const branchCount = new Map<string, number>()
  for (const h of halakat) {
    const br = h.branch || 'غير محدد'
    branchCount.set(br, (branchCount.get(br) || 0) + 1)
  }

  // Students per branch
  const hMap = new Map(halakat.map((h: any) => [h.id, h]))
  const branchStudents = new Map<string, number>()
  for (const s of students) {
    const h = hMap.get(s.halakaId)
    const br = h?.branch || 'غير محدد'
    branchStudents.set(br, (branchStudents.get(br) || 0) + 1)
  }

  // Level distribution
  const levelCount = new Map<string, number>()
  for (const s of students) {
    const lv = s.level || 'غير محدد'
    levelCount.set(lv, (levelCount.get(lv) || 0) + 1)
  }

  // Category distribution
  const catCount = new Map<string, number>()
  for (const s of students) {
    const ct = s.category || 'غير محدد'
    catCount.set(ct, (catCount.get(ct) || 0) + 1)
  }

  // Monthly attendance rate
  const mStart = monthStart()
  const monthlyAtt = attendance.filter((a: any) => a.date >= mStart)
  const presentCount = monthlyAtt.filter((a: any) => a.status === 'حاضر').length
  const lateCount = monthlyAtt.filter((a: any) => a.status === 'متأخر').length
  const rate = monthlyAtt.length ? Math.round((presentCount / monthlyAtt.length) * 100) : 0

  // Today's attendance
  const todayStr = today()
  const todayAtt = attendance.filter((a: any) => a.date === todayStr)
  const todayPresent = todayAtt.filter((a: any) => a.status === 'حاضر').length

  let msg =
    `📊 ${bold('الإحصائيات الشاملة — Alseeva2026')}\n${LINE}\n\n` +
    `┃ ${bold('البيانات العامة')}\n` +
    `┣ 👥 الطلاب: ${bold(String(students.length))}\n` +
    `┣ 📚 الحلقات: ${bold(String(halakat.length))}\n` +
    `┣ 📋 الأنشطة: ${bold(String(activities.length))}\n` +
    `┣ 🖼️ الصور: ${bold(String(media.length))}\n` +
    `┣ 🎓 دفعات الخريجين: ${bold(String(graduates.length))}\n` +
    `┣ 📊 سجلات الحضور: ${bold(String(attendance.length))}\n\n`

  msg += `┃ ${bold('الحضور')}\n`
  msg += `┣ ✅ حضور اليوم: ${bold(`${todayPresent}/${todayAtt.length}`)}\n`
  msg += `┣ 📈 نسبة الحضور الشهري: ${bold(rate + '%')}\n`
  msg += `┣ 📅 سجلات الشهر: ${bold(String(monthlyAtt.length))} (${presentCount} حاضر, ${lateCount} متأخر)\n\n`

  if (branchCount.size) {
    msg += `┃ ${bold('الحلقات حسب الفرع')}\n`
    for (const [br, n] of branchCount) {
      const stCount = branchStudents.get(br) || 0
      msg += `┣ 🌳 ${esc(br)}: ${bold(String(n))} حلقة, ${bold(String(stCount))} طالب\n`
    }
    msg += '\n'
  }

  if (levelCount.size) {
    msg += `┃ ${bold('الطلاب حسب المستوى')}\n`
    for (const [lv, n] of levelCount) msg += `┣ 📊 ${esc(lv)}: ${bold(String(n))} طالب\n`
    msg += '\n'
  }

  if (catCount.size) {
    msg += `┃ ${bold('الطلاب حسب الفئة')}\n`
    for (const [ct, n] of catCount) msg += `┣ 📂 ${esc(ct)}: ${bold(String(n))} طالب\n`
  }

  await ed(ctx, msg, backKeyboard('home'))
}
