// ═══════════════════════════════════════════════════════════════════════════════
// Safe Message Editor — Updates message in-place when possible
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'
import { bold, LINE } from '../utils/helpers.js'
import { mainKeyboard } from '../keyboards/index.js'

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
    // Fallback: try sending new message
    try {
      if (ctx.chat) {
        await ctx.reply(text, opts)
      }
    } catch {
      // Silent fail
    }
  }
}

/** Send welcome message */
export async function sendWelcome(ctx: any): Promise<void> {
  await ctx.reply(
    `👋 مرحباً بعودتك\n\n${bold('لوحة التحكم — Alseeva2026')}\n${LINE}\n\nاختر القسم ⬇️`,
    { parse_mode: 'MarkdownV2', reply_markup: mainKeyboard() }
  )
}
