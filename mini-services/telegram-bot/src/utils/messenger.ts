// ═══════════════════════════════════════════════════════════════════════════════
// Safe Message Editor — Robust version with fallbacks
// ═══════════════════════════════════════════════════════════════════════════════

import { InlineKeyboard } from 'grammy'

/** Edit or reply with text (multi-fallback: MD2 → HTML → plain) */
export async function ed(
  ctx: any,
  text: string,
  keyboard?: InlineKeyboard
): Promise<void> {
  // Strip markdown formatting for plain text fallback
  const plainText = text
    .replace(/\*([^*]+)\*/g, '$1')    // bold
    .replace(/_([^_]+)_/g, '$1')      // italic
    .replace(/`([^`]+)`/g, '$1')      // code
    .replace(/━━━━━━━━━━━━━━━━━━/g, '─────────────')

  // Convert markdown to HTML for HTML fallback
  const htmlText = text
    .replace(/\*([^*]+)\*/g, '<b>$1</b>')
    .replace(/_([^_]+)_/g, '<i>$1</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/━━━━━━━━━━━━━━━━━━/g, '─────────────')

  const isCallback = !!ctx.callbackQuery?.message

  // Method 1: Edit with MarkdownV2
  try {
    if (isCallback) {
      await ctx.editMessageText(text, {
        parse_mode: 'MarkdownV2',
        link_preview_options: { is_disabled: true },
        reply_markup: keyboard,
      })
      return
    } else if (ctx.chat) {
      await ctx.reply(text, {
        parse_mode: 'MarkdownV2',
        link_preview_options: { is_disabled: true },
        reply_markup: keyboard,
      })
      return
    }
  } catch (e: any) {
    console.log('[ED] MD2 failed:', e?.description || e?.message || e)
  }

  // Method 2: Edit with HTML
  try {
    if (isCallback) {
      await ctx.editMessageText(htmlText, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: keyboard,
      })
      return
    } else if (ctx.chat) {
      await ctx.reply(htmlText, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: keyboard,
      })
      return
    }
  } catch (e: any) {
    console.log('[ED] HTML failed:', e?.description || e?.message || e)
  }

  // Method 3: Plain text
  try {
    if (isCallback) {
      await ctx.editMessageText(plainText, {
        link_preview_options: { is_disabled: true },
        reply_markup: keyboard,
      })
      return
    } else if (ctx.chat) {
      await ctx.reply(plainText, {
        link_preview_options: { is_disabled: true },
        reply_markup: keyboard,
      })
      return
    }
  } catch (e: any) {
    console.log('[ED] Plain failed:', e?.description || e?.message || e)
  }

  // Method 4: Send as new message (last resort)
  try {
    if (ctx.chat) {
      await ctx.reply(plainText, {
        link_preview_options: { is_disabled: true },
        reply_markup: keyboard,
      })
    }
  } catch (e: any) {
    console.error('[ED] All methods failed:', e?.description || e?.message || e)
  }
}
