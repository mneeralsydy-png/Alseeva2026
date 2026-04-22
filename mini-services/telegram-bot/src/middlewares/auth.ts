// ═══════════════════════════════════════════════════════════════════════════════
// Auth Middleware — Protects all bot interactions behind authentication
// ═══════════════════════════════════════════════════════════════════════════════

import { Middleware } from 'grammy'
import { isAuthenticated, isPendingPassword } from '../services/auth.js'
import { getState } from '../services/conversation.js'

export const authMiddleware: Middleware = async (ctx, next) => {
  const c = ctx.chat?.id
  if (!c || ctx.chat?.type !== 'private') return next()

  const txt = (ctx.message as any)?.text || ''

  // Always allow these commands
  if (txt === '/start' || txt === '/login' || txt === '/help') return next()

  // Allow password entry
  if (isPendingPassword(c)) return next()

  // Callback queries: allow global actions, block rest
  if ((ctx as any).updateType === 'callback_query') {
    const data = (ctx.callbackQuery as any).data || ''
    if (data === 'cancel' || data === 'home' || data === 'login') return next()
    if (!isAuthenticated(c)) {
      try {
        await ctx.answerCallbackQuery({ text: '🔒 سجل دخولك أولاً' })
      } catch {}
      return
    }
    return next()
  }

  // Text messages in active conversation flow
  const state = getState(c)
  if (state.action) return next()

  // Block everything else
  if (!isAuthenticated(c)) {
    await ctx.reply('🔒 لم يتم تسجيل الدخول\n\nأرسل /start', {
      parse_mode: 'MarkdownV2',
    })
    return
  }

  return next()
}
