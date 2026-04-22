// ═══════════════════════════════════════════════════════════════════════════════
// Safe Message Editor — Updates message in-place or sends new message
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'

const msgOptions: any = {
  parse_mode: 'MarkdownV2',
  link_preview_options: { is_disabled: true },
}

/** Edit or reply with text (fallback-safe) */
export async function ed(
  ctx: any,
  text: string,
  keyboard?: InlineKeyboard
): Promise<void> {
  const opts: any = { ...msgOptions, reply_markup: keyboard }
  try {
    if (ctx.callbackQuery?.message) {
      await ctx.editMessageText(text, opts)
    } else if (ctx.chat) {
      await ctx.reply(text, opts)
    }
  } catch {
    try {
      if (ctx.chat) {
        await ctx.reply(text, opts)
      }
    } catch {}
  }
}
