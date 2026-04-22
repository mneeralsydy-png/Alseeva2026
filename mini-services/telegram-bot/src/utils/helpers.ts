// ═══════════════════════════════════════════════════════════════════════════════
// Markdown Utilities — Safe escape for Telegram MarkdownV2
// ═══════════════════════════════════════════════════════════════════════════════

/** Escape special characters for MarkdownV2 */
export function esc(text: string): string {
  return String(text || '').replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$&')
}

/** Bold */
export function bold(text: string): string {
  return `*${esc(text)}*`
}

/** Italic */
export function italic(text: string): string {
  return `_${esc(text)}_`
}

/** Code */
export function code(text: string): string {
  return `\`${esc(text)}\``
}

/** Horizontal line */
export const LINE = '━━━━━━━━━━━━━━━━━━'

/** Items per page in lists */
export const PAGE_SIZE = 8

/** Center data constants */
export const BRANCHES = ['السرور', 'المركز العام', 'الوادي', 'وبرة', 'ضية', 'المنعم']
export const LEVELS = ['مبتدئ', 'متوسط', 'متقدم']
export const CATEGORIES = ['1-10', '10-20', '20-30', '30-20', 'محو الامية']

/** Get display emoji for attendance status */
export function attEmoji(status: string): string {
  switch (status) {
    case 'حاضر': return '✅'
    case 'غائب': return '❌'
    case 'متأخر': return '⚠️'
    default: return '⬜'
  }
}

/** Get today's date as YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().split('T')[0]
}

/** Get first day of current month */
export function monthStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/** Get chat ID from any context */
export function chatId(ctx: any): number {
  return ctx.callbackQuery?.message?.chat?.id || ctx.chat?.id || 0
}

/** Format date for display */
export function fmtDate(d: string): string {
  if (!d) return '—'
  return esc(d)
}
